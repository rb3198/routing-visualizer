import { OSPFInterface } from ".";
import { State } from "../../ospf/enum";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { NeighborTableRow } from "../../ospf/table_rows";
import { deadTimerFactory } from "./timer_factories";

type NeighborEventHandler = (
  this: OSPFInterface,
  neighbor: NeighborTableRow,
  desc?: string
) => string;

/**
 * The `HelloReceived` Event handler.
 * - Transitions the state of the OSPF Neighbor to `INIT` if it was `DOWN` previously.
 * - Resets the dead timer irrespective of the previous state of the neighbor.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns Description of what actions took place.
 */
const helloReceived: NeighborEventHandler = function (neighbor) {
  const { config } = this;
  const { deadInterval } = config;
  const { state, routerId: neighborId } = neighbor;
  let desc = `Received a Hello Packet from neighbor <b>${neighborId}</b>.<br>`;
  // action for all states - Clear dead timer.
  if (neighbor.deadTimer) {
    clearTimeout(neighbor.deadTimer);
  }
  const deadTimer = deadTimerFactory.call(this, neighbor, deadInterval);
  desc += "Dead Timer of the neighbor reset on <i>HelloReceived</i>.<br>";
  let newState = state;
  // state transition to init if the router is in a `DOWN` state.
  if (state === State.Down) {
    newState = State.Init;
    desc += `Neighbor promoted to the <code>Init</code> state.`;
  }
  this.setNeighbor({
    ...neighbor,
    deadTimer,
    state: newState,
  });
  return desc;
};

/**
 * The `OneWayReceived` event handler. Triggered when a router doesn't see its address in the hello packet it received.
 * - If the neighbor is in a state >= `2WAY`, regresses the state down to `INIT`
 * @param this The OSPF Interface
 * @param neighbor  The OSPF Neighbor
 * @returns Description of what actions took place.
 */
const oneWayReceived: NeighborEventHandler = function (neighbor) {
  const {
    state,
    routerId: neighborId,
    areaId,
    linkStateRetransmissionList,
    lsTransmission,
  } = neighbor;
  if (state >= State.TwoWay) {
    clearTimeout(lsTransmission?.delayTimer);
    clearTimeout(lsTransmission?.rxmtTimer);
    this.setNeighbor({
      ...neighbor,
      state: State.Init,
      linkStateRequestList: [],
      linkStateRetransmissionList: new Map(),
      dbSummaryList: [],
    });
    this.lsDb.postprocessLsRetransmissionListClearout(
      areaId,
      Array.from(linkStateRetransmissionList.values()).map((x) => x.lsa)
    );
  }
  if (state === State.Full) {
    this.lsDb.originateRouterLsa(areaId, true);
  }
  return `<i>OneWayReceived</i> event triggered since the router didn't spot 
      its address in the hello packet received from ${neighborId}.
      <ul>
        <li>State of the neighbor set to <code>Init</code>.</li>
        <li>All the lists reset.</li>
      </ul>`;
};

/**
 * Handler for the event `TwoWayReceived`, which is fired when the router sees itself in a received hello packet.
 * - Always forms an adjacency (transitions to Ex-Start state) since we simulate a point to point network.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns Description of all the actions that took place
 */
const twoWayReceived: NeighborEventHandler = function (neighbor) {
  const { config } = this;
  const { rxmtInterval } = config;
  const { state, routerId: neighborId } = neighbor;
  if (state === State.Init) {
    this.setNeighbor({
      ...neighbor,
      state: State.ExStart,
      ddRxmtTimer: setInterval(
        this.sendDDPacket.bind(this, neighborId),
        rxmtInterval
      ),
    });
    setTimeout(() => this.sendDDPacket(neighborId));
    return `
    <i>TwoWayReceived</i> event triggered since the Router found itself in <b>${neighborId}</b>'s hello packet.
    <ul>
      <li>${neighborId}'s state upgraded from <code>Init</code> to <code>ExStart</code>.</li>
      <li>The router will now negotiate the Master/Slave relationship and
      send Database Description Packets to ${neighborId}</li>
    </ul>
    `;
  }
  return "";
};

/**
 * `NegotiationDone` Event Handler. See Section 10.6, 10.8.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns A description of all the steps taken by the router in its Neighbor State Machine
 */
const negotiationDone: NeighborEventHandler = function (neighbor) {
  const { master } = neighbor;
  this.setNeighbor({
    ...neighbor,
    state: State.Exchange,
  });
  setTimeout(() => this.sendDDPacket(neighbor.routerId));
  return `<b>Negotiation between the router and ${
    neighbor.routerId
  } for Master / Slave is complete</b>.<br>
  <code>NegotiationDone</code> event has been emitted and
  ${neighbor.routerId} is now promoted to the <code>Exchange</code> state. ${
    this.router.id
  } is the <b>${master ? "Master" : "Slave"}</b>
  in this relation.<br/>
  The router will send a new DD packet immediately reflecting the new relationship of the two routers.`;
};

/**
 * The `ExchangeDone` event handler.
 * - Sets state of the neighbor to `Loading` if more DDs are pending, else sets it to `Full`
 * - Starts Sending LSA Request Packets to the neighbor
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns Description of what actions took place.
 */
