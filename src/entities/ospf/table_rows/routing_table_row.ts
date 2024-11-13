import { Router } from "../../router";
import { IPv4Address } from "../../ip/ipv4_address";
import { LSA } from "../lsa";
import { NextHop } from "../shortest_path_tree/transit_vertex_data";

export type Destination = "router" | "network";

export class RoutingTableRow {
  destType: Destination;
  /**
   * For networks, the identifier is their associated IP address.  For routers, the identifier is the OSPF
   * Router ID.
   */
  destinationId: IPv4Address;
  /**
   * Only defined for networks. Helps define the network's IP address range together with the `destinationId`.
   */
  addressMask?: IPv4Address;
  /**
   * This field indicates the area whose link state information has led to the routing table entry's collection of paths.
   * This is called the entry's associated area.  For sets of AS external paths, this field is not defined.
   */
  area: number;
  pathType: "intra-area" | "inter-area" | "type1-external" | "type2-external";
  cost: number;
  type2cost?: number;
  linkStateOrigin: LSA | null;
  nextHops: NextHop[];
  /**
   * Valid only for inter-area and AS external paths.  This field indicates the Router ID of
   * the router advertising the summary-LSA or AS-external-LSA that led to this path.
   */
  advRouter?: Router;

  constructor({
    destType,
    destinationId,
    addressMask,
    area,
    pathType,
    cost,
    type2cost,
    linkStateOrigin,
    nextHops,
    advRouter,
  }: RoutingTableRow) {
    this.destType = destType;
    this.destinationId = destinationId;
    this.addressMask = addressMask;
    this.area = area;
    this.pathType = pathType;
    this.cost = cost;
    this.type2cost = type2cost;
    this.linkStateOrigin = linkStateOrigin;
    this.nextHops = nextHops;
    this.advRouter = advRouter;
  }
}

export type RoutingTable = RoutingTableRow[];
