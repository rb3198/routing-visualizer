import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSA, LSAHeader } from ".";
import { LSType } from "../enum";
import { InitialSequenceNumber } from "./constants";

export class SummaryLSABody {
  /**
 *  - For Type 3 (IP) summary-LSAs, this indicates the destination network's IP address mask.
    - For Type 4 (AS-BR) summary-LSAs, this field is meaningless.
    */
  networkMask: IPv4Address;
  /**
   * The cost of this route
   */
  metric: number;
  constructor({ networkMask, metric }: SummaryLSABody) {
    this.metric = metric;
    this.networkMask = networkMask;
  }
}

export class SummaryLSA extends LSA {
  body: SummaryLSABody;
  /**
   * The Summary LSA Constructor.
   * @param linkStateId Represents **IP Address of networks** for IP-Summary LSAs,
   * Represents **OSPF Router ID Of the AS BR** for AS-BR Summary LSAs.
   * @param advertisingRouter The IP Address of the Area Border Router generating this LSA.
   * @param lsType IP Summary or AS BR Summary LSA.
   * @param networkMask - For Type 3 (IP) summary-LSAs, this indicates the destination network's IP address mask.
     - For Type 4 (AS-BR) summary-LSAs, this field is meaningless.
   * @param metric The cost of the route to the entity (IP network or AS-BR) described by this LSA.
   * @param lsSeqNumber Sequence number, defaults to `InitialSequenceNumber`.
   * @param lsAge Age of the LSA, defaults to 0.
   */
  constructor(
    linkStateId: IPv4Address,
    advertisingRouter: IPv4Address,
    lsType: LSType.SummaryIpLSA | LSType.SummaryAsBrLSA,
    networkMask: IPv4Address,
    metric: number,
    lsSeqNumber?: number,
    lsAge?: number
  ) {
    const header = new LSAHeader(
      lsAge ?? 0,
      lsType,
      linkStateId,
      advertisingRouter,
      lsSeqNumber ?? InitialSequenceNumber
    );
    super(header);
    this.body = new SummaryLSABody({ networkMask, metric });
  }

  static isSummaryLsa = (lsa: LSA) => {
    const { body } = lsa;
    return "networkMask" in body && "metric" in body;
  };
}
