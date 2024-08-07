import { IPacket } from "../../interfaces/IPacket";
import { IPHeader } from "./header";

export class IPPacket implements IPacket {
  header: IPHeader;
  body: IPacket;
  constructor(header: IPHeader, body: IPacket) {
    this.header = header;
    this.body = body;
  }
}
