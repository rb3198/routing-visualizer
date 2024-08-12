/**
 * Default hello interval in ms.
 */
export const DEFAULT_HELLO_INTERVAL = 10000;
export const getDeadInterval = (helloInterval: number) => 4 * helloInterval;
