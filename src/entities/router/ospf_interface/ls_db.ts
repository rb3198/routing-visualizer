import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { LSType, State } from "src/entities/ospf/enum";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import {
  LSInfinity,
  LSRefreshTime,
  MaxAge,
  MinLSInterval,
} from "src/entities/ospf/lsa/constants";
import { OSPFInterface } from ".";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { NeighborTableRow } from "src/entities/ospf/table_rows";
import { copyLsa, getAreaIp } from "src/utils/common";
import { SummaryLSA } from "src/entities/ospf/lsa/summary_lsa";
import { BACKBONE_AREA_ID } from "src/entities/ospf/constants";
import { RoutingTable } from "src/entities/ospf/table_rows/routing_table_row";

export type LsId = {
  lsType: LSType;
  linkStateId: IPv4Address;
  advertisingRouter: IPv4Address;
};

export class LsDb {
  /**
   * A Map of Area ID --> List of LSAs received from routers belonging to that area.
   */
  db: Record<number, Record<string, LSA>>;

  agingTimer?: NodeJS.Timeout;

  ospfInterface: OSPFInterface;

  constructor(ospfInterface: OSPFInterface) {
    this.db = {};
    this.ospfInterface = ospfInterface;
  }

  /**
   * Given an Area ID and a LSA header, checks if the LSA exists in the DB or not.
   * @param areaId
   * @param header
   * @returns `true` if the LSA exists, `false` otherwise.
   */
  lsaExists = (areaId: number, header: LSAHeader) => {
    const key = LsDb.getLsDbKey(header);
    return !!(this.db[areaId] && this.db[areaId][key]);
  };

  /**
   * Given a partial LSA Header, figures out its unique identity
   * @param header
   * @returns
   */
  static getLsDbKey = (header: LsId) => {
    const { lsType, linkStateId, advertisingRouter } = header;
    return `${lsType}_${linkStateId}_${advertisingRouter}`;
  };

  /**
   * Ages all the LSAs in the DB by 1 second, every second.
   *
   * Refreshes the LSA if required.
   */
  private ageLSAs = () => {
    const { router } = this.ospfInterface;
    const { id: routerId } = router;
    const toRefresh: { areaId: number; lsa: LSA }[] = [];
    Object.keys(this.db).forEach((areaIdStr) => {
      const areaId = parseInt(areaIdStr);
      const areaDb = this.db[areaId];
      Object.keys(areaDb).forEach((lsaKey) => {
        const lsa = areaDb[lsaKey];
        const { header } = lsa;
        const { lsAge, advertisingRouter } = header;
        if (lsAge === MaxAge) {
          return;
        }
        header.lsAge += 1;
        const newLsAge = header.lsAge;
        if (
          newLsAge % LSRefreshTime === 0 &&
          advertisingRouter.equals(routerId)
        ) {
          // Time to refresh the LSA
          toRefresh.push({ areaId, lsa });
        }
        if (newLsAge === MaxAge) {
          // Flood this LSA out. When receiving ACKs, check if no retransmission list contains this LSA.
          // If not, delete the LSA from the DB.
          this.floodLsa(areaId, [lsa], []);
        }
      });
    });
    toRefresh.forEach(({ areaId, lsa }) => {
      const { header } = lsa;
      const { lsType } = header;
      // TODO: Emit event saying "Refreshing LSA."
      switch (lsType) {
        case LSType.RouterLSA:
          this.originateRouterLsa(areaId, true);
          break;
        case LSType.SummaryIpLSA:
        case LSType.SummaryAsBrLSA:
          this.originateSummaryLsas(areaId);
          break;
        default:
          break;
      }
    });
    this.agingTimer = setTimeout(this.ageLSAs, 1000);
  };

  clearTimers = () => {
    clearTimeout(this.agingTimer);
    this.agingTimer = undefined;
  };

  startTimers = () => {
    this.agingTimer = setTimeout(this.ageLSAs, 1000);
  };

  /**
   * Given an area ID, fetches the corresponding LS DB.
   * @param areaId The ID of the area whose LS DB is to be fetched.
   */
  getDb = (areaId: number) => {
    return this.db[areaId];
  };

  /**
   * Given an area ID and the old LSA instance, performs the LSA Lookup
   * @param areaId
   * @param lsKey
   */
  getLsa = (areaId: number, header: LsId): LSA | undefined => {
    const lsKey = LsDb.getLsDbKey(header);
    return (this.db[areaId] && this.db[areaId][lsKey]) || undefined;
  };

