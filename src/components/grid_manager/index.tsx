import React, { useCallback, useEffect, useRef, useState } from "react";
import { Grid } from "../grid";
import { GridCell } from "../../entities/geometry/grid_cell";
import { AreaManager } from "../area_manager";
import { Point2D } from "src/types/geometry";
import { addVectors, subtractVectors } from "src/utils/geometry";
import { MouseButton, MouseRightEventHandler } from "src/types/common/mouse";
import { DEFAULT_AREA_SIZE, MAX_ZOOM, MIN_ZOOM } from "src/constants/sizing";
import { getCellSize, getVisibleWorldBounds } from "src/utils/drawing";
import { ConfigFile } from "src/entities/config";

export type Drag = {
  start: Point2D;
  end: Point2D;
  offset: Point2D;
  canvasStart: Point2D;
};

export const GridManager: React.FC = () => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const zoomRef = useRef(1);
  const canvasOffsetRef = useRef<Point2D>([0, 0]);
  const dragRef = useRef<Drag>();
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  const constructGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) {
      return [];
    }
    const cellSize = getCellSize();
    const { width, height } = canvas.getBoundingClientRect();
    const cols = Math.round(width / cellSize);
    const rows = Math.round(height / cellSize);
    const context = canvas.getContext("2d");
    let x = 0,
      y = 0;
    const grid: GridCell[][] = new Array(rows)
      .fill("")
      .map(() => new Array(cols));
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
  }, []);

  useEffect(() => {
    const { clientWidth } = document.documentElement;
    let cellSize = 48; // Large desktops
    if (clientWidth < 800) cellSize = 32; // Tablets and small screens
    if (clientWidth < 1400) cellSize = 40; // Standard desktops
    window.cellSize = cellSize;
    setGrid(constructGrid());
  }, [constructGrid]);

  const expandGrid = useCallback((grid: GridCell[][]) => {
    const canvas = gridCanvasRef.current;
    if (!canvas) {
      return grid;
    }
    const { width, height } = canvas.getBoundingClientRect();
    const { startX, startY, endX, endY } = getVisibleWorldBounds(width, height);
    if (!grid.length || !grid[0].length) {
      return grid;
    }
    const cellSize = getCellSize();
    let gridMinX = grid[0][0].x;
    let gridMaxX = grid[0][grid[0].length - 1].x + cellSize;
    let gridMinY = grid[0][0].y;
    let gridMaxY = grid[grid.length - 1][0].y + cellSize;
    const newGrid = [...grid];
    while (startX < gridMinX) {
      // Add column to the left
      newGrid.forEach((row) =>
        row.unshift(new GridCell(row[0].x - cellSize, row[0].y, cellSize))
      );
      gridMinX -= cellSize;
    }
    while (gridMaxX < endX) {
      // Add column to the right
      newGrid.forEach((row) =>
        row.push(
          new GridCell(row[row.length - 1].x + cellSize, row[0].y, cellSize)
        )
      );
      gridMaxX += cellSize;
    }
    const firstRow = newGrid[0];
    while (gridMaxY < endY) {
      // Add row to the bottom
      const pushNewRow = (gridMaxY: number) => {
        newGrid.push(
          new Array(firstRow.length)
            .fill("")
            .map((_, idx) => new GridCell(firstRow[idx].x, gridMaxY, cellSize))
        );
      };
      pushNewRow(gridMaxY);
      gridMaxY += cellSize;
    }
    if (startY < gridMinY) {
      newGrid.unshift(
        new Array(firstRow.length)
          .fill("")
          .map(
            (_, idx) =>
              new GridCell(firstRow[idx].x, firstRow[0].y - cellSize, cellSize)
          )
      );
    }
    return newGrid;
  }, []);

  const drawGrid = useCallback(
    (grid: GridCell[][]) => {
      const canvas = gridCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        return;
      }
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      const newGrid = expandGrid(grid);
      const { startX, startY, endX, endY } = getVisibleWorldBounds(
        width,
        height
      );
      for (const row of newGrid) {
        for (const cell of row) {
          const { x, y, size } = cell;
          if (startX > x + size || endX < x - size) {
            continue;
          }
          if (startY > y + size || endY < y - size) {
            continue;
          }
          cell.drawEmpty(ctx);
        }
      }
      setGrid(newGrid);
    },
    [expandGrid]
  );

  //#region Ref setters
  const setZoom = useCallback(
    (zoom: number, grid: GridCell[][]) => {
      zoomRef.current = zoom;
      window.zoom = zoom;
      drawGrid(grid);
    },
    [drawGrid]
  );

  const setDrag = useCallback(
    (drag: Drag) => {
      dragRef.current = drag;
      const { canvasStart } = drag;
      const newOffset = addVectors(canvasStart, dragRef.current.offset);
      window.canvasOffset = newOffset;
      canvasOffsetRef.current = newOffset;
      drawGrid(grid);
    },
    [grid, drawGrid]
  );
  //#endregion

  const zoomHandler = useCallback(
    (evt: WheelEvent, callback?: () => unknown) => {
      const { deltaY, ctrlKey } = evt;
      if (ctrlKey) {
        // control key causes the entire page to zoom in / out.
        evt.preventDefault();
      }
      const zoom = zoomRef.current;
      const dir = Math.sign(deltaY);
      const delta = 0.1;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + dir * delta)), grid);
      callback && callback();
    },
    [grid, setZoom]
  );

  //#region Pan Methods
  const onMouseRightDown: MouseRightEventHandler = useCallback(
    (e, cb) => {
      const { button, nativeEvent } = e;
      const { offsetX, offsetY } = nativeEvent;
      if (button !== MouseButton.Right) {
        return false;
      }
      e.preventDefault();
      const zoom = zoomRef.current;
      const canvasOffset = canvasOffsetRef.current;
      const offset = [offsetX * zoom, offsetY * zoom] as Point2D;
      setDrag({
        start: offset,
        end: offset,
        offset: [0, 0],
        canvasStart: canvasOffset,
      });
      cb && cb();
      return true;
    },
    [setDrag]
  );

  const onMouseRightMove: MouseRightEventHandler = useCallback(
    (e, callback) => {
      const { nativeEvent } = e;
      const { offsetX, offsetY } = nativeEvent;
      if (!dragRef.current) {
        return false;
      }
      const zoom = zoomRef.current;
      const offset = [offsetX * zoom, offsetY * zoom] as Point2D;
      const { start, canvasStart } = dragRef.current;
      setDrag({
        end: offset,
        start,
        offset: subtractVectors(start, offset),
        canvasStart,
      });
      callback && callback();
      return true;
    },
    [setDrag]
  );

  const onMouseRightUp: MouseRightEventHandler = useCallback(
    (e, callback) => {
      if (!onMouseRightMove(e, callback)) {
        return false;
      }
      dragRef.current = undefined;
      return true;
    },
    [onMouseRightMove]
  );
  //#endregion

  const onConfigLoad = useCallback(
    (config: ConfigFile) => {
      const { zoom, canvasOffset, cellSize } = config;
      const prevCellSize = getCellSize();
      window.cellSize = cellSize;
      const newGrid = constructGrid();
      window.canvasOffset = canvasOffset;
      canvasOffsetRef.current = canvasOffset;
      setZoom((cellSize * zoom) / prevCellSize, newGrid);
    },
    [setZoom, constructGrid]
  );
  if (!document) {
    return null;
  }

  return (
    <>
      <Grid gridCanvasRef={gridCanvasRef} />
      <AreaManager
        gridRect={grid}
        defaultAreaSize={DEFAULT_AREA_SIZE}
        zoomHandler={zoomHandler}
        onMouseRightDown={onMouseRightDown}
        onMouseRightMove={onMouseRightMove}
        onMouseRightUp={onMouseRightUp}
        onConfigLoad={onConfigLoad}
      />
    </>
  );
};
