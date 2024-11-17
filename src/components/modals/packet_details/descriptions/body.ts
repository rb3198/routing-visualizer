import { HelloPacketBody } from "src/entities/ospf/packets/hello";
import { PacketSeparator, PacketViz, PacketVizField } from "./types";
import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";
import { DDPacketBody } from "src/entities/ospf/packets/dd";
import { LSAHeader, LSBody } from "src/entities/ospf/lsa";
import { LSType, lsTypeToString } from "src/entities/ospf/enum/ls_type";
import {
  linkDataSummary,
  linkIdSummary,
  lsIdDescription,
  lsIdSummary,
  lsTypeDescriptions,
} from "src/entities/ospf/constants/descriptions";
import { Colors } from "src/constants/theme";
import { LSRequest } from "src/entities/ospf/packets/ls_request";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSUpdatePacketBody } from "src/entities/ospf/packets/ls_update";
import { RouterLink, RouterLSABody } from "src/entities/ospf/lsa/router_lsa";
import { RouterLinkType } from "src/entities/ospf/enum";
import { routerLinkTypeToString } from "src/entities/ospf/enum/router_link_type";
import { SummaryLSABody } from "src/entities/ospf/lsa/summary_lsa";

const getLsTypeColumn = (lsType: LSType, flexGrow: number): PacketVizField => {
  return {
    flexGrow,
    value: lsTypeToString(lsType),
    description: `
        <p style="font-size: .764rem">
          The type of the LSA. This LSA is of type ${lsType}. Each LSA type has a separate advertisement format.<br>
          The possible types are as follows:
        </p>
        <table>
          <tbody>
          <tr>
            <th>LS Type</th>
            <th>Meaning</th>
            <th>Description</th>
          </tr>
          ${Object.keys(LSType)
            .filter((key) => isNaN(parseInt(key)))
            .map(
              (type) =>
                `
            <tr>
              <td style="text-align: center">${
                LSType[type as keyof typeof LSType]
              }</td>
              <td style="border: 1px solid #ccc; padding: .309rem; vertical-align: middle;">${lsTypeToString(
                LSType[type as keyof typeof LSType]
              )}</td>
              <td style="border: 1px solid #ccc; padding: .309rem; vertical-align: middle;">${lsTypeDescriptions(
                LSType[type as keyof typeof LSType]
              )}</td>
            </tr>
            `
            )
            .join("")}
          </tbody>
        </table>
        `,
    label: "LS Type",
  };
};

const getLinkStateIdColumn = (
  lsId: IPv4Address,
  lsType: LSType
): PacketVizField => {
  return {
    flexGrow: 1,
    label: "Link State ID",
    description: `
        <p style="font-size: .764rem">
        This field identifies the portion of the internet environment
        that is being described by the LSA.  <b>The contents of this field
        depend on the LSA's <i>LS type</i></b>.
        </p>
        <table>
          <tbody>
            <tr>
              <th>
                LS Type
              </th>
              <th>
                Description
              </th>
            </tr>
          ${Object.keys(LSType)
            .filter((key) => isNaN(parseInt(key)))
            .map(
              (type) =>
                `
            <tr>
              <td>${lsTypeToString(LSType[type as keyof typeof LSType])}</td>
              <td>${lsIdDescription(LSType[type as keyof typeof LSType])}</td>
            </tr>
            `
            )
            .join("")}
          </tbody>
        </table>
        <p style="margin-top: .764rem; font-size: 1rem; text-align: center">Since this is a ${lsTypeToString(
          lsType
        )}, ${lsId} refers to the ${lsIdSummary(lsType)}</p>
        `,
    value: lsId.toString(),
  };
};

const getAdvertisingRouterColumn = (advRouter: IPv4Address): PacketVizField => {
  return {
    flexGrow: 1,
    label: "Advertising Router",
    description: `The Router ID of the router that originated the LSA.`,
    value: advRouter.toString(),
  };
};

