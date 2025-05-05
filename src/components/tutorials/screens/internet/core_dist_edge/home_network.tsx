import React from "react";
import { Colors } from "src/constants/theme";

export const HomeNetwork: React.FC = () => {
  return (
    <svg width={"100%"} style={{ aspectRatio: 16 / 9 }} viewBox="0 0 500 300">
      {/* Internet Globe */}
      <g transform="translate(50, 150)">
        <text
          textAnchor="middle"
          x={0}
          y={60}
          fontFamily="Arial"
          fontSize={14}
          fill="#2E86C1"
        >
          Internet
        </text>
        <circle
          cx="0"
          cy="0"
          r="40"
          fill="#D6EAF8"
          stroke="#2E86C1"
          strokeWidth="2"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="40"
          ry="15"
          fill="none"
          stroke="#2E86C1"
          strokeWidth="1"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="20"
          ry="40"
          fill="none"
          stroke="#2E86C1"
          strokeWidth="1"
          transform="rotate(30)"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="20"
          ry="40"
          fill="none"
          stroke="#2E86C1"
          strokeWidth="1"
          transform="rotate(-30)"
        />
        <ellipse
          cx="0"
          cy="0"
          rx="20"
          ry="40"
          fill="none"
          stroke="#2E86C1"
          strokeWidth="1"
          transform="rotate(90)"
        />
        <path
          d="M-30,-25 Q0,-40 30,-25"
          fill="none"
          stroke="#2E86C1"
          strokeWidth="1"
        />
        <path
          d="M-30,25 Q0,40 30,25"
          fill="none"
          stroke="#2E86C1"
          strokeWidth="1"
        />
      </g>

      {/* Connection line from Internet to Modem */}
      <line
        x1="95"
        y1="150"
        x2="140"
        y2="150"
        stroke="#2C3E50"
        strokeWidth="3"
        strokeDasharray="5,3"
      />

      {/* Modem - separate device */}
      <g transform="translate(160, 150)">
        {/* Main body */}
        <rect
          x="-20"
          y="-30"
          width="40"
          height="60"
          rx="3"
          fill="#2C3E50"
          stroke="#1B2631"
          strokeWidth="2"
        />

        {/* Front panel details */}
        <rect x="-15" y="-25" width="30" height="50" rx="2" fill="#34495E" />

        {/* LED indicators */}
        <circle cx="-5" cy="-15" r="2" fill="#2ECC71" />
        <circle cx="5" cy="-15" r="2" fill="#F39C12" />
        <circle cx="-5" cy="-7" r="2" fill="#E74C3C" />
        <circle cx="5" cy="-7" r="2" fill={Colors.accent} />

        {/* Cable port */}
        <rect x="-10" y="15" width="20" height="5" rx="1" fill="#1B2631" />
        <rect x="-8" y="16" width="16" height="3" rx="1" fill="#7F8C8D" />
        <text textAnchor="middle" x={0} y={45} fontSize={14} fontFamily="Arial">
          Modem
        </text>
      </g>

      {/* Connection line from Modem to Router */}
      <line
        x1="185"
        y1="150"
        x2="230"
        y2="150"
        stroke="#2C3E50"
        strokeWidth="2"
      />

      {/* Router - separate device */}
      <g transform="translate(250, 150)">
        {/* Main body */}
        <rect
          x="-20"
          y="-25"
          width="60"
          height="50"
          rx="2.5"
          fill="#5D6D7E"
          stroke="#34495E"
          strokeWidth="2"
        />

        {/* Antennas */}
        <rect x="-15" y="-45" width="3" height="20" rx="1" fill="#34495E" />
        <rect x="10" y="-45" width="3" height="20" rx="1" fill="#34495E" />
        <rect x="32.5" y="-45" width="3" height="20" rx="1" fill="#34495E" />

        {/* Front panel indicators */}
        <rect x="-15" y="-15" width="50" height="10" rx="1" fill="#34495E" />
        <circle cx="-5" cy="-10" r="2" fill="#2ECC71" />
        <circle cx="5" cy="-10" r="2" fill={Colors.accent} />
        <circle cx="15" cy="-10" r="2" fill="#F39C12" />
        <circle cx="25" cy="-10" r="2" fill="#E74C3C" />

        {/* Ethernet ports */}
        <rect x="-15" y="5" width="50" height="10" rx="1" fill="#1B2631" />
        <rect x="-12" y="7" width="8" height="6" rx="1" fill="#7F8C8D" />
        <rect x="-2" y="7" width="8" height="6" rx="1" fill="#7F8C8D" />
        <rect x="8" y="7" width="8" height="6" rx="1" fill="#7F8C8D" />
        <rect x="18" y="7" width="8" height="6" rx="1" fill="#7F8C8D" />

        <text
          textAnchor="middle"
          x={10}
          y={40}
          fontSize={14}
          fontFamily="Arial"
        >
          Router
        </text>
      </g>

      {/* Connection lines from Router to Devices */}
      <line
        x1="295"
        y1="130"
        x2="340"
        y2="80"
        stroke={Colors.accent}
        strokeWidth={1}
      />
      <line
        x1="295"
        y1="150"
        x2="340"
        y2="150"
        stroke={Colors.accent}
        strokeWidth={1}
      />
      <line
        x1="295"
        y1="170"
        x2="340"
        y2="220"
        stroke={Colors.accent}
        strokeWidth={1}
      />

      {/* PC */}
      <g transform="translate(360, 150)">
        {/* Monitor */}
        <rect
          x="-25"
          y="-30"
          width="50"
          height="35"
          rx="3"
          fill="#34495E"
          stroke="#1B2631"
          strokeWidth="2"
        />
        <rect x="-22" y="-27" width="44" height="29" rx="2" fill="#D6EAF8" />

        {/* Stand */}
        <path
          d="M0,5 L0,10 M-10,10 L10,10"
          stroke="#1B2631"
          strokeWidth="3"
          fill="none"
        />

        {/* Keyboard */}
        <rect
          x="-20"
          y="15"
          width="40"
          height="12"
          rx="2"
          fill="#5D6D7E"
          stroke="#34495E"
          strokeWidth="1"
        />
        <rect x="-18" y="17" width="36" height="8" rx="1" fill="#34495E" />
      </g>

      {/* Phone 1 - clean, modern design */}
      <g transform="translate(360, 80)">
        {/* Phone body */}
        <rect
          x="-12"
          y="-25"
          width="24"
          height="45"
          rx="4"
          fill="#34495E"
          stroke="#1B2631"
          strokeWidth="2"
        />

        {/* Screen */}
        <rect x="-10" y="-23" width="20" height="38" rx="2" fill="#D6EAF8" />

        {/* Camera notch */}
        <rect x="-4" y="-21" width="8" height="3" rx="1.5" fill="#1B2631" />

        {/* Home indicator */}
        <rect x="-5" y="12" width="10" height="1.5" rx="0.75" fill="#1B2631" />
      </g>

      <g transform="translate(360, 220)">
        {/* Phone body */}
        <rect
          x="-12"
          y="-25"
          width="24"
          height="45"
          rx="4"
          fill="#34495E"
          stroke="#1B2631"
          strokeWidth="2"
        />

        {/* Screen */}
        <rect x="-10" y="-23" width="20" height="38" rx="2" fill="#D6EAF8" />

        {/* Camera notch */}
        <rect x="-4" y="-21" width="8" height="3" rx="1.5" fill="#1B2631" />

        {/* Home indicator */}
        <rect x="-5" y="12" width="10" height="1.5" rx="0.75" fill="#1B2631" />
      </g>
      <rect
        fill={Colors.dd}
        fillOpacity={0.5}
        x={125}
        y={0}
        width={300}
        height={300}
      />
      <text textAnchor="middle" x={275} y={275} fill={Colors.dd}>
        The Network Edge
      </text>
    </svg>
  );
};
