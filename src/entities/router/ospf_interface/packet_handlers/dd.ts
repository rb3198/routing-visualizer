import { DDPacket } from "src/entities/ospf/packets";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { DDPacketSummary } from "src/entities/ospf/summaries/dd_packet_summary";
import { LSAHeader } from "src/entities/ospf/lsa";
import { State } from "src/entities/ospf/enum";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";

export class DDPacketHandler extends PacketHandlerBase<DDPacket> {
  /**
   * Validates a DD Packet when the sender is in the `Exchange` state of this router's Neighbor Table.
   * @param packet
   * @returns
   */
  private validateExchangeDDPacket = (packet: DDPacket) => {
    const { neighborTable } = this.ospfInterface;
    const { header, body } = packet;
    const { routerId } = header;
    const { init, ddSeqNumber: packetSeqNumber, master: ms } = body;
    const neighbor = neighborTable[routerId.toString()];
    if (!neighbor || neighbor.state !== State.Exchange) {
      return false;
    }
    const { master, ddSeqNumber } = neighbor;
    const masterOk = !master === ms;
    const initOk = !init;
    const seqOk = master
      ? packetSeqNumber === ddSeqNumber
      : packetSeqNumber === (ddSeqNumber ?? 0) + 1;
    if (!masterOk || !initOk || !seqOk) {
      return false;
      // emitEvent({})(store.dispatch); TODO.
    }
    return true;
  };
  /**
   * Determines whether the neighbor is a Master or a Slave based on Section 10.6 of the spec (in state `ExStart`).
   *
   * Used in the Negotiation phase (`ExStart`) to decide the relationship.
   * @param ddPacket The received DD Packet.
   * @returns
   */
  private isNeighborMasterOrSlave = (ddPacket: DDPacket) => {
    const { neighborTable, router } = this.ospfInterface;
    const { header, body } = ddPacket;
    const { routerId: neighborId } = header;
    const { init, master, m, lsaList, ddSeqNumber } = body;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor) {
      console.warn(
        "Checking Master / Slave config of a router which is not the neighbor of ",
        router.id
      );
      return { isNeighborMaster: false, isNeighborSlave: false };
    }
    const isNeighborMaster =
      init &&
      master &&
      m &&
      !lsaList.length &&
      neighborId.compare(router.id) > 0;
    const isNeighborSlave =
      !init &&
      !master &&
      ddSeqNumber === neighbor.ddSeqNumber &&
      neighborId.compare(router.id) < 0;
    return { isNeighborMaster, isNeighborSlave };
  };

  /**
   * Checks whether the new DD Packet is a duplicate.
   * @param packet
   * @param lastReceived
   * @returns
   */
  private isDupeDD = (packet: DDPacket, lastReceived?: DDPacketSummary) => {
    if (!lastReceived) {
      return false;
    }
    const { body } = packet;
    const { init, ddSeqNumber, m, master } = body;
    const identical =
      init === lastReceived.init &&
      ddSeqNumber === lastReceived.ddSeqNumber &&
      m === lastReceived.m &&
      master === lastReceived.master;
    return identical;
  };

  /**
   * Records the last received DD Packet.
   * @param packet The received DD Packet.
   */
  private recordDDPacket = (packet: DDPacket) => {
    const { neighborTable, setNeighbor } = this.ospfInterface;
    const { header, body } = packet;
    const { routerId: neighborId } = header;
    const { ddSeqNumber: packetDdSeq, init, m, master } = body;
    const neighbor = neighborTable[neighborId.toString()];
    const { master: isRouterMaster } = neighbor;
    setNeighbor(
      {
        ...neighbor,
        ddSeqNumber: isRouterMaster
          ? (neighbor.ddSeqNumber ?? 0) + 1
          : packetDdSeq,
        lastReceivedDdPacket: new DDPacketSummary({
          init,
          ddSeqNumber: packetDdSeq,
          m,
          master,
        }),
      },
      `The new DD packet sent by the neighbor ${neighborId} was recorded in the table's "Last DD Packet"`
    );
  };

  private processLsaHeaders = (
    neighborId: string,
    areaId: number,
    lsaHeaders: LSAHeader[]
  ) => {
    const { neighborTable, lsDb, setNeighborLsRequestList } =
      this.ospfInterface;
    const neighbor = neighborTable[neighborId];
    if (!neighbor) {
      return;
    }
    const { linkStateRequestList } = neighbor;
    const copy = [...linkStateRequestList];
    lsaHeaders.forEach((header) => {
      const lsa = lsDb.getLsa(areaId, header);
      let requestLsa = false;
      if (lsa) {
        // LSA Exists, compare which one is newer.
        requestLsa = header.compareAge(lsa) > 0;
      } else {
        // This is a new LSA.
        requestLsa = true;
      }
      if (requestLsa) {
        copy.push(header);
      }
    });
    if (copy.length !== linkStateRequestList.length) {
      setNeighborLsRequestList(neighbor, copy);
    }
  };

  /**
   * Handles the packet when the neighbor is in the state `ExStart`.
   * @param packet The received DD Packet.
   * @returns
   */
  exStartHandler = (packet: DDPacket) => {
    const { header, body } = packet;
    const { routerId: neighborId } = header;
    const { neighborStateMachine, neighborTable } = this.ospfInterface;
    const neighbor = neighborTable[neighborId.toString()];
    const { ddRxmtTimer } = neighbor;
    if (!neighbor || neighbor.state !== State.ExStart) {
      return;
    }
    const { isNeighborMaster, isNeighborSlave } =
      this.isNeighborMasterOrSlave(packet);
    if (isNeighborMaster || isNeighborSlave) {
      clearInterval(ddRxmtTimer);
      this.ospfInterface.neighborTable = {
        ...this.ospfInterface.neighborTable,
        [neighborId.toString()]: {
          ...neighbor,
          master: !isNeighborMaster,
          ddSeqNumber: isNeighborMaster
            ? body.ddSeqNumber
            : neighbor.ddSeqNumber,
        },
      };
      this.recordDDPacket(packet);
      neighborStateMachine(
        neighbor.routerId.toString(),
        NeighborSMEvent.NegotiationDone
      );
    }
  };

  exchangeHandler = (ipPacket: IPPacket, packet: DDPacket) => {
    const { neighborTable, neighborStateMachine, dropPacket, sendDDPacket } =
      this.ospfInterface;
    const { header, body } = packet;
    const { routerId: neighborId, areaId } = header;
    const { m, lsaList } = body;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor || neighbor.state !== State.Exchange) {
      return;
    }
    const {
      master: isRouterMaster,
      ddRxmtTimer,
      lastReceivedDdPacket,
    } = neighbor;
    const isDupeDD = this.isDupeDD(packet, lastReceivedDdPacket);
    if (isDupeDD) {
      if (isRouterMaster) {
        dropPacket(
          ipPacket,
          `The router, being the master in the relationship with neighbor ${neighborId}, 
                detected a duplicate DD packet in the EXCHANGE state. Hence, the packet was discarded.
                <ul>
                  <li>The DD Sequence Number of the packet was the same as the last recorded DD packet sent by the neighbor</li>
                  <li>The <i>Init</i>, <i>More</i>, and <i>Master</i> bits all matched with the last recorded DD Packet sent by
                  the neighbor </li>
                </ul>
                `
        );
        return;
      }
      // The current router is the slave in this adjacency. Echo the packet back.
      sendDDPacket(neighborId);
      return;
    }
    if (!this.validateExchangeDDPacket(packet)) {
      neighborStateMachine(
        neighborId.toString(),
        NeighborSMEvent.SeqNumberMismatch
      );
      return;
    }
    this.recordDDPacket(packet);
    this.processLsaHeaders(neighborId.toString(), areaId, lsaList);
    if (isRouterMaster) {
      // The current router is the master in this adjacency.
      // The sent packet has been acknowledged.
      clearInterval(ddRxmtTimer);
    } else {
      sendDDPacket(neighborId);
    }
    !m &&
      // No more packets pending, transition to the `Loading` State.
      neighborStateMachine(neighborId.toString(), NeighborSMEvent.ExchangeDone);
  };

  loadingFullHandler = (packet: DDPacket) => {
    const { neighborTable, neighborStateMachine, sendDDPacket } =
      this.ospfInterface;
    const { header } = packet;
    const { routerId: neighborId } = header;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor || neighbor.state < State.Loading) {
      return;
    }
    const { lastReceivedDdPacket, master: isRouterMaster } = neighbor;
    if (!this.isDupeDD(packet, lastReceivedDdPacket)) {
      // The only DD packets received by the router at this stage should be duplicate packets only. Otherwise, generate
      // SeqNumberMismatch event.
      neighborStateMachine(
        neighborId.toString(),
        NeighborSMEvent.SeqNumberMismatch
      );
      return;
    }
    // The current router is the slave in this adjacency. Echo the packet back.
    !isRouterMaster && sendDDPacket(neighborId);
  };

  handle = (interfaceId: string, ipPacket: IPPacket, packet: DDPacket) => {
    const { neighborTable, router, dropPacket, neighborStateMachine } =
      this.ospfInterface;
    const { header } = packet;
    const { routerId } = header;
    const neighbor = neighborTable[routerId.toString()];
    if (!neighbor) {
      console.warn(
        "DD Packet received from a router which is not the neighbor of ",
        router.id
      );
      return;
    }
    const { state, routerId: neighborId } = neighbor;
    switch (state) {
      case State.Down:
        return dropPacket(
          ipPacket,
          "Received a DD packet from a neighbor which was in the DOWN state."
        );
      case State.Init:
        neighborStateMachine(
          neighborId.toString(),
          NeighborSMEvent.TwoWayReceived
        );
        return;
      case State.ExStart:
        return this.exStartHandler(packet);
      case State.Exchange:
        return this.exchangeHandler(ipPacket, packet);
      case State.Loading:
      case State.Full:
        return this.loadingFullHandler(packet);
      default:
        return;
    }
  };
}
