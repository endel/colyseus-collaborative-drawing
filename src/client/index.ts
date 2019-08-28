import "./css/index.css";
import "./thirdparty/jscolor";
import { showHome, hideHome } from "./pages/home";
import { showDrawing, hideDrawing } from "./pages/drawing";
import { hideGameplay, showGameplay } from "./pages/gameplay";

const gameModes = ['2minutes', '5minutes', '1hour', '1day', '1week'];

/**
 * Navigation
 */
window.addEventListener("hashchange", (e) => {
  const hash = window.location.hash.substr(1);
  if (hash.length === 0) {
    showHome();
    hideGameplay();
    hideDrawing();

  } else if (gameModes.indexOf(hash) !== -1) {
    showGameplay(hash);
    hideHome();
    hideDrawing();

  } else {
    showDrawing(hash);
    hideHome();
  }
});

showHome();