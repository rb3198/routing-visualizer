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
