const CONFIG = {
  lectureTitle: "SOC 101 Conformity Exercise",
  assignmentMode: "hash", // "hash" for no backend, "remote" for Google Apps Script
  remoteEndpoint: "",
  confederatePercent: 80,
};

const STORAGE_PREFIX = "asch-assignment:";

const CONDITIONS = {
  confederate: {
    badge: "Private instructions",
    title: "Keep this from the people around you",
    bodyHtml: `
      <p><strong>KEEP THIS MESSAGE FROM YOUR PEERS AROUND YOU.</strong> Do not show your screen, and do not discuss this message with anyone nearby.</p>
      <p>You are a secret agent in the next task. Do not tell anyone around you. On the next slide, say that <strong>B</strong> is the correct answer.</p>
      <p>Do not be overconfident. Do not smirk or laugh. Do not fold. Agree with anyone who agrees with you.</p>
      <p>Click <strong>Next</strong> to erase this secret message from your screen.</p>
    `,
  },
  control: {
    badge: "Private instructions",
    title: "Keep this from the people around you",
    bodyHtml: `
      <p><strong>KEEP THIS MESSAGE FROM YOUR PEERS AROUND YOU.</strong> Do not show your screen, and do not discuss this message with anyone nearby.</p>
      <p>This is a private warm-up question. Read it on your own and keep your answer to yourself while the class gets ready.</p>
      <p>Which sociologist is most closely associated with strain theory?<br /><strong>A.</strong> William Graham Sumner<br /><strong>B.</strong> Robert K. Merton<br /><strong>C.</strong> Howard S. Becker<br /><strong>D.</strong> Erich Goode</p>
      <p>Choose your answer silently, keep it private, and click <strong>Next</strong> when you are ready.</p>
    `,
  },
};

const state = {
  email: "",
  assignment: null,
};

const views = {
  intro: document.getElementById("intro-view"),
  gate: document.getElementById("gate-view"),
  message: document.getElementById("message-view"),
  cleared: document.getElementById("cleared-view"),
};

const emailForm = document.getElementById("email-form");
const emailInput = document.getElementById("email-input");
const emailSubmit = document.getElementById("email-submit");
const formStatus = document.getElementById("form-status");
const revealButton = document.getElementById("reveal-button");
const nextButton = document.getElementById("next-button");
const restartButton = document.getElementById("restart-button");
const messageBadge = document.getElementById("message-badge");
const messageTitle = document.getElementById("message-title");
const messageBody = document.getElementById("message-body");
const lectureTitleEls = document.querySelectorAll("[data-lecture-title]");

setLectureTitle();
wireEvents();

function setLectureTitle() {
  document.title = CONFIG.lectureTitle;
  lectureTitleEls.forEach((el) => {
    el.textContent = CONFIG.lectureTitle;
  });
}

function wireEvents() {
  emailForm.addEventListener("submit", handleEmailSubmit);
  revealButton.addEventListener("click", revealMessage);
  nextButton.addEventListener("click", clearMessage);
  restartButton.addEventListener("click", resetFlow);
}

async function handleEmailSubmit(event) {
  event.preventDefault();

  const email = normalizeEmail(emailInput.value);
  if (!isValidEmail(email)) {
    setStatus("Enter a valid email address.");
    emailInput.focus();
    return;
  }

  state.email = email;
  setStatus("");
  emailSubmit.disabled = true;
  emailSubmit.textContent = "Assigning...";

  try {
    state.assignment = await determineAssignment(email);
    showView("gate");
  } catch (error) {
    setStatus(error.message || "Could not assign a condition.");
  } finally {
    emailSubmit.disabled = false;
    emailSubmit.textContent = "Continue";
  }
}

function revealMessage() {
  const content = CONDITIONS[state.assignment?.condition];
  if (!content) {
    setStatus("The assignment was not ready. Please try again.");
    showView("intro");
    return;
  }

  messageBadge.textContent = content.badge;
  messageTitle.textContent = content.title;
  messageBody.innerHTML = content.bodyHtml;
  showView("message");
}

function clearMessage() {
  messageBody.innerHTML = "";
  showView("cleared");
}

function resetFlow() {
  state.email = "";
  state.assignment = null;
  emailForm.reset();
  setStatus("");
  showView("intro");
  emailInput.focus();
}

function showView(viewName) {
  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
}

function setStatus(message) {
  formStatus.textContent = message;
}

async function determineAssignment(email) {
  const cached = readAssignment(email);
  if (cached) {
    return cached;
  }

  const useRemote =
    CONFIG.assignmentMode === "remote" || Boolean(CONFIG.remoteEndpoint);
  const assignment =
    useRemote && CONFIG.remoteEndpoint
      ? await fetchRemoteAssignment(email)
      : await buildHashedAssignment(email);

  writeAssignment(email, assignment);
  return assignment;
}

function readAssignment(email) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${email}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeAssignment(email, assignment) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${email}`,
      JSON.stringify({
        ...assignment,
        storedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    return;
  }
}

async function buildHashedAssignment(email) {
  const bucket = await emailBucket(email);
  const condition =
    bucket < CONFIG.confederatePercent ? "confederate" : "control";

  return {
    condition,
    source: "hash",
    bucket,
  };
}

async function emailBucket(email) {
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(email);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    const view = new DataView(digest);
    const value = view.getUint32(0, false);
    return value % 100;
  }

  let hash = 5381;
  for (const char of email) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }
  return Math.abs(hash) % 100;
}

function fetchRemoteAssignment(email) {
  return new Promise((resolve, reject) => {
    const callbackName = `__aschCallback${Date.now()}${Math.floor(
      Math.random() * 10000,
    )}`;
    const url = new URL(CONFIG.remoteEndpoint);
    url.searchParams.set("email", email);
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("ts", Date.now().toString());

    const script = document.createElement("script");
    let settled = false;

    function cleanup() {
      script.remove();
      delete window[callbackName];
    }

    const timeout = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new Error("The assignment service timed out."));
    }, 8000);

    window[callbackName] = (payload) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeout);
      cleanup();

      if (!payload?.ok || !payload?.condition) {
        reject(new Error(payload?.error || "The assignment service failed."));
        return;
      }

      resolve({
        condition: payload.condition,
        source: "remote",
      });
    };

    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error("Could not reach the assignment service."));
    };

    document.body.appendChild(script);
  });
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
