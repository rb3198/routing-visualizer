import { OSPFInterface } from ".";
import { routingTableCalcWorkerPool } from "src/worker_pools/ospf/routing_table_calculation_pool";
import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";
import { RoutingTableCalculationResult } from "src/types/ospf/routing_table_calc_result";
import { IPv4Address } from "src/entities/ip/ipv4_address";

export class RoutingTableManager {
  ospfInterface: OSPFInterface;
  /**
   * Map of previous routing tables for each of the areas that the router belongs to.
   */
  prevTableMap: Record<number, RoutingTable>;
  /**
   * Map of current routing tables for each of the areas that the router belongs to.
   */
  tableMap: Record<number, RoutingTable>;
  /**
   * Map of calculation status for each area that the router belongs to.
   */
  calculatingMap: Record<number, boolean>;
  /**
   * Map of scheduling status for the calculation of the table for each of the areas that the router belongs to.
   */
  calculationScheduledMap: Record<number, boolean>;
  constructor(ospfInterface: OSPFInterface) {
    this.ospfInterface = ospfInterface;
    this.prevTableMap = [];
    this.tableMap = [];
    this.calculatingMap = {};
    this.calculationScheduledMap = {};
  }

  onCalculation = (e: MessageEvent<RoutingTableCalculationResult>) => {
    const { router, lsDb } = this.ospfInterface;
    const { ipInterfaces } = router;
    const { areaId, table } = e.data;
    for (const entry of table) {
      const { destinationId, destType } = entry;
      if (destType !== "network") {
        continue;
      }
      entry.nextHops = entry.nextHops.map((nextHop) => {
        if (nextHop.interfaceId.includes("255.255")) {
          for (let [ipInterfaceId, ipInterface] of ipInterfaces.entries()) {
            const oppositeRouter =
              ipInterface.ipInterface.getOppositeRouter(router);
            const oppositeRouterIp =
              ipInterface.ipInterface.getSelfIpAddress(oppositeRouter);
            if (
              oppositeRouterIp &&
              IPv4Address.fromString(oppositeRouterIp).fromSameSubnet(
                new IPv4Address(...destinationId.bytes)
              )
            ) {
              return {
                ...nextHop,
                interfaceId: ipInterfaceId,
              };
            }
          }
        }
        return nextHop;
      });
    }
    this.tableMap[areaId] = table;
    const isAreaBorderRouter = Object.keys(lsDb.db).length > 1;
    if (isAreaBorderRouter) {
      // generate summary LSAs for the area
    }
    this.calculatingMap[areaId] = false;
    if (this.calculationScheduledMap[areaId]) {
      this.calculationScheduledMap[areaId] = false;
      this.calculate(areaId);
    }
  };

  calculate = (areaId: number) => {
    if (this.calculatingMap[areaId]) {
      this.calculationScheduledMap[areaId] = true;
      return;
    }
    this.calculatingMap[areaId] = true;
    // // Step 1: Invalidate the current routing table.
    this.prevTableMap[areaId] = [...(this.tableMap[areaId] ?? [])];
    routingTableCalcWorkerPool.calculate(this, areaId);
  };
}
