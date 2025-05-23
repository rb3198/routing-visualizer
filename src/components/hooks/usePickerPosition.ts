import { useState, useEffect, useLayoutEffect } from "react";
import { GridCell } from "src/entities/geometry/grid_cell";
import { Point2D } from "src/types/geometry";
import { getCellSize } from "src/utils/drawing";

/**
 * Duration of the appear / disappear animation in milliseconds
 */
const DEFAULT_ANIM_DURATION = 250;

type UsePickerPositionProps = {
  /**
   * If the picker is visible.
   */
  visible?: boolean;
  /**
   * The cell that has been clicked on to open the picker.
   */
  cell: Point2D;
  /**
   * The grid object
   */
  gridRect: GridCell[][];
  /**
   * Duration of the appear / disappear animation in milliseconds
   * @default [250]
   */
  animDuration?: number;
  /** The ref to the picker element */
  picker?: HTMLDivElement | null;
  /** The ref to the canvas element */
  canvas?: HTMLCanvasElement | null;
};

type HTMLPosition = {
  left: number;
  top?: number;
  bottom?: number;
  right?: number;
};

const DEFAULT_POSITION = {
  left: -200,
  top: -200,
};

const getCoord = (coord: number, offset: number) => {
  const { zoom = 1 } = window;
  return (coord + offset) / zoom;
};

const getPosition = (
  column: number,
  row: number,
  gridRect: GridCell[][],
  tooltipElement?: HTMLDivElement | null,
  canvas?: HTMLCanvasElement | null
): { left: number; top?: number; bottom?: number } => {
  if (!canvas || !tooltipElement || !gridRect[row] || !gridRect[row][column]) {
    return { left: -200, top: -200 };
  }
  const { canvasOffset = [0, 0] } = window;
  const { height, width } = tooltipElement.getBoundingClientRect();
  const cell = gridRect[row][column];
  const cellSize = getCellSize();
  const x = getCoord(cell.x, canvasOffset[0]);
  const y = getCoord(cell.y, canvasOffset[1]);
  const { y: canvasY, height: canvasHeight } = canvas.getBoundingClientRect();
  const horizontalPosition = x + width > canvas.clientWidth ? "left" : "right";
  const verticalPosition =
    canvasY + y + height > canvasY + canvasHeight ? "top" : "bottom";
  if (horizontalPosition === "right") {
    if (verticalPosition === "bottom") {
      return {
        left: getCoord(cell.x + cellSize, canvasOffset[0]),
        top: getCoord(cell.y + cellSize, canvasOffset[1]) + canvasY,
      };
    }
    return {
      left: getCoord(cell.x + cellSize, canvasOffset[0]),
      top: y - height + canvasY,
    };
  }
  if (verticalPosition === "bottom") {
    return {
      left: x - width,
      top: canvasY + getCoord(cell.y + cellSize, canvasOffset[1]),
    };
  }
  return {
    left: x - width,
    top: getCoord(cell.y, canvasOffset[1]) - height + canvasY,
  };
};

/**
 * A hook to manage the position of a picker component based on the location of its opening.
 * @param props The props the hook requires
 * @returns
 */
export const usePickerPosition = ({
  visible,
  cell,
  gridRect,
  animDuration = DEFAULT_ANIM_DURATION,
  picker,
  canvas,
}: UsePickerPositionProps): [HTMLPosition, -1 | 100] => {
  const [position, setPosition] = useState<HTMLPosition>(
    visible ? getPosition(...cell, gridRect, picker, canvas) : DEFAULT_POSITION
  );
  const [zIndex, setZIndex] = useState<-1 | 100>(visible ? 100 : -1);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }
    const position = getPosition(...cell, gridRect, picker, canvas);
    setPosition(position);
  }, [cell, visible, gridRect, picker, canvas]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    if (!visible) {
      timeout = setTimeout(() => {
        setZIndex(-1);
      }, animDuration);
    } else {
      setZIndex(100);
    }
    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [visible, animDuration]);

  return [position, zIndex];
};
