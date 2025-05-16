import { LSRequestPacket, LSUpdatePacket } from "src/entities/ospf/packets";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { State } from "src/entities/ospf/enum";
import { LSA } from "src/entities/ospf/lsa";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { copyLsa } from "src/utils/common";
import { printLsaHtml } from "src/utils/ui";
import { IPProtocolNumber } from "src/entities/ip/enum/ip_protocol_number";

export class LsRequestPacketHandler extends PacketHandlerBase<LSRequestPacket> {
  private getDescription = (neighborId: IPv4Address, lsaList: LSA[]) => {
    return lsaList.length
      ? `Built an LS Update packet containing the requested LSAs.`
      : `No link state updates to retransmit to neighbor <b>${neighborId}</b>.`;
  };

  _handle = (
    interfaceId: string,
    ipPacket: IPPacket,
    packet: LSRequestPacket
  ) => {
    const { router, neighborTable, lsDb, neighborStateMachine } =
      this.ospfInterface;
    const { ipInterfaces, id: routerId, originateIpPacket } = router;
    const { header, body: lsRequests } = packet;
    const { areaId, routerId: neighborId } = header;
    const neighbor = neighborTable[neighborId.toString()];
    const { state, address } = neighbor || {};
    const { ipInterface } = ipInterfaces.get(interfaceId) || {};
    if (!neighbor || state < State.Exchange || !ipInterface) {
      this.packetProcessedEventBuilder?.addAction(
        `Since the ${neighborId} is in a state < <code>Exchange</code>, this request is being discarded.`
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
    // The LS Updates in response to LS Requests should NOT be placed on the retransmission list and instead must be sent directly.
    const desc = this.getDescription(neighborId, lsaResponseList);
    this.packetProcessedEventBuilder?.addAction(desc);
    setTimeout(() => {
      originateIpPacket(
        address,
        IPProtocolNumber.ospf,
        new LSUpdatePacket(routerId, areaId, lsaResponseList),
        interfaceId,
        [`The LSU was sent in response to the LS Request made by ${neighborId}`]
      );
    });
    if (isBadLsReq) {
      const action = neighborStateMachine(
        neighborId.toString(),
        NeighborSMEvent.BadLSReq
      );
      action && this.packetProcessedEventBuilder?.addAction(action);
    }
  };
}
