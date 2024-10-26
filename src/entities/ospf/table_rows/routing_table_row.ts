import { Router } from "../../router";
import { IPv4Address } from "../../ip/ipv4_address";

export class RoutingTableRow {
  destination: IPv4Address;
  nextHop: IPv4Address;
  router: Router;
  cost: number;
  interface: string;

  constructor(
    destination: IPv4Address,
    nextHop: IPv4Address,
    router: Router,
    cost: number,
    _interface: string
  ) {
    this.destination = destination;
    this.nextHop = nextHop;
    this.router = router;
    this.cost = cost;
    this.interface = _interface;
  }
}
