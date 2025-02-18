import { LSRequestPacket } from "src/entities/ospf/packets";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { State } from "src/entities/ospf/enum";
import { LSA } from "src/entities/ospf/lsa";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { NeighborTableRow } from "src/entities/ospf/table_rows";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { copyLsa } from "src/utils/common";
import { printLsaHtml } from "src/utils/ui";

export class LsRequestPacketHandler extends PacketHandlerBase<LSRequestPacket> {
  private getDescription = (neighborId: IPv4Address, lsaList: LSA[]) => {
    return lsaList.length
      ? `Updated the Link State Retransmission List for neighbor <b>${neighborId}</b>, to flood the requested
      Link State Updates to the neighbor. This list will be re-transmitted in case <code>ACK</code> is not received from the neighbor within
      <code>RxmtInterval</code> seconds`
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
    this.packetProcessedEventBuilder?.addAction(desc);
    setNeighbor({
      ...neighbor,
      linkStateRetransmissionList: lsaList,
      lsRetransmissionRxmtTimer: undefined,
    });
  };

  _handle = (
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
      this.packetProcessedEventBuilder?.addAction(
        `Since the ${neighborId} is in a state < <code>Exchange</code>, this request is being discarded`
      );
      return;
    }
    let question = `
      <b>Received the following requests from ${neighborId}:</b>
      <ol>`;
    const lsaResponseList: LSA[] = [];
    let isBadLsReq = false;
    lsRequests.forEach((lsRequest) => {
      question += printLsaHtml(lsRequest);
      const lsa = lsDb.getLsa(areaId, lsRequest);
      if (!lsa) {
        isBadLsReq = true;
        return;
      }
      lsaResponseList.push(copyLsa(lsa));
    });
    question += "</ol>";
    this.packetProcessedEventBuilder?.addQuestion(question);
    this.setNeighborRetransmissionList(neighbor, lsaResponseList);
    setTimeout(() => sendLSUpdatePacket(neighborId));
    if (isBadLsReq) {
      const action = neighborStateMachine(
        neighborId.toString(),
        NeighborSMEvent.BadLSReq
      );
      action && this.packetProcessedEventBuilder?.addAction(action);
    }
  };
}
