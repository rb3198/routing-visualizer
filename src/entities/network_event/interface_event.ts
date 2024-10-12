import { Router } from "../router";
import { NetworkEventBase, NetworkEventCallback } from "./base";
import { NetworkEventType } from "./network_event_type";

export class InterfaceNetworkEvent extends NetworkEventBase {
  private interfaceEventType: "added" | "destroyed";
  private router: Router;
  constructor(
    type: "added" | "destroyed",
    router: Router,
    callback?: NetworkEventCallback
  ) {
    super(NetworkEventType.interface, [], callback);
    this.interfaceEventType = type;
    this.router = router;
  }

  public override get message(): string {
    const { id, turnedOn, ospf } = this.router;
    const { config } = ospf;
    const { helloInterval } = config;
    switch (this.interfaceEventType) {
      case "added":
        return `<b>Interface added to the router with ID ${id.toString()}</b>.<br> 
                The router ${
                  turnedOn === true ? "" : ", when turned on,"
                } will now send Hello Packets to this interface every <i>helloInterval</i>
                (${
                  helloInterval / 1000
                }) seconds to indicate that its alive to a potential neighbor.`;
      case "destroyed":
        return `Interface destroyed. Any neighbors formed through this interface will take notice soon due to lack of hello packets and re-adjust their routing tables.
`;
      default:
        break;
    }
    return "";
  }
}
