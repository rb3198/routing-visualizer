// @ts-ignore
import { IconType } from "react-icons";
import styles from "./styles.module.css";
import { memo, MouseEventHandler } from "react";
import { Point2D } from "src/types/geometry";
import { GridCell } from "src/entities/geometry/grid_cell";
import { usePickerPosition } from "../hooks/usePickerPosition";

export interface PickerOption {
  label: string;
  Icon: IconType;
  onClick: MouseEventHandler<HTMLLIElement>;
}

export interface PickerProps {
  cell: Point2D;
  gridRect: GridCell[][];
  visible?: boolean;
  pickerRef: React.RefObject<HTMLDivElement>;
  areaLayerRef: React.RefObject<HTMLCanvasElement>;
  options: PickerOption[];
}

export const ComponentPicker: React.FC<PickerProps> = memo((props) => {
  const { visible, pickerRef, cell, options, gridRect, areaLayerRef } = props;
  const [position, zIndex] = usePickerPosition({
    visible,
    cell,
    gridRect,
    picker: pickerRef?.current,
    canvas: areaLayerRef?.current,
  });

  return (
    <div
      ref={pickerRef}
      id={styles.container}
      style={{
        zIndex,
        opacity: visible ? 1 : 0,
        position: "absolute",
        ...position,
      }}
    >
      <p className={styles.description}>Insert...</p>
      <ul>
        {(options &&
          options.length &&
          options.map(({ label, Icon, onClick }) => (
            <li key={label} onClick={onClick}>
              <div className={styles.iconContainer}>
                <Icon className={styles.icon} />
              </div>
              {label}
            </li>
          ))) || <></>}
      </ul>
    </div>
  );
});
