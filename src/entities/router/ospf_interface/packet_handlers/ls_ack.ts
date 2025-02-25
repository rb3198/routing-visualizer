import { LSAckPacket } from "src/entities/ospf/packets/ls_ack";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { printLsaHtml } from "src/utils/ui";

export class LsAckPacketHandler extends PacketHandlerBase<LSAckPacket> {
  _handle = (interfaceId: string, ipPacket: IPPacket, packet: LSAckPacket) => {
    const { config, neighborTable, sendLSUpdatePacket, setNeighbor } =
      this.ospfInterface;
    const { rxmtInterval, MaxAge } = config;
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
    let question = `
      <b>Received the following acknowledgements from ${neighborId}:</b>
      <ol>`;
    const ackedMaxAgeLsaList: LSA[] = [];
    acknowledgements.forEach((ack) => {
      question += "<li>" + printLsaHtml(ack, true);
      const lsIdx = linkStateRetransmissionList.findIndex((lsa) =>
        lsa.header.equals(LSAHeader.from(ack), MaxAge)
      );
      if (lsIdx !== -1) {
        const lsa = linkStateRetransmissionList[lsIdx];
        const { header } = lsa;
        const { lsAge } = header;
        linkStateRetransmissionList.splice(lsIdx, 1);
        question +=
          "<b>The LSA was removed from the neighbor's Link State Retransmission List.</b>";
        lsAge === MaxAge && ackedMaxAgeLsaList.push(lsa);
      } else {
        question += `No action taken since this LSA was already removed from the neighbor's 
        retransmission list.`;
      }
      question += "</li>";
    });
    this.packetProcessedEventBuilder?.addQuestion(question);
    let newTimer: NodeJS.Timeout | undefined = undefined;
    if (!linkStateRetransmissionList.length) {
      this.packetProcessedEventBuilder?.addAction(
        `The Link State Retransmission List of this neighbor is now empty. Hence,
        <b>cleared timers to resend the list to ${neighborId}</b>.`
      );
      clearTimeout(prevTimer);
    } else {
      newTimer =
        prevTimer ??
        setTimeout(() => sendLSUpdatePacket(neighborId), rxmtInterval);
    }
    setNeighbor({
      ...neighbor,
      linkStateRetransmissionList,
      lsRetransmissionRxmtTimer: newTimer,
    });
    const maxAgeLsaRemovalAction = this.ospfInterface.lsDb.removeMaxAgeLsas(
      areaId,
      ackedMaxAgeLsaList
    );
    maxAgeLsaRemovalAction &&
      this.packetProcessedEventBuilder?.addAction(maxAgeLsaRemovalAction);
  };
}
