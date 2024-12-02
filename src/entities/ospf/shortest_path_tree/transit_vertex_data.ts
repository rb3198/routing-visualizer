import { IPv4Address } from "src/entities/ip/ipv4_address";
import { RouterLSA } from "../lsa/router_lsa";

export type NextHop = {
  /**
   * IP Address of the source router to be used to reach to the destination
   */
  interfaceId: string;
  /**
   * IP address of the next hop router.
   */
  ipAddress?: string;
};
export class TransitVertexData {
  /**
   * For router vertices the Vertex ID is the router's OSPF Router ID. For network vertices, it is the IP address of the network's DR.
   */
  vertexId: IPv4Address;
  /**
   * For router vertices, this is a router LSA. For transit networks, this is a network LSA originated by the DR of the network.
   * In the future, if implementing network LSAs for NBMA / Broadcast networks, add NetworkLSA as well.
   */
  lsa: RouterLSA;
  /**
   * The list of next hops for the current set of shortest paths from the root to this vertex.
   * There can be multiple shortest paths due to the equal-cost multipath possibility.
   */
  nextHops: NextHop[];
  /**
   * The distance from the root of the tree.
   */
  distance: number;
  constructor({ vertexId, lsa, nextHops, distance }: TransitVertexData) {
    this.vertexId = vertexId;
    this.lsa = lsa;
    this.nextHops = nextHops;
    this.distance = distance;
  }

  toString = () => {
    return this.vertexId.toString();
  };
}
