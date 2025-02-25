import React, { useLayoutEffect, useRef } from "react";
import styles from "./styles.module.css";

export type TooltipProps = {
  visible: boolean;
  element: React.RefObject<HTMLElement>;
  position: "top" | "left" | "right" | "bottom";
  message: string;
  classes?: string;
};

export const Tooltip: React.FC<TooltipProps> = (props) => {
  const { visible, element, position, message, classes } = props;
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!element.current || !ref.current || !visible) {
      return;
    }
    const {
      width: tooltipWidth,
      x: tooltipX,
      y: tooltipY,
      height: tooltipHeight,
    } = ref.current.getBoundingClientRect();
    const {
      x,
      y,
      width: elWidth,
      height: elHeight,
    } = element.current.getBoundingClientRect();
    let transformX = x - tooltipX;
    let transformY = y - tooltipY;
    switch (position) {
      case "top":
        transformY -= tooltipHeight;
        break;
      case "bottom":
        transformY += elHeight;
        break;
      case "right":
        transformX += elWidth;
        break;
      case "left":
        transformX -= tooltipWidth;
        break;
      default:
        break;
    }
    ref.current.style.transform = `translate(${transformX}px, ${transformY}px)`;
  }, [visible, element, position]);
  if (!visible) return <></>;
  return (
    <div ref={ref} id={styles.container} className={classes}>
      {message}
    </div>
  );
};
