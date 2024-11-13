import { CANDIDATE_LIST_DEGREE } from "src/constants/routing_table";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSType, RouterLinkType } from "src/entities/ospf/enum";
import { LSA } from "src/entities/ospf/lsa";
import { MaxAge } from "src/entities/ospf/lsa/constants";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import {
  NextHop,
  TransitVertexData,
} from "src/entities/ospf/shortest_path_tree/transit_vertex_data";
import { Tree, TreeNode } from "src/entities/ospf/shortest_path_tree/tree";
import {
  RoutingTable,
  RoutingTableRow,
} from "src/entities/ospf/table_rows/routing_table_row";
import { LsDb } from "src/entities/router/ospf_interface/ls_db";
import {
  PriorityQueue,
  PriorityQueueFactory,
} from "ts-data-structures-collection/queues";

type TableCalculationSources = {
  routerId: string;
  lsDb: Record<string, LSA>;
  prevTable: RoutingTable;
  areaId: number;
  routerInterfaces: string[];
};

/**
 * Given the root node `v` and the destination node `w`, gets the interface ID of v connecting to w.
 * @param v
 * @param w
 */
const getConnectingInterface = (v: TransitVertexData, w: TransitVertexData) => {
  const { lsa: rootLsa } = v;
  const { links } = rootLsa.body;
  let interfaceId = "";
  // Since the simulation is only for P2P, no IP address is required in the next hop.
  for (let link of links) {
    const { id, data } = link;
    if (new IPv4Address(...id.bytes).equals(w.vertexId)) {
      interfaceId = new IPv4Address(...data.bytes).toString();
    }
  }
  return interfaceId;
};

/**
 * Given a node `v` and the root, checks if there exists a router node between the two nodes.
 * @param vNode
 * @param root
 * @returns `true` if a router node exists between v and the root, both inclusive. `false` otherwise.
 */
const hasRouterInPath = (
  vNode: TreeNode<TransitVertexData>,
  root: TreeNode<TransitVertexData>
) => {
  if (vNode.data.lsa.header.lsType === LSType.RouterLSA) {
    return true;
  }
  for (let ptr of vNode.parents) {
    while (ptr !== root) {
      if (ptr.data.lsa.header.lsType === LSType.RouterLSA) {
        return true;
      }
    }
  }
  return false;
};

const isRoutingTableEntryIdentical = (
  entry: RoutingTableRow,
  targetAreaId: number,
  targetDestId: IPv4Address,
  targetDestMask: IPv4Address,
  targetPathType:
    | "intra-area"
    | "inter-area"
    | "type1-external"
    | "type2-external"
) =>
  entry.area === targetAreaId &&
  entry.destinationId.equals(new IPv4Address(...targetDestId.bytes)) &&
  entry.addressMask?.equals(new IPv4Address(...targetDestMask.bytes)) &&
  entry.pathType === targetPathType;
/**
 * Calculates the next set of hops for a destination as per section 16.1.1 of the spec.
 * @param path Path from the root (the calculating router) to the current vertex.
 * The last vertex in this path should be the parent vertex of w, i.e. v.
 * @param v The parent vertex
 * @param w The current vertex being added to the shortest path tree.
 * @returns
 */
const calculateNextHops = (
  root: TreeNode<TransitVertexData>,
  vNode: TreeNode<TransitVertexData>,
  wNode: TreeNode<TransitVertexData>
): NextHop[] => {
  const { data: v } = vNode;
  const { data: w } = wNode;
  if (root === vNode) {
    // The parent vertex is the root itself. The destination is therefore a directly connected router or network.
    const interfaceId = getConnectingInterface(v, w);
    if (!interfaceId) {
      console.error(
        "No interface found from root to the destination. Please check."
      );
      return [];
    }
    return [{ interfaceId }];
  }
  if (hasRouterInPath(vNode, root)) {
    // If there is a router vertex in the path between the root and the current vertex,
    // the current vertex simply inherits the set of next hops from the parent.
    // Returning like this to create a referentially new array.
    return [...v.nextHops.map((nextHop) => ({ ...nextHop }))];
  }
  if (v.lsa.header.lsType === LSType.NetworkLSA) {
    // The parent node is a network directly connecting the router to the destination.
    // The list of next hops is determined by examining the destination's router LSA -
    // Each link that points back to the network (Link ID = IP address of the DR of the network) is considered to be the next hop.
    // The link data specifies the router's IP to this network in this case, and should be the next hop for the calculating router.
    // The interface is derived from the parent's next hop.
    if (!v.nextHops[0]) {
      console.error(
        "Unexpectedly found parent's next hops to not be calculated."
      );
      return [];
    }
    return w.lsa.body.links
      .filter((link) => new IPv4Address(...link.id.bytes).equals(v.vertexId))
      .map((link) => ({
        ipAddress: new IPv4Address(...link.data.bytes).toString(),
        interfaceId: v.nextHops[0].interfaceId,
      }));
  }
  console.error("No next hops found by the next hop calculating algorithm.");
  return [];
};

