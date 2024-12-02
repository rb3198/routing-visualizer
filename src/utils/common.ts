import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSA } from "src/entities/ospf/lsa";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { SummaryLSA } from "src/entities/ospf/lsa/summary_lsa";

/**
 * Gets key of object given a value belonging to the object.
 * @param obj
 * @param value
 * @returns
 */
export const getKey = <T extends Object>(obj: T, value: any) => {
  return Object.keys(obj)[Object.values(obj).indexOf(value)];
};

export const copyLsa = function (lsa: LSA) {
  if (RouterLSA.isRouterLsa(lsa)) {
    return RouterLSA.fromRouterLsa(lsa as RouterLSA);
  }
  if (SummaryLSA.isSummaryLsa(lsa)) {
    const { header, body } = lsa as SummaryLSA;
    const { linkStateId, advertisingRouter, lsSeqNumber, lsAge, lsType } =
      header;
    const { networkMask, metric } = body;
    return new SummaryLSA(
      linkStateId,
      advertisingRouter,
      // @ts-ignore - already checked in `isSummaryLsa`
      lsType,
      networkMask,
      metric,
      lsSeqNumber,
      lsAge
    );
  }
  throw new Error("Not Implemented");
};

export const rootAsIp = new IPv4Address(192, 0, 0, 0, 8);
export const getAreaIp = (areaId: number) =>
  new IPv4Address(rootAsIp.bytes[0], areaId + 1, 0, 0, 16);
