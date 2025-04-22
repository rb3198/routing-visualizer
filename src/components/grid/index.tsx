import React, { RefObject, useCallback, useEffect } from "react";
import styles from "./styles.module.css";
import { GridCell } from "../../entities/geometry/grid_cell";
import { onCanvasLayout } from "../../utils/ui";
import { bindActionCreators, Dispatch } from "redux";
import { setCellSize } from "../../action_creators";
import { connect, ConnectedProps } from "react-redux";

interface GridProps {
  gridSize: number;
  gridCanvasRef: RefObject<HTMLCanvasElement>;
  setGrid: React.Dispatch<React.SetStateAction<GridCell[][]>>;
}

type ReduxProps = ConnectedProps<typeof connector>;
export const GridComponent: React.FC<GridProps & ReduxProps> = (props) => {
  const { gridSize, gridCanvasRef, setGrid, setCellSize } = props;

  const constructGrid = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { width, height } = canvas.getBoundingClientRect();
      const totalCells = gridSize ** 2;
      const aspectRatio = width / height;
      const cols = Math.round(Math.sqrt(totalCells * aspectRatio));
      const rows = Math.round(totalCells / cols);
      const cellWidth = width / cols;
      const cellHeight = height / rows;
      const cellSize = Math.min(cellWidth, cellHeight);
      setCellSize(cellSize);
      const context = canvas.getContext("2d");
      let x = 0,
        y = 0;
      const grid: GridCell[][] = [];
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
        grid.push(row);
      }
      return grid;
    },
    [gridSize, setCellSize]
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

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setCellSize: bindActionCreators(setCellSize, dispatch),
  };
};

const connector = connect(undefined, mapDispatchToProps);

export const Grid = connector(GridComponent);
