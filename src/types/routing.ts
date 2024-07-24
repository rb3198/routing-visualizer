import { Router } from "../entities/Router";

export class IPv4Address {
  bytes: [number, number, number, number, number | undefined];
  constructor(
    byte1: number,
    byte2: number,
    byte3: number,
    byte4: number,
    subnetMask?: number
  ) {
    this.bytes = [byte1, byte2, byte3, byte4, subnetMask];
  }

  get ip() {
    return this.bytes.slice(0, 4).join(".") + "/" + this.bytes[4];
  }
}

export type OSPFTableRow = {
  destination: IPv4Address;
  nextHop: IPv4Address;
  router: Router;
  cost: number;
  interface: string;
};

export type BGPTableRow = {
  destination: IPv4Address;
  nextHop: IPv4Address;
  router: Router;
  asPath: string[];
  // localPref indicates (Not in demo) any custom priority given by network admin to the destination AS.
  origin: "internal" | "external";
};
