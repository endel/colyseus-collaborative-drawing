import { get } from "httpie";
import { State, DEFAULT_BRUSH, BRUSH } from "../../server/rooms/State";
import brushFunctions from "../brushes";
import { clearCanvas } from "./gameplay";

const drawingEl = document.querySelector('#drawing');
const drawingCanvas = drawingEl.querySelector('canvas');
const drawingCtx = drawingCanvas.getContext('2d');

export async function showDrawing(_id) {
  drawingEl.classList.remove('hidden');

  clearCanvas(drawingCtx);

  const data = (await get(`/drawings/${_id}`)).data;
  data.paths.forEach(path => {
    brushFunctions[path.brush](drawingCtx, path.color, path.points, false);
  });
}

export function hideDrawing() {
  drawingEl.classList.add('hidden');
}