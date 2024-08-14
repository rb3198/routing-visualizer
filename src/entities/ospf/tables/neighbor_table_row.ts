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
   * Sequence number to of the Database Description packet to be sent to the neighbor.
   *
   * Not relevant in states pre Ex-Start
   */
  ddSeqNumber?: number;

  /**
   * If `true`, the neighbor is the master. Else, the neighbor is the slave.
   */
  master: boolean;

  // lastDDPacket - Last Received DBD Packet TODO
  /**
   * Timeout to send hello packets.
   */
  helloTimer?: NodeJS.Timeout;
  /**
   * Timeout to set the router to DOWN state after no hello packet communication for `deadInterval` milliseconds.
   */
  deadTimer?: NodeJS.Timeout;

  /**
   * Timeout to transmit DD packets to neighbors / request LS info from masters.
   *
   * DD packets are transmitted every `rxmtInterval` ms if:
   * - The neighbor is in an `ExStart` state or
   * - The source router is the master and no ACK has been received for a DD packet within `rxmtInterval` ms.
   * LS Request packets are transmitted every `rxmtInterval` ms if the response is not received by then.
   */
  rxmtTimer?: NodeJS.Timeout;

  constructor(
    routerId: IPv4Address,
    state: State,
    deadTime: number,
    address: IPv4Address,
    interfaceId: string,
    master?: boolean
  ) {
    this.routerId = routerId;
    this.state = state;
    this.deadTime = deadTime;
    this.address = address;
    this.interfaceId = interfaceId;
    this.master = master ?? false;
  }
}
