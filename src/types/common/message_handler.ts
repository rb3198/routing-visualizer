import { Router } from "../../entities/router";
import { TwoWayMap } from "../../utils/two_way_map";
import { IPv4Address } from "../../entities/ip/ipv4_address";

export type MessageHandler = (
  from: IPv4Address,
  to: IPv4Address,
  message: unknown,
  listeners: TwoWayMap<string, Router>,
  color: string,
  duration: number
) => any;