  /**
   * Gets all the LSAs corresponding to the Area ID given in the params.
   * @param areaId
   * @returns
   */
  getLsaListByArea = (areaId: number) => {
    return this.db[areaId] ? Object.values(this.db[areaId]) : [];
  };

  getAllLSAs = () => {
    const lsaList: LSA[] = [];
    Object.entries(this.db).forEach(([, lsaDb]) => {
      lsaList.push(...Object.values(lsaDb));
    });
    return lsaList;
  };

  /**
   * If a previous instance of a router LSA exists in that area, creates a new Router LSA on the basis of the
   * `LsSeqNumber` of the previous Router LSA. Else, creates a brand new Router LSA.
   * @param areaId
   * @returns Router LSA for the attached router and the given area.
   */
  private createRouterLsa = (areaId: number) => {
    const { router } = this.ospfInterface;
    const { id: routerId } = router;
    const key = LsDb.getLsDbKey({
      lsType: LSType.RouterLSA,
      linkStateId: routerId,
      advertisingRouter: routerId,
    });
    const oldRouterLsa = this.db[areaId] && this.db[areaId][key];
    const { header } = oldRouterLsa || {};
    const { lsSeqNumber } = header || {};
    return RouterLSA.fromRouter(
      router,
      areaId,
      lsSeqNumber ? lsSeqNumber + 1 : undefined
    );
  };

  removeOldLsaFromRetransmissionLists = (areaId: number, oldCopy: LSA) => {
    const { neighborTable, setNeighbor } = this.ospfInterface;
    Object.values(neighborTable).forEach((neighbor) => {
      const {
        linkStateRetransmissionList,
        routerId: neighborId,
        areaId: neighborAreaId,
      } = neighbor;
      if (neighborAreaId !== areaId) {
        return;
      }
      const newRetransmissionList = linkStateRetransmissionList.filter(
        (lsa) => !lsa.isInstanceOf(oldCopy)
      );
      setNeighbor(
        {
          ...neighbor,
          linkStateRetransmissionList: newRetransmissionList,
        },
        `
        <ul>
        <li>Removed the stale LSA copy from neighbor ${neighborId}'s Link State Retransmission List.</li>
        ${
          !newRetransmissionList.length
            ? "<li>Cleared the associated timer to send LSAs, since none were left.</li>"
            : ""
        }
        </ul>
        `
      );
    });
  };

  /**
   * Modifies the LS DB and floods the change.
   * @param areaId
   * @param lsa
   */

  /**
   * Given a received LSA and the corresponding neighbor, updates the associated Link State Request List
   * if the neighbor is in a state < `FULL` and the exact (or an older) instance was requested to the neighbor.
   * @param neighbor
   * @param lsa
   * @returns `true` if the flooding process should go to the next neighbor,
   * `false` if the flooding process should continue processing the current neighbor.
   */
  private updateNeighborLsRequestList = (
    neighbor: NeighborTableRow,
    lsa: LSA
  ) => {
    const { state, linkStateRequestList, routerId: neighborId } = neighbor;
    const { header } = lsa;
    const { setNeighbor, neighborStateMachine } = this.ospfInterface;
    /**
     * LSA that was previously requested to the neighbor, before getting the current LSA (passed to this function)
     */
    const requestedLsa = linkStateRequestList.find((neighborLsa) =>
      neighborLsa.isInstanceOf(lsa)
    );
    if (!requestedLsa || state === State.Full) {
      return false;
    }
    if (header.compareAge(requestedLsa) > 0) {
      // New LSA is less recent (older) than the one in the request list of the neighbor. The list won't be truncated.
      return true;
    }
    const newLinkStateRequestList = linkStateRequestList.filter(
      (neighborLsa) => !neighborLsa.isInstanceOf(lsa)
    );
    setNeighbor(
      {
        ...neighbor,
        linkStateRequestList: newLinkStateRequestList,
      },
      `Received a requested LSA from the network. Neighbor ${neighborId} Updated with the new link state request list.`
    );
    if (!newLinkStateRequestList.length) {
      neighborStateMachine(neighborId.toString(), NeighborSMEvent.LoadingDone);
    }
    return true;
  };

