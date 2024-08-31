import { Router } from "../router";
import { NetworkEventBase, NetworkEventLink } from "./base";
import { NetworkEventType } from "./network_event_type";

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
    const link: NetworkEventLink = {
      label: "View Table",
      onClick: () => {}, // TODO: Open Neighbor Table Modal once created.
    };
    super(NetworkEventType.ospfNeighborTable, [link]);
    this.router = router;
    this.affectedNeighborId = affectedNeighborId;
    this.changeType = changeType;
    this.description = description;
  }

  get message() {
    return `<b>Router ID ${
      this.router.id
    }'s Neighbor Table Updated</b>:<br>Router ${this.affectedNeighborId} <i>${
      this.changeType === "added" ? "added to" : "deleted from"
    }</i> the OSPF Neighbor Table.`;
  }
}
