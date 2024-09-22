import { LSAHeader } from "./header";
import { RouterLSABody } from "./router_lsa";

export { LSAHeader } from "./header";
export abstract class LSA {
  header: LSAHeader;
  abstract body: RouterLSABody;
  updatedOn: number;
  constructor(header: LSAHeader) {
    this.header = header;
    this.updatedOn = Date.now();
  }

  /**
   * Given an LSA to compare, determines if it is the same instance as this one.
   * @param comparedLsa
   */
  equals = (comparedLsa: LSA) => this.header.equals(comparedLsa);

  referenceEquals = (comparedLsa: LSA) => this === comparedLsa;
}
