import { IPv4Address } from "src/entities/ip/ipv4_address";
import { NeighborTableRow } from "./neighbor_table_row";
export { NeighborTableRow } from "./neighbor_table_row";
export { RoutingTableRow } from "./routing_table_row";

export type NeighborTableSnapshot = {
  routerId: IPv4Address;
  timestamp: number;
  prevTable: Record<string, NeighborTableRow>;
  table: Record<string, NeighborTableRow>;
};
