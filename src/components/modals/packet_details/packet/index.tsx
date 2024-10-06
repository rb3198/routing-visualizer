import React, { useCallback, useMemo, useRef } from "react";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";
import { getHeaderRows } from "../descriptions/header";
import styles from "./styles.module.css";
import { PacketViz, PacketVizField } from "../descriptions/types";

interface PacketVizProps {
  packet: OSPFPacket;
  bodyRows: PacketViz[];
  setFieldDesc: React.Dispatch<React.SetStateAction<string>>;
}

const Field: React.FC<{
  viz: PacketVizField;
  setFieldDesc: React.Dispatch<React.SetStateAction<string>>;
}> = (props) => {
  const { viz, setFieldDesc } = props;
  const { flexGrow, description, label, value } = viz;

  const onMouseOver = useCallback(() => {
    setFieldDesc(description);
  }, [description, setFieldDesc]);

  const onMouseLeave = useCallback(() => {
    setFieldDesc("");
  }, [setFieldDesc]);
  return (
    <div
      className={styles.field}
      style={{ flexGrow }}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {value !== NOT_IMPLEMENTED && typeof value !== "undefined" && (
        <p className={styles.fieldLabel}>{label}</p>
      )}
      <p
        className={styles.value}
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
};

export const PacketInteractive: React.FC<PacketVizProps> = (props) => {
  const { packet, bodyRows, setFieldDesc } = props;
  const { header } = packet;
  const headerRef = useRef<HTMLDivElement>(null);
  const headerLabelRef = useRef<HTMLParagraphElement>(null);
  const headerRows = useMemo(() => getHeaderRows(header), [header]);
  const renderFields = useCallback(
    (rows: PacketViz[]) => {
      return rows.map((rowO, idx) => {
        const { row, separator } = rowO;
        return (
          <div
            className={styles.row}
            key={`packet_row_${row[0]?.label ?? ""}_${idx}`}
          >
            {row.map((field, idx) => {
              return (
                <Field
                  viz={field}
                  key={`${field.label}_${idx}`}
                  setFieldDesc={setFieldDesc}
                />
              );
            })}
            {separator && (
              <div
                style={{ borderColor: separator.color }}
                className={styles.packet_separator}
              >
                <p style={{ color: separator.color }}>{separator.label}</p>
              </div>
            )}
          </div>
        );
      });
    },
    [setFieldDesc]
  );

  return (
    <div id={styles.packet_container}>
      <div id={styles.packet}>
        <div ref={headerRef} id={styles.header}>
          {renderFields(headerRows)}
          <div id={styles.separator}>
            <p
              className={styles.packet_component_label}
              id={styles.header_text}
              ref={headerLabelRef}
            >
              OSPF Header
            </p>
            <p className={styles.packet_component_label}>OSPF Body</p>
          </div>
        </div>
        {renderFields(bodyRows)}
      </div>
    </div>
  );
};
