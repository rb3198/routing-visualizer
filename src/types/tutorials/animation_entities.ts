import { Point2D, RectPoints } from "../geometry";

export type House = {
  roof: [Point2D, Point2D, Point2D];
  wall: RectPoints;
  wallColor: string;
  door: RectPoints;
  doorColor: string;
};

export type Office = {
  roof: RectPoints;
  wall: RectPoints;
  door: RectPoints;
  windows: RectPoints[];
};
