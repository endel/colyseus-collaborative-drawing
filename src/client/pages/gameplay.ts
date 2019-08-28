import { client } from "../utils/networking";
import { Room } from "colyseus.js";
import { State, DEFAULT_BRUSH, BRUSH } from "../../server/rooms/State";
import brushFunctions from "../brushes";

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
    room.leave();
  }

  location.hash = "#";
});

const canvas = gameplay.querySelector('.drawing') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

const prevCanvas = gameplay.querySelector('.drawing-preview') as HTMLCanvasElement;
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
  room = await client.joinOrCreate(roomName, {
    nickname: (document.getElementById('username') as HTMLInputElement).value
  });
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
    brushFunctions[path.brush](ctx, path.color, path.points, false);
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

export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function checkRoom() {
  return (room && room.state.countdown > 0);
}

ctx.lineWidth = 1;
ctx.lineJoin = ctx.lineCap = 'round';

var isDrawing, color = 0x000000, brush = DEFAULT_BRUSH, points = [ ];

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

/**
 * Tools: colorpicker
 */
gameplay.querySelector('.colorpicker').addEventListener("change", (e) => {
  color = parseInt("0x" + (e.target as HTMLInputElement).value);
});

/**
 * Tools: brush
 */
Array.from(document.querySelectorAll('input[type=radio][name="brush"]')).forEach(radioButton => {
  radioButton.addEventListener('change', (e) => {
    brush = (e.target as HTMLInputElement).value as BRUSH;
  });
});

function startPath(x, y) {
  if (!checkRoom()) { return; }

  const point = [x, y];
  room.send(['s', point, color, brush]);

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
  brushFunctions[brush](prevCtx, color, points, true);
}

function endPath() {
  room.send(['e']);

  isDrawing = false;
  points.length = 0;

  clearCanvas(prevCtx);
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
