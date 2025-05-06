import { beforeDraw, postDraw } from "src/utils/drawing";
import { Colors } from "../../constants/theme";

/**
 * Class representing a single cell in the grid.
 * - May contain a router OR
 * - May be part of a path connecting two routers
 */
export class GridCell {
  x: number;
  y: number;
  size: number;
  cellStrokeColor: string;
  private type: "router" | "path" | "none" = "none";
  constructor(
    x: number,
    y: number,
    size: number,
    cellStrokeColor: string = Colors.grid
  ) {
    this.x = x;
    this.y = y;
    this.cellStrokeColor = cellStrokeColor;
    this.size = size;
  }

  private beforeDraw = (context: CanvasRenderingContext2D) => {
    beforeDraw(context);
    context.clearRect(this.x, this.y, this.size, this.size);
    context.beginPath();
  };

  /**
   * Draws an Add icon on hover over the cell.
   * @param context
   * @param fillColor
   * @param plusColor
   */
  drawAddIcon = (
    context: CanvasRenderingContext2D,
    fillColor: string = Colors.accent,
    plusColor: string = "white"
  ) => {
    if (this.type !== "none") {
      console.error("Cannot draw on a cell that contains a router or a path.");
      return;
    }
    beforeDraw(context);
    context.strokeStyle = plusColor;
    context.beginPath();
    context.arc(
      this.x + this.size / 2,
      this.y + this.size / 2,
      0.4 * this.size,
      0,
      Math.PI * 2
    );
    context.fillStyle = fillColor;
    context.stroke();
    context.fill();
    context.closePath();
    context.beginPath();
    // vertical bar
    context.rect(
      this.x - 1 + this.size / 2,
      this.y + this.size / 4,
      2,
      this.size / 2
    );
    // horizontal bar
    context.rect(
      this.x + this.size / 4,
      this.y - 1 + this.size / 2,
      this.size / 2,
      2
    );
    context.fillStyle = plusColor;
    context.stroke();
    context.fill();
    context.closePath();
    postDraw(context);
  };

  drawEmpty = (context: CanvasRenderingContext2D, stroke?: string) => {
    this.beforeDraw(context);
    context.rect(this.x, this.y, this.size, this.size);
    context.strokeStyle = stroke || this.cellStrokeColor;
    context.stroke();
    this.type = "none";
    context.closePath();
    postDraw(context);
  };

  drawOverlay(context: CanvasRenderingContext2D) {
    const { x, y, size } = this;
    beforeDraw(context);
    context.fillStyle = "#00000088";
    context.beginPath();
    context.rect(x, y, size, size);
    context.fill();
    context.closePath();
    postDraw(context);
  }
}
