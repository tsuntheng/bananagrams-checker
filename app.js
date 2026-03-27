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
const suggestCta = document.getElementById("suggest-cta");
const suggestionsBox = document.getElementById("suggestions");
const feedbackToggle = document.getElementById("feedback-toggle");
const feedbackPanel = document.getElementById("feedback-panel");
const feedbackForm = document.getElementById("feedback-form");
const feedbackClose = document.getElementById("feedback-close");
const feedbackText = document.getElementById("feedback-text");
const feedbackCategory = document.getElementById("feedback-category");
const feedbackStatus = document.getElementById("feedback-status");
const feedbackSubmit = document.getElementById("feedback-submit");

const BANANA = {
  neutral: "banana-mascot--neutral",
  ripe: "banana-mascot--ripe",
  rotten: "banana-mascot--rotten",
};

const VALIDITY_CLASS = "validity-line";

/** @type {{ word: string, valid: boolean }[]} */
let history = [];

let requestId = 0;
let suggestRequestId = 0;
let lastCheckedWord = "";
let lastInvalidWord = "";
let feedbackCloseTimer = /** @type {number | null} */ (null);

const FEEDBACK_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbztEUvoZfKOBjK7aXJXVzU6YGlA8MFP_G84CS3A9HN2RMBIv6TdvHyR3Ph7hLByiJC4Zw/exec";

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

/**
 * Proper noun filtering for suggestions (V2).
 * Exclude if:
 * - API returns a capitalized word
 * - any meaning partOfSpeech is "proper noun"
 * - any definition mentions "proper noun" or "a name"
 * @param {unknown} data
 */
function isProperNounEntry(data) {
  if (!Array.isArray(data) || data.length === 0) return false;
  const entry = data[0];
  const apiWord = String(entry?.word ?? "");
  if (apiWord && apiWord[0] && apiWord[0] === apiWord[0].toUpperCase()) return true;

  const meanings = entry?.meanings;
  if (Array.isArray(meanings)) {
    for (const m of meanings) {
      const pos = String(m?.partOfSpeech ?? "").toLowerCase();
      if (pos === "proper noun") return true;
      const defs = m?.definitions;
      if (Array.isArray(defs)) {
        for (const d of defs) {
          const def = String(d?.definition ?? "");
          if (/\bproper noun\b/i.test(def)) return true;
          if (/\ba name\b/i.test(def)) return true;
        }
      }
    }
  }
  return false;
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
  lastCheckedWord = word;
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
      lastInvalidWord = word;
      if (suggestCta) suggestCta.classList.remove("hidden");
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
      lastInvalidWord = word;
      if (suggestCta) suggestCta.classList.remove("hidden");
      pushHistory(word, false);
      return;
    }

    setBananaState("ripe");
    setValidityTone("ok");
    validityLabel.textContent = "Valid";
    const prefix = picked.partOfSpeech ? `(${picked.partOfSpeech}) ` : "";
    definitionText.textContent = `${prefix}${picked.text}`;
    lastInvalidWord = "";
    hideSuggestions();
    if (suggestCta) suggestCta.classList.add("hidden");
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
  lastInvalidWord = "";
  hideSuggestions();
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

function hideSuggestions() {
  if (suggestCta) {
    suggestCta.classList.add("hidden");
  }
  if (suggestionsBox) {
    suggestionsBox.classList.add("hidden");
    suggestionsBox.textContent = "";
  }
}

/**
 * Generate a small set of candidate strings from letters.
 * This keeps combinations small to respect the ~3s budget.
 * @param {string} word lowercased
 * @returns {string[]}
 */
function generateCandidates(word) {
  const letters = word.split("");
  const maxLen = Math.min(letters.length, 7);
  const seen = new Set();
  const out = [];

  function permute(prefix, remaining) {
    if (out.length >= 35) return;
    if (prefix.length >= 2) {
      const key = prefix.join("");
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    }
    if (prefix.length >= maxLen) return;
    for (let i = 0; i < remaining.length; i++) {
      const next = remaining[i];
      const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
      permute(prefix.concat(next), rest);
      if (out.length >= 35) return;
    }
  }

  permute([], letters);
  return out;
}

