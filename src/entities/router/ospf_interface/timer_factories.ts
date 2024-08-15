import { OSPFInterface } from ".";
import { NeighborSMEvent } from "../../ospf/enum/state_machine_events";
import { NeighborTableRow } from "../../ospf/tables";

/**
 * Factory to create timeouts to send Hello packets to neighbors.
 * @param this The OSPF interface
 * @param neighbor
 * @param helloInterval Hello interval configured on the OSPF interface, in milliseconds.
 * @returns
 */
export function helloTimerFactory(
  this: OSPFInterface,
  neighbor: NeighborTableRow,
  helloInterval: number
) {
  return setTimeout(this.sendHelloPacket.bind(this, neighbor), helloInterval);
}

/**
 * Factory to create timeouts declaring a neighbor to be down.
 * @param this The OSPF interface
 * @param neighbor
 * @param deadInterval Dead interval configured on the OSPF interface, in milliseconds.
 * @returns
 */
export function deadTimerFactory(
  this: OSPFInterface,
  neighbor: NeighborTableRow,
  deadInterval: number
) {
  const callback = () => {
    const { routerId } = neighbor;
    this.neighborStateMachine(
      routerId.toString(),
      NeighborSMEvent.InactivityTimer
    );
  };
  return setTimeout(callback, deadInterval);
}
