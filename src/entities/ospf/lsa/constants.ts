export const InitialSequenceNumber = -(2 ** 31) + 1;
export const MaxSequenceNumber = 2 ** 31 - 1;

/**
 * The maximum time between distinct originations of any particular LSA.
 *
 * If the LS age field of one of the router's self-originated LSAs reaches the value `LSRefreshTime`,
 * a new instance of the LSA is originated, even though the contents of the LSA (apart from the LSA header) will be the same.
 *
 * The LS Refresh Time in OSPF is always 1,800,000 ms, i.e. 30 minutes.
 */
export const LSRefreshTime = 1800000;

/**
 * The minimum time between distinct originations of any particular LSA.
 *
 * 5,000 ms i.e. 5s by default.
 */
export const MinLSInterval = 5000;

/**
 * The maximum age that an LSA can attain. When an LSA's LS age field reaches MaxAge,
 * it is re-flooded in an attempt to flush the LSA from the routing domain.
 *
 * The `MaxAge` is always 1 hour.
 */
export const MaxAge = 3600000;

/**
 * The maximum time dispersion that can occur, as an LSA is flooded throughout the AS. 
 * Most of this time is accounted for by the LSAs sitting on router output queues (and therefore not aging) during the flooding process.  
    
 * The value of `MaxAgeDiff` is set to 15 minutes.
 */
export const MaxAgeDiff = 15 * 60000;

/**
 * The metric value indicating that the destination described by an LSA is unreachable.
 * Used in summary-LSAs and AS-external-LSAs as an alternative to premature aging.
 * Set to 24 bits of all 1s.
 */
export const LSInfinity = 0xffffff;
