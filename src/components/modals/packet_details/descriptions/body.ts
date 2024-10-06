import { HelloPacketBody } from "src/entities/ospf/packets/hello";
import { PacketSeparator, PacketViz } from "./types";
import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";
import { DDPacketBody } from "src/entities/ospf/packets/dd";
import { LSAHeader } from "src/entities/ospf/lsa";
import { LSType, lsTypeToString } from "src/entities/ospf/enum/ls_type";
import { Colors } from "src/constants/theme";

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

const getLSAHeaderRows = (
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
        {
          flexGrow: 0.5,
          label: "LS Type",
          description: `
        The type of the LSA. This LSA is of type ${lsType}. Each LSA type has a separate advertisement format.
        The possible types are as follows:
        <table style="border-collapse: collapse; margin-top: .764rem">
          <tbody>
          <tr>
            <th style="border: 1px solid #ccc; padding: .764rem; text-align: center; vertical-align: middle;">LS Type</th>
            <th style="border: 1px solid #ccc; padding: .764rem; text-align: center; vertical-align: middle;">Description</th>
          </tr>
          ${Object.keys(LSType)
            .filter((key) => isNaN(parseInt(key)))
            .map(
              (type) =>
                `
            <tr>
              <td style="border: 1px solid #ccc; padding: .764rem; text-align: center; vertical-align: middle;">${
                LSType[type as keyof typeof LSType]
              }</td>
              <td style="border: 1px solid #ccc; padding: .764rem; vertical-align: middle;">${lsTypeToString(
                LSType[type as keyof typeof LSType]
              )}</td>
            </tr>
            `
            )
            .join("")}
          </tbody>
        </table>
        `,
          value: lsTypeToString(lsType),
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 1,
          label: "Link State ID",
          description: `This field identifies the portion of the internet environment
        that is being described by the LSA.  The contents of this field
        depend on the LSA's LS type.`, // TODO: Add table
          value: linkStateId.toString(),
        },
      ],
    },
    {
      row: [
        {
          flexGrow: 1,
          label: "Advertising Router",
          description: `The Router ID of the router that originated the LSA.`,
          value: advertisingRouter.toString(),
        },
      ],
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
