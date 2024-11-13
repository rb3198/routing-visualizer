const BITS_PER_BYTE = 8;

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
    const [ipBytes, subnetMask] = ip.split("/");
    const bytes = ipBytes.split(".").map((byte) => parseInt(byte));
    if (
      bytes.length < 4 ||
      bytes.length > 5 ||
      bytes.some((byte) => isNaN(byte))
    ) {
      throw new Error(
        "Invalid IP Address specified to create an instance of IPv4 address."
      );
    }
    const [byte1, byte2, byte3, byte4] = bytes;
    return new IPv4Address(byte1, byte2, byte3, byte4, parseInt(subnetMask));
  };

  get ip() {
    return (
      this.bytes.slice(0, 4).join(".") +
      (typeof this.bytes[4] !== "undefined" && this.bytes[4] !== null
        ? "/" + this.bytes[4]
        : "")
    );
  }

  toString = () => {
    return this.ip;
  };

  equals = (comparedIp: IPv4Address) =>
    this.toString() === comparedIp.toString();

  getNetworkAddress = (): [number, number, number, number] => {
    const subnetMask = this.bytes[4] ?? 32;

    const network = [0, 0, 0, 0];
    let bitsLeft = subnetMask;

    for (let i = 0; i < 4; i++) {
      const byte = this.bytes[i];
      if (byte === null || typeof byte === "undefined") {
        continue;
      }
      if (bitsLeft >= BITS_PER_BYTE) {
        network[i] = byte;
        bitsLeft -= BITS_PER_BYTE;
      } else if (bitsLeft > 0) {
        // Create a mask for the remaining bits and apply it
        const maskByte = (255 << (BITS_PER_BYTE - bitsLeft)) & 255;
        network[i] = byte & maskByte;
        bitsLeft = 0;
      } else {
        network[i] = 0;
      }
    }
    return network as [number, number, number, number];
  };

  fromSameSubnet = (comparedIp: IPv4Address) => {
    const networkId = this.getNetworkAddress();
    const comparedNetworkId = comparedIp.getNetworkAddress();
    return networkId.every((byte, idx) => byte === comparedNetworkId[idx]);
  };

  referenceEquals = (comparedIp: IPv4Address) => this === comparedIp;

  /**
   * Method to compare with another IP Address.
   *
   * Comparison is made from the MSB onward (Left to Right).
   * @param comparedIp The other IP Address
   * @returns
   * - **0** if the IPs are equal.
   * - **1** if the Current IP is > the compared IP
   * - **-1** if the Current IP < the compared IP
   */
  compare = (comparedIp: IPv4Address) => {
    if (this.equals(comparedIp)) {
      return 0;
    }
    const { bytes: comparedBytes } = comparedIp;
    for (let i = 0; i < this.bytes.length; i++) {
      const byte = this.bytes[i];
      const comparedByte = comparedBytes[i];
      const isByteUndefined = typeof byte === "undefined";
      const isComparedByteUndefined = typeof comparedByte === "undefined";
      if (isByteUndefined && isComparedByteUndefined) {
        return 0;
      }
      if (!isByteUndefined && isComparedByteUndefined) {
        return 1;
      }
      if (isByteUndefined && !isComparedByteUndefined) {
        return -1;
      }
      if (byte! > comparedByte!) {
        return 1;
      }
      if (byte! < comparedByte!) {
        return -1;
      }
    }
    return 0;
  };
}
