import { LSRequestPacket } from "src/entities/ospf/packets";
import { PacketHandlerBase } from "./base";
import { IPPacket } from "src/entities/ip/packets";
import { State } from "src/entities/ospf/enum";
import { LSA } from "src/entities/ospf/lsa";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";

export class LsRequestPacketHandler extends PacketHandlerBase<LSRequestPacket> {
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
      setNeighborLsRetransmissionList,
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
    const lsaResponseList: LSA[] = [];
    let isBadLsReq = false;
    lsRequests.forEach((lsRequest) => {
      const lsa = lsDb.getLsa(areaId, lsRequest);
      if (!lsa) {
        isBadLsReq = true;
        return;
      }
      const { header } = lsa;
      const { lsAge } = header;
      // Age all the LSAs by InfTransDelay (animation delay) before sending them on the link
      lsaResponseList.push({
        ...lsa,
        header: {
          ...header,
          lsAge: lsAge + 2, // TODO: Use Propagation Delay stored in store to age LSA.
        },
      });
    });
    setNeighborLsRetransmissionList(neighbor, lsaResponseList);
    if (isBadLsReq) {
      neighborStateMachine(neighborId.toString(), NeighborSMEvent.BadLSReq);
    }
  };
}
