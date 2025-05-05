import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { Point2D, RectPoints } from "src/types/geometry";
import { Colors } from "src/constants/theme";
import { Rect2D } from "src/entities/geometry/Rect2D";
import { House, Office } from "src/types/tutorials/animation_entities";

class NetworkElement {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "router" | "pc" | "smartphone";
  label: string;
  connected: NetworkElement[];
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    type: "router" | "pc" | "smartphone",
    label: string,
    connected: NetworkElement[]
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.label = label;
    this.connected = connected;
  }
}

const CourierCanvas = function (canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  const clientRect = canvas.getBoundingClientRect();
  /**
   * Horizontal Padding = 0.1 * width
   */
  let hPad = 0;
  /**
   * Vertical Padding = .1 * height;
   */
  let vPad = 0;
  let roadWidth = 0;
  let roads: Point2D[][] = [];
  let animationFrameId: number | null = null;
  let animationPaths: { from: Point2D; to: Point2D; points: Point2D[] }[] = [];
  let currentPathIndex = 0;
  let currentPointIndex = 0;
  let packetPaused = false;
  let packetPosition: Point2D = [0, 0];
  let pauseTime = 0;
  let routerMessage = "";
  let routerMessagePosition = {
    x: 0,
    y: 0,
  };
  let routerMessageVisible = false;

  const setPadding = () => {
    const { width, height } = clientRect;
    hPad = width * 0.05;
    vPad = height * 0.05;
  };

  const setRoadWidth = (width: number) => {
    roadWidth = width;
  };

  const setRoads = () => {
    const { width, height } = clientRect;
    roads = [
      [
        [hPad + height * 0.075, vPad + 0.125 * height],
        [hPad + height * 0.075, 0.5 * height],
        [width - hPad - height * 0.075, 0.5 * height],
        [width - hPad - height * 0.075, vPad + 0.125 * height],
      ],
      [
        [0.5 * width, 0.5 * height],
        [0.5 * width, height - vPad],
        [0.75 * width, height - vPad],
        [0.75 * width, 0.95 * height - vPad],
      ],
    ];
  };

  const getHouseDims = (start: Point2D): House => {
    const [x, y] = start;
    const { height: clientHeight } = clientRect;
    const roofHeight = clientHeight * 0.075;
    const roofWidth = roofHeight * 2;
    const roofHypotenuse = roofWidth;
    const wallHeight = clientHeight * 0.05;
    const midX = x + roofWidth / 2;
    const doorWidth = roofWidth / 8;
    const doorHeight = wallHeight;
    return {
      roof: [
        [x, y + roofHeight],
        [midX, y],
        [x + roofWidth, y + roofHeight],
      ],
      wallColor: Colors.accent + "77",
      wall: [
        [x + roofHypotenuse * 0.15, y + roofHeight - roofHypotenuse * 0.15],
        [x + roofHypotenuse * 0.15, y + roofHeight + wallHeight],
        [x + roofWidth - roofHypotenuse * 0.15, y + roofHeight + wallHeight],
        [
          x + roofWidth - roofHypotenuse * 0.15,
          y + roofHeight - roofHypotenuse * 0.15,
        ],
      ],
      door: [
        [midX - doorWidth, y + roofHeight + wallHeight],
        [midX - doorWidth, y + roofHeight + wallHeight - doorHeight],
        [midX + doorWidth, y + roofHeight + wallHeight - doorHeight],
        [midX + doorWidth, y + roofHeight + wallHeight],
      ],
      doorColor: Colors.complementary,
    };
  };

  const getOfficeDims = (
    mid: Point2D,
    width: number,
    height: number,
    label: string
  ): Office => {
    const [midX, midY] = mid;
    const roofWidth = (3 * width) / 4;
    const roofHeight = height / 4;
    const doorWidth = width / 8,
      doorHeight = height / 3;
    const wallStart: Point2D = [midX - width / 2, midY - roadWidth / 2];
    const wallEnd: Point2D = [midX + width / 2, midY - roadWidth / 2 - height];
    const wall = new Rect2D(wallStart, wallEnd).getPoints();
    const wallWidth = wallEnd[0] - wallStart[0];
    const roofStart: Point2D = [midX - roofWidth / 2, wall[2][1]];
    const roofEnd: Point2D = [midX + roofWidth / 2, wall[2][1] - roofHeight];
    const roof = new Rect2D(roofStart, roofEnd).getPoints();
    const doorStart: Point2D = [midX - doorWidth / 2, wall[0][1]];
    const doorEnd: Point2D = [midX + doorWidth / 2, wall[0][1] - doorHeight];
    const door = new Rect2D(doorStart, doorEnd).getPoints();
    if (label === "COURIER") {
      routerMessagePosition = {
        x: door[2][0],
        y: door[2][1],
      };
    }
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

  const drawHouse = (ctx: CanvasRenderingContext2D, house: House) => {
    const { roof, wall, wallColor, door, doorColor } = house;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.beginPath();
    const midRoof = roof[1];
    for (let i = 0; i < roof.length - 1; i++) {
      const [x, y] = roof[i];
      const [nextX, nextY] = roof[i + 1];
      ctx.moveTo(x, y);
      ctx.lineTo(nextX, nextY);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(...wall[0]);
    for (let i = 1; i < wall.length; i++) {
      ctx.lineTo(...wall[i]);
    }
    ctx.stroke();
    ctx.strokeStyle = "transparent";
    ctx.lineTo(midRoof[0], midRoof[1]);
    ctx.closePath();
    ctx.fillStyle = wallColor;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = doorColor;
    ctx.moveTo(...door[0]);
    for (let i = 1; i < door.length; i++) {
      ctx.lineTo(...door[i]);
    }
    ctx.fill();
    ctx.closePath();
    ctx.restore();
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
    mid: Point2D,
    width: number,
    height: number,
    label: string
  ) => {
    const { wall, door, roof, windows } = getOfficeDims(
      mid,
      width,
      height,
      label
    );
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
    ctx.font = ".5rem Roboto";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      label,
      (roof[0][0] + roof[2][0]) / 2,
      roof[2][1] + (roof[0][1] - roof[2][1]) / 2
    );
    ctx.closePath();
    ctx.restore();
  };

  const drawCanvas = () => {
    const { width, height } = clientRect;
    if (!ctx) {
      return;
    }
    // Clear the existing rect
    ctx.clearRect(0, 0, width, height);
    drawRoads(ctx);
    drawHouse(ctx, getHouseDims([hPad, vPad]));
    drawHouse(ctx, getHouseDims([width - hPad - height * 0.15, vPad]));
    const courierOfficeWidth = width * 0.25;
    const courierOfficeHeight = height * 0.25;
    const courierOfficeMid: Point2D = [width / 2, roads[1][0][1]];
    drawOffice(
      ctx,
      courierOfficeMid,
      courierOfficeWidth,
      courierOfficeHeight,
      "COURIER"
    );
    const destWidth = width * 0.125;
    const destHeight = (destWidth * 4) / 3;
    const destMid: Point2D = roads[1][3];
    drawOffice(ctx, destMid, destWidth, destHeight, "TARGET");
    drawPacket();
    drawRouterMessage();
  };

  // Generate animation path
  const generateAnimationPath = (from: Point2D, to: Point2D) => {
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    // Generate points for smooth animation
    const points: Point2D[] = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      points.push([
        fromX + (toX - fromX) * progress,
        fromY + (toY - fromY) * progress,
      ]);
    }

    return {
      from,
      to,
      points,
    };
  };

  // Setup animation paths
  const setupAnimationPaths = () => {
    const { width } = clientRect;
    animationPaths = [];

    // Path from Home 1 to intersection
    animationPaths.push(generateAnimationPath(roads[0][0], roads[0][1]));

    const courierDoorstep: Point2D = [width / 2, roads[0][1][1]];
    const courierInterior: Point2D = [width / 2, roads[0][1][1] - 10];
    // Path from intersection to courier doorstep
    animationPaths.push(generateAnimationPath(roads[0][1], courierDoorstep));

    // Path from courier doorstep to inside
    animationPaths.push(
      generateAnimationPath(courierDoorstep, courierInterior)
    );
    // courier to intersection
    animationPaths.push(generateAnimationPath(courierInterior, roads[1][1]));
    // intersection to next intersection
    animationPaths.push(generateAnimationPath(roads[1][1], roads[1][2]));
    // intersection to target
    animationPaths.push(generateAnimationPath(roads[1][2], roads[1][3]));
    // Reset animation
    currentPathIndex = 0;
    currentPointIndex = 0;
    packetPaused = false;

    // Set initial packet position
    if (animationPaths.length > 0 && animationPaths[0].points.length > 0) {
      packetPosition = animationPaths[0].points[0];
    }
  };

  // Animation loop
  const animate = (timestamp: number) => {
    if (!animationPaths.length) return;

    // Update packet position
    if (!packetPaused) {
      if (currentPointIndex < animationPaths[currentPathIndex].points.length) {
        packetPosition =
          animationPaths[currentPathIndex].points[currentPointIndex];
        currentPointIndex++;
      } else {
        // Reached end of current path
        currentPointIndex = 0;

        // Check if we're at the courier office
        const currentElement = animationPaths[currentPathIndex].to;
        if (
          currentElement[0] === clientRect.width / 2 &&
          currentElement[1] === roads[0][1][1] - 10
        ) {
          // Pause at the courier office
          packetPaused = true;
          pauseTime = timestamp;
          routerMessage = `Redirecting package...`;
          routerMessageVisible = true;
        }

        // Move to next path
        currentPathIndex++;

        // If we're at the end of all paths, reset
        if (currentPathIndex >= animationPaths.length) {
          currentPathIndex = 0;
          // Add a short delay before restarting
          packetPaused = true;
          pauseTime = timestamp;
          routerMessageVisible = false;
        }
      }
    } else {
      // Check if we should resume
      const pauseDuration = currentPathIndex === 0 ? 1000 : 2000; // 1s at end, 2s at routers
      if (timestamp - pauseTime > pauseDuration) {
        packetPaused = false;
        routerMessageVisible = false;
      }
    }

    // Draw the canvas
    drawCanvas();

    // Continue animation
    animationFrameId = requestAnimationFrame(animate);
  };

  // Draw packet
  const drawPacket = () => {
    if (!ctx) return;

    ctx.fillStyle = Colors.complementary;
    ctx.beginPath();
    ctx.arc(...packetPosition, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawRouterMessage = () => {
    if (!ctx || !routerMessageVisible) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(
      routerMessagePosition.x - 70,
      routerMessagePosition.y - 40,
      140,
      30
    );

    ctx.fillStyle = "#FFF";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      routerMessage,
      routerMessagePosition.x,
      routerMessagePosition.y - 20
    );
  };

  // Start animation
  const startAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    setupAnimationPaths();
    animationFrameId = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  setPadding();
  return {
    setDimensions: (width: number, height: number) => {
      stopAnimation();
      canvas.height = height;
      canvas.width = width;
      clientRect.height = height;
      clientRect.width = width;
      setPadding();
      setRoadWidth((height * 0.075) / 4);
      setRoads();
      drawCanvas();
      startAnimation();
    },
    startAnimation,
    stopAnimation,
  };
};

const NetworkCanvas = function (canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  let clientRect = canvas.getBoundingClientRect();
  /**
   * Horizontal Padding = 0.1 * width
   */
  let hPad = 0;

  // Animation properties
  let animationFrameId: number | null = null;
  let packetPosition = { x: 0, y: 0 };
  let currentPathIndex = 0;
  let currentPointIndex = 0;
  let animationPaths: {
    from: NetworkElement;
    to: NetworkElement;
    points: { x: number; y: number }[];
  }[] = [];
  let packetPaused = false;
  let pauseTime = 0;
  let routerMessage = "";
  let routerMessagePosition = { x: 0, y: 0 };
  let routerMessageVisible = false;

  // Create network elements
  const routerA = new NetworkElement(0, 0, 80, 60, "router", "Router A", []);

  const routerB = new NetworkElement(0, 0, 80, 60, "router", "Router B", []);

  const devicesA: NetworkElement[] = [
    new NetworkElement(0, 0, 60, 50, "pc", "PC A1", [routerA]),
    new NetworkElement(0, 0, 60, 50, "pc", "PC A2", [routerA]),
    new NetworkElement(0, 0, 40, 60, "smartphone", "Phone A1", [routerA]),
  ];

  const devicesB: NetworkElement[] = [
    new NetworkElement(0, 0, 60, 50, "pc", "PC B1", [routerB]),
    new NetworkElement(0, 0, 60, 50, "pc", "PC B2", [routerB]),
    new NetworkElement(0, 0, 40, 60, "smartphone", "Phone B1", [routerB]),
  ];

  // Connect devices to routers
  routerA.connected = [...devicesA, routerB];
  routerB.connected = [...devicesB, routerA];
  const routers = [routerA, routerB];
  // All elements
  const allElements: NetworkElement[] = [
    routerA,
    routerB,
    ...devicesA,
    ...devicesB,
  ];

  const setPadding = () => {
    const { width } = clientRect;
    hPad = width * 0.05;
  };

  const resizeElements = () => {
    const { width, height } = clientRect;
    for (let router of routers) {
      router.height = height * 0.125;
      router.width = width * 0.125;
    }
    for (let device of [...devicesA, ...devicesB]) {
      const { type } = device;
      device.height = type === "pc" ? height * 0.15 : height * 0.125;
      device.width = type === "pc" ? width * 0.1 : width * 0.06;
    }
  };

  // Position elements based on canvas size
  const positionElements = () => {
    const { width, height } = clientRect;

    // Position routers
    routerA.x = width * 0.25;
    routerA.y = height * 0.5 - routerA.height / 2;

    routerB.x = width * 0.75 - routerB.width;
    routerB.y = height * 0.5 - routerB.height / 2;

    // Position devices for Router A
    devicesA[0].x = hPad;
    devicesA[0].y = height * 0.25 - devicesA[0].height / 2;

    devicesA[1].x = hPad;
    devicesA[1].y = height * 0.5 - devicesA[1].height / 2;

    devicesA[2].x = hPad + 10;
    devicesA[2].y = height * 0.75 - devicesA[2].height / 2;

    // Position devices for Router B
    devicesB[0].x = width - devicesB[0].width - hPad;
    devicesB[0].y = height * 0.25 - devicesB[0].height / 2;

    devicesB[1].x = width - devicesB[1].width - hPad;
    devicesB[1].y = height * 0.5 - devicesB[1].height / 2;

    devicesB[2].x = width - devicesB[2].width - hPad - 10;
    devicesB[2].y = height * 0.75 - devicesB[2].height / 2;
  };

  // Draw a network element
  const drawNetworkElement = (element: NetworkElement) => {
    if (!ctx) return;

    ctx.save();

    // Draw element based on type
    switch (element.type) {
      case "router":
        // Router body
        ctx.fillStyle = Colors.accent;
        ctx.fillRect(element.x, element.y, element.width, element.height);

        // Router antennas
        ctx.fillStyle = "#000";
        ctx.fillRect(element.x + element.width * 0.3, element.y - 10, 5, 10);
        ctx.fillRect(element.x + element.width * 0.7, element.y - 10, 5, 10);

        // Router lights
        ctx.fillStyle = "#0F0";
        ctx.beginPath();
        ctx.arc(
          element.x + element.width * 0.25,
          element.y + element.height * 0.3,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = "#FF0";
        ctx.beginPath();
        ctx.arc(
          element.x + element.width * 0.5,
          element.y + element.height * 0.3,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = "#0FF";
        ctx.beginPath();
        ctx.arc(
          element.x + element.width * 0.75,
          element.y + element.height * 0.3,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
        break;

      case "pc":
        // Monitor
        ctx.fillStyle = "#333";
        ctx.lineCap = "round";
        ctx.fillRect(element.x, element.y, element.width, element.height * 0.7);

        // Stand
        ctx.fillStyle = "#555";
        ctx.fillRect(
          element.x + element.width * 0.4,
          element.y + element.height * 0.7,
          element.width * 0.2,
          element.height * 0.1
        );

        // Base
        ctx.fillStyle = "#777";
        ctx.fillRect(
          element.x + element.width * 0.25,
          element.y + element.height * 0.8,
          element.width * 0.5,
          element.height * 0.2
        );
        break;

      case "smartphone":
        // Phone body
        ctx.fillStyle = "#484848";
        ctx.fillRect(element.x, element.y, element.width, element.height);

        // Screen
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(
          element.x + 3,
          element.y + 3,
          element.width - 6,
          element.height - 12
        );

        // Home button
        ctx.fillStyle = "#DDD";
        ctx.beginPath();
        ctx.arc(
          element.x + element.width / 2,
          element.y + element.height - 6,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
        break;
    }

    // Draw label
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      element.label,
      element.x + element.width / 2,
      element.y + element.height + 15
    );

    ctx.restore();
  };

  // Draw connection between elements
  const drawConnection = (from: NetworkElement, to: NetworkElement) => {
    if (!ctx) return;

    const fromX = from.x + from.width / 2;
    const fromY = from.y + from.height / 2;
    const toX = to.x + to.width / 2;
    const toY = to.y + to.height / 2;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Draw packet
  const drawPacket = () => {
    if (!ctx) return;

    ctx.fillStyle = Colors.complementary;
    ctx.beginPath();
    ctx.arc(packetPosition.x, packetPosition.y, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw router message
  const drawRouterMessage = () => {
    if (!ctx || !routerMessageVisible) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(
      routerMessagePosition.x - 70,
      routerMessagePosition.y - 40,
      140,
      30
    );

    ctx.fillStyle = "#FFF";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      routerMessage,
      routerMessagePosition.x,
      routerMessagePosition.y - 20
    );
  };

  // Generate animation path
  const generateAnimationPath = (from: NetworkElement, to: NetworkElement) => {
    const fromX = from.x + from.width / 2;
    const fromY = from.y + from.height / 2;
    const toX = to.x + to.width / 2;
    const toY = to.y + to.height / 2;

    // Generate points for smooth animation
    const points = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      points.push({
        x: fromX + (toX - fromX) * progress,
        y: fromY + (toY - fromY) * progress,
      });
    }

    return {
      from,
      to,
      points,
    };
  };

  // Setup animation paths
  const setupAnimationPaths = () => {
    animationPaths = [];

    // Path from PC A1 to Router A
    animationPaths.push(generateAnimationPath(devicesA[0], routerA));

    // Path from Router A to Router B
    animationPaths.push(generateAnimationPath(routerA, routerB));

    // Path from Router B to PC B1
    animationPaths.push(generateAnimationPath(routerB, devicesB[0]));

    // Reset animation
    currentPathIndex = 0;
    currentPointIndex = 0;
    packetPaused = false;

    // Set initial packet position
    if (animationPaths.length > 0 && animationPaths[0].points.length > 0) {
      packetPosition = { ...animationPaths[0].points[0] };
    }
  };

  // Animation loop
  const animate = (timestamp: number) => {
    if (!animationPaths.length) return;

    // Update packet position
    if (!packetPaused) {
      if (currentPointIndex < animationPaths[currentPathIndex].points.length) {
        packetPosition = {
          ...animationPaths[currentPathIndex].points[currentPointIndex],
        };
        currentPointIndex++;
      } else {
        // Reached end of current path
        currentPointIndex = 0;

        // Check if we're at a router
        const currentElement = animationPaths[currentPathIndex].to;
        if (currentElement.type === "router") {
          // Pause at router
          packetPaused = true;
          pauseTime = timestamp;
          routerMessage = `Redirecting packet...`;
          routerMessagePosition = {
            x: currentElement.x + currentElement.width / 2,
            y: currentElement.y,
          };
          routerMessageVisible = true;
        }

        // Move to next path
        currentPathIndex++;

        // If we're at the end of all paths, reset
        if (currentPathIndex >= animationPaths.length) {
          currentPathIndex = 0;
          // Add a short delay before restarting
          packetPaused = true;
          pauseTime = timestamp;
          routerMessageVisible = false;
        }
      }
    } else {
      // Check if we should resume
      const pauseDuration = currentPathIndex === 0 ? 1000 : 2000; // 1s at end, 2s at routers
      if (timestamp - pauseTime > pauseDuration) {
        packetPaused = false;
        routerMessageVisible = false;
      }
    }

    // Draw the canvas
    drawCanvas();

    // Continue animation
    animationFrameId = requestAnimationFrame(animate);
  };

  // Start animation
  const startAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    setupAnimationPaths();
    animationFrameId = requestAnimationFrame(animate);
  };

  // Draw the canvas
  const drawCanvas = () => {
    const { width, height } = clientRect;
    if (!ctx) {
      return;
    }
    // Clear the existing rect
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    // Connection between routers
    drawConnection(routerA, routerB);

    // Connections between devices and routers
    for (const device of devicesA) {
      drawConnection(device, routerA);
    }

    for (const device of devicesB) {
      drawConnection(device, routerB);
    }

    // Draw elements
    for (const element of allElements) {
      drawNetworkElement(element);
    }

    // Draw packet
    drawPacket();

    // Draw router message
    drawRouterMessage();
  };

  // Initialize
  setPadding();
  resizeElements();
  positionElements();
  setupAnimationPaths();
  startAnimation();

  return {
    setDimensions: (width: number, height: number) => {
      canvas.height = height;
      canvas.width = width;
      clientRect = canvas.getBoundingClientRect();
      setPadding();
      resizeElements();
      positionElements();
      setupAnimationPaths();
      drawCanvas();
    },
    startAnimation: () => {
      startAnimation();
    },
    stopAnimation: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
  };
};

export const RoutingExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const courierRef = useRef<HTMLCanvasElement>(null);
  const netRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!containerRef.current || !courierRef.current || !netRef.current) {
      return;
    }
    const courierCanvas = CourierCanvas(courierRef.current);
    const netCanvas = NetworkCanvas(netRef.current);
    let timeout: NodeJS.Timeout | undefined = undefined;
    const resizeObserver = new ResizeObserver((entries) => {
      const { contentRect } = entries[0];
      const { width } = contentRect;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        const canvasWidth = width / 2;
        const canvasHeight = (9 * canvasWidth) / 16;
        courierCanvas.setDimensions(canvasWidth, canvasHeight);
        netCanvas.setDimensions(canvasWidth, canvasHeight);
      }, 100);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  return (
    <div ref={containerRef} id={styles.routing_example_container}>
      <div>
        <canvas ref={courierRef} />
        <p>1: Routing of Shipments by a Courier</p>
      </div>
      <div>
        <canvas ref={netRef} />
        <p>2: Routing of Packets by a Network</p>
      </div>
    </div>
  );
};
