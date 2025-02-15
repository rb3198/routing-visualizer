export type NetworkEventLink = { label: string; onClick: () => any };

let i = 0;

export class NetworkEvent {
  timestamp: number;
  router: string;
  title: string;
  questions: string[];
  actionLine?: string;
  actions: string[];
  links: NetworkEventLink[];
  id: string;
  constructor({
    timestamp,
    router,
    title,
    questions,
    actionLine,
    actions,
    links,
  }: Omit<NetworkEvent, "id">) {
    this.id = `${timestamp}_${i++}`;
    this.timestamp = timestamp;
    this.router = router;
    this.title = title;
    this.questions = questions;
    this.actionLine = actionLine;
    this.actions = actions;
    this.links = links;
  }
}
