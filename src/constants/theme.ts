import { PacketType } from "../entities/ospf/enum";

export const Colors = {
  accent: "#324ca8",
  complementary: "#A8324C",
  grid: "#DDD",
  helloPacket: "#4CA832",
  dd: "#A88E32",
  droppedPacket: "#E13A1E",
};

export const PacketColorMap = new Map<PacketType, string>([
  [PacketType.Hello, Colors.helloPacket],
  [PacketType.DD, Colors.dd],
]);
