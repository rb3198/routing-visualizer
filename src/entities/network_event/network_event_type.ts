export enum NetworkEventType {
  /**
   * Events affecting an IP interface
   *
   * **Example**: IP interface created / destroyed.
   */
  interface,
  /**
   * Events pertaining to routers
   *
   * **Example**: Router turns on / is shut down.
   */
  router,
  /**
   * Events pertaining to packets
   *
   * **Example**: Packet sent / received / dropped.
   */
  packet,
  /**
   * OSPF Events
   */
  ospf,
}
