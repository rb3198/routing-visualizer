import { NeighborTableEventType } from "src/entities/network_event/neighbor_table_event";
import { OSPFInterface } from ".";

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

export const getNeighborTableEventDescription = (
  type: NeighborTableEventType
) => {
  switch (type) {
    case "added":
      return `Neighbor added since its OSPF config (helloInterval, deadInterval, DR, BDR) matched exactly with the router. 
      It belonged to the same area or the backbone area (Area 0)`;
    default:
      return "";
  }
};
