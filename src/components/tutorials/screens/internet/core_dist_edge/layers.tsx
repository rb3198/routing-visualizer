import React from "react";
import { Colors } from "src/constants/theme";

export const Layers: React.FC<{
  width?: number | string;
}> = ({ width = 500 }) => {
  const [topRadius, midRadius, lowRadius] = [50, 40, 35];
  return (
    <svg
      width={width}
      style={{ aspectRatio: 16 / 9 }}
      viewBox="0 0 500 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lines connecting the circles */}
      <line x1="250" y1="80" x2="150" y2="200" stroke="black" />
      <line x1="250" y1="80" x2="350" y2="200" stroke="black" />
      <line x1="150" y1="200" x2="100" y2="320" stroke="black" />
      <line x1="150" y1="200" x2="200" y2="320" stroke="black" />
      <line x1="350" y1="200" x2="300" y2="320" stroke="black" />
      <line x1="350" y1="200" x2="400" y2="320" stroke="black" />
      {/* Top circle */}
      <g>
        <circle cx="250" cy="80" r={topRadius} stroke="black" fill="white" />
        <text
          x="250"
          y="70"
          textAnchor="middle"
          fontSize="14"
          fontStyle={"italic"}
        >
          Serves:
        </text>
        <text x="250" y="90" textAnchor="middle" fontSize="14">
          4xxxxx
        </text>
        <text x="250" y="110" textAnchor="middle" fontSize="14">
          6xxxxx
        </text>
      </g>

      {/* Left middle circle */}
      <g>
        <circle cx="150" cy="200" r={midRadius} stroke="black" fill="white" />
        <text
          x="150"
          y="190"
          textAnchor="middle"
          fontSize="12"
          fontStyle="italic"
        >
          Serves:
        </text>
        <text x="150" y="210" textAnchor="middle" fontSize="12">
          606xx
        </text>
      </g>

      {/* Right middle circle */}
      <g>
        <circle cx="350" cy="200" r={midRadius} stroke="black" fill="white" />
        <text
          x="350"
          y="190"
          textAnchor="middle"
          fontSize="12"
          fontStyle="italic"
        >
          Serves:
        </text>
        <text x="350" y="205" textAnchor="middle" fontSize="12">
          481xx
        </text>
        <text x="350" y="220" textAnchor="middle" fontSize="12">
          482xx
        </text>
      </g>

      {/* Bottom left circle 1 */}
      <g>
        <circle cx="100" cy="320" r={lowRadius} stroke="black" fill="white" />
        <text x="100" y="310" textAnchor="middle" fontSize="12">
          Office 1
        </text>
        <text
          x="100"
          y="325"
          textAnchor="middle"
          fontSize="12"
          fontStyle="italic"
        >
          Serves:
        </text>
        <text x="100" y="340" textAnchor="middle" fontSize="12">
          60666
        </text>
      </g>

      {/* Bottom left circle 2 */}
      <circle cx="200" cy="320" r={lowRadius} stroke="black" fill="white" />
      <text x="200" y="310" textAnchor="middle" fontSize="12">
        Office 2
      </text>
      <text
        x="200"
        y="325"
        textAnchor="middle"
        fontSize="12"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="200" y="340" textAnchor="middle" fontSize="12">
        60661
      </text>

      {/* Bottom right circle 1 */}
      <circle cx="300" cy="320" r={lowRadius} stroke="black" fill="white" />
      <text x="300" y="310" textAnchor="middle" fontSize="12">
        Office 1
      </text>
      <text
        x="300"
        y="325"
        textAnchor="middle"
        fontSize="12"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="300" y="340" textAnchor="middle" fontSize="12">
        48127
      </text>

      {/* Bottom right circle 2 */}
      <circle cx="400" cy="320" r={lowRadius} stroke="black" fill="white" />
      <text x="400" y="310" textAnchor="middle" fontSize="12">
        Office 2
      </text>
      <text
        x="400"
        y="325"
        textAnchor="middle"
        fontSize="12"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="400" y="340" textAnchor="middle" fontSize="12">
        48201
      </text>

      {/* Layers */}
      <g stroke={Colors.accent}>
        <rect
          x={-50}
          y={20}
          fill={Colors.accent}
          fillOpacity={0.35}
          width={600}
          height={120}
          strokeWidth={0}
        />
        <text x={500} y={80} textAnchor="middle">
          Core Layer
        </text>
        <text x={-40} y={40} fontSize={10}>
          Maximum Availability
        </text>
        <text x={-40} y={60} fontSize={10}>
          Maximum Capabilities
        </text>
        <text x={-40} y={80} fontSize={10}>
          Highest Volume Handling
        </text>
        <text x={-40} y={100} fontSize={10}>
          Backbone of the network
        </text>
      </g>
      <g stroke={Colors.complementary}>
        <rect
          x={-50}
          y={140}
          fill={Colors.complementary}
          fillOpacity={0.35}
          width={600}
          height={120}
          strokeWidth={0}
        />
        <text x={475} y={200} textAnchor="middle">
          Distribution Layer
        </text>
        <text x={-40} y={160} fontSize={10}>
          High Availability
        </text>
        <text x={-40} y={180} fontSize={10}>
          Medium Capabilities
        </text>
        <text x={-40} y={200} fontSize={10}>
          Medium Volume Handling
        </text>
        <text x={-40} y={220} fontSize={10}>
          Intermediary Role
        </text>
      </g>
      <g stroke={Colors.dd}>
        <rect
          x={-50}
          y={260}
          fill={Colors.dd}
          strokeWidth={0}
          fillOpacity={0.35}
          width={600}
          height={120}
        />
        <text x={500} y={320} textAnchor="middle">
          Edge Layer
        </text>
        <text x={-40} y={280} fontSize={10}>
          Good Availability
        </text>
        <text x={-40} y={300} fontSize={10}>
          Low Capabilities
        </text>
        <text x={-40} y={320} fontSize={10}>
          Low Traffic
        </text>
        <text x={-40} y={340} fontSize={10}>
          Endpoint Role
        </text>
      </g>
    </svg>
  );
};
