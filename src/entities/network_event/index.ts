export type NetworkEventLink = { label: string; onClick: () => any };

let i = 0;

export class NetworkEvent {
  timestamp: number;
  router: string;
  title: string;
  actions: string[];
  links: NetworkEventLink[];
  id: string;
  constructor({
    timestamp,
    router,
    title,
    actions,
    links,
  }: Omit<NetworkEvent, "id">) {
    this.id = `${timestamp}_${i++}`;
    this.timestamp = timestamp;
    this.router = router;
    this.title = title;
    this.actions = actions;
    this.links = links;
  }
}
