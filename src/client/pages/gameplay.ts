import { client } from "../utils/networking";
import { Room } from "colyseus.js";
import { State } from "../../server/rooms/State";
import { showHome } from "./home";

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

  room = await client.joinOrCreate(roomName);

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
    drawPath(ctx, path.points, false);
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

  setupListeners();
}

export function hideGameplay() {
  gameplay.classList.add('hidden');
}

function setupListeners() {

  ctx.lineWidth = 1;
  ctx.lineJoin = ctx.lineCap = 'round';

  var isDrawing, points = [ ];

  canvas.addEventListener("mousedown", (e) => {
    if (room.state.countdown === 0) { return; }

    const point = [e.offsetX, e.offsetY];
    room.send(['s', point]);

    clearPreviewCanvas();

    isDrawing = true;
    points = [];
    points.push(...point);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (room.state.countdown === 0) { return; }

    if (!isDrawing) return;

    const point = [e.offsetX, e.offsetY];
    room.send(['p', point]);

    points.push(...point);

    drawPath(prevCtx, points, true);

    // ctx.beginPath();
    // ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    // ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    // ctx.stroke();

    // for (var i = 0, len = points.length; i < len; i++) {
    //   const dx = points[i].x - points[points.length - 1].x;
    //   const dy = points[i].y - points[points.length - 1].y;
    //   const d = dx * dx + dy * dy;

    //   if (d < 1000) {
    //     ctx.beginPath();
    //     ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    //     ctx.moveTo(points[points.length - 1].x + (dx * 0.2), points[points.length - 1].y + (dy * 0.2));
    //     ctx.lineTo(points[i].x - (dx * 0.2), points[i].y - (dy * 0.2));
    //     ctx.stroke();
    //   }
    // }
  });

  canvas.addEventListener("mouseup", (e) => {
    room.send(['e']);

    isDrawing = false;
    points.length = 0;

    clearPreviewCanvas();
  });

}

function useBrush() {
}

function clearPreviewCanvas() {
  prevCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
}

function drawPath(ctx: CanvasRenderingContext2D, points: number[], isPreview: boolean = false) {
  for (let i = (isPreview) ? points.length - 4 : 2; i < points.length; i += 2) {
    const moveToX = points[i-2];
    const moveToY = points[i-1];

    const currentX = points[i];
    const currentY = points[i+1];

    ctx.beginPath();
    ctx.moveTo(moveToX, moveToY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    for (var j = 0, len = points.length; j < len; j+=2) {
      const previousX = points[j];
      const previousY = points[j+1];

      const dx = previousX - currentX;
      const dy = previousY - currentY;
      const d = dx * dx + dy * dy;

      if (d < 1000) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
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
