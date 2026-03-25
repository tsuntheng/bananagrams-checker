# Product Requirements Document for Bananagrams Checker

## 1. Product overview

This is a simple, browser‑based word checker for Bananagrams players that runs as a static site (HTML/CSS/JS) hosted on GitHub Pages so anyone with the URL can use it. Friends type a word during a game and instantly see if it’s valid under casual Bananagrams rules plus a short definition, reinforced with a playful banana visual that ripens or rots based on validity.

### Goals

- Learn AI‑assisted coding workflows while building a real, usable tool.  
- Ship a minimal but delightful Bananagrams helper that feels on‑theme (yellow, bananas, playful micro‑interactions).  
- Keep the tech stack small: static front end, no backend (yet), use an external dictionary API for validity and definitions.

---

## 2. Users and use cases

### Target users

- You and friends playing Bananagrams in person, on laptops/phones.  
- Casual players who just want a quick “is this a real word?” check without arguing or opening a full dictionary.

### Primary use case (MVP)

While playing, a user:

1. Opens the site (GitHub Pages URL).  
2. Types a candidate word into a single input field.  
3. Hits Enter (or clicks a button).  
4. Sees:  
   - A clear “Valid” or “Invalid” status.  
   - At least one definition if valid.  
   - Banana graphic that changes from “ripe” for valid to “rotten” for invalid.

---

## 3. Scope: MVP features

### 3.1 Must‑have features

#### Single word input and submission

- Text input box with placeholder like “Type a word…”.  
- Submit via Enter key or a banana‑icon button.  
- Lowercase/uppercase handled automatically.

#### Word validity check via online API

- Frontend calls a dictionary API (https://publicapi.dev/free-dictionary-api) over HTTPS (no backend).  
- The base URL for the API is `https://api.dictionaryapi.dev/api/v2/entries/en/`.  
- If API indicates the word exists and is valid, mark as valid; otherwise invalid.  

Apply basic Bananagrams rules:

- Minimum 2 letters.  
- Reject inputs with spaces, numbers, or punctuation.  
- Reject obvious proper nouns (e.g., starting with capital letter if typed that way), but API result is the main gate.

#### Definition display

- When valid: show at least one short definition from the API response.  
- If API returns multiple meanings, show the first one with part of speech if available.

#### Banana visual state: ripe vs rotten

- Default neutral banana when no word checked yet.  
- Smooth state change on each check:  
  - Valid → “Ripe banana” illustration/color (bright yellow, happy expression, etc.).  
  - Invalid → “Rotten banana” illustration/color (brownish, sad/tilted).  
- Simple animation (e.g., fade/scale) is a bonus for v1.

#### Lightweight history of checked words

- Small scrollable list under the main result showing the last N words (e.g., 5–10).  
- Each entry: word + validity icon (✓ or ✗).  
- Clicking an entry re‑displays its result (optional nice‑to‑have for MVP).

#### Bananagrams‑themed UI

- Color palette: yellows, off‑whites, browns, with high enough contrast for readability.  
- Large, readable font for the input and result (usable at table distance).  
- Simple layout that works on both desktop and mobile browsers (responsive columns/stacked layout).

### 3.2 Nice‑to‑have (stretch) for MVP

#### Helper feature: suggest words from letters

- Simple input where user can paste letters (e.g., `aetp`) and see a few suggested valid words using the same dictionary.  
- Implementation can be deferred; include in PRD as future section.

#### Small UX polish

- Keyboard focus returns to input after each check.  
- Clear error message when the API is unreachable (e.g., “Check your internet” / “Dictionary service unavailable”).

---

## 4. Rules, content, and API choices

### Bananagrams rules applied

Words must:

- Be at least 2 letters long.  
- Appear in a “standard dictionary” used by the app (API source).  
- Not be proper nouns, abbreviations, acronyms, or obvious slang not found in the dictionary.

For casual play, any word recognized by the chosen dictionary API is considered valid, subject to the above filters.

### Dictionary / word source

- Use a free dictionary API that returns both a “word exists” signal and definition(s).  
- Examples include dictionary APIs that provide validity flags or return entries only if the word exists.

Behavior:

- 200/OK with entries → valid word.  
- 404 or empty payload → invalid word.

Clean and simplify the definition for display: pick the first definition string and trim long text.

---

## 5. UX and UI requirements

### Layout

Single‑page app with:

- Top area: title (“Banana Check” placeholder name), short description.  
- Middle: word input, “Check” button, banana graphic, validity label, and definition text.  
- Bottom: recent word history.

### Visual style

- Theme: Bananagrams‑inspired, playful, not childish.  
- Rounded corners, subtle shadow on the main card.  
- Two clear color states for the banana/result:  
  - Valid: bright, saturated yellow, positive text color.  
  - Invalid: desaturated/brownish tones, but still legible.

### Interactions

- Enter key always triggers check if input not empty.  
- On submit:  
  - Show a loading micro‑state if API call takes noticeable time.  
  - After response, animate banana and update definition and history.

---

## 6. Technical requirements

### Architecture

- Static front‑end only.  
  - HTML, CSS, and JavaScript (no build step required for v1).  
  - Deployed as a GitHub Pages site from a GitHub repo with `index.html` as entry point.

### Tech constraints / choices

- Avoid Swift and Python.  
- Favor minimal stack:  
  - Option A: plain JS + minimal DOM manipulation (good for “vibe coding”).  
  - Option B (stretch): very small framework (e.g., Preact/Svelte) only if needed.  
- External calls only to the dictionary API over HTTPS; no other backend.

### Performance and reliability

- Page should load quickly on typical home Wi‑Fi and mobile data (small assets, compressed images).  
- Handle API errors gracefully with user‑friendly messages; no raw JSON or error codes shown.

---

## 7. Success criteria

- You can open the GitHub Pages URL during a game and check words with no console errors.  
- Friends can use the same URL on their own devices and understand the UI without explanation.  
- At least 90% of common English words behave as expected (valid + definition or invalid) using the chosen dictionary API in casual playtests.
