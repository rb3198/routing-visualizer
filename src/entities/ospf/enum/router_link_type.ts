export enum RouterLinkType {
  P2P = 1,
  Transit = 2,
  Stub = 3,
  Virtual = 4,
}

export const routerLinkTypeToString = (type: RouterLinkType) => {
  switch (type) {
    case RouterLinkType.P2P:
      return "A Point-to-Point connection to another router.";
    case RouterLinkType.Transit:
      return "A connection to a transit network supporting the virtual links.";
    case RouterLinkType.Stub:
      return "Connection to a stub network. The stub network is dependent on the router originating the LSAs for it. ";
    case RouterLinkType.Virtual:
      return "A manually configured virtual link implemented through OSPF software.";
    default:
      return "";
  }
};
