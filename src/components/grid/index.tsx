import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "./style.module.css";
import { debounce } from "../../utils/ui";
import { Grid as GridEntity } from "../../entities/Grid";
interface GridProps {
  gridSize: number;
}

export const Grid: React.FC<GridProps> = (props) => {
  const { gridSize } = props;
  const containerRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<GridEntity>();
  useLayoutEffect(() => {
    const onResize = debounce(() => {
      const { documentElement } = document;
      const { clientHeight, clientWidth } = documentElement;
      if (containerRef.current) {
        containerRef.current.height = 0.8 * clientHeight;
        containerRef.current.width = clientWidth;
        if (!gridRef.current) {
          gridRef.current = new GridEntity(gridSize, containerRef);
        }
        gridRef.current.drawGrid();
      }
    }, 100);
    if (containerRef.current) {
      window.onresize = onResize;
      onResize();
    }
    return () => {
      window && window.removeEventListener("resize", onResize);
    };
  }, [gridSize]);

  if (!document) {
    return null;
  }

  return <canvas id={styles.container} ref={containerRef}></canvas>;
};
