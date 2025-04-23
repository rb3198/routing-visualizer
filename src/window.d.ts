declare global {
  interface Window {
    areaLayer?: HTMLCanvasElement | null;
    gridComponentLayer?: HTMLCanvasElement | null;
    elementLayer?: HTMLCanvasElement | null;
    routerConnectionLayer?: HTMLCanvasElement | null;
    iconLayer?: HTMLCanvasElement | null;
    zoom?: number;
    canvasOffset?: [number, number];
    cellSize?: number;
  }
}

export {};
