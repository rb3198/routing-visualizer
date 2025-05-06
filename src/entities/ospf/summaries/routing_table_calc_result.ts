import { TransitVertexData } from "src/entities/ospf/shortest_path_tree/transit_vertex_data";
import { Tree } from "src/entities/ospf/shortest_path_tree/tree";
import { RoutingTableRow } from "src/entities/ospf/table_rows";

export type RoutingTableCalculationResult = {
  areaId: number;
  table: RoutingTableRow[];
  tree: Tree<TransitVertexData>;
};
