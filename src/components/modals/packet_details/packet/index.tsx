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
  const [separatorTop, setSeparatorTop] = useState(0);
  const [headerLabelTop, setHeaderLabelTop] = useState(0);
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

  const onScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    if (!headerRef.current) {
      return;
    }
    const { currentTarget: container } = e;
    const { top: containerTop } = container.getBoundingClientRect();
    const { top: headerTop, height: headerHeight } =
      headerRef.current.getBoundingClientRect();
    const { height: labelHeight } =
      headerLabelRef.current?.getBoundingClientRect() ?? {};
    setHeaderLabelTop(
      headerTop - containerTop + headerHeight - 2 - (labelHeight ?? 0)
    );
    setSeparatorTop(headerTop - containerTop + headerHeight);
  };
  return (
    <div id={styles.packet_container} onScroll={onScroll}>
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
