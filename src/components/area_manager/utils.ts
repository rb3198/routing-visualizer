import { Point2D } from "../../types/geometry";

/**
 * Gets the potential Area rect bounds based on click position.
 * @param row
 * @param column
 * @param defaultAreaSize
 * @param gridSizeX
 * @param gridSizeY
 * @returns
 */
export const getAreaPosition = (
  row: number,
  column: number,
  defaultAreaSize: number,
  gridSizeX: number,
  gridSizeY: number
): { low: Point2D; high: Point2D } => {
  let horizontal: "left" | "right" = "right",
    vertical: "bottom" | "top" = "bottom";
  if (column + defaultAreaSize > gridSizeX) {
    horizontal = "left";
  }
  if (row + defaultAreaSize > gridSizeY) {
    vertical = "top";
  }
  const lowX = horizontal === "right" ? column : column - defaultAreaSize + 1;
  const lowY = vertical === "bottom" ? row : row - defaultAreaSize;
  const highX = horizontal === "right" ? column + defaultAreaSize : column + 1;
  const highY = vertical === "bottom" ? row + defaultAreaSize : row;
  return { low: [lowX, lowY], high: [highX, highY] };
};
