import { NetworkEventType } from "./network_event_type";

let i = 0;

export type NetworkEventCallback = (...args: any) => Promise<unknown> | unknown;

export type NetworkEventLink = { label: string; onClick: () => any };
export abstract class NetworkEventBase {
  id: string;
  /**
   * Type of the event
   */
  type: NetworkEventType;
  /**
   * Optional callback to be fired on the occurrence of the event.
   */
  callback?: NetworkEventCallback;

  links: NetworkEventLink[];
  abstract get message(): string;
  constructor(
    type: NetworkEventType,
    links?: NetworkEventLink[],
    callback?: NetworkEventCallback
  ) {
    this.id = `${Date.now()}_${i}`;
    i++;
    this.type = type;
    this.callback = callback;
    this.links = links || [];
  }
}