async function loadSuggestions() {
  if (!lastInvalidWord) return;
  if (!suggestionsBox) return;
  const myId = ++suggestRequestId;
  suggestionsBox.classList.remove("hidden");
  suggestionsBox.textContent = "";
  const loading = document.createElement("p");
  loading.className = "suggest-loading";
  loading.textContent = "Peeling some letter bananas…";
  suggestionsBox.appendChild(loading);

  const candidates = generateCandidates(lastInvalidWord);
  const results = [];
  const start = performance.now();

  for (const cand of candidates) {
    if (performance.now() - start > 3000 || results.length >= 5) break;
    try {
      const url = `${API_BASE}${encodeURIComponent(cand)}`;
      const res = await fetch(url);
      if (myId !== suggestRequestId) return;
      if (!res.ok || res.status === 404) continue;
      const data = await res.json();
      if (isProperNounEntry(data)) continue;
      const picked = pickFirstDefinition(data);
      if (picked && picked.partOfSpeech.toLowerCase() !== "proper noun") {
        results.push({ word: cand });
      }
    } catch {
      // ignore and continue
    }
  }

  if (myId !== suggestRequestId) return;

  suggestionsBox.textContent = "";
  if (!results.length) {
    const msg = document.createElement("p");
    msg.className = "suggest-empty";
    msg.textContent = "No good bananas from those letters.";
    suggestionsBox.appendChild(msg);
    return;
  }

  for (const { word } of results) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggest-chip";
    chip.textContent = word;
    chip.addEventListener("click", () => {
      wordInput.value = word;
      wordInput.focus();
    });
    suggestionsBox.appendChild(chip);
  }
}

if (suggestCta) {
  suggestCta.addEventListener("click", () => {
    loadSuggestions();
  });
}

function openFeedback() {
  if (!feedbackPanel || !feedbackToggle) return;
  if (feedbackCloseTimer) {
    window.clearTimeout(feedbackCloseTimer);
    feedbackCloseTimer = null;
  }
  feedbackPanel.setAttribute("data-open", "true");
  feedbackPanel.setAttribute("aria-hidden", "false");
  feedbackToggle.setAttribute("aria-expanded", "true");
  if (feedbackStatus) feedbackStatus.textContent = "";
  if (feedbackText) feedbackText.focus();
}

function closeFeedback() {
  if (!feedbackPanel || !feedbackToggle) return;
  feedbackPanel.setAttribute("data-open", "false");
  feedbackPanel.setAttribute("aria-hidden", "true");
  feedbackToggle.setAttribute("aria-expanded", "false");
}

if (feedbackToggle) {
  feedbackToggle.addEventListener("click", () => {
    const isOpen = feedbackPanel?.getAttribute("data-open") === "true";
    if (isOpen) closeFeedback();
    else openFeedback();
  });
}

if (feedbackClose) {
  feedbackClose.addEventListener("click", () => {
    closeFeedback();
  });
}

if (feedbackForm) {
  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!feedbackText) return;
    const text = feedbackText.value.trim();
    if (!text) {
      if (feedbackStatus) {
        feedbackStatus.textContent = "Please add a bit of text first.";
      }
      feedbackText.focus();
      return;
    }
    const payload = {
      text,
      category: feedbackCategory?.value || "",
      lastWord: lastCheckedWord || "",
      userAgent: navigator.userAgent || "",
    };

    if (feedbackSubmit) feedbackSubmit.disabled = true;
    if (feedbackStatus) feedbackStatus.textContent = "Sending…";

    try {
      const params = new URLSearchParams({
        text: payload.text,
        category: payload.category || "",
        lastWord: payload.lastWord || "",
        userAgent: payload.userAgent || "",
      });

      await fetch(
        "https://script.google.com/macros/s/AKfycbztEUvoZfKOBjK7aXJXVzU6YGlA8MFP_G84CS3A9HN2RMBIv6TdvHyR3Ph7hLByiJC4Zw/exec?"
        + params.toString()
      );

      if (feedbackStatus) feedbackStatus.textContent = "Banana received! Thanks for the help.";
      if (feedbackText) feedbackText.value = "";
      feedbackCloseTimer = window.setTimeout(() => closeFeedback(), 2500);

    } catch (err) {
      console.error("Feedback error:", err);
      if (feedbackStatus) {
        feedbackStatus.textContent = "Couldn't send your bananas. Try again later.";
      }
    } finally {
      if (feedbackSubmit) feedbackSubmit.disabled = false;
    }
  });
}
