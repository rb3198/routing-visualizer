import { OSPFInterface } from ".";
import { State } from "../../ospf/enum";
import { NeighborTableRow } from "../../ospf/tables";

/**
 * Factory to create timeouts declaring a neighbor to be down.
 * @param this The OSPF interface
 * @param neighbor
 * @param deadInterval Dead interval configured on the OSPF interface, in milliseconds.
 * @returns
 */
function deadTimerFactory(
  this: OSPFInterface,
  neighbor: NeighborTableRow,
  deadInterval: number
) {
  const callback = () => {
    neighbor.state = State.Down;
    this.onOspfNeighborDown();
  };
  return setTimeout(callback, deadInterval);
}

/**
 * Factory to create timeouts to send Hello packets to neighbors.
 * @param this The OSPF interface
 * @param neighbor
 * @param helloInterval Hello interval configured on the OSPF interface, in milliseconds.
 * @returns
 */
function helloTimerFactory(
  this: OSPFInterface,
  neighbor: NeighborTableRow,
  helloInterval: number
) {
  return setTimeout(this.sendHelloPacket.bind(this, neighbor), helloInterval);
}

/**
 * Method to handle transition of a neighbor from `Down` state to `Init` State.
 *
 * Sets the state to `Init` and kick-starts a timer which will declare the router to be `Down` if a hello packet hasn't been received till then.
 * @param this The OSPF Interface of the router
 * @param neighbor
 */
export function downToInit(this: OSPFInterface, neighbor: NeighborTableRow) {
  const { config, neighborTable } = this;
  const { helloInterval, deadInterval } = config;
  const { routerId } = neighbor;
  const deadTimer = deadTimerFactory.call(this, neighbor, deadInterval);
  const helloTimer = helloTimerFactory.call(this, neighbor, helloInterval);
  neighborTable.set(routerId.toString(), {
    ...neighbor,
    deadTimer,
    helloTimer,
  });
}
