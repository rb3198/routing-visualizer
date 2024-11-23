// @ts-ignore
import { IconType } from "react-icons";
import styles from "./styles.module.css";
import { MouseEventHandler } from "react";
import { Point2D } from "src/types/geometry";
import { getPickerPosition } from "../area_manager/utils";
import { GridCell } from "src/entities/geometry/grid_cell";

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

export const ComponentPicker: React.FC<PickerProps> = (props) => {
  const { visible, pickerRef, cell, options, gridRect, areaLayerRef } = props;
  const areaLayer = areaLayerRef.current;
  const picker = pickerRef.current;

  const position = getPickerPosition(...cell, gridRect, picker, areaLayer);
  const { top, left } = position;
  return (
    <div
      ref={pickerRef}
      id={styles.container}
      style={{
        zIndex: visible ? 100 : -1,
        opacity: visible ? 1 : 0,
        position: "absolute",
        top,
        left,
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
};
