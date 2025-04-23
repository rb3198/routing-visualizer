import { KDTree } from "ts-data-structures-collection/trees";
import { OSPFArea } from "./area";
import { Rect2D } from "./geometry/Rect2D";
import { getCellSize } from "src/utils/drawing";

export class AreaTree extends KDTree<OSPFArea> {
  constructor() {
    super(2);
  }

  /**
   * Method to figure out if a new Area can be placed on a cell
   */
  canPlaceOnCell = (potentialRect: Rect2D) => {
    if (!this.root) {
      return true;
    }
    const [x, y] = potentialRect.centroid;
    const [, nearestArea] = this.searchClosest([x, y]);
    return !nearestArea.boundingBox.doesOverlapWithRect(potentialRect);
  };

  /**
   * Handles the hover action if the hover is performed inside an OSPF Area.
   * @param x x-coordinate (column) of the mouse location
   * @param y y-coordinate (row) of the mouse location
   * @param setComponentOptions
   * @returns `true` if hover should result in drawing the + icon, `false` otherwise.
   */
  handleHover = (
    x: number,
    y: number
  ): {
    inArea: boolean;
    canPlaceRouter: boolean;
    cursor: "initial" | "pointer";
  } => {
    if (!this.root) {
      return { inArea: false, canPlaceRouter: false, cursor: "pointer" };
    }
    const cellSize = getCellSize();
    const [, nearestArea] = this.searchClosest([x, y]);
    const { boundingBox, labelCell, routerLocations } = nearestArea;
    if (!boundingBox.isWithinBounds([x, y])) {
      return { inArea: false, canPlaceRouter: false, cursor: "pointer" };
    }
    const isLabelCell =
      x >= labelCell[0] &&
      x < labelCell[0] + cellSize &&
      y >= labelCell[1] &&
      y < labelCell[1] + cellSize;
    if (isLabelCell) {
      return { inArea: true, canPlaceRouter: false, cursor: "initial" };
    }
    try {
      const [, nearestRouter] = routerLocations.searchClosest([x, y]);
      if (nearestRouter.boundingBox.isWithinBounds([x, y])) {
        return {
          inArea: true,
          canPlaceRouter: false,
          cursor: "pointer",
        };
      }
      return { inArea: true, canPlaceRouter: true, cursor: "pointer" };
    } catch (error) {
      return { inArea: true, canPlaceRouter: true, cursor: "pointer" };
    }
  };
}
