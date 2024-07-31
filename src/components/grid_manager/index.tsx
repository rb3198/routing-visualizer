import React, { useState } from "react";
import { Grid } from "../grid";
import { GridCell } from "../../entities/GridCell";
import { ASManager } from "../as_manager";
interface GridProps {
  gridSize: number;
}

export const GridManager: React.FC<GridProps> = (props) => {
  const { gridSize } = props;
  const [grid, setGrid] = useState<GridCell[][]>([]);

  if (!document) {
    return null;
  }

  return (
    <>
      <Grid setGrid={setGrid} gridSize={gridSize} gridRect={grid} />
      <ASManager gridRect={grid} defaultAsSize={Math.ceil(gridSize / 6)} />
    </>
  );
};
