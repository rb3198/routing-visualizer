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
  constructor(router: Router, b?: boolean, v?: boolean, e?: boolean) {
    this.links = [];
    this.setLinks(router);
    this.nLinks = this.links.length;
    this.v = v;
    this.e = e;
    this.b = b;
  }

  private setLinks = (router: Router) => {
    const { ospf, ipInterfaces } = router;
    const { neighborTable } = ospf;
    Object.values(neighborTable).forEach((row) => {
      const { routerId, state, interfaceId } = row;
      const { ipInterface } = ipInterfaces.get(interfaceId) || {};
      const { cost, routers } = ipInterface || {};
      const address = routers?.getKey(router);
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
    });
  };
}

export class RouterLSA extends LSA {
  body: RouterLSABody;
  constructor(router: Router, lsSequenceNumber?: number) {
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
    const b = Object.keys(lsDb).length > 0;
    this.body = new RouterLSABody(router, b); // situations requiring the v and e bits are not simulated here.
  }
}
