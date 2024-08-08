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

  static fromString = (ip: string) => {
    const bytes = ip.split(".").map((byte) => parseInt(byte));
    if (
      bytes.length < 4 ||
      bytes.length > 5 ||
      bytes.some((byte) => isNaN(byte))
    ) {
      throw new Error(
        "Invalid IP Address specified to create an instance of IPv4 address."
      );
    }
    const [byte1, byte2, byte3, byte4, subnetMask] = bytes;
    return new IPv4Address(byte1, byte2, byte3, byte4, subnetMask);
  };

  get ip() {
    return this.bytes.slice(0, 4).join(".") + "/" + this.bytes[4];
  }

  toString = () => {
    return this.ip;
  };
}
