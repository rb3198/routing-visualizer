import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { Point2D, RectPoints } from "src/types/geometry";
import { Rect2D } from "src/entities/geometry/Rect2D";
import { Office } from "src/types/welcome_tutorial/animation_entities";
import { Colors } from "src/constants/theme";

const Canvas = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d");
  const clientRect = canvas.getBoundingClientRect();
  let roadWidth = 0;
  let roads: Point2D[][] = [];
  let mid: Point2D = [0, 0];
  let cp1x = 0,
    cp2x = 0;
  let animationFrameId: number | null = null;
  let time = 0,
    startTime: number | null = null;
  let processingPacket: number | null = null;
  const packetDests = [
    "NY",
    "LA",
    "LV",
    "CH",
    "SF",
    "AT",
    "MI",
    "SD",
    "PH",
    "DF",
    "AL",
  ];
  let packetPosition: Point2D[] = [];
  let packetStorageX = 0,
    packetSize = 0;
  let vPad = 0;
  const packetsAtStorage = new Set<number>();
  const setRoadWidth = (width: number) => {
    roadWidth = width;
    vPad = width * 0.75;
  };

  const setPacketSize = () => {
    packetSize = roadWidth * 2.5;
  };

  const getDefaultPacketPositions = () => {
    const { height } = clientRect;
    return new Array(11)
      .fill(0)
      .map((_, idx) => [
        0,
        idx === 0
          ? vPad - roadWidth / 2
          : idx === 5
          ? height / 2 - packetSize / 2
          : idx === 10
          ? height - vPad - (3 * roadWidth) / 2
          : (idx * height) / 10 - roadWidth / 2,
      ]) as Point2D[];
  };

  const setRoads = () => {
    const { width, height } = clientRect;
    roads = [
      [
        [0, roadWidth / 2 + 0.1 * height],
        [cp1x, roadWidth / 2 + 0.1 * height],
      ],
      [
        [0, roadWidth / 2 + 0.2 * height],
        [cp1x, roadWidth / 2 + 0.2 * height],
      ],
      [
        [0, roadWidth / 2 + 0.3 * height],
        [cp1x, roadWidth / 2 + 0.3 * height],
      ],
      [
        [0, roadWidth / 2 + 0.4 * height],
        [cp1x, roadWidth / 2 + 0.4 * height],
      ],
      [
        [0, roadWidth / 2 + 0.6 * height],
        [cp1x, roadWidth / 2 + 0.6 * height],
      ],
      [
        [0, roadWidth / 2 + 0.7 * height],
        [cp1x, roadWidth / 2 + 0.7 * height],
      ],
      [
        [0, roadWidth / 2 + 0.8 * height],
        [cp1x, roadWidth / 2 + 0.8 * height],
      ],
      [
        [0, roadWidth / 2 + 0.9 * height],
        [cp1x, roadWidth / 2 + 0.9 * height],
      ],
      [
        [0, vPad + roadWidth / 2],
        [cp1x, vPad + roadWidth / 2],
        [cp1x, height - vPad - roadWidth / 2],
        [0, height - vPad - roadWidth / 2],
      ],
      [
        [width, height - vPad - roadWidth / 2],
        [cp2x, height - vPad - roadWidth / 2],
        [cp2x, vPad + roadWidth / 2],
        [width, vPad + roadWidth / 2],
      ],
      [
        [width, roadWidth / 2 + 0.1 * height],
        [cp2x, roadWidth / 2 + 0.1 * height],
      ],
      [
        [width, roadWidth / 2 + 0.2 * height],
        [cp2x, roadWidth / 2 + 0.2 * height],
      ],
      [
        [width, roadWidth / 2 + 0.3 * height],
        [cp2x, roadWidth / 2 + 0.3 * height],
      ],
      [
        [width, roadWidth / 2 + 0.4 * height],
        [cp2x, roadWidth / 2 + 0.4 * height],
      ],
      [
        [width, roadWidth / 2 + 0.6 * height],
        [cp2x, roadWidth / 2 + 0.6 * height],
      ],
      [
        [width, roadWidth / 2 + 0.7 * height],
        [cp2x, roadWidth / 2 + 0.7 * height],
      ],
      [
        [width, roadWidth / 2 + 0.8 * height],
        [cp2x, roadWidth / 2 + 0.8 * height],
      ],
      [
        [width, roadWidth / 2 + 0.9 * height],
        [cp2x, roadWidth / 2 + 0.9 * height],
      ],
      [
        [0, height / 2],
        [width, height / 2],
      ],
    ];
  };

  const getOfficeDims = (
    mid: Point2D,
    width: number,
    height: number
  ): Office => {
    const [midX, midY] = mid;
    const roofWidth = (3 * width) / 4;
    const roofHeight = height / 4;
    const doorWidth = width / 8,
      doorHeight = height / 3;
    const wallStart: Point2D = [midX - width / 2, midY - roadWidth / 2];
    const wallEnd: Point2D = [midX + width / 2, midY - roadWidth / 2 - height];
    const wall = new Rect2D(wallStart, wallEnd).getPoints();
    packetStorageX = wallStart[0] - packetSize;
    const wallWidth = wallEnd[0] - wallStart[0];
    const roofStart: Point2D = [midX - roofWidth / 2, wall[2][1]];
    const roofEnd: Point2D = [midX + roofWidth / 2, wall[2][1] - roofHeight];
    const roof = new Rect2D(roofStart, roofEnd).getPoints();
    const doorStart: Point2D = [midX - doorWidth / 2, wall[0][1]];
    const doorEnd: Point2D = [midX + doorWidth / 2, wall[0][1] - doorHeight];
    const door = new Rect2D(doorStart, doorEnd).getPoints();
    const windows: RectPoints[] = [];
    const windowSpacing = wallWidth / 8;
    const windowSize = (wallWidth - 4 * windowSpacing) / 6;
    let x = wallStart[0] + windowSpacing,
      y = -windowSpacing;
    while (doorEnd[1] + y - windowSize > wallEnd[1]) {
      while (x + windowSize + windowSpacing <= wallEnd[0]) {
        const windowStart: Point2D = [x, doorEnd[1] + y];
        const windowEnd: Point2D = [
          x + windowSize,
          windowStart[1] - windowSize,
        ];
        x += windowSize + windowSpacing;
        windows.push(new Rect2D(windowStart, windowEnd).getPoints());
      }
      y -= windowSize + windowSpacing;
      x = wallStart[0] + windowSpacing;
    }
    return {
      wall,
      roof,
      door,
      windows,
    };
  };

  const drawRoads = (ctx: CanvasRenderingContext2D) => {
    const { width: clientWidth } = clientRect;
    ctx.save();
    for (let road of roads) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = roadWidth;
      ctx.strokeStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(...road[0]);
      for (let i = 1; i < road.length; i++) {
        ctx.lineTo(...road[i]);
      }
      ctx.stroke();
      ctx.closePath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fff";
      ctx.setLineDash([clientWidth * 0.01, clientWidth * 0.01]);
      ctx.beginPath();
      ctx.moveTo(...road[0]);
      for (let i = 1; i < road.length; i++) {
        ctx.lineTo(...road[i]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.closePath();
    }
    ctx.restore();
  };

  const drawOffice = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const { wall, door, roof, windows } = getOfficeDims(mid, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...wall[0]);
    ctx.fillStyle = "#ccc";
    for (let i = 1; i < wall.length; i++) {
      ctx.lineTo(...wall[i]);
    }
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(...roof[0]);
    for (let i = 1; i < roof.length; i++) {
      ctx.lineTo(...roof[i]);
    }
    ctx.fillStyle = Colors.accent;
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(...door[0]);
    for (let i = 1; i < door.length; i++) {
      ctx.lineTo(...door[i]);
    }
    ctx.fillStyle = Colors.complementary;
    ctx.fill();
    ctx.closePath();
    for (let window of windows) {
      ctx.beginPath();
      ctx.moveTo(...window[0]);
      for (let i = 1; i < window.length; i++) {
        ctx.lineTo(...window[i]);
      }
      ctx.fillStyle = Colors.accent + "aa";
      ctx.fill();
      ctx.closePath();
    }
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.font = ".764rem Roboto";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "COURIER",
      (roof[0][0] + roof[2][0]) / 2,
      roof[2][1] + (roof[0][1] - roof[2][1]) / 2
    );
    ctx.closePath();
    ctx.restore();
  };

  const drawPackets = (ctx: CanvasRenderingContext2D) => {
    packetPosition.forEach((point) => {
      ctx.save();
      ctx.fillStyle = Colors.complementary;
      ctx.moveTo(...point);
      ctx.rect(...point, packetSize, packetSize);
      ctx.fill();
      ctx.restore();
    });
    packetPosition.forEach((point, idx) => {
      ctx.save();
      ctx.font = "10px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        packetDests[idx] || "H",
        point[0] + packetSize / 2,
        point[1] + packetSize / 2,
        packetSize
      );
      ctx.restore();
    });
  };

  const drawProcessingText = (ctx: CanvasRenderingContext2D) => {
    if (processingPacket === null) {
      return;
    }
    const { width, height } = clientRect;
    const x = width / 2;
    const y = (2 * height) / 3;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(x - 80, y - 20, 160, 40);

    ctx.fillStyle = "#eee";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Processing shipment to ${packetDests[processingPacket - 1]}`,
      x,
      y,
      140
    );
    ctx.restore();
  };
  const drawCanvas = () => {
    if (!ctx) {
      return;
    }
    const { width, height } = clientRect;
    // Clear the existing rect
    ctx.clearRect(0, 0, width, height);
    drawRoads(ctx);
    const officeWidth = width * 0.25;
    const officeHeight = height * 0.25;
    drawOffice(ctx, officeWidth, officeHeight);
    drawPackets(ctx);
    drawProcessingText(ctx);
  };

  const stopAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    time = 0;
    packetPosition = getDefaultPacketPositions();
    startTime = null;
    processingPacket = null;
  };

  const animate = (timestamp: number) => {
    const { height, width } = clientRect;
    if (!startTime) {
      startTime = timestamp;
    }
    time = timestamp - startTime;
    if (time > 27000) {
      stopAnimation();
      return (animationFrameId = requestAnimationFrame(animate));
    }
    const defaultPacketPositions = getDefaultPacketPositions();
    packetPosition.forEach((position, idx) => {
      const [px, py] = position;
      const packetStartTime = idx * 1000;
      if (time < packetStartTime) {
        packetPosition[idx] = [
          0,
          idx === 0
            ? vPad - roadWidth / 2
            : idx === 5
            ? height / 2 - packetSize / 2
            : idx === 10
            ? height - vPad - (3 * roadWidth) / 2
            : (idx * height) / 10 - roadWidth / 2,
        ];
        return;
      }
      let newPx = px,
        newPy = py;
      const cp12y = height / 2 - packetSize / 2;
      const storageBaseY = height / 2 - roadWidth / 2;
      const checkpoints = [
        packetStartTime + 750, // 1st turn
        packetStartTime + 1500, // 1st intersection
        packetStartTime + 1800, // storage
        packetStartTime + 2000, // top of storage
        packetStartTime + 13000, // Still in storage
        packetStartTime + 13200, // back to the road
        packetStartTime + 14000, // 2nd intersection
        packetStartTime + 14750, // last turn
        packetStartTime + 15500, // destination
      ];
      if (time < checkpoints[0]) {
        const cp1xPos = cp1x - packetSize / 2;
        const t0 = packetStartTime;
        const t1 = checkpoints[0];
        newPx = (cp1xPos * (time - t0)) / (t1 - t0);
      } else if (time < checkpoints[1]) {
        const t0 = checkpoints[0];
        const t1 = checkpoints[1];
        const y0 = defaultPacketPositions[idx][1];
        newPy = y0 + ((cp12y - y0) * (time - t0)) / (t1 - t0);
      } else if (time < checkpoints[2]) {
        const targetX = packetStorageX - packetSize;
        newPx = targetX - (targetX * (checkpoints[2] - time)) / 1000;
      } else if (time < checkpoints[3]) {
        if (processingPacket === null) {
          processingPacket = idx + 1;
        }
        const targetX = packetStorageX - packetSize;
        newPx = targetX;
        const t0 = checkpoints[2];
        const t1 = checkpoints[3];
        const y0 = cp12y;
        const y1 = storageBaseY - (idx + 1) * packetSize;
        newPy = y0 + ((y1 - y0) * (time - t0)) / (t1 - t0);
      } else if (time <= checkpoints[4]) {
        packetsAtStorage.add(idx);
      } else if (time < checkpoints[5]) {
        processingPacket = idx + 1;
        const y0 = py;
        const t0 = checkpoints[4];
        const t1 = checkpoints[5];
        newPy = y0 + ((cp12y - y0) * (time - t0)) / (t1 - t0);
        const delta = newPy - py;
        for (
          let i = idx;
          i <= Math.min(idx + packetsAtStorage.size, packetPosition.length - 1);
          i++
        ) {
          packetPosition[i][1] += delta;
        }
        newPy = packetPosition[idx][1];
      } else if (time < checkpoints[6]) {
        packetsAtStorage.delete(idx);
        if (!packetsAtStorage.size) {
          processingPacket = null;
        }
        const x1 = cp2x - packetSize / 2;
        const x0 = packetStorageX - packetSize;
        const t0 = checkpoints[5],
          t1 = checkpoints[6];
        newPx = x0 + ((x1 - x0) * (time - t0)) / (t1 - t0);
      } else if (time < checkpoints[7]) {
        const y1 = defaultPacketPositions[idx][1];
        const y0 = cp12y;
        const t0 = checkpoints[6],
          t1 = checkpoints[7];
        newPy = y0 + ((y1 - y0) * (time - t0)) / (t1 - t0);
      } else {
        const x1 = width - packetSize;
        const x0 = cp2x;
        const t0 = checkpoints[7],
          t1 = checkpoints[8];
        newPx = Math.min(x1, x0 + ((x1 - x0) * (time - t0)) / (t1 - t0));
      }
      packetPosition[idx] = [newPx, newPy];
    });
    drawCanvas();
    animationFrameId = requestAnimationFrame(animate);
  };

  return {
    setDimensions: (width: number, height: number) => {
      stopAnimation();
      canvas.width = width;
      canvas.height = height;
      clientRect.width = width;
      clientRect.height = height;
      cp1x = 0.25 * width;
      cp2x = 0.75 * width;
      mid = [width / 2, height / 2];
      setRoadWidth((height * 0.075) / 4);
      setPacketSize();
      packetPosition = getDefaultPacketPositions();
      setRoads();
      drawCanvas();
      window.requestAnimationFrame(animate);
    },
  };
};

export const Overwhelmed: React.FC = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      return;
    }
    const canvas = Canvas(canvasRef.current);
    let timeout: NodeJS.Timeout | undefined = undefined;
    const observer = new ResizeObserver((entries) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        const container = entries[0];
        const { contentRect } = container;
        const { width } = contentRect;
        const canvasWidth = width * 0.6;
        canvas.setDimensions(canvasWidth, (canvasWidth * 9) / 16);
      }, 100);
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <div className={styles.canvas_container} ref={containerRef}>
      <canvas ref={canvasRef} />
      <p>Figure: An overburdened single courier office</p>
    </div>
  );
};
