import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSA } from "src/entities/ospf/lsa";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { SummaryLSA } from "src/entities/ospf/lsa/summary_lsa";
import { NeighborTableRow } from "src/entities/ospf/table_rows";

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

export const copyNeighborTable = (table: Record<string, NeighborTableRow>) => {
  const newTable: Record<string, NeighborTableRow> = {};
  Object.keys(table).forEach((key) => {
    newTable[key] = {
      ...table[key],
      linkStateRequestList: [...table[key].linkStateRequestList],
      linkStateRetransmissionList: [...table[key].linkStateRetransmissionList],
    };
  });
  return newTable;
};

export const downloadJson = (obj: object, filename: string) => {
  const json = JSON.stringify(obj, null, 3);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
