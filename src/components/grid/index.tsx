import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "./style.module.css";
import { Rect } from "../canvas/Rect";
import { debounce } from "../../utils/ui";
interface GridProps {}

const GRID_SIZE = 50;

const drawGrid = (container?: HTMLCanvasElement | null) => {
  if (!container) {
    return [];
  }
  const { width: containerWidth, height: containerHeight } =
    container.getBoundingClientRect();
  const width = containerWidth / GRID_SIZE;
  const height = width;
  const context = container.getContext("2d");
  if (!context) {
    return [];
  }
  const grid: Rect[][] = new Array(GRID_SIZE)
    .fill(0)
    .map(() => new Array(GRID_SIZE).fill(null));
  context.clearRect(0, 0, containerWidth, containerHeight);
  context.strokeStyle = "grey";
  context.lineWidth = 1;
  context.fillStyle = "transparent";
  let y = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    let x = 0;
    for (let col = 0; col < GRID_SIZE; col++) {
      if (y + height > containerHeight) {
        break;
      }
      const cell = new Rect(x, y, height, width);
      grid[row][col] = cell;
      cell.draw(context);
      x += width;
    }
    y += height;
  }
  return grid;
};

export const Grid: React.FC<GridProps> = (props) => {
  const [grid, setGrid] = useState<Rect[][]>([]);
  const containerRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const onResize = debounce(() => {
      const { documentElement } = document;
      const { clientHeight, clientWidth } = documentElement;
      if (containerRef.current) {
        containerRef.current.height = 0.8 * clientHeight;
        containerRef.current.width = clientWidth;
        setGrid(drawGrid(containerRef.current));
      }
    }, 100);
    if (containerRef.current) {
      window.onresize = onResize;
      onResize();
    }
    return () => {
      window && window.removeEventListener("resize", onResize);
    };
  }, []);

  if (!document) {
    return null;
  }

  return <canvas id={styles.container} ref={containerRef}></canvas>;
};
