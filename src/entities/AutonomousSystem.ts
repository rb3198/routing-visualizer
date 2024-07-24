import { Point2D } from "../types/geometry";
import { getAllRectPoints } from "../utils/geometry";
import { Rect2D } from "./geometry/Rect2D";
import { GridCell } from "./GridCell";
import { Router } from "./Router";

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
  routerLocations: Map<string, Router>;

  /**
   * ID to identify the AS.
   */
  id: string;

  /**
   * Cell containing the label of the AS. Should be non-interactive.
   */
  labelCell: Point2D;

  /**
   *
   * @param low Top left point of the AS's bounding box
   * @param high Bottom right point of the AS's bounding box
   * @param id ID to assign to this AS. Will be labelled on the canvas.
   * @param routerLocations Point2D Locations of routers, if any, in the AS.
   */
  constructor(
    low: Point2D,
    high: Point2D,
    id: string,
    routerLocations?: Point2D[]
  ) {
    this.labelCell = low;
    this.boundingBox = new Rect2D(low, high);
    this.id = id;
    this.routerLocations = routerLocations
      ? new Map(
          routerLocations.map(([x, y]) => [
            this.getRouterLocationKey(x, y),
            new Router([x, y]),
          ])
        )
      : new Map();
  }

  getRouterLocationKey = (row: number, col: number) => `${row}_${col}`;

  placeRouter = (row: number, col: number) => {
    const key = this.getRouterLocationKey(row, col);
    this.routerLocations.set(key, new Router([col, row]));
    if (this.routerLocations.size > 1) {
      this.buildPaths();
    }
  };

  buildPaths = () => {};

  exchangeOSPFPackets = () => {};

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
    context.clearRect(
      low[0] * cellSize,
      low[1] * cellSize,
      (high[0] - low[0]) * cellSize,
      (high[1] - low[1]) * cellSize
    );
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
    context.font = `${cellSize / 2}px sans-serif`;
    const { actualBoundingBoxAscent, actualBoundingBoxDescent } =
      context.measureText(this.id);
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
    context.fillStyle = strokeStyle;
    context.fillText(
      this.id,
      low[0] * cellSize + textHeight / 4,
      low[1] * cellSize + (5 * textHeight) / 4,
      20
    );
    for (let [loc] of this.routerLocations.entries()) {
      const [row, col] = loc.split("_").map((l) => parseInt(l));
      gridRect[row][col] && gridRect[row][col].drawRouter(context);
    }
  };
}
