import React from "react";
import { Colors } from "src/constants/theme";

export const Distribution: React.FC = () => {
  const renderRouter = (center: string) => {
    return (
      <g transform={`translate(${center})`}>
        <rect x={-20} y={10} width={40} height={10} fill={Colors.accent} />
        <path d="M-20,10 L0,0 L40,0 L20,10 L-20,10" fill={Colors.accent} />
        <path d="M40,0 L40,10 L20,20 L20,0" fill={Colors.accent} />
        <line x1={40} y1={0} x2={20} y2={10} stroke="white" strokeWidth={0.1} />
        <circle cx={-15} cy={15} r={2} fill="#2ECC71" />
        <circle cx={-5} cy={15} r={2} fill="#F39C12" />
        <line x1={5} y1={0} x2={5} y2={-20} strokeWidth={2} stroke="black" />
        <line x1={35} y1={0} x2={35} y2={-30} strokeWidth={2} stroke="black" />
        <rect
          x={0}
          y={12.5 + 2.5 / 2}
          width={15}
          height={2.5}
          rx="1"
          fill="white"
        />
      </g>
    );
  };

  const renderHomeNetwork = (center: string, idx: number) => {
    return (
      <g transform={`translate(${center})`} key={idx}>
        <circle
          x={0}
          y={0}
          r={40}
          fill={Colors.dd}
          fillOpacity={0.5}
          stroke={Colors.dd}
          strokeDasharray={`5,3`}
        />
        {/* Connection lines */}
        <line
          x1={-14}
          y1={-20}
          x2={0}
          y2={-4}
          stroke="#34495E"
          strokeWidth={1}
        />
        <line
          x1={12}
          y1={-25}
          x2={0}
          y2={-4}
          stroke="#34495E"
          strokeWidth={1}
        />
        <text
          fontSize={8}
          fill={Colors.dd}
          fontWeight={600}
          textAnchor="middle"
          y={18}
        >
          Network Edge {idx}
        </text>
        {/* Home Router */}
        <rect
          x="-15"
          y="-12"
          width="30"
          height="16.875"
          rx="3"
          fill="#7F8C8D"
          stroke="#5D6D7E"
          strokeWidth="1.5"
        />
        <rect x="-12" y="-9" width="24" height="11" rx="2" fill="#5D6D7E" />
        <circle cx="-6" cy="-4" r="1.5" fill="#2ECC71" />
        <circle cx="0" cy="-4" r="1.5" fill="#F39C12" />
        <circle cx="6" cy="-4" r="1.5" fill="#E74C3C" />

        {/* Devices */}
        <rect x="-20" y="-30" width="12" height="8" rx="1" fill="#34495E" />
        <rect x="-19" y="-29" width="10" height="6" rx="1" fill="#D6EAF8" />
        <path
          d="M-14,-22 L-14,-20 L-10,-20 M-14,-20 L-18,-20"
          stroke="#34495E"
          fill="none"
        />

        <rect x="8" y="-30" width="8" height="10" rx="2" fill="#34495E" />
        <rect x="9" y="-28.5" width="6" height="7" rx="1" fill="#D6EAF8" />
      </g>
    );
  };
  return (
    <svg width={"100%"} style={{ aspectRatio: 4 / 3 }} viewBox="0 0 500 300">
      {/* Background circle for distribution layer */}
      <circle
        cx="250"
        cy="150"
        r="90"
        fill="#E8F6F3"
        stroke="#1ABC9C"
        strokeWidth="2"
        strokeDasharray="5,3"
      />
      <text
        x="250"
        y="210"
        textAnchor="middle"
        fill="#16A085"
        fontWeight="bold"
        fontSize="14"
      >
        Distribution Layer
      </text>
      {/* Connections between distribution routers */}
      <line
        x1="240"
        y1="130"
        x2="210"
        y2="170"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      <line
        x1="260"
        y1="130"
        x2="300"
        y2="170"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      <line
        x1="210"
        y1="180"
        x2="290"
        y2="180"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      {/* Connection lines from distribution routers to home networks */}
      <line
        x1="250"
        y1="130"
        x2="150"
        y2="50"
        stroke="#2C3E50"
        strokeWidth={1}
      />
      <line
        x1="250"
        y1="130"
        x2="350"
        y2="50"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      <line
        x1="100"
        y1="180"
        x2="190"
        y2="180"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      <line
        x1="200"
        y1="280"
        x2="200"
        y2="180"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      <line
        x1="290"
        y1="280"
        x2="290"
        y2="180"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      <line
        x1="400"
        y1="180"
        x2="290"
        y2="180"
        stroke="#2C3E50"
        strokeWidth="1"
      />
      {/* Distribution Layer Routers */}
      {/* Router 1 - Top */}
      {renderRouter("240,120")}
      {/* Router 2 - Left */}
      {renderRouter("190,170")}
      {/* Router 3 - Right */}
      {renderRouter("280,170")}
      {/* Home Networks */}
      {["150,50", "350, 50", "100,180", "200, 280", "290,280", "400,180"].map(
        (position, idx) => renderHomeNetwork(position, idx + 1)
      )}
    </svg>
  );
};
