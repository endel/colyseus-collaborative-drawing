import { BRUSH } from "../../server/rooms/State";
import { getRGB, toHex } from "../utils/color";

function midPointBtw(p1x, p1y, p2x, p2y) {
  return {
    x: p1x + (p2x - p1x) / 2,
    y: p1y + (p2y - p1y) / 2
  };
}

export default {
  /**
   * "Sketch" brush: https://codepen.io/kangax/pen/EjivI
   */
  [BRUSH.SKETCH]: (ctx: CanvasRenderingContext2D, color: number, points: number[], isPreview: boolean = false) => {
    const rgb = getRGB(color);
    ctx.strokeStyle = toHex(color);
    ctx.lineWidth = 1;

    for (let i = (isPreview) ? points.length - 4 : 2; i < points.length; i += 2) {
      const moveToX = points[i - 2];
      const moveToY = points[i - 1];

      const currentX = points[i];
      const currentY = points[i + 1];

      ctx.beginPath();
      ctx.moveTo(moveToX, moveToY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      // await new Promise(resolve => setTimeout(resolve, 1));

      for (var j = 0, len = points.length; j < len; j += 2) {
        const previousX = points[j];
        const previousY = points[j + 1];

        const dx = previousX - currentX;
        const dy = previousY - currentY;
        const d = dx * dx + dy * dy;

        if (d < 1000) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
          ctx.moveTo(currentX + (dx * 0.2), currentY + (dy * 0.2));
          ctx.lineTo(previousX - (dx * 0.2), previousY - (dy * 0.2));
          ctx.stroke();
        }
      }
    }
  },

  /**
   * Pen: https://codepen.io/kangax/pen/aoxwb
   */
  [BRUSH.PEN]: (ctx: CanvasRenderingContext2D, color: number, points: number[], isPreview: boolean = false) => {
    ctx.strokeStyle = toHex(color);
    ctx.lineJoin = ctx.lineCap = 'round';

    const minWidth = 3;
    const maxWidth = 5;

    for (let i = (isPreview) ? points.length - 4 : 2; i < points.length; i += 2) {
      const moveToX = points[i - 2];
      const moveToY = points[i - 1];

      const currentX = points[i];
      const currentY = points[i + 1];

      ctx.beginPath();
      ctx.moveTo(moveToX, moveToY);
      ctx.lineWidth = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    }
  },

  /**
   * Marker: https://codepen.io/kangax/pen/jLDAf
   */
  [BRUSH.MARKER]: (ctx: CanvasRenderingContext2D, color: number, points: number[], isPreview: boolean = false) => {
    ctx.strokeStyle = toHex(color);

    ctx.lineWidth = 3;
    ctx.lineJoin = ctx.lineCap = 'round';

    for (let i = (isPreview) ? points.length - 4 : 2; i < points.length; i += 2) {
      const moveToX = points[i - 2];
      const moveToY = points[i - 1];

      const currentX = points[i];
      const currentY = points[i + 1];

      ctx.beginPath();

      ctx.globalAlpha = 1;
      ctx.moveTo(moveToX, moveToY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      ctx.moveTo(moveToX - 4, moveToY - 4);
      ctx.lineTo(currentX - 4, currentY - 4);
      ctx.stroke();

      ctx.moveTo(moveToX - 2, moveToY - 2);
      ctx.lineTo(currentX - 2, currentY - 2);
      ctx.stroke();

      ctx.moveTo(moveToX + 2, moveToY + 2);
      ctx.lineTo(currentX + 2, currentY + 2);
      ctx.stroke();

      ctx.moveTo(moveToX + 4, moveToY + 4);
      ctx.lineTo(currentX + 4, currentY + 4);
      ctx.stroke();
    }
  },

  /**
   * Rounded: https://codepen.io/kangax/pen/zofsp
  [BRUSH.ROUNDED]: (ctx: CanvasRenderingContext2D, color: number, points: number[], isPreview: boolean = false) => {
    ctx.strokeStyle = toHex(color);

    ctx.lineWidth = 15;
    ctx.lineJoin = ctx.lineCap = 'round';

    let startIndex = (isPreview) ? points.length - 4 : 2;

    let moveToX = points[startIndex - 2];
    let moveToY = points[startIndex - 1];

    ctx.beginPath();
    ctx.moveTo(moveToX, moveToY);

    let currentX;
    let currentY;

    for (let i = startIndex; i < points.length; i += 2) {
      moveToX = points[i - 2];
      moveToY = points[i - 1];

      currentX = points[i];
      currentY = points[i + 1];

      var midPoint = midPointBtw(moveToX, moveToY, currentX, currentY);
      ctx.quadraticCurveTo(moveToX, moveToY, midPoint.x, midPoint.y);
    }

    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  },
   */
}