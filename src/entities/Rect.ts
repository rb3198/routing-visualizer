import { Colors } from "../constants/theme";

export class Rect {
  x: number;
  y: number;
  height: number;
  width: number;
  constructor(x: number, y: number, height: number, width: number) {
    this.x = x;
    this.y = y;
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

  draw = (context: CanvasRenderingContext2D) => {
    context.beginPath();
    context.rect(this.x, this.y, this.width, this.height);
    context.fill();
    context.stroke();
    context.closePath();
  };
}
