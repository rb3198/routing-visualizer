import { IPv4Address } from "../ipv4_address";
import { IPProtocolNumber } from "../enum/ip_protocol_number";

/**
 * Condensed IPv4 header for simulation.
 */
export class IPHeader {
  id: number;
  protocol: IPProtocolNumber;
  source: IPv4Address;
  destination: IPv4Address;
  constructor(
    id: number,
    protocol: IPProtocolNumber,
    source: IPv4Address,
    destination: IPv4Address
  ) {
    this.id = id;
    this.protocol = protocol;
    this.source = source;
    this.destination = destination;
  }
}
