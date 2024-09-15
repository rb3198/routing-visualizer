import { IPv4Address } from "../../ip/ipv4_address";
import { LSType } from "../enum";

export class LSAHeader {
  lsAge: number;
  lsType: LSType;
  linkStateId: IPv4Address;
  advertisingRouter: IPv4Address;
  /**
   * Used to detect old and duplicate LSAs.
   * - The higher the number, the more recent is the LSA.
   * - Starts with - 2^31 + 1
   * - Max value can be 2^31 - 1. Upon reaching this, the LSA must be flushed.
   * - Gets incremented every time the router originates a new instance of the LSA.
   */
  lsSeqNumber: number;
  /*
        Checksum, length, and Options fields have been ignored.
    */
  constructor(
    lsAge: number,
    lsType: LSType,
    linkStateId: IPv4Address,
    advertisingRouter: IPv4Address,
    lsSeqNumber: number
  ) {
    this.lsAge = lsAge;
    this.lsType = lsType;
    this.linkStateId = linkStateId;
    this.advertisingRouter = advertisingRouter;
    this.lsSeqNumber = lsSeqNumber;
  }
}
