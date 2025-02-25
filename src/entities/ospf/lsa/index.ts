import { LSAHeader } from "./header";
import { RouterLSABody } from "./router_lsa";
import { SummaryLSABody } from "./summary_lsa";

export { LSAHeader } from "./header";

export type LSBody = RouterLSABody | SummaryLSABody;
export abstract class LSA {
  header: LSAHeader;
  abstract body: LSBody;
  updatedOn: number;
  createdOn: number;
  constructor(header: LSAHeader) {
    this.header = header;
    this.updatedOn = Date.now();
    this.createdOn = Date.now();
  }

  /**
   * Given an LSA to compare, determines if it is one of the instances of this one.
   * @param comparedLsa
   */
  isInstanceOf(comparedLsa: LSA) {
    return this.header.isInstanceOf(comparedLsa);
  }

  /**
   * Checks for exact equality with the compared LSA, including age and Sequence number.
   * @param comparedLsa
   * @param maxAge The configured `MaxAge` of the LSAs.
   * @returns
   */
  equals(comparedLsa: LSA, maxAge: number) {
    return this.header.equals(comparedLsa, maxAge);
  }

  referenceEquals(comparedLsa: LSA) {
    return this === comparedLsa;
  }
}
