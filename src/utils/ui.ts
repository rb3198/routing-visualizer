import { LSAHeader } from "src/entities/ospf/lsa";
import { GridCell } from "../entities/geometry/grid_cell";
import { LSRequest } from "src/entities/ospf/packets/ls_request";
import { lsTypeToString } from "src/entities/ospf/enum/ls_type";
import { getCellSize } from "./drawing";

export const debounce = (func: Function, wait: number) => {
  let timeout: number | undefined;
  return (...args: any[]) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};

export const onCanvasLayout = (canvas: HTMLCanvasElement) => {
  const { documentElement } = document;
  const { clientHeight, clientWidth } = documentElement;
  canvas.height = 0.88 * clientHeight;
  canvas.width = clientWidth;
};

export const mapCoordsToGridCell = (
  clientX: number,
  clientY: number,
  gridRect: GridCell[][],
  canvas: HTMLCanvasElement
) => {
  const { x: canvasX, y: canvasY } = canvas.getBoundingClientRect();
  const { zoom = 1, canvasOffset = [0, 0] } = window;
  const cellSize = getCellSize();
  const gridOriginX = gridRect[0][0].x;
  const gridOriginY = gridRect[0][0].y;
  const offsetX = (clientX - canvasX) * zoom - canvasOffset[0] - gridOriginX;
  const offsetY = (clientY - canvasY) * zoom - canvasOffset[1] - gridOriginY;
  const column = Math.floor(offsetX / cellSize);
  const row = Math.floor(offsetY / cellSize);
  if (row >= gridRect.length || row < 0) {
    return { row, column, cell: undefined };
  }
  return { row, column, cell: gridRect[row][column] };
};

export const printLsaHtml = (
  header: LSAHeader | LSRequest,
  printSeqNumber?: boolean
) => {
  const { advertisingRouter, linkStateId, lsType } = header;
  let html = "";
  const render = [
    {
      label: "LS Type",
      value: lsTypeToString(lsType),
    },
    {
      label: "LS ID",
      value: linkStateId,
    },
    {
      label: "Adv. Router",
      value: advertisingRouter,
    },
  ];
  "lsSeqNumber" in header &&
    printSeqNumber &&
    render.push({
      label: "LS Seq. Number",
      value: header.lsSeqNumber.toString(),
    });
  html += `
          <div class="ls_req_container">
            ${render
              .map(
                ({ label, value }) =>
                  `<div class="ls_req_desc">
              <p class="ls_req_label">${label}</p>
              <p class="ls_req_value">${value}</p>
            </div>`
              )
              .join("\n")}
          </div>
          <br>`;
  return html;
};
