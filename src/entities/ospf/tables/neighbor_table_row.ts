import { IPv4Address } from "../../ip/ipv4_address";
import { State } from "../enum";

export class NeighborTableRow {
  /**
   * Primary ID of the neighbor. Derived from the Router ID contained in the received OSPF Header.
   */
  routerId: IPv4Address;
  state: State;
  deadTime: number; // stored in epoch
  /**
   * Address of the neighbor on the IP interface.
   */
  address: IPv4Address;
  interfaceId: string;
  /**
   * Timeout to send hello packets.
   */
  helloTimer?: NodeJS.Timeout;
  /**
   * Timeout to set the router to DOWN state after no hello packet communication for `deadInterval` milliseconds.
   */
  deadTimer?: NodeJS.Timeout;

  constructor(
    routerId: IPv4Address,
    state: State,
    deadTime: number,
    address: IPv4Address,
    interfaceId: string
  ) {
    this.routerId = routerId;
    this.state = state;
    this.deadTime = deadTime;
    this.address = address;
    this.interfaceId = interfaceId;
  }
}
