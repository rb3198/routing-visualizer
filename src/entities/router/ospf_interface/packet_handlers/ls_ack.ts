import { LSAckPacket } from "src/entities/ospf/packets/ls_ack";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { MaxAge } from "src/entities/ospf/lsa/constants";

export class LsAckPacketHandler extends PacketHandlerBase<LSAckPacket> {
  // TODO: Remove this function when prod
  private printDebug = (
    routerId: IPv4Address,
    neighborId: IPv4Address,
    linkStateRetransmissionList: LSA[]
  ) => {
    console.log(`Router ${routerId}: \n Link State Retransmission List:`);
    linkStateRetransmissionList.forEach((ls, idx) => {
      console.log(
        `${idx}: ${ls.header.linkStateId} ; ${ls.header.advertisingRouter}`
      );
    });
    console.warn(
      `Router ${routerId} received the following Acknowledgements from ${neighborId}:`
    );
  };

  private printAck = (idx: number, ack: LSAHeader) => {
    console.warn(`${idx}: ${ack.linkStateId} ; ${ack.advertisingRouter}`); // TODO: Remove
  };

  _handle = (interfaceId: string, ipPacket: IPPacket, packet: LSAckPacket) => {
    let debug = true;
    const { config, neighborTable, router, sendLSUpdatePacket, setNeighbor } =
      this.ospfInterface;
    const { id: routerId } = router;
    const { rxmtInterval } = config;
    const { header, body: acknowledgements } = packet;
    const { routerId: neighborId, areaId } = header;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor) {
      return;
    }
    const {
      linkStateRetransmissionList,
      lsRetransmissionRxmtTimer: prevTimer,
    } = neighbor;
    debug && this.printDebug(routerId, neighborId, linkStateRetransmissionList);
    const ackedMaxAgeLsaList: LSA[] = [];
    acknowledgements.forEach((ack, idx) => {
      debug && this.printAck(idx, ack);
      const lsIdx = linkStateRetransmissionList.findIndex((lsa) =>
        lsa.header.equals(LSAHeader.from(ack))
      );
      if (lsIdx !== -1) {
        const lsa = linkStateRetransmissionList[lsIdx];
        const { header } = lsa;
        const { lsAge } = header;
        linkStateRetransmissionList.splice(lsIdx, 1);
        lsAge === MaxAge && ackedMaxAgeLsaList.push(lsa);
      }
    });
    let newTimer: NodeJS.Timeout | undefined = undefined;
    if (!linkStateRetransmissionList.length) {
      clearTimeout(prevTimer);
    } else {
      newTimer =
        prevTimer ??
        setTimeout(() => sendLSUpdatePacket(neighborId), rxmtInterval);
    }
    setNeighbor(
      {
        ...neighbor,
        linkStateRetransmissionList,
        lsRetransmissionRxmtTimer: newTimer,
      },
      `Neighbor ${neighborId}'s retransmission list updated since ${
        linkStateRetransmissionList.length ? "some" : "all"
      } of the LSAs sent to the neighbor and acknowledged by it.`
    );
    this.ospfInterface.lsDb.removeMaxAgeLsas(areaId, ackedMaxAgeLsaList);
  };
}
