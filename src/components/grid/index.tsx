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
import { AutonomousSystem } from "../../entities/AutonomousSystem";
import { ConnectionPicker } from "../connection_picker";
import { Router } from "../../entities/Router";
interface GridProps {
  gridSize: number;
}

type PickerState = {
  visible: boolean;
  position: {
    left: string | number;
    top?: string | number;
    bottom?: string | number;
  };
};

export const Grid: React.FC<GridProps> = (props) => {
  const { gridSize } = props;
  const [componentOptions, setComponentOptions] = useState<
    "as" | "router" | "none"
  >("as");
  const [asList, setAsList] = useState<AutonomousSystem[]>([]);
  const containerRef = useRef<HTMLCanvasElement>(null);
  const connectionPickerRef = useRef<HTMLDivElement>(null);
  const [selectedRouter, setSelectedRouter] = useState<Router>();
  const pickerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridEntity>();
  const [componentPicker, setComponentPicker] = useState<PickerState>({
    visible: false,
    position: {
      top: -200,
      left: -200,
    },
  });
  const [connectionPicker, setConnectionPicker] = useState<PickerState>({
    visible: false,
    position: {
      top: -200,
      left: -200,
    },
  });

  const openConnectionPicker = useCallback(
    (router: Router, left: number, top?: number, bottom?: number) => {
      setSelectedRouter(router);
      setConnectionPicker({ visible: true, position: { top, left, bottom } });
    },
    []
  );

  const closeConnectionPicker = useCallback((e: MouseEvent) => {
    setSelectedRouter(undefined);
    setConnectionPicker({
      visible: false,
      position: { left: -200, top: -200 },
    });
  }, []);

  const openComponentPicker = useCallback(
    (left: number, top?: number, bottom?: number) => {
      setComponentPicker({ visible: true, position: { left, top } });
    },
    []
  );

  const closeComponentPicker = useCallback((e: MouseEvent) => {
    setComponentPicker({ visible: false, position: { left: -200, top: -200 } });
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
              gridRef.current?.placeRouter(nativeEvent, closeComponentPicker);
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
              gridRef.current?.placeAS(nativeEvent, closeComponentPicker);
            },
          },
        ];
      case "none":
      default:
        return [];
    }
  }, [closeComponentPicker, componentOptions]);
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

  const { visible: componentPickerVisible, position: componentPickerPosition } =
    componentPicker;
  const {
    visible: connectionPickerVisible,
    position: connectionPickerPosition,
  } = connectionPicker;

  const onCanvasMouseMove: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const { nativeEvent } = e;
      if (
        !gridRef.current ||
        componentPickerVisible ||
        connectionPickerVisible
      ) {
        return;
      }
      gridRef.current.onMouseOverGrid(
        nativeEvent,
        setComponentOptions,
        setAsList
      );
    },
    [componentPickerVisible, connectionPickerVisible]
  );

  const onCanvasMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      if (
        !containerRef.current ||
        !gridRef.current ||
        (componentOptions === "none" && asList.length === 0)
      ) {
        return;
      }
      gridRef.current.onMouseDown(
        e.nativeEvent,
        componentPickerVisible,
        openComponentPicker,
        closeComponentPicker,
        connectionPickerVisible,
        openConnectionPicker,
        closeConnectionPicker,
        pickerRef.current,
        connectionPickerRef.current
      );
    },
    [
      asList,
      componentPickerVisible,
      componentOptions,
      connectionPickerVisible,
      openComponentPicker,
      closeComponentPicker,
      openConnectionPicker,
      closeConnectionPicker,
    ]
  );
  if (!document) {
    return null;
  }

  return (
    <>
      <canvas
        id={styles.container}
        ref={containerRef}
        className={
          ((componentOptions !== "none" || asList.length > 0) &&
            styles.can_interact) ||
          ""
        }
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
      ></canvas>
      <ComponentPicker
        pickerRef={pickerRef}
        options={pickerOptions}
        position={componentPickerPosition}
        visible={componentPickerVisible}
      />
      <ConnectionPicker
        pickerRef={connectionPickerRef}
        asList={asList}
        position={connectionPickerPosition}
        selectedRouter={selectedRouter}
        addRouterConnection={gridRef.current?.drawRouterConnection}
        visible={connectionPickerVisible}
      />
    </>
  );
};