  /**
   * Floods a given LSA in the given Area.
   * @param areaId
   * @param lsas
   * @param receivedFrom The ID of the Neighbor that this LSA was received from. `undefined` if self-originated LSA.
   */
  floodLsa = (
    areaId: number,
    lsas: LSA[],
    receivedFrom: (IPv4Address | undefined)[]
  ) => {
    const { neighborTable, config, setNeighbor, sendLSUpdatePacket } =
      this.ospfInterface;
    const { rxmtInterval } = config;
    console.log(
      `Router ID ${this.ospfInterface.router.id}, setting LSAs: [${lsas
        .map(
          (lsa) =>
            `adv Router: ${lsa.header.advertisingRouter}, type: ${lsa.header.lsType}`
        )
        .join(",")}`
    );
    for (const neighbor of Object.values(neighborTable)) {
      const {
        state,
        areaId: neighborAreaId,
        linkStateRetransmissionList,
        routerId: neighborId,
        lsRetransmissionRxmtTimer,
      } = neighbor;
      if (state < State.Exchange || areaId !== neighborAreaId) {
        continue;
      }
      const lsasToAdvertise = lsas.filter((lsa, idx) => {
        const receivedFromIp = receivedFrom[idx];
        return (
          !this.updateNeighborLsRequestList(neighbor, lsa) &&
          (!receivedFromIp || !neighborId.equals(receivedFromIp))
        );
      });
      if (!lsasToAdvertise.length) {
        continue;
      }
      linkStateRetransmissionList.push(
        ...lsasToAdvertise.map((lsa) => copyLsa(lsa))
      );
      setNeighbor(
        {
          ...neighbor,
          lsRetransmissionRxmtTimer:
            lsRetransmissionRxmtTimer ??
            setTimeout(() => sendLSUpdatePacket(neighborId), rxmtInterval),
          linkStateRetransmissionList,
        },
        `LSAs added to neighbor ${neighborId}'s retransmission list`
      );
      lsasToAdvertise.forEach((lsa) =>
        console.log(
          `LSA ${lsa.header.advertisingRouter} of type ${
            lsa.header.lsType
          } seq # ${
            lsa.header.lsSeqNumber
          } added to neighbor ${neighborId}'s retransmission list in state ${
            Object.keys(State)[Object.values(State).indexOf(state)]
          }`
        )
      );
      !lsRetransmissionRxmtTimer && sendLSUpdatePacket(neighborId);
    }
  };

  installLsa = (
    areaId: number,
    lsa: LSA,
    receivedFrom?: IPv4Address,
    flood?: boolean,
    skipCalc?: boolean
  ) => {
    const { header } = lsa;
    const key = LsDb.getLsDbKey(header);
    const oldCopy = this.getLsa(areaId, header);
    oldCopy && this.removeOldLsaFromRetransmissionLists(areaId, oldCopy);
    lsa.updatedOn = Date.now();
    this.db[areaId][key] = lsa;
    flood && this.floodLsa(areaId, [lsa], [receivedFrom]);
    const isDifferent =
      !oldCopy || JSON.stringify(oldCopy.body) !== JSON.stringify(lsa.body);
    if (isDifferent && !skipCalc) {
      this.ospfInterface.routingTableManager.calculate(areaId);
    }
  };

  removeMaxAgeLsas = (areaId: number, maxAgeLsaList: LSA[]) => {
    const { neighborTable, router } = this.ospfInterface;
    if (!maxAgeLsaList || !maxAgeLsaList.length) {
      return;
    }
    const areaNeighbors = Object.values(neighborTable).filter(
      (neighbor) => neighbor.areaId === areaId
    );
    for (let maxAgeLsa of maxAgeLsaList) {
      let toDelete = true;
      const { header } = maxAgeLsa;
      const { advertisingRouter, lsType } = header;
      for (let neighbor of areaNeighbors) {
        const { linkStateRetransmissionList } = neighbor;
        for (let lsRetransmit of linkStateRetransmissionList) {
          if (lsRetransmit.equals(maxAgeLsa)) {
            toDelete = false;
            break;
          }
        }
        if (!toDelete) {
          break;
        }
      }
      if (toDelete) {
        const areaDb = this.db[areaId];
        if (
          advertisingRouter.equals(this.ospfInterface.router.id) &&
          router.turnedOn === true
        ) {
          lsType === LSType.RouterLSA && this.originateRouterLsa(areaId, true);
          // (lsType === LSType.SummaryIpLSA || lsType === LSType.SummaryAsBrLSA) && this.originateSummaryLsas() TODO
        } else {
          delete areaDb[LsDb.getLsDbKey(header)];
        }
      }
    }
  };

