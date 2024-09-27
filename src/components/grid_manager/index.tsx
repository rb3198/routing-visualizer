import React, { useState } from "react";
import { Grid } from "../grid";
import { GridCell } from "../../entities/geometry/grid_cell";
import { AreaManager } from "../area_manager";
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
      <AreaManager gridRect={grid} defaultAreaSize={Math.ceil(gridSize / 5)} />
    </>
  );
};
