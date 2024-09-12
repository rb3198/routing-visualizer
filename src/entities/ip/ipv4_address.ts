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
    return this.bytes.slice(0, 4).join(".") + "/" + this.bytes[4];
  }

  toString = () => {
    return this.ip;
  };

  equals = (comparedIp: IPv4Address) =>
    this.toString() === comparedIp.toString();

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
