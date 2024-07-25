import { RefObject } from "react";
import { GridCell } from "./GridCell";
import { AutonomousSystem } from "./AutonomousSystem";
import { Point2D } from "../types/geometry";
import { Colors } from "../constants/theme";
import { AutonomousSystemTree } from "./AutonomousSystemTree";
import { Rect2D } from "./geometry/Rect2D";
import { IPv4Address } from "../types/routing";

export class Grid {
  /**
   * Grid constructed will be of size `gridSize x gridSize` cells
   */
  gridSize: number;

  /**
   * New AS placed on the grid will be of size `defaultAsSize x defaultAsSize` by default before any resizing by the user.
   *
   * In number of grid cells wide / tall.
   */
  defaultAsSize: number;

  /**
   * The grid will be drawn inside this canvas
   */
  canvasRef: RefObject<HTMLCanvasElement>;

  /**
   * The grid mapped to rect objects
   */
  gridRect: GridCell[][];

  /**
   * Keeps track of the previous grid location hovered. Helps in clearing the said location when mouse moves over to a different cell.
   */
  previousHoverLocation?: [number, number];

  /**
   * Keeps track of the grid location currently active - picker is in an open state as a result of a click on this location.
   */
  activeLocation?: [number, number];

  asTree: AutonomousSystemTree;

  rootIp: IPv4Address;

