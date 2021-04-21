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
}

export function hideHome() {
  home.classList.add('hidden');
}