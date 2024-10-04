import { KDTree } from "ts-data-structures-collection/trees";
import { OSPFArea } from "./area";
import { Rect2D } from "./geometry/Rect2D";
import { GridCell } from "./geometry/grid_cell";

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
   * @returns `true` if hover is inside an Area, else `false`.
   */
  handleHover = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    setComponentOptions: React.Dispatch<
      React.SetStateAction<"router" | "area" | "none">
    >,
    setConnectionOptions: React.Dispatch<React.SetStateAction<OSPFArea[]>>,
    cell?: GridCell
  ) => {
    if (!this.root) {
      return false;
    }
    const [, nearestArea] = this.searchClosest([x, y]);
    const { boundingBox, labelCell, getRouterLocationKey } = nearestArea;
    if (!boundingBox.isWithinBounds([x, y])) {
      return false;
    }
    const possibleRouterLocation = getRouterLocationKey(y, x);
    const isLabelCell = labelCell[0] === x && labelCell[1] === y;
    if (nearestArea.routerLocations.has(possibleRouterLocation)) {
      // const router = nearestArea.routerLocations.get(possibleRouterLocation);
      setComponentOptions("none");
      setConnectionOptions(
        this.inOrderTraversal(this.root).map(([, area]) => area)
      );
    } else if (isLabelCell) {
      setComponentOptions("none");
      setConnectionOptions([]);
    } else {
      setComponentOptions("router");
      setConnectionOptions([]);
      cell?.drawAddIcon(context);
    }
    return true;
  };
}
