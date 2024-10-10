import { LSA } from ".";
import { IPv4Address } from "../../ip/ipv4_address";
import { LSType } from "../enum";
import { MaxAge, MaxAgeDiff } from "./constants";

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

  /**
   * Given an LSA, compares the age of the LSA, as per Section 13.1 of the OSPF v2 Spec.
   * @param comparedLsa Either the LSA Header or the LSA instance itself of the LSA whose age needs to be compared.
   * @returns
   * - **0** if This LSA is of the same age as compared to the `comparedLsa`
   * - **-1** if This LSA is younger than the `comparedLsa`
   * - **1** if This LSA is older than the `comparedLsa`
   */
  compareAge = (comparedLsa: LSAHeader | LSA) => {
    const comparedHeader =
      comparedLsa instanceof LSA ? comparedLsa.header : comparedLsa;
    const { lsAge, lsSeqNumber } = this;
    const { lsAge: comparedLsAge, lsSeqNumber: comparedLsSeqNo } =
      comparedHeader;
    // LSAs with bigger Sequence numbers are younger.
    if (lsSeqNumber > comparedLsSeqNo) {
      return -1;
    } else if (lsSeqNumber < comparedLsSeqNo) {
      return 1;
    }
    // Sequence Number is Equal

    // If one of the instances has its age == `MaxAge`, it's considered to be more recent.
    if (lsAge === comparedLsAge) {
      return 0;
    }
    if (lsAge === MaxAge) {
      return -1;
    }
    if (comparedLsAge === MaxAge) {
      return 1;
    }
    // None of the instances have age = `MaxAge`.
    // Compare the age
    if (Math.abs(lsAge - comparedLsAge) > MaxAgeDiff) {
      return lsAge > comparedLsAge ? 1 : -1;
    }
    return 0;
  };

  /**
   * Given an LSA Header to compare, determines if both pertain to some instance of the same LSA.
   * **Note**: Does not take age or sequence number into account
   * @param comparedLsa
   */
  isInstanceOf = (comparedLsa: LSA | LSAHeader) => {
    const comparedHeader =
      "lsAge" in comparedLsa ? comparedLsa : comparedLsa.header;
    const { advertisingRouter, linkStateId, lsType } = this;
    return (
      lsType === comparedHeader.lsType &&
      advertisingRouter.equals(comparedHeader.advertisingRouter) &&
      linkStateId.equals(comparedHeader.linkStateId)
    );
  };

  /**
   * Checks for exact equality with the compared LSA, including age and Sequence number.
   * @param comparedLsa
   * @returns
   */
  equals = (comparedLsa: LSA | LSAHeader) => {
    const comparedHeader =
      comparedLsa instanceof LSAHeader ? comparedLsa : comparedLsa.header;
    return (
      this.isInstanceOf(comparedHeader) && this.compareAge(comparedHeader) === 0
    );
  };

  static from = (header: LSAHeader) => {
    const { lsAge, lsSeqNumber, lsType, linkStateId, advertisingRouter } =
      header;
    return new LSAHeader(
      lsAge,
      lsType,
      linkStateId,
      advertisingRouter,
      lsSeqNumber
    );
  };
}
