import { LSAHeader } from "./header";
import { RouterLSABody } from "./router_lsa";

export { LSAHeader } from "./header";
export abstract class LSA {
  header: LSAHeader;
  abstract body: RouterLSABody;
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
  isInstanceOf = (comparedLsa: LSA) => this.header.isInstanceOf(comparedLsa);

  /**
   * Checks for exact equality with the compared LSA, including age and Sequence number.
   * @param comparedLsa
   * @returns
   */
  equals = (comparedLsa: LSA) => this.header.equals(comparedLsa);

  referenceEquals = (comparedLsa: LSA) => this === comparedLsa;
}
