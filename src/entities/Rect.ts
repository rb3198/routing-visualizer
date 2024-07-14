import { Colors } from "../constants/theme";
import {
  drawRouterAntennas,
  drawRouterBox,
  drawRouterButtons,
} from "../utils/grid_cell";

export class Rect {
  x: number;
  y: number;
  height: number;
  width: number;
  cellStrokeColor: string;
  constructor(
    x: number,
    y: number,
    height: number,
    width: number,
    cellStrokeColor: string = "#ddd"
  ) {
    this.x = x;
    this.y = y;
    this.cellStrokeColor = cellStrokeColor;
    this.height = height;
    this.width = width;
  }

  drawAddIcon = (
    context: CanvasRenderingContext2D,
    fillColor: string = Colors.accent,
    plusColor: string = "white"
  ) => {
    context.beginPath();
    context.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      0.4 * this.width,
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
      this.x - 1 + this.width / 2,
      this.y + this.height / 4,
      2,
      this.height / 2
    );
    // horizontal bar
    context.rect(
      this.x + this.width / 4,
      this.y - 1 + this.height / 2,
      this.width / 2,
      2
    );
    context.fillStyle = plusColor;
    context.stroke();
    context.fill();
    context.closePath();
  };

  drawRouter = (context: CanvasRenderingContext2D) => {
    const { x, y, width, height } = this;
    context.beginPath();
    context.fillStyle = Colors.complementary;
    context.rect(x, y, width, height);
    context.fill();
    context.closePath();
    context.beginPath();
    drawRouterBox.call(this, context);
    drawRouterAntennas.call(this, context);
    drawRouterButtons.call(this, context);
    context.moveTo(x + 0.55 * width, y + 0.7 * height);
    context.lineTo(x + 0.825 * width, y + 0.7 * height);
    context.strokeStyle = "white";
    context.lineWidth = 1.25;
    context.stroke();
    context.closePath();
    context.strokeStyle = "";
  };

  draw = (context: CanvasRenderingContext2D) => {
    context.strokeStyle = this.cellStrokeColor;
    context.beginPath();
    context.rect(this.x, this.y, this.width, this.height);
    context.fill();
    context.stroke();
    context.closePath();
  };
}
