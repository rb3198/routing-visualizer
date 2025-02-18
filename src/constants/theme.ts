import { PacketType } from "../entities/ospf/enum";

export const Colors = {
  accent: "#324ca8",
  complementary: "#A8324C",
  grid: "#DDD",
  helloPacket: "#4CA832",
  dd: "#A88E32",
  lsRequest: "#8E32A8",
  lsUpdate: "#32A88E",
  lsAck: "#5A32A8",
  droppedPacket: "#E13A1E",
};

export const OspfPacketColorMap = new Map<PacketType, string>([
  [PacketType.Hello, Colors.helloPacket],
  [PacketType.DD, Colors.dd],
  [PacketType.LinkStateRequest, Colors.lsRequest],
  [PacketType.LinkStateUpdate, Colors.lsUpdate],
  [PacketType.LinkStateAck, Colors.lsAck],
]);
