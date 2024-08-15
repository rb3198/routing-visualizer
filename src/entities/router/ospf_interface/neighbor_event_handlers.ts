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
const helloReceived: NeighborEventHandler = function (this, neighbor) {
  const { config, neighborTable } = this;
  const { deadInterval } = config;
  const { state, routerId } = neighbor;
  // action for all states - Clear dead timer.
  if (neighbor.deadTimer) {
    clearTimeout(neighbor.deadTimer);
  }
  const deadTimer = deadTimerFactory.call(this, neighbor, deadInterval);
  neighborTable.set(routerId.toString(), {
    ...neighbor,
    deadTimer,
  });
  // state transition to init if the router is in a `DOWN` state.
  if (state === State.Down) {
    neighborTable.set(routerId.toString(), {
      ...neighbor,
      state: State.Init,
    });
  }
};

/**
 * The `OneWayReceived` event handler. Triggered when a router doesn't see its address in the hello packet it received.
 * - If the neighbor is in a state >= `2WAY`, regresses the state down to `INIT`
 * @param this The OSPF Interface
 * @param neighbor  The OSPF Neighbor
 */
const oneWayReceived: NeighborEventHandler = function (this, neighbor) {
  const { neighborTable } = this;
  const { routerId, state } = neighbor;
  if (state >= State.TwoWay) {
    neighborTable.set(routerId.toString(), {
      ...neighbor,
      state: State.Init,
    });
  }
};

/**
 * Handler for the event `TwoWayReceived`, which is fired when the router sees itself in a received hello packet.
 * - Always forms an adjacency (transitions to Ex-Start state) since we simulate a point to point network.
 * @param this
 * @param neighbor
 */
const twoWayReceived: NeighborEventHandler = function (this, neighbor) {
  const { neighborTable, config } = this;
  const { rxmtInterval } = config;
  const { routerId, state } = neighbor;
  if (state === State.Init) {
    neighborTable.set(routerId.toString(), {
      ...neighbor,
      state: State.ExStart,
      rxmtTimer: setTimeout(
        this.sendDDPacket.bind(this, neighbor),
        rxmtInterval
      ),
    });
  }
};

/**
 * `NegotiationDone` Event Handler. See Section 10.6, 10.8.
 * @param this
 * @param neighbor
 */
const negotiationDone: NeighborEventHandler = function (this, neighbor) {
  const { neighborTable } = this;
  const { routerId } = neighbor;
  neighborTable.set(routerId.toString(), {
    ...neighbor,
    state: State.Exchange,
  });
  this.sendDDPacket(neighbor);
};

const exchangeDone: NeighborEventHandler = function (this, neighbor) {
  const { neighborTable } = this;
  const { routerId, linkStateRequestList } = neighbor;
  neighborTable.set(routerId.toString(), {
    ...neighbor,
    state: linkStateRequestList.length ? State.Loading : State.Full,
  });
  // TODO: Send LSA Request Packets to the neighbor.
};

const loadingDone: NeighborEventHandler = function (this, neighbor) {
  const { neighborTable } = this;
  const { routerId } = neighbor;
  neighborTable.set(routerId.toString(), {
    ...neighbor,
    state: State.Full,
  });
};

// AdjOK event handler is not required since this event will never be transmitted in our simulator.

/**
 * The `SeqNumberMismatch` (Regressive event) event handler. The adjacency is torn down, and then an attempt is made at reestablishment.
 * - The LS Retransmission list, DB Summary List, and LS Request List are cleared of LSAs.
 * - New state is set to `ExStart` and DD packets are sent to the neighbor with current router as the master (2 Way Received event handler).
 * @param this
 * @param neighbor
 */
const seqNumberMismatch: NeighborEventHandler = function (this, neighbor) {
  const { neighborTable, config } = this;
  const { rxmtInterval } = config;
  const { routerId } = neighbor;
  neighborTable.set(routerId.toString(), {
    ...neighbor,
    state: State.ExStart,
    linkStateRequestList: [],
    dbSummaryList: [],
    linkStateRetransmissionList: [],
    rxmtTimer: setTimeout(this.sendDDPacket.bind(this, neighbor), rxmtInterval),
  });
};

export const neighborEventHandlerFactory = new Map([
  [NeighborSMEvent.HelloReceived, helloReceived],
  [NeighborSMEvent.OneWay, oneWayReceived],
  [NeighborSMEvent.TwoWayReceived, twoWayReceived],
  [NeighborSMEvent.NegotiationDone, negotiationDone],
  [NeighborSMEvent.ExchangeDone, exchangeDone],
  [NeighborSMEvent.LoadingDone, loadingDone],
  [NeighborSMEvent.SeqNumberMismatch, seqNumberMismatch],
]);

export default neighborEventHandlerFactory;
