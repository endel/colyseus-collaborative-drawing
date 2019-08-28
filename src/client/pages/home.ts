import { get } from "httpie";

const home = document.getElementById('home');

Array.from(home.querySelectorAll('ul li a')).forEach((joinSessionLink) => {
  joinSessionLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const target = e.target as HTMLElement;
    if (target.dataset.room) {
      location.hash = target.dataset.room;
    }
  });
});

export async function showHome() {
  home.classList.remove('hidden');

  const previousSessionsEl = home.querySelector('.previous-sessions');
  previousSessionsEl.innerHTML = "";

  const drawings = (await get('/drawings')).data;
  drawings.forEach(drawing => {
    const drawingEl = document.createElement('li');
    const drawingAnchorEl = document.createElement('a');
    drawingAnchorEl.href = `#${drawing._id}`;
    drawingAnchorEl.innerText = `${drawing.mode} (${drawing.createdAt})`;

    drawingEl.appendChild(drawingAnchorEl);
    previousSessionsEl.appendChild(drawingEl);

  });
  console.log(drawings);
}

export function hideHome() {
  home.classList.add('hidden');
}