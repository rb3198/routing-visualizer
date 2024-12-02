import { KDTree } from "ts-data-structures-collection/trees";
import { OSPFArea } from "./area";
import { Rect2D } from "./geometry/Rect2D";

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
    const [, nearestArea] = this.searchClosest([x, y]);
    const { boundingBox, labelCell, getRouterLocationKey } = nearestArea;
    if (!boundingBox.isWithinBounds([x, y])) {
      return { inArea: false, canPlaceRouter: false, cursor: "pointer" };
    }
    const possibleRouterLocation = getRouterLocationKey(y, x);
    const isLabelCell = labelCell[0] === x && labelCell[1] === y;
    if (
      nearestArea.routerLocations.has(possibleRouterLocation) ||
      isLabelCell
    ) {
      return {
        inArea: true,
        canPlaceRouter: false,
        cursor: isLabelCell ? "initial" : "pointer",
      };
    }
    return { inArea: true, canPlaceRouter: true, cursor: "pointer" };
  };
}