export const getHelloVizRows = (body: HelloPacketBody): PacketViz[] => {
  const { deadInterval, helloInterval, neighborList, networkMask } = body;
  return [
    {
      row: [
        {
          flexGrow: 1,
          label: "Network Mask",
          value: networkMask,
          description: `The network mask associated with this interface. <br>  For example,
        if the interface is to a class B network whose third byte is
        used for subnetting, the network mask is 0xffffff00.`,
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 2,
          label: "Hello Interval",
          value: `${helloInterval / 1000}s`,
          description: `The number of seconds between the source router's Hello packets.
          This should match with the receiving router for the source to be considered as the receiving router's neighbor.`,
        },
        {
          flexGrow: 1,
          label: "Options",
          value: NOT_IMPLEMENTED,
          description: `The optional capabilities supported by the router.
          These capabilities should match for the source to be considered as the receiver's neighbor.`,
        },
        {
          flexGrow: 1,
          label: "Router Priority",
          value: 1,
          description: "Used in DR Election.",
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 1,
          label: "Router DeadInterval",
          value: `${deadInterval / 1000}s`,
          description: `The number of seconds before declaring a silent router down. If a router does not receive
          a hello packet for <i>deadInterval</i> seconds from a neighbor, it considers its neighbor to be DOWN.`,
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 1,
          label: "Neighbor List",
          value: Array.from(neighborList.values()).reduce(
            (str, neighborId) => (str += neighborId + "<br>"),
            ""
          ),
          description: `The Router IDs of each router from whom valid Hello packets have
        been seen recently on the network.  Recently means in the last
        RouterDeadInterval seconds.`,
        },
      ],
    },
  ];
};

export const getLSAHeaderRows = (
  header: LSAHeader,
  showIgnoredRow?: boolean
): PacketViz[] => {
  const { lsAge, lsType, advertisingRouter, lsSeqNumber, linkStateId } = header;
  const rows: PacketViz[] = [
    {
      row: [
        {
          flexGrow: 1,
          label: "LS Age",
          description: "The time in seconds since the LSA was originated.",
          value: lsAge,
        },
        {
          flexGrow: 0.5,
          label: "Options",
          description:
            "Optional capabilities supported by the described portion of the routing domain.",
          value: NOT_IMPLEMENTED,
        },
        getLsTypeColumn(lsType, 0.5),
      ],
    },
    {
      row: [getLinkStateIdColumn(linkStateId, lsType)],
    },
    {
      row: [getAdvertisingRouterColumn(advertisingRouter)],
    },
    {
      row: [
        {
          flexGrow: 1,
          label: "LS Sequence Number",
          description: `Detects old or duplicate LSAs.  Successive instances of an LSA are given successive LS sequence numbers.`,
          value: lsSeqNumber,
        },
      ],
    },
  ];
  if (showIgnoredRow) {
    rows.push({
      row: [
        {
          flexGrow: 1,
          value: NOT_IMPLEMENTED,
          description:
            "The Fletcher checksum of the complete contents of the LSA, including the LSA header but excluding the LS age field.",
          label: "LS Checksum",
        },
        {
          flexGrow: 1,
          label: "Length",
          description: "The length in bytes of the LSA, including its header",
          value: "20+",
        },
      ],
    });
  }
  return rows;
};

export const getDDVizRows = (body: DDPacketBody): PacketViz[] => {
  const { ddSeqNumber, init, lsaList, m, master } = body;

  const toInt = (x: boolean) => (x ? 1 : 0);
  const rows: PacketViz[] = [
    {
      row: [
        {
          flexGrow: 1.6,
          label: "Interface MTU",
          description: `The size in bytes of the largest IP datagram that can be sent
        out the associated interface, without fragmentation.<br>
        Kept infinite in this simulation, i.e. the simulated network can send IP datagrams of infinite size at once, without fragmentation.
        Needless to say, this is not the case in real life.
        `,
          value: "Infinite",
        },
        {
          flexGrow: 0.2,
          label: "Options",
          description: "",
          value: 0,
        },
        {
          flexGrow: 0.2,
          label: "Options",
          description: "",
          value: 0,
        },
        {
          flexGrow: 0.2,
          label: "Options",
          description: "",
          value: 0,
        },
        {
          flexGrow: 0.2,
          label: "Options",
          description: "",
          value: 0,
        },
        {
          flexGrow: 0.2,
          label: "Options",
          description: "",
          value: 0,
        },
        {
          flexGrow: 0.2,
          label: "I-bit",
          description: `
        The <b>Init bit</b>.  When set to 1, this packet is the first in the sequence of Database Description Packets.<br>
        That is, this bit is true during the initial exchange of the DD packets by potential neighbors.`,
          value: toInt(init),
        },
        {
          flexGrow: 0.2,
          label: "M-bit",
          description: `
        The <b>More bit</b>.  When set to 1, it indicates that more Database Description Packets are to follow.<br>
        Also set to 1 when the Master / Slave negotiation has not yet been completed, i.e. in the EX-START state.<br>
        The slave in the relation always sets this bit to whatever the Master sent before.`,
          value: toInt(m),
        },
        {
          flexGrow: 0.2,
          label: "MS-bit",
          description: `
        The <b>Master/Slave bit</b>.<br>
        Indicates whether the sender is the Master(<b>MS = 1</b>), or slave (<b>MS = 0</b>).<br>
        When the Master/Slave relationship has not been negotiated, both the routers set this to 1 in a bid to become the master.`,
          value: toInt(master),
        },
      ],
    },
    {
      row: [
        {
          description: `
        This number is used to sequence the collection of Database Description Packets.
        <ul>
        <li>
        The initial value (indicated by the Init bit being set) should be unique. It is typically set to the time of the day in Epoch.
        </li>
        <li>
        The DD sequence number then increments until the complete database description has been sent.
        </li>
        </ul>
        `,
          flexGrow: 1,
          label: "DD Sequence Number",
          value: ddSeqNumber,
        },
      ],
    },
  ];
  lsaList.forEach((header, lsaIdx) => {
    const headerRows = getLSAHeaderRows(header);
    headerRows.forEach((row, headerIdx) => {
      const separator: PacketSeparator | undefined = !headerIdx
        ? {
            color: Colors.dd,
            label: `LSA Header ${lsaIdx + 1}`,
          }
        : undefined;
      rows.push({
        ...row,
        separator,
      });
    });
  });
  return rows;
};

