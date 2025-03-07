import { Router } from "src/entities/router";
import { NetworkEvent } from "../..";
import { RouterPowerState } from "src/entities/router/enum/RouterPowerState";

export function InterfaceEventBuilder(
  router: Router,
  type: "added" | "destroyed",
  interfaceAddress: string
) {
  const { id, power, ospf } = router;
  const { config } = ospf;
  const { helloInterval } = config;
  const title =
    type === "added"
      ? `<b>Interface ${interfaceAddress} added to the router ${id}</b>`
      : `<b>Interface ${interfaceAddress} of router ${id} destroyed.</b>`;
  const actions = [];
  if (type === "added") {
    actions.push(`The router ${
      power === RouterPowerState.On ? "" : ", when turned on,"
    } will now send Hello Packets to this interface every <code>helloInterval</code>
        (${
          helloInterval / 1000
        }) seconds to indicate that its alive to a potential neighbor.`);
  } else {
    actions.push(
      `Any neighbors formed through this interface will take notice soon due to lack of hello packets and re-adjust their routing tables.`
    );
  }
  return new NetworkEvent({
    timestamp: Date.now(),
    title,
    questions: [],
    actions,
    links: [],
    router: id.toString(),
  });
}
