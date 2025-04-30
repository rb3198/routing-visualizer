import { Point2D } from "src/types/geometry";
import { OSPFGlobals } from "./ospf/config/ospf_globals";
import { AreaTree } from "./area_tree";
import { OSPFConfig } from "./ospf/config";
import { IPLinkInterface } from "./ip/link_interface";
import { RouterPowerState } from "./router/enum/RouterPowerState";
import { JSONSchemaType } from "ajv/dist/2020";
import { MAX_ZOOM, MIN_ZOOM } from "src/constants/sizing";

type RouterConstructor = {
  low: Point2D;
  ipBytes: [number, number, number, number, number | undefined];
  ospfConfig: OSPFConfig;
  gracefulShutdown: boolean;
  power: RouterPowerState;
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
    if (!tree.root) {
      return [];
    }
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

export const ConfigFileJsonSchema: JSONSchemaType<ConfigFile> = {
  $id: "routing_viz/config_file",
  $defs: {
    ipBytes: {
      type: "array",
      items: { type: "number" },
      minItems: 5,
      maxItems: 5,
      prefixItems: [
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: ["number", "null"] },
      ],
    },
    point2d: {
      type: "array",
      items: {
        type: "number",
      },
      minItems: 2,
      maxItems: 2,
    },
    simConfig: {
      type: "object",
      properties: {
        propagationDelay: {
          type: "number",
        },
        gracefulShutdown: {
          type: "boolean",
        },
        helloInterval: {
          type: "number",
        },
        deadInterval: {
          type: "number",
        },
        rxmtInterval: {
          type: "number",
        },
        MaxAge: {
          type: "number",
        },
        LsRefreshTime: {
          type: "number",
        },
      },
      required: [
        "propagationDelay",
        "gracefulShutdown",
        "helloInterval",
        "deadInterval",
        "rxmtInterval",
        "MaxAge",
        "LsRefreshTime",
      ],
    },
    router: {
      type: "object",
      properties: {
        low: {
          $ref: "#/$defs/point2d",
        },
        ipBytes: {
          $ref: "#/$defs/ipBytes",
        },
        ospfConfig: {
          type: "object",
          properties: {
            helloInterval: {
              type: "number",
            },
            deadInterval: {
              type: "number",
            },
            rxmtInterval: {
              type: "number",
            },
            areaId: {
              type: "number",
            },
            MaxAge: {
              type: "number",
            },
            LsRefreshTime: {
              type: "number",
            },
            connectedToBackbone: {
              type: "boolean",
            },
          },
          required: [
            "helloInterval",
            "deadInterval",
            "rxmtInterval",
            "areaId",
            "MaxAge",
            "LsRefreshTime",
            "connectedToBackbone",
          ],
        },
        gracefulShutdown: {
          type: "boolean",
        },
        power: {
          type: "number",
          const: RouterPowerState.Shutdown,
        },
      },
      required: ["low", "ipBytes", "ospfConfig", "gracefulShutdown", "power"],
    },
    // @ts-ignore Schemas with $ref are not compatible with JSON Schema Type.
    // Other options don't promote reusability.
    area: {
      type: "object",
      properties: {
        low: {
          $ref: "#/$defs/point2d",
        },
        high: {
          $ref: "#/$defs/point2d",
        },
        id: {
          type: "number",
          minimum: 0,
        },
        ipBytes: {
          $ref: "#/$defs/ipBytes",
        },
        routers: {
          type: "array",
          items: {
            $ref: "#/$defs/router",
          },
        },
      },
      required: ["low", "high", "id", "ipBytes", "routers"],
    },
  },
  type: "object",
  properties: {
    simConfig: {
      $ref: "#/$defs/simConfig",
    },
    cellSize: {
      type: "number",
    },
    zoom: {
      type: "number",
      minimum: MIN_ZOOM,
      maximum: MAX_ZOOM,
    },
    canvasOffset: {
      $ref: "#/$defs/point2d",
    },
    areas: {
      type: "array",
      items: {
        $ref: "#/$defs/area",
      },
    },
    links: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          ipBytes: {
            $ref: "#/$defs/ipBytes",
          },
          routers: {
            type: "array",
            items: {
              $ref: "#/$defs/point2d",
            },
          },
        },
        required: ["id", "ipBytes", "routers"],
      },
    },
  },
  required: ["simConfig", "cellSize", "zoom", "canvasOffset", "areas", "links"],
};
