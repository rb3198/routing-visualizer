import React, {
  MouseEventHandler,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./style.module.css";
import { debounce } from "../../utils/ui";
import { Grid as GridEntity } from "../../entities/Grid";
import { CiRouter } from "react-icons/ci";
import { PiRectangleDashed } from "react-icons/pi";
import { ComponentPicker, PickerOption } from "../picker";
interface GridProps {
  gridSize: number;
}

export const Grid: React.FC<GridProps> = (props) => {
  const { gridSize } = props;
  const containerRef = useRef<HTMLCanvasElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridEntity>();
  const [picker, setPicker] = useState({
    visible: false,
    top: -200,
    left: -200,
  });

  const openPicker = useCallback((left: number, top: number) => {
    setPicker({ visible: true, left, top });
    if (containerRef.current && gridRef.current) {
      containerRef.current.removeEventListener(
        "mousemove",
        gridRef.current.onMouseOverGrid
      );
    }
  }, []);

  const closePicker = useCallback((e: MouseEvent) => {
    setPicker({ visible: false, left: -200, top: -200 });
    if (containerRef.current && gridRef.current) {
      containerRef.current.addEventListener(
        "mousemove",
        gridRef.current.onMouseOverGrid
      );
      gridRef.current.onMouseOverGrid(e);
    }
  }, []);

  const pickerOptions: PickerOption[] = useMemo(
    () => [
      {
        label: "Router",
        Icon: CiRouter,
        onClick: (e) => {
          const { nativeEvent } = e;
          gridRef.current?.placeRouter(nativeEvent, closePicker);
        },
      },
      {
        label: "AS Boundary",
        Icon: PiRectangleDashed,
        onClick: () => {},
      },
    ],
    [closePicker]
  );
  useLayoutEffect(() => {
    const onResize = debounce(() => {
      const { documentElement } = document;
      const { clientHeight, clientWidth } = documentElement;
      if (containerRef.current) {
        containerRef.current.height = 0.92 * clientHeight;
        containerRef.current.width = clientWidth;
        if (!gridRef.current) {
          gridRef.current = new GridEntity(gridSize, containerRef);
        }
        gridRef.current.drawGrid();
        containerRef.current.addEventListener(
          "mousemove",
          gridRef.current.onMouseOverGrid
        );
      }
    }, 100);
    if (containerRef.current) {
      window.onresize = onResize;
      onResize();
    }
    return () => {
      window && window.removeEventListener("resize", onResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener(
          "mousemove",
          gridRef.current?.onMouseOverGrid!
        );
      }
    };
  }, [gridSize]);

  const { visible, top, left } = picker;

  const onCanvasMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      if (!containerRef.current || !gridRef.current || !pickerRef.current) {
        return;
      }
      gridRef.current.onMouseDown(
        e.nativeEvent,
        visible,
        pickerRef.current,
        openPicker,
        closePicker
      );
    },
    [visible, openPicker, closePicker]
  );
  if (!document) {
    return null;
  }

  return (
    <>
      <canvas
        id={styles.container}
        ref={containerRef}
        onMouseDown={onCanvasMouseDown}
      ></canvas>
      <ComponentPicker
        pickerRef={pickerRef}
        options={pickerOptions}
        position={{
          top,
          left,
        }}
        visible={visible}
      />
    </>
  );
};
