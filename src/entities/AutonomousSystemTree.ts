import { KDTree } from "ts-data-structures-collection/trees";
import { AutonomousSystem } from "./AutonomousSystem";
import { Rect2D } from "./geometry/Rect2D";
import { GridCell } from "./GridCell";

export class AutonomousSystemTree extends KDTree<AutonomousSystem> {
  constructor() {
    super(2);
  }

  /**
   * Method to figure out if a new AS can be placed on a cell
   */
  canPlaceAsOnCell = (potentialRect: Rect2D) => {
    if (!this.root) {
      return true;
    }
    const [x, y] = potentialRect.centroid;
    const [, nearestAs] = this.searchClosest([x, y]);
    return !nearestAs.boundingBox.doesOverlapWithRect(potentialRect);
  };

  /**
   * Handles the hover action if the hover is performed inside an AS area.
   * @param x x-coordinate (column) of the mouse location
   * @param y y-coordinate (row) of the mouse location
   * @returns `true` if hover is inside an AS, else `false`.
   */
  handleHover = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    setComponentOptions: React.Dispatch<
      React.SetStateAction<"router" | "as" | "none">
    >,
    setConnectionOptions: React.Dispatch<
      React.SetStateAction<AutonomousSystem[]>
    >,
    cell?: GridCell
  ) => {
    if (!this.root) {
      return false;
    }
    const [, nearestAs] = this.searchClosest([x, y]);
    const { boundingBox, labelCell, getRouterLocationKey } = nearestAs;
    if (!boundingBox.isWithinBounds([x, y])) {
      return false;
    }
    const possibleRouterLocation = getRouterLocationKey(y, x);
    const isLabelCell = labelCell[0] === x && labelCell[1] === y;
    if (nearestAs.routerLocations.has(possibleRouterLocation)) {
      // const router = nearestAs.routerLocations.get(possibleRouterLocation);
      setComponentOptions("none");
      setConnectionOptions(
        this.inOrderTraversal(this.root).map(([, as]) => as)
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
