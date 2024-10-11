import { LSA } from "src/entities/ospf/lsa";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";

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
    return RouterLSA.fromRouterLsa(lsa);
  }
  throw new Error("Not Implemented");
};
