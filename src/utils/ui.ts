export const debounce = (func: Function, wait: number) => {
  let timeout: number | undefined;
  return (...args: any[]) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};
