import { LSAHeader } from "./header";
import { RouterLSABody } from "./router_lsa";

export { LSAHeader } from "./header";
export abstract class LSA {
  header: LSAHeader;
  abstract body: RouterLSABody;
  constructor(header: LSAHeader) {
    this.header = header;
  }
}
