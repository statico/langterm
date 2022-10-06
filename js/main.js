//
// Initialize the game. Try fancy mode on large screens that support WebGL. If
// we detect a touch event or are on a small screen, go with simple mode. Fall
// back to simple and original mode of more advanced modes don't work.
//
const originalBody = document.querySelector(".content").innerHTML;
let mode = "original";

// Orignal mode: Just static text and links.
const goOriginal = async () => {
  try {
    simpleView.teardown();
    fancyView.teardown();
  } catch (err) {
    // Do nothing.
  }
  mode = "original";
  document.body.className = "original";
  document.body.innerHTML = originalBody;
};

// Simple mode: Scrollable text & an input field.
const goSimple = async () => {
  if (mode !== "simple") {
    await fancyView.teardown();
    await simpleView.setup();
    mode = "simple";
  }
};

// Fancy mode: The full pseudo-CRT experience.
const goFancy = async () => {
  if (mode !== "fancy") {
    await simpleView.teardown();
    await fancyView.setup();
    mode = "fancy";
  }
};

const updateView = async () => {
  if (document.body.clientWidth > 768 && !window._forceSimple) {
    try {
      await goFancy();
    } catch (err) {
      console.error(`Couldn't do fancy mode: ${err}`);
      try {
        await goSimple();
      } catch (err) {
        console.error(`Couldn't do simple mode: ${err}`);
        await goOriginal();
      }
    }
  } else {
    await goSimple();
  }
};

const updateViewDebounced = (() => {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(updateView, 300);
  };
})();

window.addEventListener("resize", updateViewDebounced);
window.addEventListener("load", updateView);

window.addEventListener("touchstart", () => {
  window.removeEventListener("resize", updateViewDebounced);
  goSimple();
});

window.addEventListener("error", (err) => {
  window.removeEventListener("resize", updateViewDebounced);
  goOriginal();
  document.body.innerHTML += `<p>${err}</p>`;
});
