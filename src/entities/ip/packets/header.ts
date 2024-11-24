import { IPv4Address } from "../ipv4_address";
import { IPProtocolNumber } from "../enum/ip_protocol_number";

const DEFAULT_TTL = 32;

/**
 * Condensed IPv4 header for simulation.
 */
export class IPHeader {
  id: number;
  protocol: IPProtocolNumber;
  source: IPv4Address;
  destination: IPv4Address;
  ttl: number;
  constructor(
    id: number,
    protocol: IPProtocolNumber,
    source: IPv4Address,
    destination: IPv4Address,
    ttl?: number
  ) {
    this.id = id;
    this.protocol = protocol;
    this.source = source;
    this.destination = destination;
    this.ttl = ttl ?? DEFAULT_TTL;
  }
}
