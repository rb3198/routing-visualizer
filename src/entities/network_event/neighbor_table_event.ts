import { openNeighborTableModal } from "src/action_creators";
import { Router } from "../router";
import { NetworkEventBase } from "./base";
import { NetworkEventType } from "./network_event_type";
import { store } from "src/store";
import { IPv4Address } from "../ip/ipv4_address";
import { NeighborTableRow } from "../ospf/tables";

export type NeighborTableEventType = "added" | "deleted";

export class NeighborTableEvent extends NetworkEventBase {
  timestamp: number;
  routerId: IPv4Address;
  affectedNeighborId: string;
  neighborTable: Record<string, NeighborTableRow>;
  changeType: NeighborTableEventType;
  description: string;
  constructor(
    timestamp: number,
    router: Router,
    affectedNeighborId: string,
    changeType: NeighborTableEventType,
    description: string
  ) {
    super(NetworkEventType.ospfNeighborTable, []);
    this.timestamp = timestamp;
    this.routerId = router.id;
    this.neighborTable = {};
    for (const [
      neighborId,
      neighborRow,
    ] of router.ospf.neighborTable.entries()) {
      this.neighborTable[neighborId] = { ...neighborRow };
    }
    this.affectedNeighborId = affectedNeighborId;
    this.changeType = changeType;
    this.description = description;
    this.links = [
      {
        label: "View Table Snapshot",
        onClick: () => {
          store.dispatch(openNeighborTableModal(this));
        },
      },
    ];
  }

  get message() {
    return `<b>Router ID ${
      this.routerId
    }'s Neighbor Table Updated</b>:<br>Router ${this.affectedNeighborId} <i>${
      this.changeType === "added" ? "added to" : "deleted from"
    }</i> the OSPF Neighbor Table.`;
  }
}
