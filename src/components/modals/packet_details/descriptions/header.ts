import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";
import { PacketType } from "src/entities/ospf/enum";
import { OSPFHeader } from "src/entities/ospf/packets/header";
import { getKey } from "src/utils/common";
import { PacketVizField } from "./types";

export const getHeaderRows = (header: OSPFHeader): PacketVizField[][] => {
  const { version, type, routerId, areaId } = header;
  return [
    [
      {
        flexGrow: 1,
        label: "Version",
        value: version,
        description:
          "The OSPF Version Number used by this router's OSPF Interface.",
      },
      {
        flexGrow: 1,
        label: "Type",
        value: type,
        description: `The type of OSPF Packet. ${getKey(
          PacketType,
          type
        )} in this case.`,
      },
      {
        flexGrow: 2,
        label: "Packet Length",
        value: "",
        description:
          "The length of the OSPF protocol packet in bytes.  This length includes the standard OSPF header.",
      },
    ],
    [
      {
        flexGrow: 1,
        label: "Router ID",
        description: `The Router ID of the packet's source (32 bit IPv4 address). This packet was sent by ${routerId.toString()}`,
        value: routerId.toString(),
      },
    ],
    [
      {
        flexGrow: 1,
        label: "Area ID",
        description:
          "A 32 bit number identifying the area that this packet belongs to.",
        value: `0.0.0.${areaId}`,
      },
    ],
    [
      {
        flexGrow: 1,
        label: "Checksum",
        value: NOT_IMPLEMENTED,
        description: `The standard IP checksum of the entire contents of the packet,
        starting with the OSPF packet header but excluding the 64-bit
        authentication field.\n
        Calculated as the 16-bit
        one's complement of the one's complement sum of all the 16-bit
        words in the packet, excepting the authentication field.  If the
        packet's length is not an integral number of 16-bit words, the
        packet is padded with a byte of zero before checksumming.  The
        checksum is considered to be part of the packet authentication
        procedure; for some authentication types the checksum
        calculation is omitted.`,
      },
      {
        flexGrow: 1,
        label: "AuType",
        value: NOT_IMPLEMENTED,
        description:
          "Identifies the authentication procedure to be used for the packet.",
      },
    ],
    [
      {
        flexGrow: 1,
        label: "Authentication",
        value: NOT_IMPLEMENTED,
        description: "A 64-bit field for use by the authentication scheme.",
      },
    ],
    [
      {
        flexGrow: 1,
        label: "Authentication",
        value: NOT_IMPLEMENTED,
        description: "A 64-bit field for use by the authentication scheme.",
      },
    ],
  ];
};
