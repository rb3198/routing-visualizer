import {
  DEFAULT_HELLO_INTERVAL,
  DEFAULT_RXMT_INTERVAL,
  getDeadInterval,
} from "../constants";

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

  constructor(areaId: number, helloInterval?: number, rxmtInterval?: number) {
    this.helloInterval = helloInterval ?? DEFAULT_HELLO_INTERVAL;
    this.deadInterval = getDeadInterval(this.helloInterval);
    this.rxmtInterval = rxmtInterval ?? DEFAULT_RXMT_INTERVAL;
    this.areaId = areaId;
  }
}
