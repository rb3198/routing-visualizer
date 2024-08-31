import { HelloPacketBody } from "src/entities/ospf/packets/hello";
import { PacketVizField } from "./types";
import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";

export const getHelloVizRows = (body: HelloPacketBody): PacketVizField[][] => {
  const { deadInterval, helloInterval, neighborList, networkMask } = body;
  return [
    [
      {
        flexGrow: 1,
        label: "Network Mask",
        value: networkMask,
        description: `The network mask associated with this interface. <br>  For example,
        if the interface is to a class B network whose third byte is
        used for subnetting, the network mask is 0xffffff00.`,
      },
    ],
    [
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
    [
      {
        flexGrow: 1,
        label: "Router DeadInterval",
        value: `${deadInterval / 1000}s`,
        description: `The number of seconds before declaring a silent router down. If a router does not receive
          a hello packet for <i>deadInterval</i> seconds from a neighbor, it considers its neighbor to be DOWN.`,
      },
    ],
    [
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
  ];
};
