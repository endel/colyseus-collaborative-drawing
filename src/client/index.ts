import "./css/index.css";
import "./thirdparty/jscolor";
import { showHome, hideHome } from "./pages/home";
import { showDrawing } from "./pages/drawing";

window.addEventListener("hashchange", (e) => {
  const _id = window.location.hash.substr(1)
  showDrawing(_id);
  hideHome();
});

showHome();