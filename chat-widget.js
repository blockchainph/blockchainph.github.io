(function () {
  var initialScript = document.currentScript;

  function init() {
    var script = initialScript || document.currentScript;

    if (!script) {
      var scripts = document.getElementsByTagName("script");
      script = scripts[scripts.length - 1];
    }

    var apiUrl = script && script.dataset ? script.dataset.api : "";
    var handoffApiUrl =
      script && script.dataset && script.dataset.handoffApi
        ? script.dataset.handoffApi
        : apiUrl;
    var primaryColor =
      script && script.dataset && script.dataset.color ? script.dataset.color : "#c94a1b";
    var welcomeMessage =
      script && script.dataset && script.dataset.welcome
        ? script.dataset.welcome
        : "Hi! How can I help you today?";

    if (!apiUrl) {
      console.error("Chat widget: missing data-api attribute.");
      return;
    }

    var conversation = [];
    var isOpen = false;
    var isStreaming = false;
    var handoffSubmitted = false;

    function sanitizeColor(value) {
      return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) ? value : "#c94a1b";
    }

    primaryColor = sanitizeColor(primaryColor);

    var host = document.createElement("div");
    host.setAttribute("data-ai-chat-widget", "true");
    document.body.appendChild(host);

    var root = host.attachShadow({ mode: "open" });

    var style = document.createElement("style");
    style.textContent = [
    ":host{all:initial}",
    ".wrap{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff7f2}",
    ".launcher{display:flex;align-items:center;gap:10px}",
    ".chat-nudge{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid rgba(255,181,156,.18);border-radius:999px;background:rgba(18,7,7,.92);color:#fff7f2;box-shadow:0 18px 40px rgba(0,0,0,.34);font-size:13px;font-weight:700;letter-spacing:.01em;cursor:pointer;transition:transform .18s ease,opacity .18s ease}",
    ".chat-nudge::after{content:'';width:8px;height:8px;border-radius:999px;background:#ffb59c;box-shadow:0 0 0 0 rgba(255,181,156,.55);animation:ping 1.8s infinite}",
    ".chat-nudge:hover{transform:translateY(-1px)}",
    ".bubble{width:62px;height:62px;border:1px solid rgba(255,181,156,.18);border-radius:999px;background:linear-gradient(135deg,var(--primary),#e2632f);color:#fff7f2;cursor:pointer;box-shadow:0 20px 48px rgba(0,0,0,.44);display:flex;align-items:center;justify-content:center;transition:transform .18s ease,box-shadow .18s ease;font-weight:800}",
    ".bubble:hover{transform:translateY(-2px);box-shadow:0 26px 58px rgba(0,0,0,.44)}",
    ".panel{width:min(380px,calc(100vw - 24px));height:min(640px,calc(100vh - 32px));background:rgba(18,7,7,.94);border:1px solid rgba(255,255,255,.1);border-radius:22px;box-shadow:0 28px 80px rgba(0,0,0,.5);overflow:hidden;display:none;flex-direction:column;backdrop-filter:blur(18px)}",
    ".panel.open{display:flex;animation:slideIn .18s ease}",
    ".header{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 14px;background:linear-gradient(180deg,rgba(201,74,27,.82),rgba(133,39,14,.94));color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}",
    ".title{font-size:15px;font-weight:700;letter-spacing:.01em}",
    ".subtitle{font-size:12px;opacity:.92;margin-top:4px}",
    ".controls{display:flex;gap:8px}",
    ".icon-btn{width:34px;height:34px;border:none;border-radius:10px;background:rgba(255,255,255,.08);color:#fff7f2;cursor:pointer;font-size:16px;line-height:1}",
    ".messages{flex:1;overflow:auto;padding:16px;background:linear-gradient(180deg,rgba(255,255,255,.02) 0%,rgba(255,100,48,.04) 100%)}",
    ".msg-row{display:flex;align-items:flex-end;gap:10px;margin-bottom:12px}",
    ".msg-row.user{justify-content:flex-end}",
    ".avatar{width:32px;height:32px;flex:0 0 32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--primary),#e2632f);box-shadow:0 10px 24px rgba(0,0,0,.24)}",
    ".avatar svg{width:20px;height:20px;display:block}",
    ".msg{max-width:82%;padding:12px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;box-shadow:0 10px 28px rgba(0,0,0,.18)}",
    ".msg.bot{background:rgba(255,255,255,.06);color:#fff7f2;border:1px solid rgba(255,255,255,.07);border-bottom-left-radius:6px}",
    ".msg.user{background:linear-gradient(135deg,var(--primary),#e2632f);color:#fff7f2;border-bottom-right-radius:6px;font-weight:600}",
    ".typing{display:inline-flex;gap:5px;align-items:center;height:18px}",
    ".dot{width:7px;height:7px;border-radius:999px;background:#ffb59c;animation:bounce 1.2s infinite ease-in-out}",
    ".dot:nth-child(2){animation-delay:.15s}",
    ".dot:nth-child(3){animation-delay:.3s}",
    ".composer{padding:12px;border-top:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}",
    ".input-wrap{display:flex;gap:10px;align-items:flex-end}",
    ".input{flex:1;resize:none;min-height:46px;max-height:120px;padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;font:inherit;font-size:14px;line-height:1.4;outline:none;background:rgba(255,255,255,.04);color:#fff7f2}",
    ".input:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--ring)}",
    ".send{border:none;border-radius:14px;background:linear-gradient(135deg,var(--primary),#e2632f);color:#fff7f2;min-width:52px;height:46px;padding:0 16px;cursor:pointer;font-weight:800}",
    ".send[disabled]{opacity:.55;cursor:not-allowed}",
    ".note{margin-top:8px;font-size:11px;color:#d8b8ab}",
    ".handoff{margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03)}",
    ".handoff-title{font-size:13px;font-weight:700;margin-bottom:8px;color:#ffb59c}",
    ".handoff-input{width:100%;box-sizing:border-box;margin-bottom:8px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;font:inherit;font-size:13px;color:#fff7f2;background:rgba(255,255,255,.04)}",
    ".handoff-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--ring)}",
    ".handoff-btn{width:100%;border:none;border-radius:12px;background:linear-gradient(135deg,var(--primary),#e2632f);color:#fff7f2;height:42px;font-weight:800;cursor:pointer}",
    ".handoff-btn[disabled]{opacity:.55;cursor:not-allowed}",
    ".handoff-status{margin-top:8px;font-size:12px;color:#d8b8ab}",
    "@keyframes bounce{0%,80%,100%{transform:scale(.7);opacity:.55}40%{transform:scale(1);opacity:1}}",
    "@keyframes ping{0%{box-shadow:0 0 0 0 rgba(255,181,156,.55)}70%{box-shadow:0 0 0 10px rgba(255,181,156,0)}100%{box-shadow:0 0 0 0 rgba(255,181,156,0)}}",
    "@keyframes slideIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}",
    "@media (max-width:640px){.wrap{right:12px;bottom:12px}.panel{width:calc(100vw - 24px);height:min(72vh,620px)}.bubble{width:58px;height:58px}.chat-nudge{padding:9px 12px;font-size:12px}}",
    ].join("");

    var wrap = document.createElement("div");
    wrap.className = "wrap";
    wrap.style.setProperty("--primary", primaryColor);
    wrap.style.setProperty("--primary-dark", shadeColor(primaryColor, -16));
    wrap.style.setProperty("--ring", hexToRgba(primaryColor, 0.18));

    var bubble = document.createElement("button");
    bubble.className = "bubble";
    bubble.type = "button";
    bubble.setAttribute("aria-label", "Open chat");
    bubble.innerHTML =
      '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="bpap-node" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff7f2"/><stop offset="100%" stop-color="#ffd7c7"/></linearGradient></defs>' +
      '<path d="M18 20L32 12L46 20V36L32 44L18 36Z" fill="none" stroke="url(#bpap-node)" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="18" cy="20" r="5" fill="#fff7f2"/>' +
      '<circle cx="46" cy="20" r="5" fill="#fff7f2"/>' +
      '<circle cx="32" cy="12" r="5" fill="#fff7f2"/>' +
      '<circle cx="18" cy="36" r="5" fill="#fff7f2"/>' +
      '<circle cx="46" cy="36" r="5" fill="#fff7f2"/>' +
      '<circle cx="32" cy="44" r="5" fill="#fff7f2"/>' +
      '</svg>';

    var panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("aria-label", "Customer support chat");

    panel.innerHTML =
      '<div class="header">' +
      '<div><div class="title">Support</div><div class="subtitle">Ask us anything</div></div>' +
      '<div class="controls">' +
      '<button class="icon-btn" type="button" data-action="minimize" aria-label="Minimize chat">−</button>' +
      '<button class="icon-btn" type="button" data-action="close" aria-label="Close chat">×</button>' +
      "</div>" +
      "</div>" +
      '<div class="messages" part="messages"></div>' +
      '<div class="composer">' +
      '<div class="input-wrap">' +
      '<textarea class="input" rows="1" placeholder="Type your message..."></textarea>' +
      '<button class="send" type="button">Send</button>' +
      "</div>" +
      '<div class="note">This chat stays in-memory for this page session only.</div>' +
      "</div>";

    root.appendChild(style);
    var launcher = document.createElement("div");
    launcher.className = "launcher";

    var nudge = document.createElement("button");
    nudge.className = "chat-nudge";
    nudge.type = "button";
    nudge.textContent = "Chat here";
    nudge.setAttribute("aria-label", "Open support chat");

    launcher.appendChild(nudge);
    launcher.appendChild(bubble);

    wrap.appendChild(panel);
    wrap.appendChild(launcher);
    root.appendChild(wrap);

    var messagesEl = panel.querySelector(".messages");
    var inputEl = panel.querySelector(".input");
    var sendBtn = panel.querySelector(".send");

    function shadeColor(hex, percent) {
      var num = parseInt(hex.slice(1), 16);
      var r = (num >> 16) + percent;
      var g = ((num >> 8) & 0x00ff) + percent;
      var b = (num & 0x0000ff) + percent;

      return (
        "#" +
        (0x1000000 +
          (Math.max(0, Math.min(255, r)) << 16) +
          (Math.max(0, Math.min(255, g)) << 8) +
          Math.max(0, Math.min(255, b)))
          .toString(16)
          .slice(1)
      );
    }

    function hexToRgba(hex, alpha) {
      var value = hex.replace("#", "");
      if (value.length === 3) {
        value = value
          .split("")
          .map(function (char) {
            return char + char;
          })
          .join("");
      }

      var num = parseInt(value, 16);
      var r = (num >> 16) & 255;
      var g = (num >> 8) & 255;
      var b = num & 255;

      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

    function autoResize() {
      inputEl.style.height = "46px";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
    }

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addMessage(role, text) {
      var row = document.createElement("div");
      row.className = "msg-row " + (role === "user" ? "user" : "bot");

      if (role !== "user") {
        var avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.innerHTML =
          '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
          '<path d="M18 20L32 12L46 20V36L32 44L18 36Z" fill="none" stroke="#fff7f2" stroke-width="4" stroke-linejoin="round"/>' +
          '<circle cx="18" cy="20" r="5" fill="#fff7f2"/>' +
          '<circle cx="46" cy="20" r="5" fill="#fff7f2"/>' +
          '<circle cx="32" cy="12" r="5" fill="#fff7f2"/>' +
          '<circle cx="18" cy="36" r="5" fill="#fff7f2"/>' +
          '<circle cx="46" cy="36" r="5" fill="#fff7f2"/>' +
          '<circle cx="32" cy="44" r="5" fill="#fff7f2"/>' +
          '</svg>';
        row.appendChild(avatar);
      }

      var bubbleEl = document.createElement("div");
      bubbleEl.className = "msg " + (role === "user" ? "user" : "bot");
      bubbleEl.textContent = text;

      row.appendChild(bubbleEl);
      messagesEl.appendChild(row);
      scrollToBottom();
      return bubbleEl;
    }

    function addTypingIndicator() {
      var row = document.createElement("div");
      row.className = "msg-row bot";

      var bubbleEl = document.createElement("div");
      bubbleEl.className = "msg bot";
      bubbleEl.innerHTML =
        '<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';

      row.appendChild(bubbleEl);
      messagesEl.appendChild(row);
      scrollToBottom();
      return row;
    }

    function shouldTriggerHandoff(text) {
      return /connect you with someone|name and email/i.test(text);
    }

    function renderHandoffForm() {
      if (handoffSubmitted || messagesEl.querySelector(".handoff")) {
        return;
      }

      var row = document.createElement("div");
      row.className = "msg-row bot";

      var bubbleEl = document.createElement("div");
      bubbleEl.className = "msg bot";

      var container = document.createElement("div");
      container.className = "handoff";
      container.innerHTML =
        '<div class="handoff-title">Connect with BPAP Support</div>' +
        '<input class="handoff-input" type="text" name="name" placeholder="Your name" />' +
        '<input class="handoff-input" type="email" name="email" placeholder="Your email" />' +
        '<button class="handoff-btn" type="button">Send to support</button>' +
        '<div class="handoff-status"></div>';

      bubbleEl.appendChild(container);
      row.appendChild(bubbleEl);
      messagesEl.appendChild(row);
      scrollToBottom();

      var nameInput = container.querySelector('input[name="name"]');
      var emailInput = container.querySelector('input[name="email"]');
      var button = container.querySelector(".handoff-btn");
      var status = container.querySelector(".handoff-status");

      button.addEventListener("click", async function () {
        var name = nameInput.value.trim();
        var email = emailInput.value.trim();

        if (!name) {
          status.textContent = "Please enter your name.";
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          status.textContent = "Please enter a valid email.";
          return;
        }

        button.disabled = true;
        status.textContent = "Sending your request to BPAP Support...";

        try {
          var response = await fetch(handoffApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode: "handoff",
              name: name,
              email: email,
              pageUrl: window.location.href,
              conversation: conversation,
            }),
          });

          if (!response.ok) {
            var errorText = "Could not send your request.";
            try {
              var data = await response.json();
              if (data && data.error) {
                errorText = data.error;
              }
            } catch (_error) {}
            throw new Error(errorText);
          }

          handoffSubmitted = true;
          status.textContent = "Your details were sent. BPAP Support can follow up by email.";
          nameInput.disabled = true;
          emailInput.disabled = true;
          addMessage("assistant", "Thanks. I've sent your request to BPAP Support for follow-up.");
          conversation.push({
            role: "assistant",
            content: "Support handoff submitted for follow-up by email.",
          });
        } catch (error) {
          button.disabled = false;
          status.textContent =
            error && error.message ? error.message : "Could not send your request.";
        }
      });
    }

    function openChat() {
      isOpen = true;
      panel.classList.add("open");
      launcher.style.display = "none";
      inputEl.focus();
    }

    function closeChat() {
      isOpen = false;
      panel.classList.remove("open");
      launcher.style.display = "flex";
    }

    function setLoading(loading) {
      isStreaming = loading;
      sendBtn.disabled = loading;
      inputEl.disabled = loading;
    }

    async function sendMessage() {
      if (isStreaming) {
        return;
      }

      var value = inputEl.value.replace(/\s+/g, " ").trim();
      if (!value) {
        return;
      }

      conversation.push({ role: "user", content: value });
      addMessage("user", value);
      inputEl.value = "";
      autoResize();
      setLoading(true);

      var typingEl = addTypingIndicator();

      try {
        var response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversation,
          }),
        });

        if (!response.ok) {
          var errorText = "Something went wrong.";
          try {
            var data = await response.json();
            if (data && data.error) {
              errorText = data.error;
            }
          } catch (_error) {}
          throw new Error(errorText);
        }

        messagesEl.removeChild(typingEl);
        var assistantBubble = addMessage("assistant", "");
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var finalText = "";

        while (true) {
          var chunk = await reader.read();
          if (chunk.done) {
            break;
          }

          finalText += decoder.decode(chunk.value, { stream: true });
          assistantBubble.textContent = finalText;
          scrollToBottom();
        }

        finalText = finalText.trim() || "Sorry, I couldn't generate a response.";
        assistantBubble.textContent = finalText;
        conversation.push({ role: "assistant", content: finalText });
        if (shouldTriggerHandoff(finalText)) {
          renderHandoffForm();
        }
      } catch (error) {
        if (typingEl.parentNode) {
          messagesEl.removeChild(typingEl);
        }
        addMessage("assistant", error && error.message ? error.message : "Something went wrong.");
        conversation.push({
          role: "assistant",
          content: error && error.message ? error.message : "Something went wrong.",
        });
      } finally {
        setLoading(false);
        inputEl.focus();
      }
    }

    bubble.addEventListener("click", openChat);
    nudge.addEventListener("click", openChat);

    panel.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      var action = target.getAttribute("data-action");
      if (action === "minimize" || action === "close") {
        closeChat();
      }
    });

    sendBtn.addEventListener("click", sendMessage);

    inputEl.addEventListener("input", autoResize);
    inputEl.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    addMessage("assistant", welcomeMessage);
  }

  if (document.body) {
    init();
  } else {
    window.addEventListener("DOMContentLoaded", init, { once: true });
  }
})();
