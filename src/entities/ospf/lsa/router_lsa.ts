import { IPv4Address } from "src/entities/ip/ipv4_address";
import { Router } from "src/entities/router";
import { LSType, RouterLinkType, State } from "../enum";
import { LSA, LSAHeader } from ".";
import { InitialSequenceNumber } from "./constants";

export class RouterLink {
  id: IPv4Address;
  /**
   * For connections to
      stub networks, Link Data specifies the network's IP address
      mask. For unnumbered point-to-point connections, it specifies
      the interface's MIB-II [Ref8] ifIndex value. For the other link
      types it specifies the router interface's IP address (self's IP address on the interface).
   */
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
  constructor(links: RouterLink[], b?: boolean, v?: boolean, e?: boolean) {
    this.links = links;
    this.nLinks = this.links.length;
    this.v = v;
    this.e = e;
    this.b = b;
  }

  static fromRouter = (
    router: Router,
    areaId: number,
    b?: boolean,
    v?: boolean,
    e?: boolean
  ) => {
    const body = new RouterLSABody([], b, v, e);
    const { ospf, ipInterfaces } = router;
    const { neighborTable } = ospf;
    Object.values(neighborTable)
      .filter(
        (neighbor) =>
          neighbor.areaId === areaId && neighbor.state !== State.Down
      )
      .forEach((row) => {
        const { routerId, state, interfaceId, address } = row;
        const { ipInterface } = ipInterfaces.get(interfaceId) || {};
        const { cost } = ipInterface || {};
        // Adding a Type 1 link for the full neighbor
        state === State.Full &&
          interfaceId &&
          body.links.push(
            new RouterLink(
              routerId,
              IPv4Address.fromString(interfaceId),
              cost ?? 0,
              RouterLinkType.P2P
            )
          );
        // Assuming that the state of the interface is always Point To Point
        // Adding a Type 3 link for the neighbor, regardless of its state.
        // The IP link's subnet is the subnet advertised as reachable with the configured cost.
        address &&
          body.links.push(
            new RouterLink(
              new IPv4Address(
                address.bytes[0],
                address.bytes[1],
                address.bytes[2],
                0,
                24
              ),
              new IPv4Address(255, 255, 255, 0), // Link Data is the subnet mask in Type 3 link
              cost ?? 0,
              RouterLinkType.Stub
            )
          );
      });
    body.nLinks = body.links.length;
    return body;
  };
}

export class RouterLSA extends LSA {
  body: RouterLSABody;
  constructor(header: LSAHeader, body: RouterLSABody) {
    super(header);
    this.body = body;
  }
  static fromRouter(router: Router, areaId: number, lsSequenceNumber?: number) {
    const header = new LSAHeader(
      0,
      LSType.RouterLSA,
      router.id,
      router.id,
      lsSequenceNumber ?? InitialSequenceNumber
    ); // The link state ID and Advertising Router ID for Router LSAs are always the same.
    const { ospf } = router;
    const { lsDb } = ospf;
    const b = Object.keys(lsDb.db).length > 1;
    const body = RouterLSABody.fromRouter(router, areaId, b); // situations requiring the v and e bits are not simulated here.
    return new RouterLSA(header, body);
  }

  static isRouterLsa = (lsa: LSA) => {
    return (
      lsa instanceof RouterLSA ||
      ("b" in lsa.body && "links" in lsa.body && "nLinks" in lsa.body)
    );
  };

  static fromRouterLsa = (lsa: RouterLSA) => {
    const { header, body } = lsa;
    const { links, b, e, v } = body;
    const newHeader = LSAHeader.from(header);
    const newBody = new RouterLSABody(links, b, v, e);
    return new RouterLSA(newHeader, newBody);
  };
}
