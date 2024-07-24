import { Point2D } from "../types/geometry";
import { IPv4Address, OSPFTableRow } from "../types/routing";

export class Router {
  location: Point2D;
  ip: IPv4Address;
  ospfTable: OSPFTableRow[];

  constructor(location: Point2D, ip: IPv4Address, localRouters?: Router[]) {
    this.location = location;
    this.ip = ip;
    this.ospfTable = [];
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
