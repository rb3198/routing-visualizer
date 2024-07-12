import { MutableRefObject, RefObject } from "react";
import { Rect } from "./Rect";

export class Grid {
  /**
   * Grid constructed will be of size `gridSize x gridSize` cells
   */
  gridSize: number;

  /**
   * The grid will be drawn inside this canvas
   */
  canvasRef: RefObject<HTMLCanvasElement>;

  /**
   * The grid mapped to rect objects
   */
  gridRect: Rect[][];

  constructor(gridSize: number, canvasRef: RefObject<HTMLCanvasElement>) {
    this.canvasRef = canvasRef;
    this.gridSize = gridSize;
    this.gridRect = this.getEmptyGridRect(gridSize);
  }

  private getEmptyGridRect = (gridSize: number) => {
    return new Array(gridSize)
      .fill(0)
      .map(() => new Array(gridSize).fill(null));
  };

  private getCellSize = () => {
    if (!this.canvasRef.current) {
      throw new Error("Canvas Ref should be initialized");
    }
    const { width: containerWidth } =
      this.canvasRef.current.getBoundingClientRect();
    return containerWidth / this.gridSize;
  };

  /**
   * Draws(or re-draws) the grid from scratch keeping in mind all the state variables.
   *
   * Initialize all the state variables before calling this method.
   */
  drawGrid = (strokeColor?: string) => {
    if (!this.canvasRef.current) {
      throw new Error("Canvas Ref should be initialized");
    }
    const cellSize = this.getCellSize();
    const { width: containerWidth, height: containerHeight } =
      this.canvasRef.current.getBoundingClientRect();
    const context = this.canvasRef.current.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, containerWidth, containerHeight);
    context.fillStyle = "transparent";
    context.strokeStyle = strokeColor || "grey";
    let y = 0;
    for (let row = 0; row < this.gridSize; row++) {
      let x = 0;
      for (let col = 0; col < this.gridSize; col++) {
        const cell = new Rect(x, y, cellSize, cellSize);
        this.gridRect[row][col] = cell;
        cell.draw(context);
        x += cellSize;
      }
      y += cellSize;
    }
  };
}
