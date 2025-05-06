import { RoutingTableManager } from "src/entities/router/ospf_interface/routing_table";
import { MAX_WORKERS_PER_POOL } from "../n_workers";
import { RoutingTableCalculationResult } from "src/entities/ospf/summaries/routing_table_calc_result";

class RoutingTableCalculationWorkerPool {
  nWorkers: number;
  workerPool: Worker[];
  queue: { tableRef: RoutingTableManager; areaId: number }[];
  constructor() {
    this.nWorkers = MAX_WORKERS_PER_POOL;
    this.workerPool = [];
    this.queue = [];
    for (let i = 0; i < this.nWorkers; i++) {
      this.workerPool.push(
        // @ts-ignore
        new Worker(new URL("./routing_table_calc.worker.ts", import.meta.url))
      );
    }
  }

  getOnMessageCallback = (worker: Worker, tableRef: RoutingTableManager) => {
    return (e: MessageEvent<RoutingTableCalculationResult>) => {
      tableRef.onCalculation(e);
      const task = this.queue.shift();
      if (task) {
        const { ospfInterface, prevTableMap } = task.tableRef;
        const { lsDb, router, config } = ospfInterface;
        const { MaxAge } = config;
        worker.onmessage = this.getOnMessageCallback(worker, task.tableRef);
        worker.postMessage(
          JSON.parse(
            JSON.stringify({
              lsDb: lsDb.db,
              prevTable: prevTableMap[task.areaId],
              areaId: task.areaId,
              MaxAge,
              routerId: router.id.toString(),
              routerInterfaces: Array.from(router.ipInterfaces.keys()),
            })
          )
        );
      } else {
        this.workerPool.push(worker);
      }
    };
  };

  calculate(tableRef: RoutingTableManager, areaId: number) {
    const worker = this.workerPool.shift();
    if (worker) {
      const { ospfInterface, prevTableMap } = tableRef;
      const { lsDb, router, config } = ospfInterface;
      const { MaxAge } = config;
      worker.onmessage = this.getOnMessageCallback(worker, tableRef);
      worker.postMessage(
        JSON.parse(
          JSON.stringify({
            lsDb: lsDb.db,
            prevTable: prevTableMap[areaId] ?? [],
            areaId,
            MaxAge,
            routerInterfaces: Array.from(router.ipInterfaces.keys()),
            routerId: router.id.toString(),
          })
        )
      );
    } else {
      this.queue.push({ tableRef, areaId });
    }
  }
}

export const routingTableCalcWorkerPool =
  new RoutingTableCalculationWorkerPool();
