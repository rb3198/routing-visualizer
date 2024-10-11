import { LSRequestPacket } from "src/entities/ospf/packets";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { State } from "src/entities/ospf/enum";
import { LSA } from "src/entities/ospf/lsa";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { NeighborTableRow } from "src/entities/ospf/tables";
import { IPv4Address } from "src/entities/ip/ipv4_address";

export class LsRequestPacketHandler extends PacketHandlerBase<LSRequestPacket> {
  private getDescription = (neighborId: IPv4Address, lsaList: LSA[]) => {
    return lsaList.length
      ? `The Link State Retransmission List has been updated for neighbor <b>${neighborId}</b>, since the router just flooded
      Link State Updates to the neighbor. This list will be re-transmitted in case ACK is not received from the neighbor within
      <i>rxmtInterval</i> seconds`
      : `No link state updates to retransmit to neighbor <b>${neighborId}</b>. Retransmission Timer reset.`;
  };

  setNeighborRetransmissionList = (
    neighbor: NeighborTableRow,
    lsaList: LSA[]
  ) => {
    const { setNeighbor } = this.ospfInterface;
    const { lsRetransmissionRxmtTimer, routerId: neighborId } = neighbor;
    clearTimeout(lsRetransmissionRxmtTimer);
    const desc = this.getDescription(neighborId, lsaList);
    setNeighbor(
      {
        ...neighbor,
        linkStateRetransmissionList: lsaList,
        lsRetransmissionRxmtTimer: undefined,
      },
      desc
    );
  };

  handle = (
    interfaceId: string,
    ipPacket: IPPacket,
    packet: LSRequestPacket
  ) => {
    const {
      router,
      neighborTable,
      lsDb,
      neighborStateMachine,
      sendLSUpdatePacket,
    } = this.ospfInterface;
    const { ipInterfaces } = router;
    const { header, body: lsRequests } = packet;
    const { areaId, routerId: neighborId } = header;
    const neighbor = neighborTable[neighborId.toString()];
    const { state } = neighbor || {};
    const { ipInterface } = ipInterfaces.get(interfaceId) || {};
    if (!neighbor || state < State.Exchange || !ipInterface) {
      return; // TODO: Emit Event
    }
    console.warn(
      `Router ${router.id} received the following requests from ${neighborId}:`
    );
    const lsaResponseList: LSA[] = [];
    let isBadLsReq = false;
    lsRequests.forEach((lsRequest, idx) => {
      console.warn(
        `${idx}: LS Request Type ${lsRequest.lsType}; ${lsRequest.linkStateId}; ${lsRequest.advertisingRouter}`
      );
      const lsa = lsDb.getLsa(areaId, lsRequest);
      if (!lsa) {
        isBadLsReq = true;
        return;
      }
      lsaResponseList.push(lsa);
    });
    this.setNeighborRetransmissionList(neighbor, lsaResponseList);
    sendLSUpdatePacket(neighborId);
    if (isBadLsReq) {
      neighborStateMachine(neighborId.toString(), NeighborSMEvent.BadLSReq);
    }
  };
}
