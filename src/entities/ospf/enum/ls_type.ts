export enum LSType {
  /**
   * | Originated By | Describes | Flooded Through |
   * |:--------------|:----------|:----------------|
   * | All Routers| Collected States of the router's interfaces | Single Area |
   */
  RouterLSA = 1,
  /**
   * | Originated By | Describes | Flooded Through |
   * |:--------------|:----------|:----------------|
   * | Designated Router | List of routers in the network | Single Area |
   */
  NetworkLSA,
  /**
   * | Originated By | Describes | Flooded Through |
   * |:--------------|:----------|:----------------|
   * | Area Border Routers | A route to a destination network outside the area | Single Area |
   */
  SummaryIpLSA,
  /**
   * | Originated By | Describes | Flooded Through |
   * |:--------------|:----------|:----------------|
   * | Area Border Routers | A route to a destination Area Boundary Router (ABR) outside the area | Single Area |
   */
  SummaryAsBrLSA,
  /**
   * | Originated By | Describes | Flooded Through |
   * |:--------------|:----------|:----------------|
   * | AS Boundary Routers | A route to a destination outside the AS | Throughout the AS |
   */
  ASExternalLSA,
}
