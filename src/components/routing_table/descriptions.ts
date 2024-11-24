import { IPv4Address } from "src/entities/ip/ipv4_address";
import { RoutingTableRow } from "src/entities/ospf/table_rows";

export const columnNames: Record<keyof RoutingTableRow, string> = {
  destinationId: "Destination ID",
  addressMask: "Address Mask",
  destType: "Destination Type",
  area: "Area",
  nextHops: "Next Hop(s)",
  cost: "Cost",
  advertisingRouter: "Advertising Router",
  linkStateOrigin: "LS Origin",
  pathType: "Path Type",
  type2cost: "",
  lastUsedNextHopIdx: "",
};

const dummyRow = new RoutingTableRow({
  destType: "network",
  area: 0,
  cost: 1,
  destinationId: new IPv4Address(1, 1, 1, 1),
  nextHops: [{ interfaceId: "192.1.19.10" }],
  linkStateOrigin: null,
  pathType: "intra-area",
  advertisingRouter: new IPv4Address(1, 1, 1, 1),
});

export const getDescriptions = (
  activeRow?: RoutingTableRow
): Record<keyof RoutingTableRow | "none", string> => {
  const { destType, destinationId } = activeRow || dummyRow;
  const destinationIp = new IPv4Address(...destinationId.bytes);
  return {
    none: "Hover over any column to learn about it.",
    destinationId: `
        <p>The Destination's <b>identifier</b> or <b>name</b>, which depends on the <i>destination's type</i>.</p> 
        <ul>
              <li>For networks, the identifier is their associated IP address.</li>
              <li>For routers, the identifier is the OSPF Router ID.</li>
        </ul>
        <p><b>This row points to the ${destType} ${destinationIp}</b>`,
    destType: `
      <p>Can be either <b>"network"</b> or <b>"router"</b>.</p> 
      <ul>
        <li>Only network entries are actually used when forwarding IP data traffic.</li>
        <li>Router entries, stored only for Area Boundary Routers and AS Boundary Routers, are used solely as intermediate
        steps in the routing table build process.
      </ul>
      <p>This row points to a ${destType} which ${
      destType === "router"
        ? `will be used to calculate routes reachable through the router with OSPF ID ${destinationIp}`
        : `is a condensed address point to a number of routers.`
    }
      `,
    addressMask: `Only defined for networks.  The network's IP address together 
    with its address mask defines a range of IP addresses.`,
    area: `This field indicates the area whose link state information has led to the routing table entry's collection of paths.
    This is called the entry's associated area.For sets of AS external paths, this field is not defined.`,
    pathType: `One of "intra-area", "inter-area", "type 1 / type 2 external". As their names suggest,
    <ul>
      <li>Intra-area paths indicate destinations belonging to one of the router's attached areas.</li>
      <li>Inter-area paths are paths to destinations in other OSPF areas.</li>
      <li>AS external paths, detected through AS-External LSAs, are paths to destinations external to the AS.</li>
    </ul>`,
    cost: "Specifies the cost of the path to the destination.",
    nextHops:
      "Specifies the outgoing interface to use when trying to route a packet to the Destination ID.",
    type2cost: "",
    advertisingRouter: `<p>Valid only for <i>inter-area</i> paths, this field indicates the 
    <b>OSPF Router ID of the router advertising the Summary LSA that led to this path</b>.</p>`,
    linkStateOrigin: `Valid only for intra-area paths, this field indicates the LSA
        (router-LSA or network-LSA) that directly references the
        destination.`,
    lastUsedNextHopIdx: "",
  };
};
