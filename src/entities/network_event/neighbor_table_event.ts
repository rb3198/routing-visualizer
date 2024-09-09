import { openNeighborTableSnapshot } from "src/action_creators";
import { Router } from "../router";
import { NetworkEventBase } from "./base";
import { NetworkEventType } from "./network_event_type";
import { store } from "src/store";
import { IPv4Address } from "../ip/ipv4_address";
import { NeighborTableRow } from "../ospf/tables";

export type NeighborTableEventType = "added" | "deleted" | "column_updated";

export class NeighborTableEvent extends NetworkEventBase {
  timestamp: number;
  routerId: IPv4Address;
  /**
   * The ID of the neighbor that was added / deleted, or whose column was updated.
   */
  affectedNeighborId: string;
  /**
   * The table snapshot before this event occurred.
   */
  prevTable: Record<string, NeighborTableRow>;
  /**
   * The table snapshot after this event occurred.
   */
  neighborTable: Record<string, NeighborTableRow>;
  eventType: NeighborTableEventType;
  affectedColumns: Set<keyof NeighborTableRow>;
  description: string;
  constructor(
    timestamp: number,
    prevTable: Record<string, NeighborTableRow>,
    router: Router,
    affectedNeighborId: string,
    eventType: NeighborTableEventType,
    description: string
  ) {
    super(NetworkEventType.ospfNeighborTable, []);
    this.timestamp = timestamp;
    this.routerId = router.id;
    this.neighborTable = {};
    this.prevTable = {};
    this.affectedColumns = new Set();
    for (const [neighborId, neighborRow] of Object.entries(prevTable)) {
      this.prevTable[neighborId] = { ...neighborRow };
    }
    for (const [neighborId, neighborRow] of Object.entries(
      router.ospf.neighborTable
    )) {
      this.neighborTable[neighborId] = { ...neighborRow };
    }
    this.affectedNeighborId = affectedNeighborId;
    this.eventType = eventType;
    this.links = [
      {
        label: "View Table Snapshot",
        onClick: () => {
          store.dispatch(openNeighborTableSnapshot(this));
        },
      },
    ];
    this.description = description;
    this.constructAffectedColumns();
  }

  private constructAffectedColumns = () => {
    if (this.eventType !== "column_updated") {
      return;
    }
    const prevRow = this.prevTable[this.affectedNeighborId];
    const row = this.neighborTable[this.affectedNeighborId];
    Object.entries(row).forEach(([key, value]) => {
      const prop = key as keyof NeighborTableRow;
      if (row[prop] !== prevRow[prop]) {
        this.affectedColumns.add(prop);
      }
    });
  };

  get message() {
    return `<b>Router ID ${this.routerId}'s Neighbor Table Updated</b>:<br>
    ${this.description}
    `;
  }
}
