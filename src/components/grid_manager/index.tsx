import React, { useLayoutEffect, useState } from "react";
import { Grid } from "../grid";
import { GridCell } from "../../entities/geometry/grid_cell";
import { AreaManager } from "../area_manager";

export const GridManager: React.FC = () => {
  const [gridSize, setGridSize] = useState(30);
  const [grid, setGrid] = useState<GridCell[][]>([]);

  useLayoutEffect(() => {
    const { documentElement } = document;
    const { clientWidth } = documentElement;
    if (clientWidth <= 768) {
      setGridSize(18);
      return;
    }
    if (clientWidth <= 1024) {
      setGridSize(24);
      return;
    }
    if (clientWidth <= 1368) {
      setGridSize(26);
      return;
    }
    if (clientWidth < 1800) {
      setGridSize(28);
      return;
    }
  }, []);

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
