import { GridCell } from "src/entities/geometry/grid_cell";
import { Point2D } from "../../types/geometry";
import { getCellSize } from "src/utils/drawing";

/**
 * Gets the potential Area rect bounds based on click position.
 * @param row
 * @param column
 * @param defaultAreaSize
 * @param gridRect
 * @returns
 */
export const getAreaPosition = (
  row: number,
  column: number,
  areaSize: number,
  gridRect: GridCell[][]
): { low: Point2D; high: Point2D } => {
  const gridSizeX = gridRect[0]?.length ?? 0;
  const gridSizeY = gridRect.length;
  const cellSize = getCellSize();
  let horizontal: "left" | "right" = "right",
    vertical: "bottom" | "top" = "bottom";
  if (column + areaSize > gridSizeX) {
    horizontal = "left";
  }
  if (row + areaSize > gridSizeY) {
    vertical = "top";
  }
  let { x, y } = gridRect[row][column];
  x = horizontal === "right" ? x : x - (areaSize - 1) * cellSize;
  y = vertical === "bottom" ? y : y - (areaSize - 1) * cellSize;
  const low = [x, y] as Point2D;
  const high = low.map((x) => x + areaSize * cellSize) as Point2D;
  return { low, high };
};
