import { IPv4Address } from "../../ip/ipv4_address";
import { LSType } from "../enum";

export class LSAHeader {
  lsAge: number;
  lsType: LSType;
  linkStateId: IPv4Address;
  advertisingRouter: IPv4Address;
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
