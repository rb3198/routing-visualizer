import { IArea } from "ts-data-structures-collection";
import { Point2D } from "../../types/geometry";
import { getAllRectPoints } from "../../utils/geometry";

/**
 * Rectangular Bounding box. Runs on inverted Y axis as per JS norms.
 *
 * p1 = top left point (low), p2 = top right point, p3 = bottom right point (high), p4 = bottom left point.
 */
export class Rect2D implements IArea {
  low: Point2D;
  high: Point2D;
  centroid: Point2D;
  constructor(low: Point2D, high: Point2D) {
    this.low = low;
    this.high = high;
    this.centroid = this.getCentroid();
  }
  getMinCoord = (axis: number) => this.low[axis];
  getMaxCoord = (axis: number) => this.high[axis];

  /**
   * Checks if a given point is within the area of the bounding box.
   *
   * Bounding Box is LOW INCLUSIVE and HIGH EXCLUSIVE
   * @param p Point to be tested.
   * @returns
   */
  isWithinBounds = (point: number[]) => {
    for (let i = 0; i < point.length; i++) {
      if (point[i] < this.low[i] || point[i] >= this.high[i]) {
        return false;
      }
    }
    return true;
  };

  private getCentroid = (): Point2D => {
    const [x1, y1] = this.low;
    const [x2, y2] = this.high;
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  };

  /**
   * Checks if the bounding box with a given rect's area.
   * @param rect The rect to test overlap with.
   */
  doesOverlapWithRect = (rect: Rect2D) => {
    const { low, high } = rect;
    const { p1, p2, p3, p4 } = getAllRectPoints(low, high);
    return (
      this.isWithinBounds(p1) ||
      this.isWithinBounds(p2) ||
      this.isWithinBounds(p3) ||
      this.isWithinBounds(p4)
    );
  };
}
