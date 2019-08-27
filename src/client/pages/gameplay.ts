import { client } from "../utils/networking";
import { Room } from "colyseus.js";
import { State } from "../../server/rooms/State";
import { showHome } from "./home";
import { getRGB, toHex } from "../utils/color";

let room: Room<State>;

const gameplay = document.getElementById('gameplay');
const countdownEl = gameplay.querySelector('.countdown');

const peopleEl = gameplay.querySelector('.people');
const chatEl = gameplay.querySelector('.chat');
const chatMessagesEl = chatEl.querySelector('ul');

chatEl.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = chatEl.querySelector('input[type=text]') as HTMLInputElement;
  room.send(['chat', input.value]);
  input.value = "";
});

gameplay.querySelector('.info a').addEventListener("click", (e) => {
  e.preventDefault();

  if (room) {
    console.log("LEAVE ROOM!");
    room.leave();
  }

  hideGameplay();
  showHome();
});

const canvas = document.getElementById('drawing') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

const prevCanvas = document.getElementById('drawing-preview') as HTMLCanvasElement;
const prevCtx = prevCanvas.getContext('2d');

export async function showGameplay(roomName: string) {
  gameplay.classList.remove('hidden');

  // clear previous chat messages.
  chatMessagesEl.innerHTML = "";
  peopleEl.innerHTML = "";
  gameplay.querySelector('.mode').innerHTML = `${roomName} session`;

  clearCanvas(ctx);
  clearCanvas(prevCtx);

  gameplay.classList.add('loading');
  room = await client.joinOrCreate(roomName);
  room.onStateChange.once(() => gameplay.classList.remove('loading'));

  room.state.players.onAdd = (player, sessionId) => {
    const playerEl = document.createElement("li");

    if (sessionId === room.sessionId) { playerEl.classList.add('you'); }

    playerEl.innerText = player.name;
    playerEl.id = `p${sessionId}`;
    peopleEl.appendChild(playerEl);
  }

  room.state.players.onRemove = (player, sessionId) => {
    const playerEl = peopleEl.querySelector(`#p${sessionId}`);
    peopleEl.removeChild(playerEl);
  }

  room.state.onChange = (changes) => {
    changes.forEach(change => {
      if (change.field === "countdown") {
        countdownEl.innerHTML = (change.value > 0)
          ? millisecondsToStr(change.value)
          : "Time is up!";
      }
    });
  };

  room.state.paths.onAdd = function(path, index) {
    drawPath(ctx, path.color, path.points, false);
  }

  room.onMessage((message) => {
    const [cmd, data] = message;
    if (cmd === "chat") {
      const message = document.createElement("li");
      message.innerText = data;
      chatMessagesEl.appendChild(message);
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  });
}

export function hideGameplay() {
  gameplay.classList.add('hidden');
}

function checkRoom() {
  return (room && room.state.countdown > 0);
}

ctx.lineWidth = 1;
ctx.lineJoin = ctx.lineCap = 'round';

var isDrawing, color = 0x000000, points = [ ];

prevCanvas.addEventListener("mousedown", (e) => startPath(e.offsetX, e.offsetY));
prevCanvas.addEventListener("mousemove", (e) => movePath(e.offsetX, e.offsetY));
prevCanvas.addEventListener("mouseup", (e) => endPath());

prevCanvas.addEventListener("touchstart", (e) => {
  var rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  var bodyRect = document.body.getBoundingClientRect();
  var x = e.touches[0].pageX - (rect.left - bodyRect.left);
  var y = e.touches[0].pageY - (rect.top - bodyRect.top);
  return startPath(x, y);
});
prevCanvas.addEventListener("touchmove", (e) => {
  var rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  var bodyRect = document.body.getBoundingClientRect();
  var x = e.touches[0].pageX - (rect.left - bodyRect.left);
  var y = e.touches[0].pageY - (rect.top - bodyRect.top);
  movePath(x, y)
});
prevCanvas.addEventListener("touchend", (e) => endPath());

gameplay.querySelector('.colorpicker').addEventListener("change", (e) => {
  color = parseInt("0x" + (e.target as HTMLInputElement).value);
});

function useBrush() {
}

function startPath(x, y) {
  if (!checkRoom()) { return; }

  const point = [x, y];
  room.send(['s', point, color]);

  clearCanvas(prevCtx);

  isDrawing = true;
  points = [];
  points.push(...point);
}

function movePath(x, y) {
  if (!checkRoom()) { return; }
  if (!isDrawing) { return; }

  const point = [x, y];
  room.send(['p', point]);

  points.push(...point);
  drawPath(prevCtx, color, points, true);
}

function endPath() {
  room.send(['e']);

  isDrawing = false;
  points.length = 0;

  clearCanvas(prevCtx);
}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
}

async function drawPath(ctx: CanvasRenderingContext2D, color: number, points: number[], isPreview: boolean = false) {
  const rgb = getRGB(color);
  ctx.strokeStyle = toHex(color);

  for (let i = (isPreview) ? points.length - 4 : 2; i < points.length; i += 2) {
    const moveToX = points[i-2];
    const moveToY = points[i-1];

    const currentX = points[i];
    const currentY = points[i+1];

    ctx.beginPath();
    ctx.moveTo(moveToX, moveToY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // await new Promise(resolve => setTimeout(resolve, 1));

    for (var j = 0, len = points.length; j < len; j+=2) {
      const previousX = points[j];
      const previousY = points[j+1];

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
}

function millisecondsToStr(_seconds) {
  let temp = _seconds;
  const years = Math.floor(temp / 31536000),
    days = Math.floor((temp %= 31536000) / 86400),
    hours = Math.floor((temp %= 86400) / 3600),
    minutes = Math.floor((temp %= 3600) / 60),
    seconds = temp % 60;

  if (days || hours || seconds || minutes) {
    return (years ? years + "y " : "") +
      (days ? days + "d " : "") +
      (hours ? hours + "h " : "") +
      (minutes ? minutes + "m " : "") +
      seconds + "s";
  }

  return "< 1s";
}
