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

  draw = (context: CanvasRenderingContext2D) => {
    context.beginPath();
    context.rect(this.x, this.y, this.width, this.height);
    context.fill();
    context.stroke();
    context.closePath();
  };
}