  originateRouterLsa = (areaId: number, flood?: boolean) => {
    const { router } = this.ospfInterface;
    const { id: routerId } = router;
    const areaExists = !!this.db[areaId];
    if (!areaExists) {
      this.db[areaId] = {};
      // A new area will be added, originate the router LSA for each area ID and flood it.
      // (The B bit will change in the new LSA)
      Object.keys(this.db).forEach((areaIdKey) => {
        const oAreaId = parseInt(areaIdKey);
        const routerLsa = this.createRouterLsa(oAreaId);
        this.installLsa(
          oAreaId,
          routerLsa,
          undefined,
          flood || oAreaId !== areaId
        );
      });
    } else {
      const existingRouterLsa = this.getLsa(areaId, {
        advertisingRouter: routerId,
        linkStateId: routerId,
        lsType: LSType.RouterLSA,
      });
      const originateLsa = () => {
        const routerLsa = this.createRouterLsa(areaId);
        this.installLsa(areaId, routerLsa, undefined, flood);
      };
      const timeSinceInception =
        existingRouterLsa && Date.now() - existingRouterLsa.createdOn;
      if (
        timeSinceInception &&
        timeSinceInception > 0 &&
        timeSinceInception < MinLSInterval
      ) {
        setTimeout(originateLsa, MinLSInterval - timeSinceInception);
      } else {
        originateLsa();
      }
    }
  };

  getAreaNetworkSummaryLsa = (areaId: number) => {
    const { routingTableManager, router } = this.ospfInterface;
    const { id: routerId } = router;
    const { tableMap } = routingTableManager;
    const table = tableMap[areaId] ?? [];
    const destinationId = getAreaIp(areaId);
    const addressMask = new IPv4Address(255, 255, 0, 0);
    const intraAreaRoutes = table
      .filter(
        ({ area, pathType }) => pathType === "intra-area" && area === areaId
      )
      .map((row) => row.cost);
    const maxCostToArea = intraAreaRoutes.length
      ? Math.max(...intraAreaRoutes)
      : LSInfinity;
    return new SummaryLSA(
      destinationId,
      routerId,
      LSType.SummaryIpLSA,
      addressMask,
      maxCostToArea
    );
  };

  getInterAreaLsas = (
    destAreaId: number,
    srcAreaRoutingTable: RoutingTable,
    onlyAdvertisedBySelf?: boolean
  ) => {
    const { router } = this.ospfInterface;
    const { id: routerId } = router;
    if (!this.db[destAreaId] || !srcAreaRoutingTable.length) {
      return new Set<string>();
    }
    const areaDb = this.db[destAreaId];
    const interAreaLsas = new Set<string>();
    for (const route of srcAreaRoutingTable) {
      const {
        pathType,
        advertisingRouter: advRouterBytes,
        destinationId,
      } = route;
      if (pathType !== "inter-area" || !advRouterBytes) {
        continue;
      }
      const destinationIp = new IPv4Address(...destinationId.bytes);
      const advertisingRouter = new IPv4Address(...advRouterBytes.bytes);
      if (onlyAdvertisedBySelf && !advertisingRouter.equals(routerId)) {
        continue;
      }
      const routeLsaKey = LsDb.getLsDbKey({
        advertisingRouter: routerId,
        linkStateId: destinationIp,
        lsType: LSType.SummaryIpLSA,
      });
      const lsa = areaDb[routeLsaKey];
      lsa && interAreaLsas.add(routeLsaKey);
    }
    return interAreaLsas;
  };

