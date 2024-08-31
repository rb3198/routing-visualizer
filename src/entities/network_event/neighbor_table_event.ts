import { emitEvent, openNeighborTableModal } from "src/action_creators";
import { Router } from "../router";
import { NetworkEventBase, NetworkEventLink } from "./base";
import { NetworkEventType } from "./network_event_type";
import { store } from "src/store";

export type NeighborTableEventType = "added" | "deleted";

export class NeighborTableEvent extends NetworkEventBase {
  router: Router;
  affectedNeighborId: string;
  changeType: NeighborTableEventType;
  description: string;
  constructor(
    router: Router,
    affectedNeighborId: string,
    changeType: NeighborTableEventType,
    description: string
  ) {
    super(NetworkEventType.ospfNeighborTable, []);
    this.router = router;
    this.affectedNeighborId = affectedNeighborId;
    this.changeType = changeType;
    this.description = description;
    this.links = [
      {
        label: "View Table",
        onClick: () => {
          store.dispatch(openNeighborTableModal(this));
        },
      },
    ];
  }

  get message() {
    return `<b>Router ID ${
      this.router.id
    }'s Neighbor Table Updated</b>:<br>Router ${this.affectedNeighborId} <i>${
      this.changeType === "added" ? "added to" : "deleted from"
    }</i> the OSPF Neighbor Table.`;
  }
}