const exchangeDone: NeighborEventHandler = function (neighbor) {
  const { linkStateRequestList, routerId: neighborId, ddRxmtTimer } = neighbor;
  const { rxmtInterval } = this.config;
  const loadDone = !linkStateRequestList.length;
  if (loadDone) {
    return loadingDone.call(
      this,
      neighbor,
      `Exchange between the router and ${neighborId} is complete. Entering the <code>Full</code> (final) state!`
    );
  }
  const desc = `<code>ExchangeDone</code>
      event was generated on completion of examination of the neighbor's Database Description packet.
      The router has some link state requests to emit to ${neighborId} and hence enters the <code>Loading</code> state.
      The router is completing the requests.`;
  clearInterval(ddRxmtTimer);
  this.setNeighbor({
    ...neighbor,
    state: State.Loading,
    lsRequestRxmtTimer: setInterval(
      () => this.sendLSRequestPacket(neighborId),
      rxmtInterval
    ),
    ddRxmtTimer: undefined,
  });
  return desc;
};

/**
 * The `LoadingDone` Event handler. Sets the state to full, since all the LSAs from the neighbor have been received.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @param desc Optional description to be emitted to Event Handler.
 * @returns Description of what actions took place.
 */
const loadingDone: NeighborEventHandler = function (neighbor, desc?: string) {
  const { routerId: neighborId, areaId, lsRequestRxmtTimer } = neighbor;
  clearInterval(lsRequestRxmtTimer);
  this.setNeighbor({
    ...neighbor,
    state: State.Full,
    lsRequestRxmtTimer: undefined,
  });
  this.lsDb.originateRouterLsa(areaId, true);
  return (
    desc ??
    `Loading complete wrt neighbor ${neighborId}.
    <code>LoadingDone</code> event generated - Entering the <code>Full</code> state.`
  );
};

// AdjOK event handler is not required since this event will never be transmitted in our simulator.

/**
 * The `SeqNumberMismatch` (Regressive event) event handler. The adjacency is torn down, and then an attempt is made at reestablishment.
 * - The LS Retransmission list, DB Summary List, and LS Request List are cleared of LSAs.
 * - New state is set to `ExStart` and DD packets are sent to the neighbor with current router as the master.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns Description of what actions took place.
 */
const seqNumberMismatch: NeighborEventHandler = function (
  neighbor,
  desc?: string
) {
  const { config, lsDb } = this;
  const { rxmtInterval } = config;
  const {
    state,
    lsRequestRxmtTimer,
    lsTransmission,
    areaId,
    linkStateRetransmissionList,
  } = neighbor;
  clearInterval(lsRequestRxmtTimer);
  if (lsTransmission) {
    const { rxmtTimer, delayTimer } = lsTransmission;
    clearTimeout(rxmtTimer);
    clearTimeout(delayTimer);
  }
  if (state >= State.Exchange) {
    this.setNeighbor({
      ...neighbor,
      state: State.ExStart,
      linkStateRequestList: [],
      dbSummaryList: [],
      linkStateRetransmissionList: new Map(),
      ddRxmtTimer: setInterval(
        this.sendDDPacket.bind(this, neighbor.routerId),
        rxmtInterval
      ),
      lastReceivedDdPacket: undefined,
      lsRequestRxmtTimer: undefined,
      lsTransmission: undefined,
    });
    lsDb.postprocessLsRetransmissionListClearout(
      areaId,
      Array.from(linkStateRetransmissionList.values()).map((x) => x.lsa)
    );
    this.lsDb.originateRouterLsa(areaId, true);
    return (
      (desc || "") +
      `
    <code>SEQ_NUMBER_MISMATCH</code> Event led to a reset of the neighbor state to <code>ExStart</code> state.<br>
    All the timers were reset, and the request and retransmission lists were cleared.
    `
    );
  }
  return "";
};

/**
 * The action for event `BadLSReq` is exactly the same as for the neighbor event `SeqNumberMismatch`.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns Description of what actions took place.
 */
const badLsRequest: NeighborEventHandler = function (neighbor, reason) {
  const { state } = neighbor;
  if (state >= State.Exchange) {
    return seqNumberMismatch.call(
      this,
      neighbor,
      reason ??
        `Link State Request packet received in a state >= <code>Exchange</code>.
      Generating <code>SeqNumberMismatch</code> event.`
    );
  }
  return "";
};

/**
 * The `KillNbr`, `LLDown`, and `InactivityTimer` Event Handlers.
 * - The state of the neighbor transitions to `DOWN`.
 * - The Link state retransmission list, Database summary list and Link state request list are cleared of LSAs.
 * - The Inactivity Timer is disabled.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @returns Description of what actions took place.
 */
const killNeighbor: NeighborEventHandler = function (this, neighbor) {
  const {
    deadTimer,
    routerId: neighborId,
    areaId,
    linkStateRetransmissionList,
  } = neighbor;
  clearTimeout(deadTimer);
  this.setNeighbor({
    ...neighbor,
    state: State.Down,
    linkStateRequestList: [],
    linkStateRetransmissionList: new Map(),
    dbSummaryList: [],
    deadTimer: undefined,
    lastReceivedDdPacket: undefined,
  });
  this.lsDb.postprocessLsRetransmissionListClearout(
    areaId,
    Array.from(linkStateRetransmissionList.values()).map((x) => x.lsa)
  );
  this.lsDb.originateRouterLsa(areaId, true);
  return `
  Dead timer of ${neighborId} triggered. The neighbor is being set to the <code>DOWN</code> state.
  <ul>
    <li>A new router LSA will be generated, informing the network of the new state.</li>
    <li>All the timers related to this neighbor will be cleared</li>
  </ul>
  `;
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
