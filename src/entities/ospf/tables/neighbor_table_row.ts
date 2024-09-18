import { IPv4Address } from "../../ip/ipv4_address";
import { State } from "../enum";
import { LSAHeader } from "../lsa";
import { DDPacketSummary } from "../summaries/dd_packet_summary";

export class NeighborTableRow {
  /**
   * Primary ID of the neighbor. Derived from the Router ID contained in the received OSPF Header.
   */
  routerId: IPv4Address;

  areaId: number;
  state: State;
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
   * If `true`, the router is the master. Else, the router is the slave.
   */
  master: boolean;

  // lastDDPacket - Last Received DBD Packet TODO

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

  /**
   * The list of LSAs that need to be received from this neighbor in order to synchronize the two neighbors' link-state databases.
   * This list is created as Database Description packets are received, and is then sent to the neighbor in Link State Request packets.
   * The list is depleted as appropriate Link State Update packets are received.
   */
  linkStateRequestList: LSAHeader[];

  /**
   * The complete list of LSAs that make up the area link-state
   * database, at the moment the neighbor goes into Database Exchange state.
   *
   * This list is sent to the neighbor in Database Description packets.
   */
  dbSummaryList: any[]; // TODO

  lastReceivedDdPacket?: DDPacketSummary;

  /**
   * The list of LSAs that have been flooded but not acknowledged on this adjacency.
   * These will be retransmitted at intervals until they are acknowledged, or until the adjacency is destroyed.
   */
  linkStateRetransmissionList: any[]; // TODO

  constructor(
    routerId: IPv4Address,
    areaId: number,
    state: State,
    address: IPv4Address,
    interfaceId: string,
    master?: boolean
  ) {
    this.routerId = routerId;
    this.areaId = areaId;
    this.state = state;
    this.address = address;
    this.interfaceId = interfaceId;
    this.master = master ?? true;
    this.linkStateRequestList = [];
    this.dbSummaryList = [];
    this.linkStateRetransmissionList = [];
  }
}
