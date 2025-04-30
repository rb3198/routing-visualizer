import React, { RefObject, useEffect } from "react";
import styles from "./styles.module.css";
import { onCanvasLayout } from "../../utils/ui";

interface GridProps {
  gridCanvasRef: RefObject<HTMLCanvasElement>;
}
export const Grid: React.FC<GridProps> = (props) => {
  const { gridCanvasRef } = props;

  useEffect(() => {
    if (!gridCanvasRef.current) {
      return;
    }
    onCanvasLayout(gridCanvasRef.current);
  }, [gridCanvasRef]);
  return <canvas ref={gridCanvasRef} id={styles.cell_grid} />;
};
