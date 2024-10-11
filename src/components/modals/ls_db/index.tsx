import React, { useCallback, useMemo, useState } from "react";
import { IPv4Address } from "src/entities/ip/ipv4_address";
import { LSA, LSAHeader } from "src/entities/ospf/lsa";
import styles from "./styles.module.css";
import { MdKeyboardArrowDown } from "react-icons/md";
import { RouterLSA } from "src/entities/ospf/lsa/router_lsa";
import {
  getLSAHeaderRows,
  getRouterLSARows,
} from "../packet_details/descriptions/body";
import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";

export type LsDBProps = {
  routerId: IPv4Address;
  db: Record<number, Record<string, LSA>>;
};

/**
 * If the DB has only 1 area, selects it as open by default. Else, sets no area as active
 * @param db The Link State Database
 */
const getInitiallySelectedArea = (db: Record<number, Record<string, LSA>>) => {
  const areas = Object.keys(db);
  if (areas.length === 1) {
    return parseInt(areas[0]);
  }
  return undefined;
};

const getCols = (header: LSAHeader) => {
  const { advertisingRouter, linkStateId, lsSeqNumber } = header;
  return [
    {
      label: "Advertising Router",
      value: advertisingRouter,
    },
    {
      label: "Link State ID",
      value: linkStateId,
    },
    {
      label: "LS Seq. Number",
      value: lsSeqNumber,
    },
  ];
};

export const LsDbModalBody: React.FC<LsDBProps> = (props) => {
  const { db } = props;
  const [activeArea, setActiveArea] = useState<number | undefined>(
    getInitiallySelectedArea(db)
  );
  const [activeLsa, setActiveLsa] = useState<LSA | undefined>();
  const [activeField, setActiveField] = useState<[number, number]>();
  const emptyDb = !Object.keys(db).length;

  const renderArea = useCallback(
    (areaId: number) => {
      const areaDb = db[areaId];
      if (!areaDb) {
        return null;
      }
      const routerLsaList: RouterLSA[] = [];
      //   TODO: When implementing summary LSAs, create a new Summary LSA list and display it
      Object.values(areaDb).forEach((lsa) => {
        if (RouterLSA.isRouterLsa(lsa)) {
          routerLsaList.push(lsa);
          return;
        }
      });
      const setArea = () => {
        setActiveArea((prevAreaId) =>
          prevAreaId === areaId ? undefined : areaId
        );
      };

      const Head = (
        <div className={styles.area_head} onClick={setArea}>
          <h3>Area {areaId}</h3>
          <MdKeyboardArrowDown
            className={styles.area_expand_collapse}
            size={24}
          />
        </div>
      );

      const Body = (
        <div className={styles.area_body}>
          {routerLsaList.length && (
            <div className={styles.db}>
              <div className={styles.th}>Router LSAs</div>
              {routerLsaList.map((lsa) => {
                const { header } = lsa;
                const { linkStateId, advertisingRouter } = header;
                const cols = getCols(header);
                return (
                  <div
                    data-active={lsa === activeLsa}
                    key={`${linkStateId}_${advertisingRouter}`}
                    className={styles.td}
                    onClick={() => setActiveLsa(lsa)}
                  >
                    <div className={styles.lsa_header}>
                      {cols.map(({ label, value }) => (
                        <div key={`${label}_${value}`}>
                          <p className={styles.lsa_header_label}>{label}</p>
                          <p
                            className={styles.lsa_header_value}
                          >{`${value}`}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

      return (
        <div className={styles.area} data-active={areaId === activeArea}>
          {Head}
          {Body}
        </div>
      );
    },
    [db, activeArea, activeLsa]
  );

  const Lsa = useMemo(() => {
    if (!activeLsa) {
      return null;
    }
    const { header, body } = activeLsa;
    const headerRows = getLSAHeaderRows(header);
    const bodyRows = getRouterLSARows(body);
    const rows = [...headerRows, ...bodyRows];
    let nSeparators = 0;
    const [selectedRow, selectedCol] = activeField || [-1, -1];
    return (
      <div id={styles.packet}>
        {rows.map(({ row, separator }, rowIdx) => {
          return (
            <div key={rowIdx} className={styles.packet_row}>
              {row.map((column, idx) => {
                const { flexGrow, label, value } = column;
                return (
                  <div
                    key={idx}
                    className={styles.packet_field}
                    onClick={() => setActiveField([rowIdx, idx])}
                    data-selected={
                      rowIdx === selectedRow && idx === selectedCol
                    }
                    style={{ flexGrow }}
                  >
                    {value !== NOT_IMPLEMENTED &&
                      typeof value !== "undefined" && (
                        <p className={styles.packet_field_label}>{label}</p>
                      )}
                    <p
                      className={styles.packet_field_value}
                      dangerouslySetInnerHTML={{
                        __html:
                          value === NOT_IMPLEMENTED
                            ? `${label} (Not Simulated)`
                            : typeof value === "undefined"
                            ? label
                            : value.toString(),
                      }}
                    ></p>
                  </div>
                );
              })}
              {separator && (
                <div className={styles.packet_separator}>
                  <p>Link {++nSeparators}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [activeLsa, activeField]);

  const rows = activeLsa
    ? [
        ...getLSAHeaderRows(activeLsa.header),
        ...getRouterLSARows(activeLsa.body),
      ]
    : [];
  const desc =
    activeField &&
    rows.length &&
    activeField.length === 2 &&
    rows[activeField[0]]
      ? rows[activeField[0]].row[activeField[1]].description
      : "";
  return (
    <div id={styles.container}>
      {emptyDb && (
        <p id={styles.no_items_desc}>
          No items currently present in the Link State Database.
        </p>
      )}
      {!emptyDb && (
        <>
          <div>
            <h3 className={styles.header}>Database</h3>
            {Object.keys(db).map((areaId) => (
              <React.Fragment key={areaId}>
                {renderArea(parseInt(areaId))}
              </React.Fragment>
            ))}
            {activeLsa && (
              <div
                id={styles.desc}
                dangerouslySetInnerHTML={{
                  __html: desc
                    ? desc
                    : `
                    <p id="${styles.no_items_desc}">
                    Click on any field on the LSA to learn more about it.
                  </p>
                    `,
                }}
              />
            )}
          </div>
          <div id={styles.lsa_viewer_container}>
            <h3 className={styles.header}>LSA Viewer</h3>
            <div id={styles.lsa_viewer}>
              {!activeLsa && (
                <p id={styles.select_lsa}>
                  Select an LSA on the left panel to view here.
                </p>
              )}
              {Lsa}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
