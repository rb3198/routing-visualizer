import {
  DEFAULT_HELLO_INTERVAL,
  DEFAULT_RXMT_INTERVAL,
  getDeadInterval,
} from "../constants";
import { MaxAge as DefMaxAge } from "../lsa/constants";

/**
 * Toned-down version of OSPF configuration.
 */
export class OSPFConfig {
  /**
   * Hello Packets must be sent at every `helloInterval` milliseconds.
   */
  helloInterval: number;
  /**
   * If a hello packet hasn't arrived within `deadInterval` milliseconds from a neighbor, the neighbor is considered to be `DOWN`.
   */
  deadInterval: number;
  /**
   * OSPF Area ID, which must match between the neighbors to establish adjacency.
   */
  areaId: number;

  /**
   * The number of milliseconds between LSA retransmissions.
   */
  rxmtInterval: number;

  /**
   * The maximum age that an LSA can attain. When an LSA's LS age field reaches MaxAge,
   * it is re-flooded in an attempt to flush the LSA from the routing domain.
   *
   * The `MaxAge` is always 1 hour.
   */
  MaxAge: number;

  /**
   * The maximum time between distinct originations of any particular LSA.
   *
   * If the LS age field of one of the router's self-originated LSAs reaches the value `LSRefreshTime`,
   * a new instance of the LSA is originated, even though the contents of the LSA (apart from the LSA header) will be the same.
   *
   * The LS Refresh Time in OSPF is always 1,800,000 ms, i.e. 30 minutes.
   */
  LsRefreshTime: number;

  /**
   * Boolean indicating if the OSPF Area is connected to the backbone area of the Autonomous System.
   */
  connectedToBackbone: boolean;

  constructor(
    areaId: number,
    helloInterval?: number,
    rxmtInterval?: number,
    maxAge?: number
  ) {
    this.helloInterval = helloInterval ?? DEFAULT_HELLO_INTERVAL;
    this.deadInterval = getDeadInterval(this.helloInterval);
    this.rxmtInterval = rxmtInterval ?? DEFAULT_RXMT_INTERVAL;
    this.MaxAge = maxAge ?? DefMaxAge;
    this.LsRefreshTime = (maxAge ?? DefMaxAge) / 2;
    this.areaId = areaId;
    this.connectedToBackbone = false;
  }
}
