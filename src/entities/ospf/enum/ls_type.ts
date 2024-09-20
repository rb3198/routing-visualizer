export enum LSType {
  /**
   * | Originated By | Describes | Flooded Through | Implemented?|
   * |:--------------|:----------|:----------------|:--------------|
   * | All Routers| Collected States of the router's interfaces | Single Area | Yes |
   */
  RouterLSA = 1,
  /**
   * | Originated By | Describes | Flooded Through | Implemented? |
   * |:--------------|:----------|:----------------|:-------------|
   * | Designated Router | List of routers in the network | Single Area | No |
   */
  NetworkLSA,
  /**
   * | Originated By | Describes | Flooded Through | Implemented? |
   * |:--------------|:----------|:----------------|:-------------|
   * | Area Border Routers | A route to a destination network outside the area | Single Area | Yes |
   */
  SummaryIpLSA,
  /**
   * | Originated By | Describes | Flooded Through | Implemented? |
   * |:--------------|:----------|:----------------|:-------------|
   * | Area Border Routers | A route to a destination Area Boundary Router (ABR) outside the area | Single Area | No |
   */
  SummaryAsBrLSA,
  /**
   * | Originated By | Describes | Flooded Through | Implemented? |
   * |:--------------|:----------|:----------------|:-------------|
   * | AS Boundary Routers | A route to a destination outside the AS | Throughout the AS | No |
   */
  ASExternalLSA,
}
