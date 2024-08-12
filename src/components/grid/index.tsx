import React, { useCallback, useLayoutEffect, useRef } from "react";
import styles from "./styles.module.css";
import { GridCell } from "../../entities/geometry/grid_cell";
import { onCanvasLayout } from "../../utils/ui";

interface GridProps {
  gridRect: GridCell[][];
  gridSize: number;
  setGrid: React.Dispatch<React.SetStateAction<GridCell[][]>>;
}

export const Grid: React.FC<GridProps> = (props) => {
  const { gridSize, setGrid } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const constructGrid = useCallback(
    (canvas: HTMLCanvasElement, cellSize: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      const context = canvas.getContext("2d");
      let x = 0,
        y = 0;
      const gridRect: GridCell[][] = [];
      while (y <= height) {
        x = 0;
        const row = [];
        while (x < width) {
          const cell = new GridCell(x, y, cellSize);
          context && cell.drawEmpty(context);
          row.push(cell);
          x += cellSize;
        }
        y += cellSize;
        gridRect.push(row);
      }
      return gridRect;
    },
    []
  );

  useLayoutEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    onCanvasLayout(canvasRef.current);
    const cellSize = canvasRef.current.width / gridSize;
    const gridRect = constructGrid(canvasRef.current, cellSize);
    setGrid(gridRect);
  }, [gridSize, setGrid, constructGrid]);
  return <canvas ref={canvasRef} id={styles.cell_grid} />;
};
