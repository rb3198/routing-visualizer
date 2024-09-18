import { IPv4Address } from "src/entities/ip/ipv4_address";
import { Router } from "src/entities/router";
import { LSType, RouterLinkType, State } from "../enum";
import { LSA, LSAHeader } from ".";
import { InitialSequenceNumber } from "./constants";

export class RouterLink {
  id: IPv4Address;
  data: IPv4Address;
  metric: number;
  type: RouterLinkType;
  constructor(
    id: IPv4Address,
    data: IPv4Address,
    metric: number,
    type: RouterLinkType
  ) {
    this.id = id;
    this.data = data;
    this.metric = metric;
    this.type = type;
  }
}

export class RouterLSABody {
  links: RouterLink[];
  /**
   * Number of links that this router is connected to.
   */
  nLinks: number;
  /**
   * When set, indicates that the router is an endpoint of one or more fully adjacent virtual links.
   */
  v?: boolean;
  /**
   * When set, the router is an AS boundary router (E is for external).
   */
  e?: boolean;

  /**
   * When set, the router is an area border router (B is for border).
   */
  b?: boolean;
  constructor(
    router: Router,
    areaId: number,
    b?: boolean,
    v?: boolean,
    e?: boolean
  ) {
    this.links = [];
    this.setLinks(router, areaId);
    this.nLinks = this.links.length;
    this.v = v;
    this.e = e;
    this.b = b;
  }

  private setLinks = (router: Router, areaId: number) => {
    const { ospf, ipInterfaces } = router;
    const { neighborTable } = ospf;
    Object.values(neighborTable)
      .filter(
        (neighbor) =>
          neighbor.areaId === areaId && neighbor.state !== State.Down
      )
      .forEach((row) => {
        const { routerId, state, interfaceId } = row;
        const { ipInterface } = ipInterfaces.get(interfaceId) || {};
        const { cost, routers } = ipInterface || {};
        const address = routers?.getKey(router);
        // Adding a Type 1 link for the full neighbor
        state === State.Full &&
          address &&
          this.links.push(
            new RouterLink(
              routerId,
              IPv4Address.fromString(address),
              cost ?? 0,
              RouterLinkType.P2P
            )
          );
        // Assuming that the state of the interface is always Point To Point
        // Adding a Type 3 link for the neighbor, regardless of its state.
        // The neighbor's IP address is always known. It is considered to be a link to a stub subnet.
        address &&
          this.links.push(
            new RouterLink(
              IPv4Address.fromString(address),
              new IPv4Address(255, 255, 255, 255, 32), // Link DAta is the subnet mask in Type 3 link
              cost ?? 0,
              RouterLinkType.Stub
            )
          );
      });
  };
}

export class RouterLSA extends LSA {
  body: RouterLSABody;
  constructor(router: Router, areaId: number, lsSequenceNumber?: number) {
    const header = new LSAHeader(
      0,
      LSType.RouterLSA,
      router.id,
      router.id,
      lsSequenceNumber ?? InitialSequenceNumber
    ); // The link state ID and Advertising Router ID for Router LSAs are always the same.
    super(header);
    const { ospf } = router;
    const { lsDb } = ospf;
    const b = Object.keys(lsDb.db).length > 1;
    this.body = new RouterLSABody(router, areaId, b); // situations requiring the v and e bits are not simulated here.
  }
}
