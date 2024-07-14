import { IconType } from "react-icons";
import styles from "./styles.module.css";
import { MouseEventHandler } from "react";

export interface PickerOption {
  label: string;
  Icon: IconType;
  onClick: MouseEventHandler<HTMLLIElement>;
}

export interface PickerProps {
  visible?: boolean;
  pickerRef?: React.LegacyRef<HTMLDivElement>;
  position: {
    top: number;
    left: number;
  };
  options: PickerOption[];
}

export const ComponentPicker: React.FC<PickerProps> = (props) => {
  const { visible, position, pickerRef, options } = props;
  const { top, left } = position;
  return (
    <div
      ref={pickerRef}
      id={styles.container}
      style={{
        zIndex: visible ? 2 : -1,
        opacity: visible ? 1 : 0,
        position: "absolute",
        top,
        left,
      }}
    >
      <p className={styles.description}>Insert...</p>
      <ul>
        {options.map(({ label, Icon, onClick }) => (
          <li key={label} onClick={onClick}>
            <div className={styles.iconContainer}>
              <Icon className={styles.icon} />
            </div>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};
