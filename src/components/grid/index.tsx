import React, { RefObject, useCallback, useEffect } from "react";
import styles from "./styles.module.css";
import { GridCell } from "../../entities/geometry/grid_cell";
import { onCanvasLayout } from "../../utils/ui";

interface GridProps {
  cellSize: number;
  gridCanvasRef: RefObject<HTMLCanvasElement>;
  setGrid: React.Dispatch<React.SetStateAction<GridCell[][]>>;
}
export const Grid: React.FC<GridProps> = (props) => {
  const { cellSize, gridCanvasRef, setGrid } = props;

  const constructGrid = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { width, height } = canvas.getBoundingClientRect();
      const cols = Math.round(width / cellSize);
      const rows = Math.round(height / cellSize);
      const context = canvas.getContext("2d");
      let x = 0,
        y = 0;
      const grid: GridCell[][] = new Array(rows)
        .fill("")
        .map((x) => new Array(cols));
      for (let i = 0; i < rows; i++) {
        x = 0;
        for (let j = 0; j < cols; j++) {
          const cell = new GridCell(x, y, cellSize);
          grid[i][j] = cell;
          context && cell.drawEmpty(context);
          x += cellSize;
        }
        y += cellSize;
      }
      return grid;
    },
    [cellSize]
  );

  useEffect(() => {
    if (!gridCanvasRef.current) {
      return;
    }
    onCanvasLayout(gridCanvasRef.current);
    const gridRect = constructGrid(gridCanvasRef.current);
    setGrid(gridRect);
  }, [gridCanvasRef, setGrid, constructGrid]);
  return <canvas ref={gridCanvasRef} id={styles.cell_grid} />;
};
