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
  const [componentOptions, setComponentOptions] = useState<
    "as" | "router" | "none"
  >("as");
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
  }, []);

  const closePicker = useCallback((e: MouseEvent) => {
    setPicker({ visible: false, left: -200, top: -200 });
  }, []);

  const pickerOptions: PickerOption[] = useMemo(() => {
    switch (componentOptions) {
      case "router":
        return [
          {
            label: "Router",
            Icon: CiRouter,
            onClick: (e) => {
              const { nativeEvent } = e;
              gridRef.current?.placeRouter(nativeEvent, closePicker);
            },
          },
        ];
      case "as":
        return [
          {
            label: "AS Boundary",
            Icon: PiRectangleDashed,
            onClick: (e) => {
              const { nativeEvent } = e;
              gridRef.current?.placeAS(nativeEvent, closePicker);
            },
          },
        ];
      case "none":
      default:
        return [];
    }
  }, [closePicker, componentOptions]);
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
      }
    }, 100);
    if (containerRef.current) {
      window.onresize = onResize;
      onResize();
    }
    return () => {
      window && window.removeEventListener("resize", onResize);
    };
  }, [gridSize]);

  const { visible: pickerVisible, top, left } = picker;

  const onCanvasMouseMove: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const { nativeEvent } = e;
      if (!gridRef.current || pickerVisible) {
        return;
      }
      gridRef.current.onMouseOverGrid(nativeEvent, setComponentOptions);
    },
    [pickerVisible]
  );

  const onCanvasMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      if (
        !containerRef.current ||
        !gridRef.current ||
        !pickerRef.current ||
        componentOptions === "none"
      ) {
        return;
      }
      gridRef.current.onMouseDown(
        e.nativeEvent,
        pickerVisible,
        pickerRef.current,
        openPicker,
        closePicker
      );
    },
    [pickerVisible, componentOptions, openPicker, closePicker]
  );
  if (!document) {
    return null;
  }

  return (
    <>
      <canvas
        id={styles.container}
        ref={containerRef}
        className={(componentOptions !== "none" && styles.can_interact) || ""}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
      ></canvas>
      <ComponentPicker
        pickerRef={pickerRef}
        options={pickerOptions}
        position={{
          top,
          left,
        }}
        visible={pickerVisible}
      />
    </>
  );
};
