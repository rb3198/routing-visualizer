import { IPacket } from "../../interfaces/IPacket";
import { DDPacketBody } from "./dd";
import { OSPFHeader } from "./header";
import { HelloPacketBody } from "./hello";

export abstract class OSPFPacket implements IPacket {
  header: OSPFHeader;
  abstract body: HelloPacketBody | DDPacketBody; // Add packet types here as you create
  constructor(header: OSPFHeader) {
    this.header = header;
  }
}
