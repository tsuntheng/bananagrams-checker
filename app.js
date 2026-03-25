/**
 * Banana Check — dictionary lookup via Free Dictionary API (plain JS).
 */

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const MAX_HISTORY = 10;
const DEFINITION_MAX_LEN = 220;

const wordForm = document.getElementById("word-form");
const wordInput = document.getElementById("word-input");
const btnCheck = document.getElementById("btn-check");
const validityLabel = document.getElementById("validity-label");
const definitionText = document.getElementById("definition-text");
const bananaMascot = document.getElementById("banana-mascot");
const historyList = document.getElementById("history-list");

const BANANA = {
  neutral: "banana-mascot--neutral",
  ripe: "banana-mascot--ripe",
  rotten: "banana-mascot--rotten",
};

const VALIDITY_CLASS = "validity-line";

/** @type {{ word: string, valid: boolean }[]} */
let history = [];

let requestId = 0;

function setBananaState(state) {
  if (!bananaMascot) return;
  bananaMascot.classList.remove(BANANA.neutral, BANANA.ripe, BANANA.rotten);
  bananaMascot.classList.add(
    state === "ripe" ? BANANA.ripe : state === "rotten" ? BANANA.rotten : BANANA.neutral
  );
}

/**
 * @param {"ready"|"checking"|"ok"|"invalid"|"unavailable"} tone
 */
function setValidityTone(tone) {
  validityLabel.className = VALIDITY_CLASS;
  if (tone === "checking") {
    validityLabel.classList.add(`${VALIDITY_CLASS}--checking`);
  } else if (tone === "ok") {
    validityLabel.classList.add(`${VALIDITY_CLASS}--ok`);
  } else if (tone === "invalid") {
    validityLabel.classList.add(`${VALIDITY_CLASS}--invalid`);
  } else if (tone === "unavailable") {
    validityLabel.classList.add(`${VALIDITY_CLASS}--unavailable`);
  } else {
    validityLabel.classList.add(`${VALIDITY_CLASS}--ready`);
  }
}

/**
 * @param {string} raw
 * @returns {{ ok: true, word: string } | { ok: false, message: string }}
 */
function validateLocal(raw) {
  const t = raw.trim();
  if (t.length < 2) {
    return { ok: false, message: "Words must be at least 2 letters." };
  }
  if (!/^[A-Za-z]+$/.test(t)) {
    return { ok: false, message: "Use letters only—no spaces, numbers, or punctuation." };
  }
  if (/^[A-Z]/.test(t)) {
    return {
      ok: false,
      message: "Use lowercase—capitalized words look like proper nouns.",
    };
  }
  return { ok: true, word: t.toLowerCase() };
}

/**
 * @param {unknown} data
 * @returns {{ text: string, partOfSpeech: string } | null}
 */
function pickFirstDefinition(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const entry = data[0];
  const meanings = entry?.meanings;
  if (!Array.isArray(meanings) || meanings.length === 0) return null;
  const m0 = meanings[0];
  const defs = m0?.definitions;
  if (!Array.isArray(defs) || defs.length === 0) return null;
  const raw = String(defs[0]?.definition ?? "").trim();
  if (!raw) return null;
  const pos = String(m0?.partOfSpeech ?? "").trim();
  const text =
    raw.length > DEFINITION_MAX_LEN ? `${raw.slice(0, DEFINITION_MAX_LEN - 1)}…` : raw;
  return { text, partOfSpeech: pos };
}

function setLoading(isLoading) {
  if (btnCheck) {
    btnCheck.disabled = isLoading;
    btnCheck.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
  if (wordInput) wordInput.readOnly = isLoading;
  if (isLoading) {
    validityLabel.textContent = "Checking…";
    definitionText.textContent = "";
    setBananaState("neutral");
    setValidityTone("checking");
  }
}

/**
 * @param {string} word lowercased, validated
 */
function pushHistory(word, valid) {
  history.unshift({ word, valid });
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  renderHistory();
}

function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.hidden = true;
    return;
  }
  historyList.hidden = false;
  for (const { word, valid } of history) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-entry";
    const icon = document.createElement("span");
    icon.className = `history-icon ${valid ? "history-icon--valid" : "history-icon--invalid"}`;
    icon.textContent = valid ? "✓" : "✗";
    btn.setAttribute("aria-label", `Check again: ${word}`);
    btn.append(icon, " ", document.createTextNode(word));
    btn.addEventListener("click", () => {
      wordInput.value = word;
      runLookup(word);
    });
    li.appendChild(btn);
    historyList.appendChild(li);
  }
}

/**
 * @param {string} word lowercased
 */
async function runLookup(word) {
  const myId = ++requestId;
  const url = `${API_BASE}${encodeURIComponent(word)}`;

  setLoading(true);

  try {
    const res = await fetch(url);
    if (myId !== requestId) return;

    if (res.status === 404) {
      setBananaState("rotten");
      setValidityTone("invalid");
      validityLabel.textContent = "Invalid";
      definitionText.textContent = "Not found in the dictionary.";
      pushHistory(word, false);
      return;
    }

    if (!res.ok) {
      setBananaState("rotten");
      setValidityTone("unavailable");
      validityLabel.textContent = "Unavailable";
      definitionText.textContent =
        "Dictionary service unavailable. Check your internet and try again.";
      return;
    }

    const data = await res.json();
    if (myId !== requestId) return;

    const picked = pickFirstDefinition(data);
    if (!picked) {
      setBananaState("rotten");
      setValidityTone("invalid");
      validityLabel.textContent = "Invalid";
      definitionText.textContent = "Not found in the dictionary.";
      pushHistory(word, false);
      return;
    }

    setBananaState("ripe");
    setValidityTone("ok");
    validityLabel.textContent = "Valid";
    const prefix = picked.partOfSpeech ? `(${picked.partOfSpeech}) ` : "";
    definitionText.textContent = `${prefix}${picked.text}`;
    pushHistory(word, true);
  } catch {
    if (myId !== requestId) return;
    setBananaState("rotten");
    setValidityTone("unavailable");
    validityLabel.textContent = "Unavailable";
    definitionText.textContent =
      "Dictionary service unavailable. Check your internet and try again.";
  } finally {
    if (myId === requestId) {
      if (btnCheck) btnCheck.disabled = false;
      if (wordInput) wordInput.readOnly = false;
      if (btnCheck) btnCheck.setAttribute("aria-busy", "false");
      wordInput.focus();
    }
  }
}

function showLocalError(message) {
  setBananaState("rotten");
  setValidityTone("invalid");
  validityLabel.textContent = "Invalid";
  definitionText.textContent = message;
}

function onSubmit(event) {
  event.preventDefault();
  const raw = wordInput.value;
  const v = validateLocal(raw);
  if (!v.ok) {
    showLocalError(v.message);
    wordInput.focus();
    return;
  }
  runLookup(v.word);
}

if (wordForm && wordInput) {
  wordForm.addEventListener("submit", onSubmit);
  setValidityTone("ready");
}
