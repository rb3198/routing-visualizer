import { GridCell } from "../../entities/GridCell";
import { Router } from "../../entities/Router";
import { Point2D } from "../../types/geometry";

/**
 * Gets the potential AS rect bounds based on click position.
 * @param row
 * @param column
 * @param defaultAsSize
 * @param gridSizeX
 * @param gridSizeY
 * @returns
 */
export const getASPosition = (
  row: number,
  column: number,
  defaultAsSize: number,
  gridSizeX: number,
  gridSizeY: number
): { low: Point2D; high: Point2D } | null => {
  let horizontal: "left" | "right" = "right",
    vertical: "bottom" | "top" = "bottom";
  if (column + defaultAsSize > gridSizeX) {
    horizontal = "left";
  }
  if (row + defaultAsSize > gridSizeY) {
    vertical = "top";
  }
  const lowX = horizontal === "right" ? column : column - defaultAsSize + 1;
  const lowY = vertical === "bottom" ? row : row - defaultAsSize;
  const highX = horizontal === "right" ? column + defaultAsSize : column + 1;
  const highY = vertical === "bottom" ? row + defaultAsSize : row;
  return { low: [lowX, lowY], high: [highX, highY] };
};

export const getPickerPosition = (
  row: number,
  column: number,
  gridRect: GridCell[][],
  tooltipElement?: HTMLDivElement | null,
  canvas?: HTMLCanvasElement
): { left: number; top?: number; bottom?: number } => {
  if (!canvas || !tooltipElement) {
    return { left: -200, top: -200 };
  }
  const { height, width } = tooltipElement.getBoundingClientRect();
  const cell = gridRect[row][column];
  const { x, y } = cell;
  const canvasY = canvas.getBoundingClientRect().y;
  const horizontalPosition = x + width > canvas.clientWidth ? "left" : "right";
  const verticalPosition =
    canvas.getBoundingClientRect().y + y + height > canvas.clientHeight
      ? "top"
      : "bottom";
  if (horizontalPosition === "right") {
    if (verticalPosition === "bottom") {
      const { x, y } = gridRect[row + 1][column + 1];
      return { left: x, top: y + canvasY };
    }
    const { x } = gridRect[row - 1][column + 1];
    return { left: x, top: y - height + canvasY };

    // return { left: x, bottom: (this.gridSize - row) * this.getCellSize() };
  }
  if (verticalPosition === "bottom") {
    const { y } = gridRect[row + 1][column - 1];
    return { left: x - width, top: y + canvasY };
  }
  return { left: x - width, top: y - height + canvasY };
};

export const drawRouterConnection = (
  routerA: Router,
  routerB: Router,
  cellSize: number,
  context: CanvasRenderingContext2D
) => {
  const { location: locA } = routerA;
  const [aX, aY] = locA;
  const { location: locB } = routerB;
  const [bX, bY] = locB;
  const slope = (bY - aY) / (bX - aX);
  const theta = Math.atan(slope);
  context.save();
  const distance = Math.sqrt((bX - aX) ** 2 + (bY - aY) ** 2);
  context.strokeStyle = "black";
  context.fillStyle = "black";
  let startX = aX * cellSize + cellSize / 2,
    startY = aY * cellSize,
    endX = bX * cellSize + cellSize / 2,
    endY = (bY + 1) * cellSize;
  context.beginPath();
  if (theta === Math.PI / 2) {
    startY = (aY + 1) * cellSize;
    endY = bY * cellSize;
  } else if (theta !== -Math.PI / 2) {
    startX = (aX > bX ? aX : aX + 1) * cellSize;
    startY = aY * cellSize + cellSize / 2;
    endX = (aX > bX ? bX + 1 : bX) * cellSize;
    endY = bY * cellSize + cellSize / 2;
  }
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.font = "16px sans-serif";
  const textX = (startX + endX) / 2,
    textY = (startY + endY) / 2;
  context.translate(textX, textY);
  context.rotate(theta);
  context.fillText(distance.toFixed(2), 0, -5);
  context.stroke();
  context.fill();
  context.closePath();
  context.restore();
};