  /**
   * Originates Summary LSAs for the given area ID if the router is an Area Border Router (ABR).
   * @param sourceAreaId The ID of the area for which the summary LSAs are to be generated.
   * @returns
   */
  originateSummaryLsas = (sourceAreaId: number) => {
    const { routingTableManager, router } = this.ospfInterface;
    const { id: routerId } = router;
    if (Object.keys(this.db).length <= 1) {
      return; // do not originate any summary LSA if the router is not an ABR connected to multiple areas.
    }
    const { tableMap, prevTableMap } = routingTableManager;
    const table = tableMap[sourceAreaId];
    const prevTable = prevTableMap[sourceAreaId];
    if (!table) {
      console.error(
        `originateSummaryLsas called for an area whose DB doesn't exist with the router!`
      );
      return;
    }
    const destAreas = Object.keys(this.db)
      .map((areaId) => parseInt(areaId))
      .filter((areaId) => areaId !== sourceAreaId);
    for (const destArea of destAreas) {
      const routesToAdvertise: SummaryLSA[] = [];
      const routesToFlush: SummaryLSA[] = [];
      const intraAreaSummary = this.getAreaNetworkSummaryLsa(sourceAreaId);
      const existingAreaSummaryKey = LsDb.getLsDbKey({
        advertisingRouter: routerId,
        linkStateId: intraAreaSummary.header.linkStateId,
        lsType: LSType.SummaryIpLSA,
      });
      const existingAreaSummary =
        this.db[destArea] &&
        (this.db[destArea][existingAreaSummaryKey] as SummaryLSA);
      if (existingAreaSummary) {
        if (!SummaryLSA.isIdentical(intraAreaSummary, existingAreaSummary)) {
          intraAreaSummary.header.lsSeqNumber =
            existingAreaSummary.header.lsSeqNumber + 1;
          routesToAdvertise.push(intraAreaSummary);
        }
      } else {
        routesToAdvertise.push(intraAreaSummary);
      }
      if (sourceAreaId === BACKBONE_AREA_ID) {
        // advertise inter-area routes as well into other areas
        const prevInterAreaLsas = this.getInterAreaLsas(destArea, prevTable);
        const curInterAreaRoutes = table.filter(
          ({ pathType, destinationId }) =>
            pathType === "inter-area" &&
            destinationId.bytes[1] !== BACKBONE_AREA_ID + 1
        );
        // Compare the prev and current tables for inter area routes present
        // in the prev table but not in the current table. Age those summary LSAs accordingly.
        for (const interAreaRoute of curInterAreaRoutes) {
          const { destinationId, addressMask, cost } = interAreaRoute;
          const interAreaRouteLsa = new SummaryLSA(
            new IPv4Address(...destinationId.bytes),
            routerId,
            LSType.SummaryIpLSA,
            new IPv4Address(...addressMask!.bytes),
            cost
          );
          const interAreaRouteLsaKey = LsDb.getLsDbKey({
            advertisingRouter: routerId,
            linkStateId: interAreaRouteLsa.header.linkStateId,
            lsType: LSType.SummaryIpLSA,
          });
          if (prevInterAreaLsas.has(interAreaRouteLsaKey)) {
            const existingLsa = this.db[destArea][
              interAreaRouteLsaKey
            ] as SummaryLSA;
            if (!SummaryLSA.isIdentical(existingLsa, interAreaRouteLsa)) {
              interAreaRouteLsa.header.lsSeqNumber =
                existingLsa.header.lsSeqNumber + 1;
              routesToAdvertise.push(interAreaRouteLsa);
            }
            prevInterAreaLsas.delete(interAreaRouteLsaKey);
          } else {
            routesToAdvertise.push(interAreaRouteLsa);
          }
        }
        // Remaining LSAs in this set are now unreachable, since these were not found in the new table
        prevInterAreaLsas.forEach((lsaKey) => {
          const lsa = this.db[destArea][lsaKey] as SummaryLSA;
          lsa.header.lsAge = MaxAge;
          lsa.header.lsSeqNumber++;
          lsa.body.metric = LSInfinity;
          routesToFlush.push(lsa);
        });
      }
      const lsasToAdvertise = [...routesToFlush, ...routesToAdvertise];
      lsasToAdvertise.forEach((lsa) =>
        this.installLsa(destArea, lsa, undefined, false, true)
      );
      lsasToAdvertise.length && this.floodLsa(destArea, lsasToAdvertise, []);
    }
  };

  clearDb = async (graceful?: boolean) => {
    const { router } = this.ospfInterface;
    const { id: routerId } = router;
    if (graceful) {
      const routerLsaKey = LsDb.getLsDbKey({
        advertisingRouter: routerId,
        lsType: LSType.RouterLSA,
        linkStateId: routerId,
      });
      // Flood MaxAged self-originated router LSAs.
      for (let [areaId, areaDb] of Object.entries(this.db)) {
        const routerLsa = areaDb[routerLsaKey];
        routerLsa.header.lsAge = MaxAge;
        this.floodLsa(parseInt(areaId), [routerLsa], []);
      }
      await new Promise((resolve) => {
        const check = () => {
          let shouldResolve = true;
          for (let [, areaDb] of Object.entries(this.db)) {
            if (areaDb[routerLsaKey]) {
              shouldResolve = false;
              break;
            }
          }
          if (shouldResolve) {
            resolve(true);
          } else {
            setTimeout(check, 1000);
          }
        };
        setTimeout(check, 1000);
      });
    }
    this.db = {};
  };
}
