import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OSPFPacket } from "src/entities/ospf/packets/packet_base";
import { NOT_IMPLEMENTED } from "src/entities/ospf/constants";
import { getHeaderRows } from "../descriptions/header";
import styles from "./styles.module.css";
import { PacketVizField } from "../descriptions/types";

interface PacketVizProps {
  packet: OSPFPacket;
  bodyRows: PacketVizField[][];
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
      {value !== NOT_IMPLEMENTED && value && (
        <p className={styles.fieldLabel}>{label}</p>
      )}
      <p
        className={styles.value}
        dangerouslySetInnerHTML={{
          __html:
            value === NOT_IMPLEMENTED
              ? `${label} (Not Simulated)`
              : !value
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
  const [separatorTop, setSeparatorTop] = useState(0);
  const [headerLabelTop, setHeaderLabelTop] = useState(0);
  const renderFields = useCallback(
    (rows: PacketVizField[][]) => {
      return rows.map((row) => (
        <div className={styles.row} key={`packet_row_${row[0]?.label ?? ""}`}>
          {row.map((field) => {
            return (
              <Field
                viz={field}
                key={field.label}
                setFieldDesc={setFieldDesc}
              />
            );
          })}
        </div>
      ));
    },
    [setFieldDesc]
  );

  useLayoutEffect(() => {
    if (!headerRef.current || !headerLabelRef.current) {
      return;
    }
    const { height } = headerRef.current.getBoundingClientRect();
    const { height: labelHeight } =
      headerLabelRef.current.getBoundingClientRect();
    setHeaderLabelTop(height - 2 - labelHeight);
    setSeparatorTop(height);
  }, []);
  return (
    <div id={styles.packet_container}>
      <div id={styles.packet}>
        <div ref={headerRef}>{renderFields(headerRows)}</div>
        {renderFields(bodyRows)}
      </div>
      <p
        className={styles.packet_component_label}
        style={{ top: headerLabelTop }}
        ref={headerLabelRef}
      >
        OSPF Header
      </p>
      <hr id={styles.separator} style={{ top: separatorTop }}></hr>
      <p
        className={styles.packet_component_label}
        style={{ top: separatorTop + 2 }}
      >
        OSPF Body
      </p>
    </div>
  );
};
