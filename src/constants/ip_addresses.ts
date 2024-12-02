import { IPv4Address } from "../entities/ip/ipv4_address";

export const IPAddresses = {
  OSPFBroadcast: new IPv4Address(224, 0, 0, 5, 32),
};

export const BROADCAST_ADDRESSES = new Set([
  IPAddresses.OSPFBroadcast.toString(),
]);
