import { Point2D } from "../types/geometry";
import { getAllRectPoints } from "../utils/geometry";
import { Rect2D } from "./geometry/Rect2D";
import { GridCell } from "./GridCell";

export class AutonomousSystem {
  /**
   * Bounding box representing the area contained in the AS. Runs on inverted Y axis as per JS norms.
   *
   * p1 = top left point, p2 = top right point, p3 = bottom right point, p4 = bottom left point.
   */
  boundingBox: Rect2D;
  /**
   * A set of all locations of the router, stored as `<x coordinate>_<y_coordinate>`
   */
  routerLocations: Set<string>;

  /**
   *
   * @param low Top left point of the AS's bounding box
   * @param high Bottom right point of the AS's bounding box
   * @param routerLocations Point2D Locations of routers, if any, in the AS.
   */
  constructor(low: Point2D, high: Point2D, routerLocations?: Point2D[]) {
    this.boundingBox = new Rect2D(low, high);
    this.routerLocations = routerLocations
      ? new Set(
          routerLocations.map(([x, y]) => this.getRouterLocationKey(x, y))
        )
      : new Set();
  }

  getRouterLocationKey = (row: number, col: number) => `${row}_${col}`;

  /**
   * Draws the AS from scratch on the grid.
   * Redraws all the routers and paths included in the AS.
   * @param context
   * @param strokeStyle
   * @param fillStyle
   * @param cellSize Size in px of each cell in the grid.
   */
  draw = (
    context: CanvasRenderingContext2D,
    strokeStyle: string,
    fillStyle: string,
    cellSize: number,
    gridRect: GridCell[][]
  ) => {
    const { low, high } = this.boundingBox;
    const { p1, p2, p3, p4 } = getAllRectPoints(low, high);
    for (let i = p1[0]; i < p3[0]; i++) {
      for (let j = p1[1]; j < p3[1]; j++) {
        gridRect[j][i].drawEmpty(context);
      }
    }
    context.beginPath();
    context.strokeStyle = strokeStyle;
    context.fillStyle = fillStyle;
    context.setLineDash([3, 3]);
    context.moveTo(p1[0] * cellSize, p1[1] * cellSize);
    context.lineTo(p2[0] * cellSize, p2[1] * cellSize);
    context.lineTo(p3[0] * cellSize, p3[1] * cellSize);
    context.lineTo(p4[0] * cellSize, p4[1] * cellSize);
    context.lineTo(p1[0] * cellSize, p1[1] * cellSize);
    context.stroke();
    context.fill();
    context.closePath();
    context.setLineDash([]);
    this.routerLocations.forEach((loc) => {
      const [row, col] = loc.split("_").map((l) => parseInt(l));
      gridRect[row][col] && gridRect[row][col].drawRouter(context);
    });
  };
}
