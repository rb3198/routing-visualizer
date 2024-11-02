import {
  PriorityQueueFactory,
  PriorityQueue,
} from "ts-data-structures-collection/queues";
import { OSPFInterface } from ".";
import { routingTableCalcWorkerPool } from "src/worker_pools/ospf/routing_table_calculation_pool";
import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";

export class RoutingTableManager {
  ospfInterface: OSPFInterface;
  prevTable: RoutingTable;
  table: RoutingTable;
  candidates: PriorityQueue<number>;
  calculating: boolean;
  calculationScheduled: boolean;
  constructor(ospfInterface: OSPFInterface) {
    this.ospfInterface = ospfInterface;
    this.prevTable = [];
    this.table = [];
    this.candidates = PriorityQueueFactory();
    this.calculating = false;
    this.calculationScheduled = false;
  }

  onCalculation = (e: MessageEvent) => {
    console.log("On calculation invoked");
    console.log(e.data);
    this.calculating = false;
    if (this.calculationScheduled) {
      this.calculationScheduled = false;
      this.calculate();
    }
  };

  calculate = () => {
    if (this.calculating) {
      this.calculationScheduled = true;
      return;
    }
    this.calculating = true;
    routingTableCalcWorkerPool.calculate(this);
    // // Step 1: Invalidate the current routing table.
    // this.prevTable = [...this.table];
    // this.table = [];
  };
}
