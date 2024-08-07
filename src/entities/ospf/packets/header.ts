import { IPv4Address } from "../../ip/ipv4_address";
import { PacketType } from "../enum";

/**
 * Only fields essential to the simulation are kept from the full spec.
 * - Auth is not simulated, so all auth fields are omitted.
 * - Version number is only added to simulate the compatibility checking process.
 * - Checksum is not simulated and is thus omitted.
 */
export class OSPFHeader {
  version: number;
  type: PacketType;
  routerId: IPv4Address;
  areaId: string;
  constructor(
    version: number,
    type: PacketType,
    routerId: IPv4Address,
    areaId: string
  ) {
    this.version = version;
    this.type = type;
    this.routerId = routerId;
    this.areaId = areaId;
  }
}
