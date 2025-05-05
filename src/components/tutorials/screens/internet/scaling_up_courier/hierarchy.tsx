import React from "react";

export const Hierarchy: React.FC<{
  width?: number | string;
}> = ({ width = 500 }) => {
  return (
    <svg
      width={width}
      style={{ aspectRatio: 16 / 9 }}
      viewBox="0 0 500 400"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lines connecting the circles */}
      <line x1="250" y1="70" x2="100" y2="200" stroke="black" />
      <line x1="250" y1="70" x2="400" y2="200" stroke="black" />
      <line x1="100" y1="200" x2="30" y2="320" stroke="black" />
      <line x1="100" y1="200" x2="170" y2="320" stroke="black" />
      <line x1="400" y1="200" x2="330" y2="320" stroke="black" />
      <line x1="400" y1="200" x2="470" y2="320" stroke="black" />
      {/* Top circle */}
      <circle cx="250" cy="80" r="50" stroke="black" fill="white" />
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

      {/* Left middle circle */}
      <circle cx="100" cy="200" r="50" stroke="black" fill="white" />
      <text
        x="100"
        y="190"
        textAnchor="middle"
        fontSize="14"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="100" y="210" textAnchor="middle" fontSize="14">
        606xx
      </text>

      {/* Right middle circle */}
      <circle cx="400" cy="200" r="50" stroke="black" fill="white" />
      <text
        x="400"
        y="190"
        textAnchor="middle"
        fontSize="14"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="400" y="210" textAnchor="middle" fontSize="14">
        481xx
      </text>
      <text x="400" y="230" textAnchor="middle" fontSize="14">
        482xx
      </text>

      {/* Bottom left circle 1 */}
      <circle cx="30" cy="320" r="40" stroke="black" fill="white" />
      <text x="30" y="310" textAnchor="middle" fontSize="12">
        Office 1
      </text>
      <text x="30" y="325" textAnchor="middle" fontSize="12" fontStyle="italic">
        Serves:
      </text>
      <text x="30" y="340" textAnchor="middle" fontSize="12">
        60666
      </text>

      {/* Bottom left circle 2 */}
      <circle cx="170" cy="320" r="40" stroke="black" fill="white" />
      <text x="170" y="310" textAnchor="middle" fontSize="12">
        Office 2
      </text>
      <text
        x="170"
        y="325"
        textAnchor="middle"
        fontSize="12"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="170" y="340" textAnchor="middle" fontSize="12">
        60661
      </text>

      {/* Bottom right circle 1 */}
      <circle cx="330" cy="320" r="40" stroke="black" fill="white" />
      <text x="330" y="310" textAnchor="middle" fontSize="12">
        Office 1
      </text>
      <text
        x="330"
        y="325"
        textAnchor="middle"
        fontSize="12"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="330" y="340" textAnchor="middle" fontSize="12">
        48127
      </text>

      {/* Bottom right circle 2 */}
      <circle cx="470" cy="320" r="40" stroke="black" fill="white" />
      <text x="470" y="310" textAnchor="middle" fontSize="12">
        Office 2
      </text>
      <text
        x="470"
        y="325"
        textAnchor="middle"
        fontSize="12"
        fontStyle="italic"
      >
        Serves:
      </text>
      <text x="470" y="340" textAnchor="middle" fontSize="12">
        48201
      </text>
    </svg>
  );
};
