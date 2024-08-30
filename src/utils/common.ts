/**
 * Gets key of object given a value belonging to the object.
 * @param obj
 * @param value
 * @returns
 */
export const getKey = <T extends Object>(obj: T, value: any) => {
  return Object.keys(obj)[Object.values(obj).indexOf(value)];
};
