import { KDTree } from "ts-data-structures-collection/trees";
import { AutonomousSystem } from "./AutonomousSystem";
import { Rect2D } from "./geometry/Rect2D";

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
}
