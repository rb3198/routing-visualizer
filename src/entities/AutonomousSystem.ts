import { Point, Rect } from "../types/geometry";
import { getRectCentroid } from "../utils/geometry";

export class AutonomousSystem {
  /**
   * Bounding box representing the area contained in the AS. Runs on inverted Y axis as per JS norms.
   *
   * p1 = top left point, p2 = top right point, p3 = bottom right point, p4 = bottom left point.
   */
  boundingBox: Rect;
  routerLocations: Set<string>;
  centroid: Point;

  /**
   *
   * @param low Top left point of the AS's bounding box
   * @param high Bottom right point of the AS's bounding box
   * @param routerLocations Point Locations of routers, if any, in the AS.
   */
  constructor(low: Point, high: Point, routerLocations?: Point[]) {
    const [lowX, lowY] = low;
    const [highX, highY] = high;
    this.boundingBox = {
      p1: low,
      p2: [highX, lowY],
      p3: [highX, highY],
      p4: [lowX, highY],
    };
    this.centroid = getRectCentroid(this.boundingBox);
    this.routerLocations = routerLocations
      ? new Set(routerLocations.map(([x, y]) => this.getLocationKey(x, y)))
      : new Set();
  }

  getLocationKey = (x: number, y: number) => `${x}_${y}`;

  /**
   * Checks if a given point is within bounds of the AS's bounding box area.
   * @param p Point to be tested.
   * @returns
   */
  isWithinBounds = (p: Point) => {
    const [x, y] = p;
    const { p1, p3 } = this.boundingBox;
    const [lowX, lowY] = p1;
    const [highX, highY] = p3;
    return x >= lowX && x < highX && y >= lowY && y <= highY;
  };

  /**
   * Checks if the bounding box of the AS overlaps with a given rect's area.
   * @param rect The rect to test overlap with.
   */
  doesOverlapWithRect = (rect: Rect) => {
    const { p1, p2, p3, p4 } = rect;
    return (
      this.isWithinBounds(p1) ||
      this.isWithinBounds(p2) ||
      this.isWithinBounds(p3) ||
      this.isWithinBounds(p4)
    );
  };
}
