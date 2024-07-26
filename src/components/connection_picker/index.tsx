import React, { memo } from "react";
import styles from "./styles.module.css";
import { AutonomousSystem } from "../../entities/AutonomousSystem";
import { CiRouter } from "react-icons/ci";
import { Router } from "../../entities/Router";

export interface ConnectionPickerProps {
  selectedRouter?: Router;
  visible?: boolean;
  pickerRef?: React.LegacyRef<HTMLDivElement>;
  position: {
    top?: number | string;
    left?: number | string;
    bottom?: number | string;
  };
  asList: AutonomousSystem[];
  addRouterConnection?: (routerA: Router, routerB: Router) => any;
}

/**
 * Component to display options to connect a router to other routers.
 * @param props
 * @returns
 */
export const ConnectionPicker: React.FC<ConnectionPickerProps> = (props) => {
  const {
    visible,
    position,
    pickerRef,
    asList,
    selectedRouter,
    addRouterConnection,
  } = props;
  const { top, left, bottom } = position;
  const selectedRouterKey = selectedRouter?.key;
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
          bottom,
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
                  <Connection
                    loc={loc}
                    router={router}
                    key={`r_picker_${loc}`}
                    rootRouter={selectedRouter}
                    addRouterConnection={addRouterConnection}
                  />
                ))}
              </ul>
            </React.Fragment>
          );
        })}
      </div>
    )) || <></>
  );
};

interface ConnectionProps {
  loc: string;
  rootRouter?: Router;
  router: Router;
  addRouterConnection?: (routerA: Router, routerB: Router) => any;
}

const Connection: React.FC<ConnectionProps> = memo(
  ({ loc, router, rootRouter, addRouterConnection }) => {
    const onClick = () => {
      if (rootRouter) {
        addRouterConnection && addRouterConnection(rootRouter, router);
      }
    };
    return (
      <li key={`router_${loc}`} onClick={onClick}>
        <div className={styles.iconContainer}>
          <CiRouter className={styles.icon} />
        </div>
        {router.ip.ip}
      </li>
    );
  }
);
