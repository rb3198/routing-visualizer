import React from "react";
import styles from "./styles.module.css";
import { AutonomousSystem } from "../../entities/AutonomousSystem";
import { CiRouter } from "react-icons/ci";

export interface ConnectionPickerProps {
  selectedRouterKey: string;
  visible?: boolean;
  pickerRef?: React.LegacyRef<HTMLDivElement>;
  position: {
    top: number;
    left: number;
  };
  asList: AutonomousSystem[];
}

/**
 * Component to display options to connect a router to other routers.
 * @param props
 * @returns
 */
export const ConnectionPicker: React.FC<ConnectionPickerProps> = (props) => {
  const { visible, position, pickerRef, asList, selectedRouterKey } = props;
  const { top, left } = position;

  return (
    (asList && asList.length > 0 && (
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
        <p className={styles.description}>Connect to...</p>
        {asList.map((as) => {
          const { routerLocations, id } = as;
          const connectionOptionList = [...routerLocations].filter(
            ([loc]) =>
              loc !==
              selectedRouterKey /* TODO: AND router should not be already connected to the current router*/
          );
          if (!connectionOptionList.length) {
            return null;
          }
          return (
            <React.Fragment key={`connection_picker_as_${id}`}>
              <p className={`${styles.as_name} ${styles.description}`}>{id}</p>
              <ul>
                {connectionOptionList.map(([loc, router]) => (
                  <li key={`router_${loc}`} /* onClick={onClick} */>
                    <div className={styles.iconContainer}>
                      <CiRouter className={styles.icon} />
                    </div>
                    {router.ip.ip}
                  </li>
                ))}
              </ul>
            </React.Fragment>
          );
        })}
      </div>
    )) || <></>
  );
};
