import React, {
  PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";

interface TableCellProps<T> {
  activeCol: T | "none";
  col: T | "none";
  idx: number;
  setActiveCol: React.Dispatch<React.SetStateAction<T | "none">>;
  type: "th" | "td";
}

export function TC<T>(props: PropsWithChildren<TableCellProps<T>>) {
  const { idx, col, activeCol, type, children, setActiveCol } = props;
  const [prevValue, setPrevValue] = useState(children);
  const wasStale = useRef(false);
  const [stale, setStale] = useState(false);
  const onMouseEnter = useCallback(() => {
    setActiveCol(col);
  }, [col, setActiveCol]);
  const onMouseLeave = useCallback(() => {
    setActiveCol("none");
  }, [setActiveCol]);

  useLayoutEffect(() => {
    let timeout: NodeJS.Timeout;
    if (children !== prevValue) {
      setStale(true);
      timeout = setTimeout(() => {
        setStale(false);
        setPrevValue(children);
        wasStale.current = true;
      }, 500);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [children, prevValue]);

  const elProps = {
    className: `${idx === 0 ? styles.fixed : ""} ${
      activeCol === col ? styles.hovered : ""
    }`,
    onMouseEnter,
    onMouseLeave,
  };
  return type === "th" ? (
    <th {...elProps}>{children}</th>
  ) : (
    <td {...elProps}>
      <div
        className={stale ? styles.out : wasStale.current ? styles.in : ""}
        dangerouslySetInnerHTML={{ __html: prevValue?.toString() ?? "" }}
      ></div>
    </td>
  );
}
