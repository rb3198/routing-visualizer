import React, { useState } from "react";
import { Grid } from "../grid";
import { GridCell } from "../../entities/geometry/grid_cell";
import { AreaManager } from "../area_manager";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

export const GridManager: React.FC = () => {
  const [gridSize, setGridSize] = useState(30);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState<GridCell[][]>([]);

  const zoomHandler = (evt: WheelEvent) => {
    const { deltaY, ctrlKey } = evt;
    if (ctrlKey) {
      // control key causes the entire page to zoom in / out.
      evt.preventDefault();
    }
    const dir = Math.sign(deltaY);
    const delta = 0.1;
    setZoom((prev) => {
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, prev + dir * delta)
      );
      window.zoom = newZoom;
      return newZoom;
    });
  };

  if (!document) {
    return null;
  }

  return (
    <>
      <Grid setGrid={setGrid} gridSize={gridSize} grid={grid} zoom={zoom} />
      <AreaManager
        gridRect={grid}
        defaultAreaSize={Math.ceil(gridSize / 5)}
        zoomHandler={zoomHandler}
        zoom={zoom}
      />
    </>
  );
};
