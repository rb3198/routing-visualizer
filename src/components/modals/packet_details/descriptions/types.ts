export type PacketVizField = {
  flexGrow: number;
  label: string;
  value: string | number;
  description: string;
};

export type PacketViz = {
  separator?: PacketSeparator;
  row: PacketVizField[];
};

export type PacketSeparator = {
  label: string;
  color: string;
};
