import { IPacket } from "../../interfaces/IPacket";
import { OSPFHeader } from "./header";

export abstract class OSPFPacket implements IPacket {
  header: OSPFHeader;
  abstract body: any;
  constructor(header: OSPFHeader) {
    this.header = header;
  }
}
