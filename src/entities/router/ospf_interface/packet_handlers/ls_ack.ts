import { LSAckPacket } from "src/entities/ospf/packets/ls_ack";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { printLsaHtml } from "src/utils/ui";
import { LsDb } from "../ls_db";

export class LsAckPacketHandler extends PacketHandlerBase<LSAckPacket> {
  _handle = (interfaceId: string, ipPacket: IPPacket, packet: LSAckPacket) => {
    const { config, neighborTable, setNeighbor } = this.ospfInterface;
    const { MaxAge } = config;
    const { header, body: acknowledgements } = packet;
    const { routerId: neighborId, areaId } = header;
    const neighbor = neighborTable[neighborId.toString()];
    if (!neighbor) {
      return;
    }
    const { linkStateRetransmissionList, lsTransmission } = neighbor;
    let question = `
      <b>Received the following acknowledgements from ${neighborId}:</b>
      <ol>`;
    const ackedMaxAgeLsaList: LSA[] = [];
    acknowledgements.forEach((ack) => {
      question += "<li>" + printLsaHtml(ack, true);
      const key = LsDb.getLsDbKey(LSAHeader.from(ack));
      const { lsa: lsInList } = linkStateRetransmissionList.get(key) || {};
      if (lsInList && lsInList.header.equals(LSAHeader.from(ack), MaxAge)) {
        const { header } = lsInList;
        const { lsAge } = header;
        linkStateRetransmissionList.delete(key);
        question +=
          "<b>The LSA was removed from the neighbor's Link State Retransmission List.</b>";
        lsAge === MaxAge && ackedMaxAgeLsaList.push(lsInList);
      } else {
        question += `No action taken since this LSA was already removed from the neighbor's 
        retransmission list.`;
      }
      question += "</li>";
    });
    this.packetProcessedEventBuilder?.addQuestion(question);
    if (!linkStateRetransmissionList.size) {
      clearTimeout(lsTransmission?.delayTimer);
      clearTimeout(lsTransmission?.rxmtTimer);
      this.packetProcessedEventBuilder?.addAction(
        `The Link State Retransmission List of this neighbor is now empty. Hence,
        <b>cleared timers to resend the list to ${neighborId}</b>.`
      );
    }
    setNeighbor({
      ...neighbor,
      linkStateRetransmissionList,
    });
    const maxAgeLsaRemovalAction = this.ospfInterface.lsDb.removeMaxAgeLsas(
      areaId,
      ackedMaxAgeLsaList
    );
    maxAgeLsaRemovalAction &&
      this.packetProcessedEventBuilder?.addAction(maxAgeLsaRemovalAction);
  };
}
