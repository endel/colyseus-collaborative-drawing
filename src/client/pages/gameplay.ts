import { client } from "../utils/networking";
import { Room } from "colyseus.js";
import { State, DEFAULT_BRUSH, BRUSH } from "../../server/rooms/State";
import brushFunctions from "../brushes";

let room: Room<State>;

const gameplay = document.getElementById('gameplay');
const drawingArea = gameplay.querySelector('.drawing-area');
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

var isDrawing, color = 0x000000, brush = DEFAULT_BRUSH, points = [ ];
var previewCtx;

const previewPerPlayer: {[id: string]: CanvasRenderingContext2D} = {};

export async function showGameplay(roomName: string) {
  gameplay.classList.remove('hidden');

  // clear previous chat messages.
  chatMessagesEl.innerHTML = "";
  peopleEl.innerHTML = "";
  gameplay.querySelector('.mode').innerHTML = `${roomName} session`;

  clearCanvas(ctx);

  gameplay.classList.add('loading');
  room = await client.joinOrCreate(roomName, {
    nickname: (document.getElementById('username') as HTMLInputElement).value
  });
  room.onStateChange.once(() => gameplay.classList.remove('loading'));

  room.state.players.onAdd = (player, sessionId) => {
    const playerEl = document.createElement("li");

    // create drawing preview canvas for this player
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 800;
    previewCanvas.height = 600;
    previewCanvas.classList.add("drawing-preview");
    drawingArea.appendChild(previewCanvas);
    previewPerPlayer[sessionId] = previewCanvas.getContext('2d');

    if (sessionId === room.sessionId) {
      playerEl.classList.add('you');

      previewCtx = previewCanvas.getContext('2d');

      // add event listeners to current player's preview canvas
      previewCanvas.addEventListener("mousedown", (e) => startPath(e.offsetX, e.offsetY));
      previewCanvas.addEventListener("mousemove", (e) => movePath(e.offsetX, e.offsetY));
      previewCanvas.addEventListener("mouseup", (e) => endPath());

      previewCanvas.addEventListener("touchstart", (e) => {
        var rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        var bodyRect = document.body.getBoundingClientRect();
        var x = e.touches[0].pageX - (rect.left - bodyRect.left);
        var y = e.touches[0].pageY - (rect.top - bodyRect.top);
        return startPath(x, y);
      });
      previewCanvas.addEventListener("touchmove", (e) => {
        var rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        var bodyRect = document.body.getBoundingClientRect();
        var x = e.touches[0].pageX - (rect.left - bodyRect.left);
        var y = e.touches[0].pageY - (rect.top - bodyRect.top);
        movePath(x, y)
      });
      previewCanvas.addEventListener("touchend", (e) => endPath());

    } else {
      // prevent events on other people's canvases
      previewCanvas.style.pointerEvents = "none";
    }

    playerEl.innerText = player.name;
    playerEl.id = `p${sessionId}`;
    peopleEl.appendChild(playerEl);
  }

  room.state.players.onRemove = (player, sessionId) => {
    // remove player from the list
    const playerEl = peopleEl.querySelector(`#p${sessionId}`);
    peopleEl.removeChild(playerEl);

    // remove preview canvas
    const previewCanvas = previewPerPlayer[sessionId].canvas;
    drawingArea.removeChild(previewCanvas);
    delete previewPerPlayer[sessionId];
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

  room.state.paths.onAdd = (path, index) => {
    const previewCanvas = previewPerPlayer[path.sessionId];

    if (path.finished) {
      brushFunctions[path.brush](ctx, path.color, path.points, false);

    } else {
      path.onChange = (changes) => {
        changes.forEach(change => {
          if (change.field === "finished") {
            clearCanvas(previewCanvas);
            brushFunctions[path.brush](ctx, path.color, path.points, false);

          } else if (path.sessionId !== room.sessionId) { // skip preview from current player.
            clearCanvas(previewCanvas);
            brushFunctions[path.brush](previewCanvas, path.color, path.points, false);
          }
        })
      }
      path.triggerAll();
    }
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

  for (let sessionId in previewPerPlayer) {
    drawingArea.removeChild(previewPerPlayer[sessionId].canvas);
  }
}

export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function checkRoom() {
  return (room && room.state.countdown > 0);
}

ctx.lineWidth = 1;
ctx.lineJoin = ctx.lineCap = 'round';

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
  console.log("START PATH!");
  if (!checkRoom()) { return; }

  const point = [x, y];
  room.send(['s', point, color, brush]);

  clearCanvas(previewCtx);

  isDrawing = true;
  points = [];
  points.push(...point);
}

function movePath(x, y) {
  if (!checkRoom()) { return; }
  if (!isDrawing) { return; }
  console.log("MOVE PATH!");

  const point = [x, y];
  room.send(['p', point]);

  points.push(...point);
  brushFunctions[brush](previewCtx, color, points, true);
}

function endPath() {
  room.send(['e']);

  isDrawing = false;
  points.length = 0;
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
