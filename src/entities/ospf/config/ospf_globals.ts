import {
  DEFAULT_HELLO_INTERVAL,
  getDeadInterval,
  getRxmtInterval,
} from "../constants";
import { MaxAge as DefMaxAge, LSRefreshTime } from "../lsa/constants";
/**
 * Default propagation delay of the interfaces in the simulation.
 *
 * `2000ms` = `2s`
 */
export const DEFAULT_PROPAGATION_DELAY = 2000;

/**
 * Global configuration of the simulation to apply to all the areas.
 * - Configured by the user before starting the simulation.
 * - Post starting the simulation, can be adjusted per area / router.
 */
export class OSPFGlobals {
  propagationDelay: number;
  gracefulShutdown: boolean;
  helloInterval: number;
  deadInterval: number;
  rxmtInterval: number;
  MaxAge: number;
  LsRefreshTime: number;

  constructor({
    propagationDelay = DEFAULT_PROPAGATION_DELAY,
    gracefulShutdown = true,
    helloInterval = DEFAULT_HELLO_INTERVAL,
    MaxAge = DefMaxAge,
    LsRefreshTime = LSRefreshTime,
  }: Partial<OSPFGlobals>) {
    this.propagationDelay = propagationDelay;
    this.gracefulShutdown = gracefulShutdown;
    this.helloInterval = helloInterval;
    this.deadInterval = getDeadInterval(helloInterval);
    this.rxmtInterval = getRxmtInterval(propagationDelay);
    this.MaxAge = MaxAge;
    this.LsRefreshTime = LsRefreshTime;
  }
}
