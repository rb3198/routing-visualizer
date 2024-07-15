import { RefObject } from "react";
import { Rect } from "./Rect";

export class Grid {
  /**
   * Grid constructed will be of size `gridSize x gridSize` cells
   */
  gridSize: number;

  /**
   * The grid will be drawn inside this canvas
   */
  canvasRef: RefObject<HTMLCanvasElement>;

  /**
   * The grid mapped to rect objects
   */
  gridRect: Rect[][];

  /**
   * A set of all locations of the router, stored as `<x coordinate>_<y_coordinate>`
   */
  routerLocations: Set<string> = new Set();

  /**
   * Keeps track of the previous grid location hovered. Helps in clearing the said location when mouse moves over to a different cell.
   */
  previousHoverLocation?: [number, number];

  /**
   * Keeps track of the grid location currently active - picker is in an open state as a result of a click on this location.
   */
  activeLocation?: [number, number];

  constructor(gridSize: number, canvasRef: RefObject<HTMLCanvasElement>) {
    this.canvasRef = canvasRef;
    this.gridSize = gridSize;
    this.gridRect = this.getEmptyGridRect(gridSize);
  }

  private getLocationKey = (row: number, column: number) => `${row}_${column}`;

  private getEmptyGridRect = (gridSize: number) => {
    return new Array(gridSize)
      .fill(0)
      .map(() => new Array(gridSize).fill(null));
  };

  private getCellSize = () => {
    if (!this.canvasRef.current) {
      throw new Error("Canvas Ref should be initialized");
    }
    const { width: containerWidth } =
      this.canvasRef.current.getBoundingClientRect();
    return containerWidth / this.gridSize;
  };

  private isCellEmpty = (row: number, column: number) => {
    const locKey = this.getLocationKey(row, column);
    // TODO: Add path conditions
    return !this.routerLocations.has(locKey);
  };

  private mapCoordsToGridCell = (x: number, y: number) => {
    const cellSize = this.getCellSize();
    const column = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return { row, column, rect: this.gridRect[row][column] };
  };

  /**
   * Function to handle mouse hovering over the grid.
   * @param e The Mouse event
   */
  onMouseOverGrid = (e: MouseEvent) => {
    if (!this.canvasRef.current) {
      return;
    }
    const { clientX, clientY } = e;
    const {
      x: canvasX,
      y: canvasY,
      width: canvasWidth,
      height: canvasHeight,
    } = this.canvasRef.current.getBoundingClientRect();
    const offsetX = clientX - canvasX;
    const offsetY = clientY - canvasY;
    if (
      offsetX < 0 ||
      offsetX > canvasWidth ||
      offsetY < 0 ||
      offsetY > canvasHeight
    ) {
      return;
    }
    const {
      row,
      column,
      rect: cell,
    } = this.mapCoordsToGridCell(offsetX, offsetY);
    const context = this.canvasRef.current.getContext("2d");
    if (!context) {
      return;
    }
    if (this.routerLocations.has(this.getLocationKey(row, column))) {
      // TODO: Make it draggable
      return;
    }
    context.fillStyle = "white";
    if (this.previousHoverLocation) {
      const [prevRow, prevCol] = this.previousHoverLocation;
      const shouldResetPrevLocation =
        this.isCellEmpty(prevRow, prevCol) &&
        (prevRow !== row || prevCol !== column);
      if (shouldResetPrevLocation) {
        this.gridRect[prevRow][prevCol].draw(context);
      }
    }
    cell.drawAddIcon(context);
    context.fillStyle = "transparent";
    this.previousHoverLocation = [row, column];
  };

  private calcPickerPosition = (
    row: number,
    column: number,
    cell: Rect,
    tooltipElement: HTMLDivElement
  ) => {
    if (!this.canvasRef.current) {
      return { left: 0, top: 0 };
    }
    const { height, width } = tooltipElement.getBoundingClientRect();
    const { x, y } = cell;
    const canvasY = this.canvasRef.current.getBoundingClientRect().y;
    const horizontalPosition =
      x + width > this.canvasRef.current.clientWidth ? "left" : "right";
    const verticalPosition =
      y + height > this.canvasRef.current.clientHeight ? "top" : "bottom";
    if (horizontalPosition === "right") {
      if (verticalPosition === "bottom") {
        const { x, y } = this.gridRect[row + 1][column + 1];
        return { left: x, top: y + canvasY };
      }
      const { x } = this.gridRect[row - 1][column + 1];
      return { left: x, top: y - height + canvasY };
    }
    if (verticalPosition === "bottom") {
      const { y } = this.gridRect[row + 1][column - 1];
      return { left: x - width, top: y + canvasY };
    }
    return { left: x - width, top: y - height + canvasY };
  };

  /**
   * Handle mouse clicks on the grid
   */
  onMouseDown = (
    e: MouseEvent,
    tooltipOpen: boolean,
    tooltipElement: HTMLDivElement,
    openTooltip: (left: number, top: number) => void,
    closeTooltip: (e: MouseEvent) => void
  ) => {
    const { clientX, clientY } = e;
    if (!this.canvasRef.current) {
      return;
    }
    const { x: canvasX, y: canvasY } =
      this.canvasRef.current.getBoundingClientRect();
    const offsetX = clientX - canvasX,
      offsetY = clientY - canvasY;
    const { row, column, rect } = this.mapCoordsToGridCell(offsetX, offsetY);
    if (tooltipOpen) {
      closeTooltip(e);
      return;
    }
    const locationKey = this.getLocationKey(row, column);
    if (!this.routerLocations.has(locationKey)) {
      // TODO: Add AND !(Paths.contains location key)
      const { left, top } = this.calcPickerPosition(
        row,
        column,
        rect,
        tooltipElement
      );
      openTooltip(left, top);
      this.activeLocation = [row, column];
    }
  };

  placeRouter = (e: MouseEvent, onPlaced?: (e: MouseEvent) => unknown) => {
    if (!this.activeLocation || this.activeLocation.length !== 2) {
      console.error(
        "Unexpected placeRouter call! Active Location must be populated before calling this method"
      );
      return;
    }
    const [row, col] = this.activeLocation;
    const routerKey = this.getLocationKey(row, col);
    if (!this.canvasRef.current || this.routerLocations.has(routerKey)) {
      return;
    }
    const context = this.canvasRef.current.getContext("2d");
    if (!context) {
      return;
    }
    const rect = this.gridRect[row][col];
    rect.drawRouter(context);
    this.routerLocations.add(routerKey);
    this.activeLocation = undefined;
    this.previousHoverLocation = undefined;
    onPlaced && onPlaced(e);
  };

  /**
   * Draws(or re-draws) the grid from scratch keeping in mind all the state variables.
   *
   * Initialize all the state variables before calling this method.
   */
  drawGrid = (strokeColor?: string) => {
    if (!this.canvasRef.current) {
      throw new Error("Canvas Ref should be initialized");
    }
    const cellSize = this.getCellSize();
    const { width: containerWidth, height: containerHeight } =
      this.canvasRef.current.getBoundingClientRect();
    const context = this.canvasRef.current.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, containerWidth, containerHeight);
    context.fillStyle = "transparent";
    let y = 0;
    for (let row = 0; row < this.gridSize; row++) {
      let x = 0;
      for (let col = 0; col < this.gridSize; col++) {
        const cell = new Rect(x, y, cellSize, cellSize);
        this.gridRect[row][col] = cell;
        cell.draw(context);
        x += cellSize;
      }
      y += cellSize;
    }
  };
}
