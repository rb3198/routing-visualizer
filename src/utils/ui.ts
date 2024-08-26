import { GridCell } from "../entities/geometry/grid_cell";
import { store } from "../store";

export const debounce = (func: Function, wait: number) => {
  let timeout: number | undefined;
  return (...args: any[]) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};

export const onCanvasLayout = (canvas: HTMLCanvasElement) => {
  const { documentElement } = document;
  const { clientHeight, clientWidth } = documentElement;
  canvas.height = 0.92 * clientHeight;
  canvas.width = 0.75 * clientWidth;
};

export const mapCoordsToGridCell = (
  clientX: number,
  clientY: number,
  gridRect: GridCell[][],
  canvas: HTMLCanvasElement
) => {
  const { cellSize } = store.getState();
  const { x: canvasX, y: canvasY } = canvas.getBoundingClientRect();
  const offsetX = clientX - canvasX;
  const offsetY = clientY - canvasY;
  const column = Math.floor(offsetX / cellSize);
  const row = Math.floor(offsetY / cellSize);
  if (row >= gridRect.length || row < 0) {
    return { row, column, cell: undefined };
  }
  return { row, column, cell: gridRect[row][column] };
};