export const getLSRequestRows = (requests: LSRequest[]): PacketViz[] => {
  const rows: PacketViz[] = [];
  requests.forEach((request, idx) => {
    const { advertisingRouter, linkStateId, lsType } = request;
    rows.push({
      row: [getLsTypeColumn(lsType, 1)],
      separator: {
        color: Colors.lsRequest,
        label: `LS Request ${idx + 1}`,
      },
    });
    rows.push({
      row: [getLinkStateIdColumn(linkStateId, lsType)],
    });
    rows.push({
      row: [getAdvertisingRouterColumn(advertisingRouter)],
    });
  });
  return rows;
};

const getRouterLinkRows = (link: RouterLink, idx: number): PacketViz[] => {
  const { type, metric, id, data } = link;
  return [
    {
      row: [
        {
          flexGrow: 1,
          description: `
          <p style="font-size: .764rem">Identifies the object that this router link connects to. Its value depends on the link's type.</p>
          <table>
            <tbody>
              <tr>
                <th>Link Type</th>
                <th>Link State ID Refers To</th>
              </tr>
              ${Object.keys(RouterLinkType)
                .filter((key) => !isNaN(parseInt(key)))
                .map(
                  (type) =>
                    `
                <tr>
                  <td style="text-align: center">${type}</td>
                  <td>${linkIdSummary(parseInt(type))}</td>
                </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          <p style="text-align: center; font-size: 1rem; margin-top: .309rem">
          Since this link is a type ${type} link, <b>${id} is the ${linkIdSummary(
            type
          )}</b>
          </p>
          `,
          label: "Link ID",
          value: id.toString(),
        },
      ],
      separator: {
        label: `Router Link ${idx + 1}`,
        color: Colors.dd,
      },
    },
    {
      row: [
        {
          flexGrow: 1,
          label: "Link Data",
          description: `
            <p style="font-size: .764rem">The value depends on the Link Type:</p>
            <table>
              <tbody>
                <tr>
                  <th>Link Type</th>
                  <th>Link Data refers to</th>
                </tr>
                ${Object.keys(RouterLinkType)
                  .filter((key) => isNaN(parseInt(key)))
                  .map(
                    (type) =>
                      `
                      <tr>
                        <td>${type}</td>
                        <td>${linkDataSummary(
                          RouterLinkType[type as keyof typeof RouterLinkType]
                        )}</td>
                      </tr>
                      `
                  )
                  .join("")}
              </tbody>
            </table>
            <p style="text-align: center; margin-top: .764rem">
            Since this link is of type ${type}, <b>${data} is the ${linkDataSummary(
            type
          )}</b>
            </p>
          `,
          value: data.toString(),
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 0.5,
          label: "Type",
          description: `
          <p style="font-size: 0.764rem">A quick description of the router link. Describes what this link refers to, and hence
          describes the meaning of the Link State ID and Link State Data.</p>
          <table>
            <tbody>
              <tr>
                <th>Link Type</th>
                <th>Description</th>
                <th>Link State ID Refers to</th>
                <th>Link Data Refers to</th>
              </tr>
              ${Object.keys(RouterLinkType)
                .filter((key) => !isNaN(parseInt(key)))
                .map(
                  (type) =>
                    `
                <tr>
                  <td style="text-align: center">${type}</td>
                  <td>${routerLinkTypeToString(parseInt(type))}</td>
                  <td>${linkIdSummary(parseInt(type))}</td>
                  <td>${linkDataSummary(parseInt(type))}</td>
                </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          `,
          value: type,
        },
        {
          flexGrow: 0.5,
          label: "# TOS",
          description: `The number of different TOS metrics given for this link, not
        counting the required link metric`,
          value: NOT_IMPLEMENTED,
        },
        {
          flexGrow: 1,
          label: "Metric",
          description: `<p>Refers to the cost of using this router link.
            (The <i><b>Euclidean distance</i></b> in this simulation).</p>`,
          value: metric,
        },
      ],
    },
  ];
};

const getRouterLSARows = (body: RouterLSABody): PacketViz[] => {
  const { e, b, v, nLinks, links } = body;
  const rows: PacketViz[] = [
    {
      row: [
        {
          label: "",
          description: "Padding",
          flexGrow: 0.25,
          value: 0,
        },
        {
          label: "V",
          description:
            "When set, the router is an endpoint of one or more fully adjacent virtual links having the described area as Transit area",
          flexGrow: 0.1,
          value: v ? 1 : 0,
        },
        {
          label: "E",
          description:
            "E stands for external - This bit is set <b>when the router is an AS Boundary router</b>",
          flexGrow: 0.1,
          value: e ? 1 : 0,
        },
        {
          label: "B",
          description:
            "B stands for border - This bit is set <b>when the router is an Area Boundary Router</b>",
          flexGrow: 0.1,
          value: b ? 1 : 0,
        },
        {
          label: "",
          description: "Padding",
          flexGrow: 0.25,
          value: 0,
        },
        {
          label: "# Links",
          description: `Describes the number of links that this LSA contains. For Router LSAs,
          this must be the total collection of router links (i.e., interfaces) to the area. (If the router has 3 neighbors)`,
          flexGrow: 0.8,
          value: nLinks,
        },
      ],
    },
  ];
  links.forEach((link, idx) => {
    rows.push(...getRouterLinkRows(link, idx));
  });
  return rows;
};

const getSummaryLSARows = (
  lsType: LSType.SummaryIpLSA | LSType.SummaryAsBrLSA,
  body: SummaryLSABody
): PacketViz[] => {
  const { networkMask, metric } = body;
  return [
    {
      row: [
        {
          flexGrow: 1,
          description: `
          <p style="font-size: .764rem">
            For Type 3 summary-LSAs, this indicates the destination
            network's IP address mask.  For example, when advertising the
            location of a class A network the value 0xff000000 would be
            used.  This field is not meaningful and must be zero for Type 4
            summary-LSAs.
          </p>
          `,
          label: "Network Mask",
          value: `${networkMask}`,
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 0.2,
          description: `Padding bits`,
          value: 0,
          label: "",
        },
        {
          flexGrow: 1,
          description: `The cost of the route to the ${
            lsType === LSType.SummaryIpLSA ? "IP network" : "AS-BR"
          } described by this LSA.`,
          label: "Metric",
          value: `${metric}`,
        },
      ],
    },
  ];
};

export const getLSABodyRows = (
  lsType: LSType,
  lsaBody: LSBody
): PacketViz[] => {
  switch (lsType) {
    case LSType.RouterLSA:
      return getRouterLSARows(lsaBody as RouterLSABody);
    case LSType.SummaryIpLSA:
    case LSType.SummaryAsBrLSA:
      return getSummaryLSARows(lsType, lsaBody as SummaryLSABody);
    default:
      return [];
  }
};

export const getLSUpdateRows = (body: LSUpdatePacketBody): PacketViz[] => {
  const { lsaList, nLsa } = body;
  const rows: PacketViz[] = [
    {
      row: [
        {
          flexGrow: 1,
          label: "# LSAs",
          description: "The number of LSAs included in this update.",
          value: nLsa,
        },
      ],
    },
  ];
  lsaList.forEach((lsa, idx) => {
    const { header, body } = lsa;
    const { lsType } = header;
    const headerRows = getLSAHeaderRows(header);
    headerRows[0].separator = {
      color: Colors.lsUpdate,
      label: `LSA ${idx + 1}`,
    };
    rows.push(...headerRows);
    rows.push(...getLSABodyRows(lsType, body));
  });
  return rows;
};

export const getLSAckRows = (acknowledgements: LSAHeader[]): PacketViz[] => {
  const rows: PacketViz[] = [];
  acknowledgements.forEach((header, idx) => {
    const headerRows = getLSAHeaderRows(header);
    if (headerRows[0]) {
      headerRows[0].separator = {
        label: `LS Ack ${idx + 1}`,
        color: Colors.lsAck,
      };
    }
    rows.push(...headerRows);
  });
  return rows;
};
