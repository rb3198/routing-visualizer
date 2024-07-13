import React from "react";

interface IconProps {
  color?: string;
  classes?: string;
}

export const HeaderIcon: React.FC<IconProps> = ({ color, classes }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 65 65"
      height={40}
      width={40}
      className={classes || ""}
    >
      <g>
        <g>
          <path
            fill={color}
            d="M64.5,41.4c0-0.6-0.4-1-1-1H41.4c-0.6,0-1,0.4-1,1v22.1c0,0.6,0.4,1,1,1s1-0.4,1-1V42.4h21.1C64,42.4,64.5,41.9,64.5,41.4    z"
          />
          <path
            fill={color}
            d="M41.4,24.6h22.1c0.6,0,1-0.4,1-1s-0.4-1-1-1H42.4V1.5c0-0.6-0.4-1-1-1s-1,0.4-1,1v22.1C40.4,24.2,40.8,24.6,41.4,24.6z"
          />
          <path
            fill={color}
            d="M1.5,24.6h22.1c0.6,0,1-0.4,1-1V1.5c0-0.6-0.4-1-1-1s-1,0.4-1,1v21.1H1.5c-0.6,0-1,0.4-1,1S0.9,24.6,1.5,24.6z"
          />
          <path
            fill={color}
            d="M23.6,40.4H1.5c-0.6,0-1,0.4-1,1s0.4,1,1,1h21.1v21.1c0,0.6,0.4,1,1,1s1-0.4,1-1V41.4C24.6,40.8,24.1,40.4,23.6,40.4z"
          />
          <path
            fill={color}
            d="M36.4,33.5h27.1c0.6,0,1-0.4,1-1s-0.4-1-1-1H36.4c-0.4-1.4-1.5-2.5-2.9-2.9V1.5c0-0.6-0.4-1-1-1s-1,0.4-1,1v27.1    c-1.4,0.4-2.5,1.5-2.9,2.9H1.5c-0.6,0-1,0.4-1,1s0.4,1,1,1h27.1c0.4,1.4,1.5,2.6,2.9,2.9v27.1c0,0.6,0.4,1,1,1s1-0.4,1-1V36.4    C34.9,36.1,36,34.9,36.4,33.5z M32.5,34.6c-1.1,0-2-0.9-2-2.1c0-1.1,0.9-2,2-2c1.1,0,2.1,0.9,2.1,2C34.5,33.7,33.6,34.6,32.5,34.6    z"
          />
          <path
            fill={color}
            d="M60.5,44.6c-1.9,0-3.5,1.3-3.9,3.1h-7.9c-0.6,0-1,0.4-1,1v7.7c-1.8,0.4-3.1,2-3.1,3.9c0,2.2,1.8,4.1,4.1,4.1    c2.2,0,4-1.8,4-4.1c0-1.9-1.3-3.5-3.1-3.9v-6.7h6.9c0.5,1.8,2,3.1,3.9,3.1c2.2,0,4-1.8,4-4.1C64.5,46.4,62.7,44.6,60.5,44.6z     M50.7,60.3c0,1.1-0.9,2.1-2,2.1c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2,2.1-2C49.8,58.2,50.7,59.1,50.7,60.3z M60.5,50.7    c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2,2.1-2c1.1,0,2,0.9,2,2C62.5,49.8,61.6,50.7,60.5,50.7z"
          />
          <path
            fill={color}
            d="M47.6,8.5v7.9c0,0.6,0.4,1,1,1h7.7c0.4,1.8,2,3.1,3.9,3.1c2.2,0,4.1-1.8,4.1-4.1c0-2.2-1.8-4-4.1-4    c-1.9,0-3.5,1.3-3.9,3.1h-6.7V8.5c1.8-0.5,3.1-2,3.1-3.9c0-2.2-1.8-4-4.1-4c-2.2,0-4,1.8-4,4C44.6,6.5,45.9,8,47.6,8.5z     M60.3,14.3c1.1,0,2.1,0.9,2.1,2c0,1.2-0.9,2.1-2.1,2.1c-1.1,0-2-0.9-2-2.1C58.2,15.2,59.1,14.3,60.3,14.3z M48.6,2.5    c1.1,0,2.1,0.9,2.1,2c0,1.2-0.9,2.1-2.1,2.1c-1.1,0-2-0.9-2-2.1C46.6,3.4,47.5,2.5,48.6,2.5z"
          />
          <path
            fill={color}
            d="M17.4,56.4v-7.7c0-0.6-0.4-1-1-1H8.5c-0.4-1.8-2-3.1-3.9-3.1c-2.2,0-4,1.8-4,4c0,2.2,1.8,4.1,4,4.1c1.9,0,3.5-1.3,3.9-3.1    h6.9v6.7c-1.8,0.4-3.1,2-3.1,3.9c0,2.2,1.8,4.1,4,4.1c2.2,0,4.1-1.8,4.1-4.1C20.4,58.4,19.1,56.8,17.4,56.4z M4.5,50.7    c-1.1,0-2-0.9-2-2.1c0-1.1,0.9-2,2-2c1.1,0,2.1,0.9,2.1,2C6.6,49.8,5.7,50.7,4.5,50.7z M16.4,62.3c-1.1,0-2-0.9-2-2.1    c0-1.1,0.9-2,2-2c1.1,0,2.1,0.9,2.1,2C18.4,61.4,17.5,62.3,16.4,62.3z"
          />
          <path
            fill={color}
            d="M4.7,20.4c1.9,0,3.5-1.3,3.9-3.1h7.7c0.6,0,1-0.4,1-1V8.5c1.8-0.4,3.1-2,3.1-3.9c0-2.2-1.8-4-4-4c-2.2,0-4.1,1.8-4.1,4    c0,1.9,1.3,3.5,3.1,3.9v6.9H8.6c-0.4-1.8-2-3.1-3.9-3.1c-2.2,0-4.1,1.8-4.1,4C0.6,18.6,2.5,20.4,4.7,20.4z M14.3,4.6    c0-1.1,0.9-2,2.1-2c1.1,0,2,0.9,2,2c0,1.1-0.9,2.1-2,2.1C15.2,6.6,14.3,5.7,14.3,4.6z M4.7,14.3c1.1,0,2,0.9,2,2    c0,1.1-0.9,2.1-2,2.1c-1.2,0-2.1-0.9-2.1-2.1C2.6,15.2,3.6,14.3,4.7,14.3z"
          />
        </g>
      </g>
    </svg>
  );
};
