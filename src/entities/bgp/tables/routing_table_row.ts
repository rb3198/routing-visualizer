import { IPv4Address } from "../../ip/ipv4_address";
import { Router } from "../../router";

export class RoutingTableRow {
  destination: IPv4Address;
  nextHop: IPv4Address;
  router: Router;
  asPath: string[];
  // localPref indicates (Not in demo) any custom priority given by network admin to the destination AS.
  origin: "internal" | "external";

  constructor(
    destination: IPv4Address,
    nextHop: IPv4Address,
    router: Router,
    asPath: string[],
    origin: "internal" | "external"
  ) {
    this.destination = destination;
    this.nextHop = nextHop;
    this.router = router;
    this.asPath = asPath;
    this.origin = origin;
  }
}
