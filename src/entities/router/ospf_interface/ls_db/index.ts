import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import { Router } from "../..";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import { LSType } from "src/entities/ospf/enum";
import { IPv4Address } from "src/entities/ip/ipv4_address";

export class LsDb {
  /**
   * A Map of Area ID --> List of LSAs received from routers belonging to that area.
   */
  db: Record<number, Record<string, LSA>>;

  agingTimer: NodeJS.Timeout;

  router: Router;

  constructor(router: Router) {
    this.db = {};
    this.router = router;
    this.agingTimer = setInterval(this.ageLSAs, 1000);
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
  private getLsDbKey = (header: {
    lsType: LSType;
    linkStateId: IPv4Address;
    advertisingRouter: IPv4Address;
  }) => {
    const { lsType, linkStateId, advertisingRouter } = header;
    return `${lsType}_${linkStateId}_${advertisingRouter}`;
  };

  /**
   * Ages all the LSAs in the DB by 1 second, every second.
   */
  private ageLSAs = () => {
    Object.keys(this.db).forEach((areaIdStr) => {
      const areaId = parseInt(areaIdStr);
      const areaDb = this.db[areaId];
      Object.keys(areaDb).forEach((lsaKey) => {
        const lsa = areaDb[lsaKey];
        const { header } = lsa;
        const { lsAge } = header;
        this.db = {
          ...this.db,
          [areaId]: {
            ...this.db[areaId],
            [lsaKey]: {
              ...lsa,
              header: {
                ...header,
                lsAge: lsAge + 1,
              },
            },
          },
        };
      });
    });
  };

  clearTimers = () => {
    clearInterval(this.agingTimer);
  };

  startTimers = () => {
    this.agingTimer = setInterval(this.ageLSAs, 1000);
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
  getLsa = (areaId: number, header: LSAHeader) => {
    const lsKey = this.getLsDbKey(header);
    return (this.db[areaId] && this.db[areaId][lsKey]) || undefined;
  };

  /**
   * Gets all the LSAs corresponding to the Area ID given in the params.
   * @param areaId
   * @returns
   */
  getAreaLsaList = (areaId: number) => {
    return this.db[areaId] ? Object.values(this.db[areaId]) : [];
  };

  /**
   * If a previous instance of a router LSA exists in that area, creates a new Router LSA on the basis of the
   * `LsSeqNumber` of the previous Router LSA. Else, creates a brand new Router LSA.
   * @param areaId
   * @returns Router LSA for the attached router and the given area.
   */
  private getRouterLsa = (areaId: number) => {
    const key = this.getLsDbKey({
      lsType: LSType.RouterLSA,
      linkStateId: this.router.id,
      advertisingRouter: this.router.id,
    });
    const oldRouterLsa = this.db[areaId] && this.db[areaId][key];
    const { header } = oldRouterLsa || {};
    const { lsSeqNumber } = header || {};
    return new RouterLSA(
      this.router,
      areaId,
      lsSeqNumber ? lsSeqNumber + 1 : undefined
    );
  };

  /**
   * Modifies the LS DB and floods the change.
   * @param areaId
   * @param lsa
   */
  setLsDb = (areaId: number, lsa: LSA) => {
    const { header } = lsa;
    const key = this.getLsDbKey(header);
    this.db = {
      ...this.db,
      [areaId]: {
        ...this.db[areaId],
        [key]: lsa,
      },
    };
    // TODO: Flood this LSA in that area.
  };

  originateRouterLsa = (areaId: number) => {
    const areaExists = !!this.db[areaId];
    if (!areaExists) {
      this.db[areaId] = {};
      // A new area will be added, originate the router LSA for each area ID and flood it.
      // (The B bit will change in the new LSA)
      Object.keys(this.db).forEach((areaIdKey) => {
        const areaId = parseInt(areaIdKey);
        const routerLsa = this.getRouterLsa(areaId);
        this.setLsDb(areaId, routerLsa);
      });
    } else {
      const routerLsa = this.getRouterLsa(areaId);
      this.setLsDb(areaId, routerLsa);
    }
  };
}
