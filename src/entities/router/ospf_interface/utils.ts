import { LSAHeader } from "src/entities/ospf/lsa";
import { OSPFInterface } from ".";
import { DDPacket } from "src/entities/ospf/packets";
import { State } from "src/entities/ospf/enum";

export const getIpPacketDropReason = function (
  this: OSPFInterface,
  versionOk: boolean,
  sourceOk: boolean,
  areaIdOk: boolean
) {
  const { config } = this;
  const { areaId } = config;
  let reason = "";
  if (!versionOk) {
    reason += "OSPF Version mismatch between routers.\n";
  }
  if (!sourceOk) {
    reason += "The broadcast packet originated from the router itself.\n";
  }
  if (!areaIdOk) {
    reason += `The packet originated from a router outside the area that the router resides in.\n
        For the packet to be accepted, it should either originate from Area 0 (the backbone), or from Area ${areaId}
        (The area that this router belongs to).
      `;
  }
  return reason;
};

/**
 * Validates a DD Packet when the sender is in the `Exchange` state of this router's Neighbor Table.
 * @param this
 * @param packet
 * @returns
 */
export function validateExchangeDDPacket(
  this: OSPFInterface,
  packet: DDPacket
) {
  const { header, body } = packet;
  const { routerId } = header;
  const { init, ddSeqNumber: packetSeqNumber, master: ms } = body;
  const neighbor = this.neighborTable[routerId.toString()];
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
}

/**
 * Given an LSA, figures out its unique identity
 * @param header
 * @returns
 */
export const getLsDbKey = (header: LSAHeader) => {
  const { lsType, linkStateId, advertisingRouter } = header;
  return `${lsType}_${linkStateId}_${advertisingRouter}`;
};
