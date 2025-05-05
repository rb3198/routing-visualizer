import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { Point2D } from "src/types/geometry";
import { Colors } from "src/constants/theme";
import { getTextDimensions } from "src/utils/drawing";

type Hub = {
  location: Point2D;
  label?: string;
  // fill: string;
  serves: string[];
  radius: number;
  children: Hub[];
};

type Subtitle = {
  labels: string[];
  position: Point2D;
};

type Animation = {
  from: Point2D;
  to: Point2D;
  start: number;
  end: number;
  title: string;
  subtitle?: Subtitle | null;
};

type Connection = { from: Point2D; to: Point2D };

const Canvas = (canvas: HTMLCanvasElement) => {
  const clientRect = canvas.getBoundingClientRect();
  let [localHubRadius, regionalHubRadius, nationalHubRadius] = [0, 0, 0];
  let hubs: Hub[] = [];
  let connections: Connection[] = [];
  let animationFrameId: number | null = null;
  let packetPosition: Point2D = [-20, -20];
  let time = 0,
    startTime = 0,
    animationIdx = 0;
  let animations: Animation[] = [];
  let subtitle: Subtitle | null | undefined = null;
  let title: string | null = null;

  const createConnections = (hub: Hub) => {
    const { children, location: pLocation } = hub;
    for (let child of children) {
      const { location: cLocation } = child;
      connections.push({ from: pLocation, to: cLocation });
      createConnections(child);
    }
  };

  const getLabelPosition = (
    nodePosition: Point2D,
    nodeRadius: number,
    position: "left" | "bottom" | "right",
    labels: string[]
  ): Point2D => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return [-20, -20];
    }
    let textWidth = 0,
      textHeight = 0;
    const [nodeX, nodeY] = nodePosition;
    let x = 0,
      y = 0;
    for (let label of labels) {
      const { width, height } = getTextDimensions(ctx, label);
      textWidth = Math.max(width, textWidth);
      textHeight += height;
    }
    if (position === "left") {
      x = nodeX - nodeRadius - 5 - textWidth;
      y = nodeY;
    } else if (position === "right") {
      x = nodeX + nodeRadius + 5;
      y = nodeY;
    } else {
      x = nodeX - nodeRadius;
      y = nodeY + nodeRadius + 10 + textHeight / 2;
    }
    return [x, y];
  };

  const setHubs = () => {
    const { width } = clientRect;
    const chicagoHub: Hub = {
      label: "Chicago, IL",
      serves: ["606xx"],
      location: [regionalHubRadius * 2, localHubRadius * 5],
      radius: regionalHubRadius,
      children: [
        {
          location: [1.1 * localHubRadius, 1.1 * localHubRadius],
          children: [],
          radius: localHubRadius,
          serves: ["60666"],
        },
        {
          location: [localHubRadius * 5, localHubRadius * 2],
          children: [],
          radius: localHubRadius,
          serves: ["60661"],
        },
      ],
    };
    const detroitHub: Hub = {
      label: "Detroit, MI",
      serves: ["481xx", "482xx"],
      location: [regionalHubRadius * 7, regionalHubRadius * 4],
      radius: regionalHubRadius,
      children: [
        {
          location: [regionalHubRadius * 6, localHubRadius * 2],
          children: [],
          radius: localHubRadius,
          serves: ["48127"],
        },
        {
          location: [regionalHubRadius * 8, localHubRadius * 3],
          children: [],
          radius: localHubRadius,
          serves: ["48201"],
        },
      ],
    };
    const midwestHub: Hub = {
      label: "Midwest National Hub",
      serves: ["4xxxx", "6xxxx"],
      location: [0.2 * width, localHubRadius * 10],
      radius: nationalHubRadius,
      children: [chicagoHub, detroitHub],
    };
    const bostonHub: Hub = {
      label: "Boston, MA",
      children: [
        {
          children: [],
          serves: ["02115"],
          location: [
            width - 3 * regionalHubRadius - 2 * localHubRadius,
            localHubRadius * 2,
          ],
          radius: localHubRadius,
        },
        {
          children: [],
          serves: ["02203"],
          location: [
            width - 2 * regionalHubRadius + 1.8 * localHubRadius,
            localHubRadius * 2,
          ],
          radius: localHubRadius,
        },
      ],
      location: [width - 4 * regionalHubRadius, localHubRadius * 6],
      serves: ["021xx", "022xx"],
      radius: regionalHubRadius,
    };
    const nyHub: Hub = {
      label: "New York, NY",
      children: [
        {
          children: [],
          serves: ["10001"],
          location: [
            width - 2 * regionalHubRadius - 2 * localHubRadius,
            localHubRadius * 14,
          ],
          radius: localHubRadius,
        },
        {
          children: [],
          serves: ["10203"],
          location: [
            width - 2 * regionalHubRadius + 1.8 * localHubRadius,
            localHubRadius * 14,
          ],
          radius: localHubRadius,
        },
      ],
      location: [width - 2 * regionalHubRadius, localHubRadius * 10],
      serves: ["100xx-104xx", "110xx"],
      radius: regionalHubRadius,
    };
    const neHub: Hub = {
      label: "Northeast National Hub",
      serves: ["0xxxx", "1xxxx"],
      children: [nyHub, bostonHub],
      location: [0.6 * width, localHubRadius * 10],
      radius: nationalHubRadius,
    };
    hubs = [midwestHub, neHub];
    connections = [{ from: midwestHub.location, to: neHub.location }];
    hubs.forEach((hub) => createConnections(hub));
    const titles = [
      "Routing a package from Chicago, 60666 to Chicago, 60661",
      "Routing a package from Chicago, 60666 to Detroit, 48127",
      "Routing a package from Chicago, 60666 to New York, 10001",
    ];
    packetPosition = chicagoHub.children[0].location;
    animations = [
      {
        from: chicagoHub.children[0].location,
        to: chicagoHub.location,
        start: 0,
        end: 1000,
        title: titles[0],
        subtitle: null,
      },
      {
        from: chicagoHub.location,
        to: chicagoHub.location,
        start: 1000,
        end: 3000,
        title: titles[0],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routed to the office handling",
            "60661 for last mile delivery.",
          ],
          position: getLabelPosition(
            chicagoHub.location,
            chicagoHub.radius,
            "right",
            [
              "Processing the package...",
              "Routed to the office handling",
              "60661 for last mile delivery.",
            ]
          ),
        },
      },
      {
        from: chicagoHub.location,
        to: chicagoHub.children[1].location,
        start: 3000,
        end: 4000,
        title: titles[0],
      },
      {
        from: chicagoHub.children[1].location,
        to: chicagoHub.children[1].location,
        start: 4000,
        end: 5000,
        title: "Delivered!",
      },
      {
        from: chicagoHub.children[0].location,
        to: chicagoHub.location,
        start: 5000,
        end: 6000,
        title: titles[1],
      },
      {
        from: chicagoHub.location,
        to: chicagoHub.location,
        start: 6000,
        end: 8000,
        title: titles[1],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routed to the Midwest National Hub",
            "since Midwest National Hub",
            "handles 4xxxx deliveries.",
          ],
          position: getLabelPosition(
            chicagoHub.location,
            chicagoHub.radius,
            "right",
            [
              "Processing the package...",
              "Routed to the Midwest National Hub",
              "since Midwest National Hub",
              "handles 4xxxx deliveries.",
            ]
          ),
        },
      },
      {
        from: chicagoHub.location,
        to: midwestHub.location,
        start: 8000,
        end: 9000,
        title: titles[1],
      },
      {
        from: midwestHub.location,
        to: midwestHub.location,
        start: 9000,
        end: 11000,
        title: titles[1],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routed to the Detroit Hub",
            "since the Detroit Hub handles 481xx & 482xx deliveries.",
          ],
          position: getLabelPosition(
            midwestHub.location,
            midwestHub.radius,
            "bottom",
            [
              "Processing the package...",
              "Routed to the Detroit Hub",
              "since the Detroit Hub handles 481xx & 482xx deliveries.",
            ]
          ),
        },
      },
      {
        from: midwestHub.location,
        to: detroitHub.location,
        title: titles[1],
        start: 11000,
        end: 12000,
      },
      {
        from: detroitHub.location,
        to: detroitHub.location,
        title: titles[1],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routed to the office handling 48127 for last mile deliveries.",
          ],
          position: getLabelPosition(
            detroitHub.location,
            detroitHub.radius,
            "right",
            [
              "Processing the package...",
              "Routed to the office handling 48127 for last mile deliveries.",
            ]
          ),
        },
        start: 12000,
        end: 14000,
      },
      {
        from: detroitHub.location,
        to: detroitHub.children[0].location,
        title: titles[1],
        start: 14000,
        end: 15000,
      },
      {
        from: detroitHub.children[0].location,
        to: detroitHub.children[0].location,
        title: "Delivered!",
        start: 15000,
        end: 16000,
      },
      {
        from: chicagoHub.children[0].location,
        to: chicagoHub.location,
        start: 16000,
        end: 17000,
        title: titles[2],
      },
      {
        from: chicagoHub.location,
        to: chicagoHub.location,
        start: 17000,
        end: 19000,
        title: titles[2],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routing to the Northeast National Hub",
            "through the Midwest National Hub",
            "since NE National Hub handles",
            "deliveries for 1xxxx",
          ],
          position: getLabelPosition(
            chicagoHub.location,
            chicagoHub.radius,
            "right",
            [
              "Processing the package...",
              "Routing to the Northeast National Hub",
              "through the Midwest National Hub",
              "since NE National Hub handles",
              "deliveries for 1xxxx",
            ]
          ),
        },
      },
      {
        from: chicagoHub.location,
        to: midwestHub.location,
        start: 19000,
        end: 20000,
        title: titles[2],
      },
      {
        from: midwestHub.location,
        to: midwestHub.location,
        start: 20000,
        end: 22000,
        title: titles[2],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routing to the Northeast National Hub",
            "since it handles deliveries for 1xxxx",
          ],
          position: getLabelPosition(
            midwestHub.location,
            midwestHub.radius,
            "bottom",
            [
              "Processing the package...",
              "Routing to the Northeast National Hub",
              "since it handles deliveries for 1xxxx",
            ]
          ),
        },
      },
      {
        from: midwestHub.location,
        to: neHub.location,
        start: 22000,
        end: 23000,
        title: titles[2],
      },
      {
        from: neHub.location,
        to: neHub.location,
        start: 23000,
        end: 25000,
        title: titles[2],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routing to the New York Regional Hub",
            "since it handles deliveries for 100xx",
          ],
          position: getLabelPosition(neHub.location, neHub.radius, "bottom", [
            "Processing the package...",
            "Routing to the New York Regional Hub",
            "since it handles deliveries for 100xx",
          ]),
        },
      },
      {
        from: neHub.location,
        to: nyHub.location,
        start: 25000,
        end: 26000,
        title: titles[2],
      },
      {
        from: nyHub.location,
        to: nyHub.location,
        start: 26000,
        end: 28000,
        title: titles[2],
        subtitle: {
          labels: [
            "Processing the package...",
            "Routing to the office handling",
            "last mile deliveries for 10001",
          ],
          position: getLabelPosition(nyHub.location, nyHub.radius, "bottom", [
            "Processing the package...",
            "Routing to the office handling",
            "last mile deliveries for 10001",
          ]),
        },
      },
      {
        from: nyHub.location,
        to: nyHub.children[0].location,
        start: 28000,
        end: 29000,
        title: titles[2],
      },
      {
        from: nyHub.children[0].location,
        to: nyHub.children[0].location,
        start: 29000,
        end: 31000,
        title: "Delivered!",
      },
    ];
  };

  const setHubRadii = () => {
    const { height } = clientRect;
    nationalHubRadius = 0.125 * height;
    regionalHubRadius = 0.75 * nationalHubRadius;
    localHubRadius = 0.5 * nationalHubRadius;
  };

  const renderHub = (ctx: CanvasRenderingContext2D, hub: Hub) => {
    const { label, serves, location, radius, children } = hub;
    const [x, y] = location;
    ctx.beginPath();
    const texts = [...serves];
    label && texts.unshift(label);
    let textHeight = 0,
      textPos = y;
    ctx.font = `bold 55% Arial`;
    ctx.fillStyle = "white";
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    for (let text of texts) {
      ctx.fillStyle = "black";
      ctx.fillText(text, x, textPos, 2 * radius);
      textHeight = getTextDimensions(ctx, text).height;
      textPos += textHeight + 4;
      ctx.font = "55% Arial";
    }
    ctx.closePath();
    for (let child of children) {
      renderHub(ctx, child);
    }
  };

  const renderHubs = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = "#484848";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let hub of hubs) {
      renderHub(ctx, hub);
    }
    ctx.restore();
  };

  const renderConnections = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.lineWidth = 1;
    for (let connection of connections) {
      const { from, to } = connection;
      ctx.moveTo(...from);
      ctx.lineTo(...to);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawPacket = (ctx: CanvasRenderingContext2D) => {
    const { height } = clientRect;
    const packetSize = height * 0.05;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = Colors.complementary;
    ctx.arc(...packetPosition, packetSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };

  const renderText = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = clientRect;
    if (title) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.font = "70% Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const { height: textHeight, width: textWidth } = getTextDimensions(
        ctx,
        title
      );
      const x = width / 2,
        y = height - 2 * textHeight;
      ctx.fillRect(
        x - textWidth / 2 - 10,
        y - 1.5 * textHeight,
        textWidth + 20,
        3 * textHeight
      );
      ctx.fillStyle = "white";
      ctx.fillText(title, width / 2, height - 2 * textHeight);
      ctx.restore();
    }
    if (subtitle) {
      const { labels, position } = subtitle;
      const [x, y] = position;
      ctx.save();
      let yContainer: number = -Infinity;
      let containerHeight: number = 2;
      let containerWidth = 0;
      ctx.font = "60% Arial";
      const mid = Math.floor(labels.length / 2);
      const labelPos: Point2D[] = [];
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const { height: textHeight, width } = getTextDimensions(ctx, label);
        const yLabel =
          y + (i - mid) * textHeight + (i < mid ? -2 : i === mid ? 0 : 2);
        labelPos.push([x, yLabel]);
        if (yContainer === -Infinity) {
          yContainer = yLabel - textHeight;
        }
        if (width > containerWidth) {
          containerWidth = width;
        }
        containerHeight += textHeight + 2;
      }
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      yContainer !== -Infinity &&
        ctx.fillRect(x - 2, yContainer, containerWidth + 4, containerHeight);
      ctx.fillStyle = "#ddd";
      for (let i = 0; i < labelPos.length; i++) {
        const label = labels[i];
        ctx.fillText(label, ...labelPos[i]);
      }
      ctx.restore();
    }
  };

  const drawCanvas = () => {
    const { width, height } = clientRect;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, width, height);
    renderConnections(ctx);
    renderHubs(ctx);
    drawPacket(ctx);
    renderText(ctx);
  };

  const stopAnimation = () => {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }
    packetPosition = [-20, -20];
    time = 0;
    animationIdx = 0;
    subtitle = null;
    title = null;
  };

  const animate = (timestamp: number) => {
    if (time > animations[animationIdx].end) {
      animationIdx = (animationIdx + 1) % animations.length;
      if (!animationIdx) {
        startTime = timestamp;
      }
    }
    time = timestamp - startTime;
    const {
      start: animStart,
      end: animEnd,
      from,
      to,
    } = animations[animationIdx];
    title = animations[animationIdx].title;
    subtitle = animations[animationIdx].subtitle;
    if (time < animStart) {
      return window.requestAnimationFrame(animate);
    }
    const [fromX, fromY] = from,
      [toX, toY] = to;
    const x =
      fromX + ((toX - fromX) * (time - animStart)) / (animEnd - animStart);
    const y =
      fromY + ((toY - fromY) * (time - animStart)) / (animEnd - animStart);
    packetPosition = [x, y];
    drawCanvas();
    window.requestAnimationFrame(animate);
  };

  return {
    setDimensions: (width: number, height: number) => {
      stopAnimation();
      clientRect.width = width;
      clientRect.height = height;
      canvas.width = width;
      canvas.height = height;
      setHubRadii();
      setHubs();
      drawCanvas();
      animate(Date.now());
    },
  };
};

export const ScaledUpCourier: React.FC = (props) => {
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
        const canvasWidth = width > 800 ? width * 0.75 : width;
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
      <p>Figure: Our Improved, Scaled Network</p>
    </div>
  );
};
