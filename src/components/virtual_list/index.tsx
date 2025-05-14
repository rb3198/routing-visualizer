import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type VirtualListProps<T> = {
  /**
   * List of items being rendered
   */
  items: T[];
  /**
   * Function to render each item in JSX, given the corresponding data
   * @param data
   * @returns
   */
  renderItem: (data: T) => JSX.Element;
  /**
   * Function to extract the key for a given item.
   * The key helps map the data item to its rendered component.
   * @param item
   * @returns
   */
  keyExtractor: (item: T) => string | number;
  /**
   * Number of items to be rendered at once.
   */
  windowSize: number;
  /**
   * The estimated height of an item before its placed in the DOM.
   * - Used for initial estimations for painting a `windowSize` sized array of items.
   */
  estimatedHeight: number;
  /**
   * Classes to be applied to the container
   */
  classes?: string;
  /**
   * The boundary of scroll top at which list is updated continuously.
   * After this boundary, the list is not updated to prevent layout shifts.
   */
  refreshDelta?: number;
};

export const VirtualList = <T extends Object>(props: VirtualListProps<T>) => {
  const {
    items,
    windowSize,
    estimatedHeight,
    classes,
    refreshDelta,
    keyExtractor,
    renderItem,
  } = props;
  const [scrollTop, setScrollTop] = useState(0);
  const heightMap = useRef(new Map<string | number, number>());
  const propItems = useRef(items);
  const [curItems, setCurItems] = useState<T[]>(items);
  propItems.current = items;
  useEffect(() => {
    const timeout = setInterval(() => {
      if (typeof refreshDelta !== "undefined") {
        scrollTop < refreshDelta && setCurItems(propItems.current);
      } else {
        setCurItems(propItems.current);
      }
    }, 1000);
    return () => {
      clearInterval(timeout);
    };
  }, [refreshDelta, scrollTop]);

  const onScroll: React.UIEventHandler<HTMLDivElement> = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  /**
   * Measures a given node and stores its height in the height map.
   * Used to decide the window of components to be rendered.
   */
  const measureNode = useCallback(
    (node: HTMLDivElement | null, key: string | number) => {
      if (!node) {
        return;
      }
      const { height } = node.getBoundingClientRect();
      if (heightMap.current.get(key) === height) {
        return;
      }
      heightMap.current.set(key, height);
    },
    []
  );

  /**
   * An array storing the offsets of each item in the current list.
   * - If the node is rendered and its height is measured, it reads its height from the height map constructed while rendering.
   * - Else, the given `estimatedHeight` is used to measure the node.
   *
   * For a given node,
   * - The offset array first stores the estimated height as the height of the node
   * - The window then gets rendered, and if the node is within the window, its height is measured and stored.
   * - Offsets array is measured again since `heightMap` has a new state, causing a re-render of the list.
   */
  const offsets = useMemo(() => {
    let cumulativeHeight = 0;
    return curItems.map((item) => {
      const key = keyExtractor(item);
      const prevCumulativeHeight = cumulativeHeight;
      cumulativeHeight += heightMap.current.get(key) ?? estimatedHeight;
      return prevCumulativeHeight;
    });
  }, [curItems, keyExtractor, estimatedHeight]);

  /**
   * Given the window size and the offsets, selects the indices to be rendered.
   * - Gets the first element whose offset is more than `scrollTop` being tracked.
   * - Then selects the element `windowSize / 3` elements above the first, as the first element to be rendered.
   * - Finally, selects the element at `windowSize` elements away from the selected first element
   */
  const getIndicesToRender = useCallback(() => {
    let start = 0,
      end = offsets.length - 1;
    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (offsets[mid] < scrollTop) {
        start = mid + 1;
        continue;
      }
      end = mid;
    }
    start = Math.max(0, start - Math.floor(windowSize / 3));
    end = Math.min(offsets.length, start + windowSize);
    return [start, end];
  }, [scrollTop, windowSize, offsets]);

  const [start, end] = getIndicesToRender();
  const scrollableHeight =
    (offsets[offsets.length - 1] ?? 0) +
    ((curItems.length
      ? heightMap.current.get(keyExtractor(curItems[curItems.length - 1])) ||
        estimatedHeight
      : 0) || estimatedHeight);
  return (
    <div className={classes} onScroll={onScroll}>
      <div
        style={{
          height: scrollableHeight,
        }}
      >
        <div style={{ transform: `translateY(${offsets[start] || 0}px)` }}>
          {curItems.slice(start, end).map((data) => {
            const key = keyExtractor(data);
            return (
              <div key={key} ref={(node) => measureNode(node, key)}>
                {renderItem(data)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
