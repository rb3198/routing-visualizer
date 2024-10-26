import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { LSType, State } from "src/entities/ospf/enum";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import {
  LSRefreshTime,
  MaxAge,
  MinLSInterval,
} from "src/entities/ospf/lsa/constants";
import { OSPFInterface } from ".";
import { NeighborSMEvent } from "src/entities/ospf/enum/state_machine_events";
import { NeighborTableRow } from "src/entities/ospf/table_rows";
import { copyLsa } from "src/utils/common";

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
    const key = this.getLsDbKey(header);
    return !!(this.db[areaId] && this.db[areaId][key]);
  };

  /**
   * Given a partial LSA Header, figures out its unique identity
   * @param header
   * @returns
   */
  private getLsDbKey = (header: LsId) => {
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
          this.floodLsa(areaId, lsa);
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
        default:
          // TODO Summary LSAs
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
    const lsKey = this.getLsDbKey(header);
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
    const key = this.getLsDbKey({
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

  removeOldLsaFromRetransmissionLists = (oldCopy: LSA) => {
    const { neighborTable, setNeighbor } = this.ospfInterface;
    Object.values(neighborTable).forEach((neighbor) => {
      const { linkStateRetransmissionList, routerId: neighborId } = neighbor;
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
   * @param lsa
   * @param receivedFrom The ID of the Neighbor that this LSA was received from. `undefined` if self-originated LSA.
   */
  floodLsa = (areaId: number, lsa: LSA, receivedFrom?: IPv4Address) => {
    const { neighborTable, config, setNeighbor, sendLSUpdatePacket } =
      this.ospfInterface;
    const { rxmtInterval } = config;
    console.log(
      `Router ID ${this.ospfInterface.router.id}, setting LSA: ${lsa.header.advertisingRouter} of type ${lsa.header.lsType}`
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
      if (this.updateNeighborLsRequestList(neighbor, lsa)) {
        continue;
      }
      if (receivedFrom && neighborId.equals(receivedFrom)) {
        continue;
      }
      linkStateRetransmissionList.push(copyLsa(lsa));
      setNeighbor(
        {
          ...neighbor,
          lsRetransmissionRxmtTimer:
            lsRetransmissionRxmtTimer ??
            setTimeout(() => sendLSUpdatePacket(neighborId), rxmtInterval),
          linkStateRetransmissionList,
        },
        `LSA added to neighbor ${neighborId}'s retransmission list`
      );
      console.log(
        `LSA ${lsa.header.advertisingRouter} of type ${
          lsa.header.lsType
        } added to neighbor ${neighborId}'s retransmission list in state ${
          Object.keys(State)[Object.values(State).indexOf(state)]
        }`
      );
      !lsRetransmissionRxmtTimer && sendLSUpdatePacket(neighborId);
    }
  };

  installLsa = (
    areaId: number,
    lsa: LSA,
    receivedFrom?: IPv4Address,
    flood?: boolean
  ) => {
    const { header } = lsa;
    const key = this.getLsDbKey(header);
    const oldCopy = this.getLsa(areaId, header);
    oldCopy && this.removeOldLsaFromRetransmissionLists(oldCopy);
    lsa.updatedOn = Date.now();
    this.db[areaId][key] = lsa;
    flood && this.floodLsa(areaId, lsa, receivedFrom);
    // TODO: Compare the bodies of the old and new copies. Calculate routing tables on LSA change.
    const isDifferent = !!oldCopy;
    if (isDifferent) {
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
        } else {
          delete areaDb[this.getLsDbKey(header)];
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
        console.log("Waiting before generating a new router LSA.");
        setTimeout(originateLsa, MinLSInterval - timeSinceInception);
      } else {
        originateLsa();
      }
    }
  };

  clearDb = async (graceful?: boolean) => {
    const { router } = this.ospfInterface;
    const { id: routerId } = router;
    if (graceful) {
      const routerLsaKey = this.getLsDbKey({
        advertisingRouter: routerId,
        lsType: LSType.RouterLSA,
        linkStateId: routerId,
      });
      // Flood MaxAged self-originated router LSAs.
      for (let [areaId, areaDb] of Object.entries(this.db)) {
        const routerLsa = areaDb[routerLsaKey];
        routerLsa.header.lsAge = MaxAge;
        this.floodLsa(parseInt(areaId), routerLsa);
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
