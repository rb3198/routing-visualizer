import { OSPFInterface } from ".";
import { State } from "../../ospf/enum";
import { NeighborTableRow } from "../../ospf/tables";
import { deadTimerFactory } from "./timer_factories";

/**
 * The `HelloReceived` Event handler.
 * - Transitions the state of the OSPF Neighbor to `INIT` if it was `DOWN` previously.
 * - Resets the dead timer irrespective of the previous state of the neighbor.
 * @param this The OSPF Interface
 * @param neighbor
 */
export function helloReceived(this: OSPFInterface, neighbor: NeighborTableRow) {
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
}
