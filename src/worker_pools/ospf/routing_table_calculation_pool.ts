import { RoutingTableManager } from "src/entities/router/ospf_interface/routing_table";
import { MAX_WORKERS_PER_POOL } from "../n_workers";
import routingCalcWorker from "./routing_table_calc_worker";
// import { LSA } from "src/entities/ospf/lsa";
// import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";

// type TableCalculationSources = {
//   lsDb: Record<number, Record<string, LSA>>;
//   prevTable: RoutingTable;
// };

class RoutingTableCalculationWorkerPool {
  nWorkers: number;
  workerPool: Worker[];
  queue: { tableRef: RoutingTableManager }[];
  constructor() {
    this.nWorkers = MAX_WORKERS_PER_POOL;
    this.workerPool = [];
    this.queue = [];
    for (let i = 0; i < this.nWorkers; i++) {
      this.workerPool.push(new Worker(routingCalcWorker));
    }
  }

  getOnMessageCallback = (worker: Worker, tableRef: RoutingTableManager) => {
    return (e: MessageEvent) => {
      tableRef.onCalculation(e);
      const task = this.queue.shift();
      if (task) {
        const { ospfInterface, prevTable } = task.tableRef;
        const { lsDb } = ospfInterface;
        worker.onmessage = this.getOnMessageCallback(worker, task.tableRef);
        worker.postMessage(
          JSON.parse(JSON.stringify({ lsDb: lsDb.db, prevTable }))
        );
      } else {
        this.workerPool.push(worker);
      }
    };
  };

  calculate(tableRef: RoutingTableManager) {
    const worker = this.workerPool.shift();
    if (worker) {
      const { ospfInterface, prevTable } = tableRef;
      const { lsDb } = ospfInterface;
      worker.onmessage = this.getOnMessageCallback(worker, tableRef);
      worker.postMessage(
        JSON.parse(JSON.stringify({ lsDb: lsDb.db, prevTable }))
      );
    } else {
      this.queue.push({ tableRef });
    }
  }
}

export const routingTableCalcWorkerPool =
  new RoutingTableCalculationWorkerPool();
