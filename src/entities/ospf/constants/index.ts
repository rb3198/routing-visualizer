/**
 * Default hello interval in ms.
 */
export const DEFAULT_HELLO_INTERVAL = 10000;
export const getDeadInterval = (helloInterval: number) => 4 * helloInterval;
export const DEFAULT_RXMT_INTERVAL = 5000;

/**
 * RXMT interval is set based on the propagation delay faced by the network.
 * - Round Trip Time (RTT) = 2 * propagation delay
 * - Propagation Delay = RTT + 1s
 * @param propagationDelay
 * @returns
 */
export const getRxmtInterval = (propagationDelay: number) =>
  propagationDelay * 2 + 1000;

/**
 * The OSPF Version # used by this simulator.
 */
export const VERSION = 2;

/**
 * The ID of the Backbone area.
 */
export const BACKBONE_AREA_ID = 0;

export const NOT_IMPLEMENTED = "NOT_IMPLEMENTED";
