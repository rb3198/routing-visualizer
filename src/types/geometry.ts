/**
 * Defines a point on the grid. `[<x_coordinate>, <y_coordinate>]`
 */
export type Point = [number, number];

export type Rect = {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
};