  constructor(gridSize: number, canvasRef: RefObject<HTMLCanvasElement>) {
    this.canvasRef = canvasRef;
    this.gridSize = gridSize;
    this.gridRect = this.getEmptyGridRect(gridSize);
    this.defaultAsSize = Math.ceil(gridSize / 6);
    this.asTree = new AutonomousSystemTree();
    this.rootIp = new IPv4Address(192, 0, 0, 0, 8);
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

  private updatePreviousHoverLocation = (
    context: CanvasRenderingContext2D,
    row: number,
    column: number
  ) => {
    this.gridRect[row][column].drawEmpty(context);
    if (this.asTree.root) {
      const [, nearestAs] = this.asTree.searchClosest([column, row]);
      nearestAs.draw(
        context,
        Colors.accent,
        Colors.accent + "55",
        this.getCellSize(),
        this.gridRect
      );
    }
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
  onMouseOverGrid = (
    e: MouseEvent,
    setComponentOptions: React.Dispatch<
      React.SetStateAction<"as" | "none" | "router">
    >,
    setAsList: React.Dispatch<React.SetStateAction<AutonomousSystem[]>>
  ) => {
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
    if (this.previousHoverLocation) {
      const [prevRow, prevCol] = this.previousHoverLocation;
      if (prevRow === row && prevCol === column) {
        return;
      }
      this.updatePreviousHoverLocation(context, prevRow, prevCol);
    }
    if (this.asTree.root) {
      const [, nearestAs] = this.asTree.searchClosest([column, row]);
      const { boundingBox, labelCell, getRouterLocationKey } = nearestAs;
      const possibleRouterLocation = getRouterLocationKey(row, column);
      if (boundingBox.isWithinBounds([column, row])) {
        const isLabelCell = labelCell[0] === column && labelCell[1] === row;
        if (nearestAs.routerLocations.has(possibleRouterLocation)) {
          setComponentOptions("none");
          setAsList(
            this.asTree.inOrderTraversal(this.asTree.root).map(([, as]) => as)
          );
        } else if (isLabelCell) {
          setComponentOptions("none");
          setAsList([]);
        } else {
          setComponentOptions("router");
          setAsList([]);
          nearestAs.draw(
            context,
            Colors.accent,
            Colors.accent + "55",
            this.getCellSize(),
            this.gridRect
          );
          cell.drawAddIcon(context);
        }
        this.previousHoverLocation = [row, column];
        return;
      }
    }
    const potentialAsPosition = this.getASPosition(row, column);
    if (potentialAsPosition) {
      const potentialAsRect = new Rect2D(
        potentialAsPosition.low,
        potentialAsPosition.high
      );
      if (this.asTree.canPlaceAsOnCell(potentialAsRect)) {
        setComponentOptions("as");
        const prevFill = context.fillStyle;
        context.fillStyle = "white";
        cell.drawAddIcon(context);
        context.fillStyle = prevFill;
      } else {
        setComponentOptions("none");
      }
      this.previousHoverLocation = [row, column];
    }
    // If inside AS and no router present - open picker with only router option shown
    /* If outside AS and no router present
      - Check if the location is at least one grid cell away from any AS:
        - If yes, show Add Icon, with the only option being to add an AS area
        - Else, Change cursor to normal, do not show Add icon.
      If inside AS:
        - Check the AS for router locations if it has any.
          - If location is present inside the router locations set, make the router draggable within the AS.
          - Else show Add icon, opening picker on click, with the only option being to add a router
    */
    // // TODO: Make it draggable, search router inside AS.
  };

  private getPickerPosition = (
    row: number,
    column: number,
    cell: GridCell,
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

  private getASPosition = (
    row: number,
    column: number
  ): { low: Point2D; high: Point2D } | null => {
    let horizontal: "left" | "right" = "right",
      vertical: "bottom" | "top" = "bottom";
    if (!this.canvasRef.current) {
      return null;
    }
    if (column + this.defaultAsSize > this.gridSize) {
      horizontal = "left";
    }
    if (row + this.defaultAsSize > this.gridSize) {
      vertical = "top";
    }
    const lowX =
      horizontal === "right" ? column : column - this.defaultAsSize + 1;
    const lowY = vertical === "bottom" ? row : row - this.defaultAsSize;
    const highX =
      horizontal === "right" ? column + this.defaultAsSize : column + 1;
    const highY = vertical === "bottom" ? row + this.defaultAsSize : row;
    return { low: [lowX, lowY], high: [highX, highY] };
  };

  /**
   * Handle mouse clicks on the grid
   */
  onMouseDown = (
    e: MouseEvent,
    pickerOpen: boolean,
    openPicker: (left: number, top: number) => void,
    closePicker: (e: MouseEvent) => void,
    connectionPickerOpen: boolean,
    openConnectionPicker: (
      routerKey: string,
      left: number,
      top: number
    ) => void,
    closeConnectionPicker: (e: MouseEvent) => void,
    pickerElement?: HTMLDivElement | null,
    connectionPickerElement?: HTMLDivElement | null
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
    if (pickerOpen) {
      closePicker(e);
      return;
    }
    const [, nearestAs] =
      (this.asTree.root && this.asTree.searchClosest([column, row])) || [];
    if (
      connectionPickerElement &&
      nearestAs &&
      nearestAs.routerLocations.has(nearestAs.getRouterLocationKey(row, column))
    ) {
      // Clicked on a router.
      const { left, top } = this.getPickerPosition(
        row,
        column,
        rect,
        connectionPickerElement
      );
      if (connectionPickerOpen) {
        closeConnectionPicker(e);
        return;
      } else {
        openConnectionPicker(
          nearestAs.getRouterLocationKey(row, column),
          left,
          top
        );
      }
      return;
    }
    if (connectionPickerOpen) {
      closeConnectionPicker(e);
      return;
    }
    if (pickerElement) {
      const { left, top } = this.getPickerPosition(
        row,
        column,
        rect,
        pickerElement
      );
      // TODO: Add AND !(Paths.contains location key)
      openPicker(left, top);
    }
    this.activeLocation = [row, column];
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
    const [, nearestAs] = this.asTree.searchClosest([col, row]);
    if (!this.canvasRef.current || nearestAs.routerLocations.has(routerKey)) {
      return;
    }
    const context = this.canvasRef.current.getContext("2d");
    if (!context) {
      return;
    }
    const rect = this.gridRect[row][col];
    const router = nearestAs.placeRouter(row, col);
    rect.drawRouter(context, router.ip.ip);
    this.activeLocation = undefined;
    this.previousHoverLocation = undefined;
    onPlaced && onPlaced(e);
  };

  placeAS = (e: MouseEvent, onPlaced?: (e: MouseEvent) => unknown) => {
    if (!this.activeLocation || this.activeLocation.length !== 2) {
      console.error(
        "Unexpected placeAS call! Active Location must be populated before calling this method"
      );
      return;
    }
    const [row, col] = this.activeLocation;
    const context = this.canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }
    const asBounds = this.getASPosition(row, col);
    if (!asBounds) {
      return;
    }
    if (this.previousHoverLocation) {
      const cellSize = this.getCellSize();
      context.clearRect(
        this.previousHoverLocation[1] * cellSize,
        this.previousHoverLocation[0] * cellSize,
        cellSize,
        cellSize
      );
    }
    const { low, high } = asBounds;
    const [byte1] = this.rootIp.bytes;
    const nAs = this.asTree.inOrderTraversal(this.asTree.root).length;
    const as = new AutonomousSystem(
      low,
      high,
      `AS ${nAs + 1}`,
      new IPv4Address(byte1, nAs + 1, 0, 0)
    );
    const { boundingBox } = as;
    const { centroid: asCentroid } = boundingBox;
    const asFillColor = Colors.accent + "55";
    as.draw(
      context,
      Colors.accent,
      asFillColor,
      this.getCellSize(),
      this.gridRect
    );
    this.asTree.insert(asCentroid, as);
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
        const cell = new GridCell(x, y, cellSize, cellSize);
        this.gridRect[row][col] = cell;
        cell.drawEmpty(context);
        x += cellSize;
      }
      y += cellSize;
    }
    if (this.asTree.root) {
      this.asTree
        .inOrderTraversal(this.asTree.root)
        .map(([, as]) => as)
        .forEach((as) => {
          as.draw(
            context,
            Colors.accent,
            Colors.accent + "55",
            this.getCellSize(),
            this.gridRect
          );
        });
    }
  };
}
