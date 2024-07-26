import { Point2D } from "../types/geometry";
import { BGPTableRow, IPv4Address, OSPFTableRow } from "../types/routing";

export class Router {
  key: string;
  location: Point2D;
  ip: IPv4Address;
  ospfTable: OSPFTableRow[];
  bgpTable: BGPTableRow[];

  constructor(
    key: string,
    location: Point2D,
    ip: IPv4Address,
    localRouters?: Router[]
  ) {
    this.key = key;
    this.location = location;
    this.ip = ip;
    this.ospfTable = [];
    this.bgpTable = [];
    if (localRouters && localRouters.length > 0) {
      this.ospfTable = localRouters.map((router) => ({
        cost: 0, // TODO
        destination: router.ip,
        interface: "", // TODO
        nextHop: ip,
        router: router,
      }));
    }
  }
}
