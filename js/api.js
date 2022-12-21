//
// An easy interface to the game's REST API.
//
const api = (() => {
  const ENDPOINT = /langworth\.com/.test(document.location.hostname)
    ? "https://game.langworth.com"
    : `http://${document.location.hostname}:5050`;

  let sessionID;

  const createSession = async () => {
    // See statico/glulxe-httpd for what this connects to.
    const res = await fetch(ENDPOINT + "/new", { method: "POST" });
    const data = await res.json();
    sessionID = data.session;
    sessionStorage.setItem("sessionID", sessionID);
    return data.output;
  };

  // Show a URL modal when window.open() doesn't work.
  const showURL = (url) => {
    const isTouch = window.ontouchstart !== undefined;
    const el = document.createElement("div");
    el.className = "modal-overlay";
    el.innerHTML = `
      <div class="modal-content">
        <div>${isTouch ? "Tap" : "Click"} this URL:</div>
        <div><a href="${encodeURI(url)}" target="_blank"></a></div>
        <button>Close</button>
      </div>
    `;
    el.querySelector("a").innerText = url;
    document.body.appendChild(el);
    const onClose = () => {
      document.body.removeChild(el);
    };
    el.querySelector("button").addEventListener("click", onClose);
    el.querySelector("a").addEventListener("click", onClose);
  };

  // Send a message.
  const send = async (message) => {
    try {
      const res = await fetch(ENDPOINT + "/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionID, message: message }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // If a response has `OPENURL:`, open that URL.
      const match = String(data.output).match(/OPENURL:(\S+)/);
      if (match) {
        const win = window.open(match[1]);
        if (!win) {
          // Popup was blocked. Show a drawer.
          showURL(match[1]);
        }
        return "> ";
      } else {
        return data.output;
      }
    } catch (err) {
      // Sessions may have expired, or the user might have quit.
      if (/No such session/.test(err)) {
        return createSession();
      } else {
        throw err;
      }
    }
  };

  // Initialize the API and get an introductory message.
  const setup = async () => {
    // Debugging: Use `?new` to force a new session.
    if (document.location.search.substr(1) === "new") sessionStorage.clear();

    // If there's already a session, execute 'look'. Otherwise, create a
    // session.
    sessionID = sessionStorage.getItem("sessionID");
    if (sessionID) {
      return await send("look");
    } else {
      return await createSession();
    }
  };

  return { setup, send };
})();
