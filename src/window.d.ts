declare global {
  interface Window {
    gridComponentLayer?: HTMLCanvasElement | null;
    elementLayer?: HTMLCanvasElement | null;
    routerConnectionLayer?: HTMLCanvasElement | null;
  }
}

export {};