/**
 * Given the shortest path tree, the current vertex V (vertex), inspects the links belonging to the current vertex
 * and adds them to the candidate queue.
 * @param lsDb The LS DB of the root (calculating router)
 * @param tree The current shortest path tree
 * @param vNode The node most recently added to the shortest path tree
 * @param queue The current queue of potential additions to the shortest path tree
 */
const processRouterLinks = (
  lsDb: Record<string, LSA>,
  tree: Tree<TransitVertexData>,
  vNode: TreeNode<TransitVertexData>,
  queue: PriorityQueue<TreeNode<TransitVertexData>>
) => {
  const v = vNode.data;
  let { lsa: vLsa, vertexId: vId } = v;
  vId = new IPv4Address(...vId.bytes);
  const { body: vLsaBody } = vLsa as RouterLSA;
  const { links } = vLsaBody;
  for (let potentialW of links) {
    let { type, id: wRouterId, metric: vwCost } = potentialW;
    wRouterId = new IPv4Address(...wRouterId.bytes);
    if (type === RouterLinkType.Stub) {
      continue; // stub LSAs are dealt with in stage 2.
    }
    const wLsaKey = LsDb.getLsDbKey({
      advertisingRouter: wRouterId,
      linkStateId: wRouterId,
      lsType: LSType.RouterLSA,
    });
    const wRouterLsa = lsDb[wLsaKey];
    if (!wRouterLsa) {
      continue;
    }
    /**
     * Dummy vertex to check if the vertex already exists on the tree.
     */
    const potentialVertex = new TransitVertexData({
      vertexId: wRouterId,
      distance: Infinity,
      lsa: wRouterLsa,
      nextHops: [],
    });
    if (tree.has(potentialVertex)) {
      continue;
    }
    const { header: linkLsaHeader, body: linkedRouterLsaBody } = wRouterLsa;
    const { lsAge } = linkLsaHeader;
    const { links: linkedRouterLinks } = linkedRouterLsaBody;
    if (
      lsAge === MaxAge ||
      linkedRouterLinks.findIndex((link) =>
        new IPv4Address(...link.id.bytes).equals(vId)
      ) === -1
    ) {
      continue;
    }
    const wCost = v.distance + vwCost;
    const wNode = new TreeNode(
      new TransitVertexData({
        vertexId: wRouterId,
        distance: wCost,
        lsa: wRouterLsa,
        nextHops: [],
      }),
      [],
      vNode
    );
    const w = wNode.data;
    w.nextHops = calculateNextHops(tree.root, vNode, wNode);
    /**
     * Index of w on the queue. -1 if w does not exist on the queue.
     */
    const wQueueIdx = queue.queue.findIndex(
      ([candidate]) => candidate.data.toString() === w.toString()
    );
    if (wQueueIdx === -1) {
      // Vertex does not exist on the candidate queue, push it.
      queue.push([wNode, wCost]);
      continue;
    }
    const [wOnQueue, wCostOnQueue] = queue.at(wQueueIdx)!;
    if (wCost > wCostOnQueue) {
      // New path is costlier than the path calculated earlier.
      continue;
    }
    if (wCost === wCostOnQueue) {
      // Add new next hops
      wOnQueue.data.nextHops.push(...w.nextHops);
      !wOnQueue.parents.has(vNode) && wOnQueue.parents.add(vNode); // Add vNode to w on queue's parents.
      continue;
    }
    // Update the candidate's priority to be the new, smaller cost.
    wOnQueue.data.nextHops = w.nextHops; // Replace the next hops to reflect the smaller path
    wOnQueue.parents.clear();
    wOnQueue.parents.add(vNode);
    queue.updatePriority(wQueueIdx, wCost);
  }
};

const initTree = (routerId: IPv4Address, lsDb: Record<string, LSA>) => {
  const selfRouterLsaKey = LsDb.getLsDbKey({
    advertisingRouter: routerId,
    linkStateId: routerId,
    lsType: LSType.RouterLSA,
  });
  const selfRouterLsa = lsDb[selfRouterLsaKey] as RouterLSA;
  if (!selfRouterLsa) {
    return null;
  }
  const table: RoutingTableRow[] = [];
  const queue: PriorityQueue<TreeNode<TransitVertexData>> =
    PriorityQueueFactory(CANDIDATE_LIST_DEGREE);
  const rootData = new TransitVertexData({
    vertexId: routerId,
    lsa: selfRouterLsa,
    distance: 0,
    nextHops: [],
  });
  const shortestPathTree = new Tree<TransitVertexData>(rootData);
  processRouterLinks(lsDb, shortestPathTree, shortestPathTree.root, queue);
  return { shortestPathTree, queue, table };
};

