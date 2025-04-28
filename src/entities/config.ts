import { Point2D } from "src/types/geometry";
import { OSPFGlobals } from "./ospf/config/ospf_globals";
import { AreaTree } from "./area_tree";
import { OSPFConfig } from "./ospf/config";
import { IPLinkInterface } from "./ip/link_interface";
import { RouterPowerState } from "./router/enum/RouterPowerState";

type RouterConstructor = {
  low: Point2D;
  ipBytes: [number, number, number, number, number | undefined];
  ospfConfig: OSPFConfig;
  gracefulShutdown: boolean;
  power: RouterPowerState.Shutdown;
};

type AreaConstructor = {
  low: Point2D;
  high: Point2D;
  id: number;
  ipBytes: [number, number, number, number, number | undefined];
  routers: RouterConstructor[];
};

type LinkConstructor = {
  id: string;
  ipBytes: [number, number, number, number, number | undefined];
  routers: Point2D[];
};

export class ConfigFile {
  topology: undefined;
  simConfig: OSPFGlobals;
  cellSize: number;
  areas: AreaConstructor[];
  links: LinkConstructor[];
  zoom: number;
  canvasOffset: Point2D;
  constructor(
    cellSize: number,
    simConfig: OSPFGlobals,
    areaTree: AreaTree,
    linkMap: Map<string, IPLinkInterface>
  ) {
    this.simConfig = simConfig;
    this.cellSize = cellSize;
    this.areas = this.getAreasFromTree(areaTree);
    this.links = this.getLinks(linkMap);
    this.zoom = window.zoom ?? 1;
    this.canvasOffset = window.canvasOffset ?? [0, 0];
  }

  private getAreasFromTree = (tree: AreaTree): AreaConstructor[] => {
    tree.reBalanceTree();
    const areas: AreaConstructor[] = [];
    const queue = [tree.root];
    while (queue.length) {
      const node = queue.shift();
      if (!node) {
        continue;
      }
      const { data: area, left, right } = node;
      const { boundingBox, id, ip, routerLocations } = area;
      const { low, high } = boundingBox;
      const routers: RouterConstructor[] = [];
      for (let [, router] of routerLocations.inOrderTraversal(
        routerLocations.root
      )) {
        const { id, location, gracefulShutdown, ospf } = router;
        const { config: ospfConfig } = ospf;
        routers.push({
          ipBytes: id.bytes,
          low: location,
          gracefulShutdown,
          power: RouterPowerState.Shutdown,
          ospfConfig,
        });
      }
      areas.push({
        low,
        high,
        id,
        ipBytes: ip.bytes,
        routers,
      });
      left && queue.push(left);
      right && queue.push(right);
    }
    return areas;
  };

  private getLinks = (
    linkMap: Map<string, IPLinkInterface>
  ): LinkConstructor[] => {
    return Array.from(linkMap.values()).map((link) => {
      const { id, routers, baseIp } = link;
      return {
        id,
        ipBytes: baseIp.bytes,
        routers: Array.from(routers.values()).map((router) => router.location),
      };
    });
  };
}
