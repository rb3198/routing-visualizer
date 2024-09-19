export enum PacketType {
  Hello = 1,
  DD = 2,
  LinkStateRequest = 3,
  LinkStateUpdate = 4,
  LinkStateAck = 5,
}

export const getPacketTypeString = (value: PacketType) => {
  switch (value) {
    case PacketType.Hello:
      return "Hello";
    case PacketType.DD:
      return "Database Description";
    case PacketType.LinkStateRequest:
      return "Link State Request";
    case PacketType.LinkStateUpdate:
      return "Link State Update";
    case PacketType.LinkStateAck:
      return "Link State Acknowledgement";
    default:
      return "";
  }
};