const calculateIntraAreaTable = (
  areaId: number,
  routerId: IPv4Address,
  routerInterfaces: Set<string>,
  lsDb: Record<string, LSA>
) => {
  const init = initTree(routerId, lsDb);
  if (!init) {
    return init;
  }
  // Stage 1 - Looking for routes to ABRs, AS BRs, and networks.
  const { shortestPathTree, queue, table } = init;
  while (queue.length() > 0) {
    const vNode = queue.shift();
    if (!vNode || !vNode.parents.size) {
      break;
    }
    const { lsa: vLsa, nextHops, distance: cost, vertexId: vId } = vNode.data;
    if (vLsa?.body?.b || vLsa?.body?.e) {
      // If the vertex just added is an ABR or AS-BR, add it to the table
      table.push(
        new RoutingTableRow({
          destType: "router",
          area: areaId,
          cost,
          destinationId: vId,
          linkStateOrigin: vLsa,
          nextHops,
          pathType: "intra-area",
        })
      );
    }
    /*
    Else If the newly added vertex is a transit network, the routing
    table entry for the network is located.  The entry's
    Destination ID is the IP network number, which can be
    obtained by masking the Vertex ID (Link State ID) with its
    associated subnet mask (found in the body of the associated
    network-LSA).  If the routing table entry already exists
    (i.e., there is already an intra-area route to the
    destination installed in the routing table), multiple
    vertices have mapped to the same IP network.  For example,
    this can occur when a new Designated Router is being
    established.  In this case, the current routing table entry
    should be overwritten if and only if the newly found path is
    just as short and the current routing table entry's Link
    State Origin has a smaller Link State ID than the newly
    added vertex' LSA.
    */
    shortestPathTree.insertNode(vNode);
    processRouterLinks(lsDb, shortestPathTree, vNode, queue);
  }
  // Stage 2 - Adding stub links
  for (let vNode of shortestPathTree.bfsTraversal()) {
    const { data } = vNode;
    const { lsa: vLsa, distance: vCost } = data;
    const { header, body } = vLsa;
    if (header.lsType !== LSType.RouterLSA) {
      continue;
    }
    const { links } = body;
    links
      .filter((link) => link.type === RouterLinkType.Stub)
      .forEach((link) => {
        const { metric: linkCost, id: linkId, data: wMask } = link;
        const cost = vCost + linkCost;
        const wId = new IPv4Address(...linkId.bytes);
        if (routerInterfaces.has(wId.toString())) {
          return;
        }
        const w = new TransitVertexData({
          vertexId: wId,
          distance: cost,
          lsa: vLsa,
          nextHops: [],
        });
        const wNode = new TreeNode<TransitVertexData>(w, [], vNode);
        const existingEntryIdx = table.findIndex((entry) =>
          isRoutingTableEntryIdentical(entry, areaId, wId, wMask, "intra-area")
        );
        const wEntry = new RoutingTableRow({
          area: areaId,
          cost,
          destinationId: wId,
          destType: "network",
          linkStateOrigin: vLsa,
          nextHops: calculateNextHops(shortestPathTree.root, vNode, wNode),
          pathType: "intra-area",
          addressMask: new IPv4Address(...wMask.bytes),
        });
        if (existingEntryIdx === -1) {
          table.push(wEntry);
          return;
        }
        const existingEntry = table[existingEntryIdx];
        if (cost < existingEntry.cost) {
          table.splice(existingEntryIdx, 1);
          table.push(wEntry);
          return;
        } else if (cost === existingEntry.cost) {
          console.warn(
            `For root ${routerId}, Equal cost found to network ${wEntry.destinationId}, through ${vNode.data.vertexId}`
          );
          existingEntry.nextHops.push(
            ...calculateNextHops(shortestPathTree.root, vNode, wNode)
          );
        }
      });
  }
  // Stage 3 - Adding Inter area routes
  return { tree: shortestPathTree, table };
};

/**
 * Given an areaId, the LS DB for the given area ID, and the previous table of that area.
 * @param e An object containing an areaId, the LS DB for the given area ID, and the previous table of that area.
 */
self.onmessage = async function (e: MessageEvent<TableCalculationSources>) {
  const { routerId: routerIdStr, lsDb, areaId, routerInterfaces } = e.data;
  const routerId = IPv4Address.fromString(routerIdStr);
  const init = calculateIntraAreaTable(
    areaId,
    routerId,
    new Set(routerInterfaces),
    lsDb
  );
  if (!init) {
    console.error("No root node found for intra area table calculation");
    self.postMessage({ areaId });
    return;
  }
  const { table, tree } = init;
  self.postMessage(JSON.parse(JSON.stringify({ areaId, table, tree })));
};
