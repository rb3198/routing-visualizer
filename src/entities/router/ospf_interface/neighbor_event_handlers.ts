import { OSPFInterface } from ".";
import { State } from "../../ospf/enum";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { NeighborTableRow } from "../../ospf/table_rows";
import { deadTimerFactory } from "./timer_factories";

type NeighborEventHandler = (
  this: OSPFInterface,
  neighbor: NeighborTableRow,
  desc?: string
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
    desc += `Neighbor promoted to the <i>Init</i> state.`;
  }
  this.setNeighbor(
    {
      ...neighbor,
      deadTimer,
      state: newState,
    },
    desc
  );
};

/**
 * The `OneWayReceived` event handler. Triggered when a router doesn't see its address in the hello packet it received.
 * - If the neighbor is in a state >= `2WAY`, regresses the state down to `INIT`
 * @param this The OSPF Interface
 * @param neighbor  The OSPF Neighbor
 */
const oneWayReceived: NeighborEventHandler = function (neighbor) {
  const { state, routerId: neighborId, areaId } = neighbor;
  if (state >= State.TwoWay) {
    this.setNeighbor(
      {
        ...neighbor,
        state: State.Init,
        linkStateRequestList: [],
        linkStateRetransmissionList: [],
        dbSummaryList: [],
      },
      `<i>OneWayReceived</i> event triggered since the router didn't spot 
      its address in the hello packet received from ${neighborId}.
      <ul>
        <li>State of the neighbor set to INIT.</li>
        <li>All the lists reset.</li>
      </ul>`
    );
  }
  if (state === State.Full) {
    this.lsDb.originateRouterLsa(areaId, true);
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
  const { state, routerId: neighborId } = neighbor;
  if (state === State.Init) {
    this.setNeighbor(
      {
        ...neighbor,
        state: State.ExStart,
        ddRxmtTimer: setInterval(
          this.sendDDPacket.bind(this, neighborId),
          rxmtInterval
        ),
      },
      `
    <i>TwoWayReceived</i> event triggered since the Router found itself in <b>${neighborId}</b>'s hello packet.
    <ul>
      <li>${neighborId}'s state upgraded from INIT to EX-START.</li>
      <li>The router will now negotiate the Master/Slave relationship and
      send Database Description Packets to ${neighborId}</li>
    </ul>
    `
    );
    this.sendDDPacket(neighborId);
  }
};

/**
 * `NegotiationDone` Event Handler. See Section 10.6, 10.8.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const negotiationDone: NeighborEventHandler = function (neighbor) {
  const { master } = neighbor;
  this.setNeighbor(
    {
      ...neighbor,
      state: State.Exchange,
    },
    `<b>Negotiation between the router and ${
      neighbor.routerId
    } for Master / Slave is complete</b>.
  ${
    neighbor.routerId
  } is now promoted to the EXCHANGE state. The router is the <b>${
      master ? "Master" : "Slave"
    }</b>
  in this relation.`
  );
  this.sendDDPacket(neighbor.routerId);
};

/**
 * The `ExchangeDone` event handler.
 * - Sets state of the neighbor to `Loading` if more DDs are pending, else sets it to `Full`
 * - Starts Sending LSA Request Packets to the neighbor
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 */
const exchangeDone: NeighborEventHandler = function (neighbor) {
  const { linkStateRequestList, routerId: neighborId, ddRxmtTimer } = neighbor;
  const { rxmtInterval } = this.config;
  const loadDone = !linkStateRequestList.length;
  if (loadDone) {
    return loadingDone.call(
      this,
      neighbor,
      `Exchange between the router and ${neighborId} is complete. Entering the FULL (final) state!`
    );
  }
  const desc = `The router has some link state requests to emit to ${neighborId}. The router is completing the requests.`;
  clearInterval(ddRxmtTimer);
  this.setNeighbor(
    {
      ...neighbor,
      state: State.Loading,
      lsRequestRxmtTimer: setInterval(
        () => this.sendLSRequestPacket(neighborId),
        rxmtInterval
      ),
      ddRxmtTimer: undefined,
    },
    desc
  );
  this.sendLSRequestPacket(neighborId);
};

/**
 * The `LoadingDone` Event handler. Sets the state to full, since all the LSAs from the neighbor have been received.
 * @param this The OSPF Interface
 * @param neighbor The OSPF Neighbor
 * @param desc Optional description to be emitted to Event Handler.
 */
const loadingDone: NeighborEventHandler = function (neighbor, desc?: string) {
  const { routerId: neighborId, areaId, lsRequestRxmtTimer } = neighbor;
  clearInterval(lsRequestRxmtTimer);
  this.setNeighbor(
    {
      ...neighbor,
      state: State.Full,
      lsRequestRxmtTimer: undefined,
    },
    desc ??
      `Loading complete wrt neighbor ${neighborId}. Entering the FULL state.`
  );
  this.lsDb.originateRouterLsa(areaId, true);
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
  const { state, lsRequestRxmtTimer, lsRetransmissionRxmtTimer, areaId } =
    neighbor;
  clearInterval(lsRequestRxmtTimer);
  clearTimeout(lsRetransmissionRxmtTimer);
  if (state >= State.Exchange) {
    this.setNeighbor(
      {
        ...neighbor,
        state: State.ExStart,
        linkStateRequestList: [],
        dbSummaryList: [],
        linkStateRetransmissionList: [],
        ddRxmtTimer: setInterval(
          this.sendDDPacket.bind(this, neighbor.routerId),
          rxmtInterval
        ),
        lastReceivedDdPacket: undefined,
        lsRequestRxmtTimer: undefined,
        lsRetransmissionRxmtTimer: undefined,
      },
      ""
    );
    this.lsDb.originateRouterLsa(areaId, true);
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
  const { deadTimer, routerId: neighborId, areaId } = neighbor;
  clearTimeout(deadTimer);
  this.setNeighbor(
    {
      ...neighbor,
      state: State.Down,
      linkStateRequestList: [],
      linkStateRetransmissionList: [],
      dbSummaryList: [],
      deadTimer: undefined,
      lastReceivedDdPacket: undefined,
    },
    `
  Dead timer of ${neighborId} triggered. The neighbor is being set to the DOWN state.
  `
  );
  this.lsDb.originateRouterLsa(areaId, true);
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
