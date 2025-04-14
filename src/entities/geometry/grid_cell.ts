import { Colors } from "../../constants/theme";
import {
  drawRouterAntennas,
  drawRouterBox,
  drawRouterButtons,
} from "../../utils/grid_cell";
import { RouterPowerState } from "../router/enum/RouterPowerState";

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

  private beforeDraw = (context: CanvasRenderingContext2D, stroke?: string) => {
    const prevStrokeStyle = context.strokeStyle;
    context.clearRect(this.x, this.y, this.size, this.size);
    context.beginPath();
    context.rect(this.x, this.y, this.size, this.size);
    context.strokeStyle = stroke || this.cellStrokeColor;
    context.stroke();
    context.closePath();
    context.strokeStyle = prevStrokeStyle;
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
    context.save();
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
    context.restore();
  };

  drawRouter = (
    context: CanvasRenderingContext2D,
    routerIp: string,
    power = RouterPowerState.Shutdown
  ) => {
    const { x, y, size } = this;
    context.clearRect(x, y, size, size);
    context.beginPath();
    context.fillStyle =
      power === RouterPowerState.Shutdown
        ? Colors.disabled
        : Colors.complementary;
    context.rect(x, y, size, size);
    context.fill();
    context.closePath();
    context.beginPath();
    drawRouterBox.call(this, context);
    drawRouterAntennas.call(this, context);
    drawRouterButtons.call(this, context);
    context.moveTo(x + 0.55 * size, y + 0.7 * size);
    context.lineTo(x + 0.825 * size, y + 0.7 * size);
    context.strokeStyle = "white";
    context.lineWidth = 1.25;
    context.stroke();
    context.closePath();
    context.fillStyle = "white";
    context.font = `${size / 4.5}px sans-serif`;
    const { fontBoundingBoxAscent, fontBoundingBoxDescent } =
      context.measureText(routerIp);
    const fontHeight = fontBoundingBoxAscent + fontBoundingBoxDescent;
    context.fillText(routerIp, x, y + fontHeight, size);
    context.strokeStyle = "";
    this.type = "router";
  };

  drawEmpty = (context: CanvasRenderingContext2D, stroke?: string) => {
    this.beforeDraw(context, stroke);
    this.type = "none";
  };

  drawOverlay(context: CanvasRenderingContext2D) {
    const { x, y, size } = this;
    context.save();
    context.fillStyle = "#00000088";
    context.beginPath();
    context.rect(x, y, size, size);
    context.fill();
    context.closePath();
    context.restore();
  }
}
