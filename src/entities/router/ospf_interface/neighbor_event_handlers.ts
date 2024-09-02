import { OSPFInterface } from ".";
import { State } from "../../ospf/enum";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { NeighborTableRow } from "../../ospf/tables";
import { deadTimerFactory } from "./timer_factories";

type NeighborEventHandler = (
  this: OSPFInterface,
  neighbor: NeighborTableRow
) => void;

/**
 * The `HelloReceived` Event handler.
 * - Transitions the state of the OSPF Neighbor to `INIT` if it was `DOWN` previously.
 * - Resets the dead timer irrespective of the previous state of the neighbor.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const helloReceived: NeighborEventHandler = function (neighbor) {
  const { config } = this;
  const { deadInterval } = config;
  const { state } = neighbor;
  // action for all states - Clear dead timer.
  if (neighbor.deadTimer) {
    clearTimeout(neighbor.deadTimer);
  }
  neighbor.deadTimer = deadTimerFactory.call(this, neighbor, deadInterval);
  // state transition to init if the router is in a `DOWN` state.
  if (state === State.Down) {
    neighbor.state = State.Init;
  }
};

/**
 * The `OneWayReceived` event handler. Triggered when a router doesn't see its address in the hello packet it received.
 * - If the neighbor is in a state >= `2WAY`, regresses the state down to `INIT`
 * @param this The OSPF Interface
 * @param neighbor  The OSPF Neighbor
 */
const oneWayReceived: NeighborEventHandler = function (neighbor) {
  const { state } = neighbor;
  if (state >= State.TwoWay) {
    neighbor.state = State.Init;
    neighbor.linkStateRequestList = [];
    neighbor.linkStateRetransmissionList = [];
    neighbor.dbSummaryList = [];
  }
};

/**
 * Handler for the event `TwoWayReceived`, which is fired when the router sees itself in a received hello packet.
 * - Always forms an adjacency (transitions to Ex-Start state) since we simulate a point to point network.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const twoWayReceived: NeighborEventHandler = function (neighbor) {
  const { config } = this;
  const { rxmtInterval } = config;
  const { state } = neighbor;
  if (state === State.Init) {
    neighbor.state = State.ExStart;
    neighbor.rxmtTimer = setTimeout(
      this.sendDDPacket.bind(this, neighbor),
      rxmtInterval
    );
  }
};

/**
 * `NegotiationDone` Event Handler. See Section 10.6, 10.8.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const negotiationDone: NeighborEventHandler = function (neighbor) {
  neighbor.state = State.Exchange;
  this.sendDDPacket(neighbor);
};

/**
 * The `ExchangeDone` event handler.
 * - Sets state of the neighbor to `Loading` if more DDs are pending, else sets it to `Full`
 * - Starts Sending LSA Request Packets to the neighbor
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const exchangeDone: NeighborEventHandler = function (neighbor) {
  const { linkStateRequestList } = neighbor;
  neighbor.state = linkStateRequestList.length ? State.Loading : State.Full;
  // TODO: Send LSA Request Packets to the neighbor.
};

/**
 * The `LoadingDone` Event handler. Sets the state to full, since all the LSAs from the neighbor have been received.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const loadingDone: NeighborEventHandler = function (neighbor) {
  neighbor.state = State.Full;
};

// AdjOK event handler is not required since this event will never be transmitted in our simulator.

/**
 * The `SeqNumberMismatch` (Regressive event) event handler. The adjacency is torn down, and then an attempt is made at reestablishment.
 * - The LS Retransmission list, DB Summary List, and LS Request List are cleared of LSAs.
 * - New state is set to `ExStart` and DD packets are sent to the neighbor with current router as the master.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const seqNumberMismatch: NeighborEventHandler = function (neighbor) {
  const { config } = this;
  const { rxmtInterval } = config;
  const { state } = neighbor;
  if (state >= State.Exchange) {
    neighbor.state = State.ExStart;
    neighbor.linkStateRequestList = [];
    neighbor.dbSummaryList = [];
    neighbor.linkStateRetransmissionList = [];
    neighbor.rxmtTimer = setTimeout(
      this.sendDDPacket.bind(this, neighbor),
      rxmtInterval
    );
  }
};

/**
 * The action for event `BadLSReq` is exactly the same as for the neighbor event `SeqNumberMismatch`.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const badLsRequest: NeighborEventHandler = function (neighbor) {
  const { state } = neighbor;
  if (state >= State.Exchange) {
    seqNumberMismatch.call(this, neighbor);
  }
};

/**
 * The `KillNbr`, `LLDown`, and `InactivityTimer` Event Handlers.
 * - The state of the neighbor transitions to `DOWN`.
 * - The Link state retransmission list, Database summary list and Link state request list are cleared of LSAs.
 * - The Inactivity Timer is disabled.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const killNeighbor: NeighborEventHandler = function (neighbor) {
  const { deadTimer } = neighbor;
  clearTimeout(deadTimer);
  neighbor.state = State.Down;
  neighbor.linkStateRequestList = [];
  neighbor.linkStateRetransmissionList = [];
  neighbor.dbSummaryList = [];
  neighbor.deadTimer = undefined;
  this.onOspfNeighborDown();
};

export const neighborEventHandlerFactory = new Map([
  [NeighborSMEvent.HelloReceived, helloReceived],
  [NeighborSMEvent.OneWay, oneWayReceived],
  [NeighborSMEvent.TwoWayReceived, twoWayReceived],
  [NeighborSMEvent.NegotiationDone, negotiationDone],
  [NeighborSMEvent.ExchangeDone, exchangeDone],
  [NeighborSMEvent.LoadingDone, loadingDone],
  [NeighborSMEvent.SeqNumberMismatch, seqNumberMismatch],
  [NeighborSMEvent.BadLSReq, badLsRequest],
  [NeighborSMEvent.KillNbr, killNeighbor],
  /**
   * The `LLDown` event handler is the same as `KillNeighbor` handler.
   */
  [NeighborSMEvent.LLDown, killNeighbor],
  /**
   * The `InactivityTimer` event handler is the same as `KillNeighbor` handler.
   */
  [NeighborSMEvent.InactivityTimer, killNeighbor],
]);

export default neighborEventHandlerFactory;
