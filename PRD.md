# Product Requirements Document for Bananagrams Checker (V2)

## 1. Product overview

This is a simple, browser‑based word checker for Bananagrams players that runs as a static site (HTML/CSS/JS) hosted on GitHub Pages so anyone with the URL can use it. Friends type a word during a game and instantly see if it’s valid under casual Bananagrams rules plus a short definition, reinforced with a playful banana visual that ripens or rots based on validity.

V2 keeps this core experience and adds two new capabilities:  
1) a helper that suggests valid words built from the same letters when a word is invalid, and  
2) a lightweight in‑app feedback panel (“Spill the bananas”) that sends submissions to a Google Sheets/App Script backend for later review.

### Goals

- Learn AI‑assisted coding workflows while building a real, usable tool.  
- Ship a minimal but delightful Bananagrams helper that feels on‑theme (yellow, bananas, playful micro‑interactions).  
- Keep the tech stack small: static front end, no backend server, use external dictionary APIs for validity and definitions.  
- In V2, provide helpful suggestions when words are invalid, without overwhelming the UI.  
- Collect user feedback directly in the app via a subtle slide‑out panel wired to a Google Sheets / Apps Script endpoint.

---

## 2. Users and use cases

### Target users

- You and friends playing Bananagrams in person, on laptops/phones.  
- Casual players who just want a quick “is this a real word?” check without arguing or opening a full dictionary.  
- Players who occasionally want ideas for valid words from the letters they already have.

### Primary use case (V1 core, still primary)

While playing, a user:

1. Opens the site (GitHub Pages URL).  
2. Types a candidate word into a single input field.  
3. Hits Enter (or clicks a button).  
4. Sees:  
   - A clear “Valid” or “Invalid” status.  
   - At least one definition if valid.  
   - Banana graphic that changes from “ripe” for valid to “rotten” for invalid.

### New V2 use cases

1. **Invalid word → suggestions helper**  
   - A user types a word, submits it, and gets an “Invalid” result.  
   - Below the invalid message, a “Need ideas?” style prompt appears.  
   - When the user clicks this prompt, the UI expands to show 3–5 suggested valid words built only from the letters in the invalid word, shown as chips.  
   - Tapping a chip auto‑fills the main input with that word so it can be quickly checked or reused.

2. **In‑app feedback (“Spill the bananas”)**  
   - During or after a game, a user taps a subtle “Spill the bananas” button in the footer (or bottom button on mobile).  
   - A neutral‑styled slide‑out panel appears with a small form where they can describe issues or suggestions.  
   - On submit, the app sends the feedback to a Google Apps Script endpoint that writes it to a Google Sheet, then shows a small in‑app success state.

---

## 3. Scope: V2 features

V2 includes all V1 features, plus the new suggestion and feedback flows.

### 3.1 Must‑have features (V1, unchanged)

**Single word input and submission**  
- Text input box with placeholder like “Type a word…”.  
- Submit via Enter key or a banana‑icon button.  
- Lowercase/uppercase handled automatically.

**Word validity check via online API**  
- Frontend calls a dictionary API (e.g., https://publicapi.dev/free-dictionary-api) over HTTPS (no backend server).  
- Base URL example: `https://api.dictionaryapi.dev/api/v2/entries/en/`.  
- If the API indicates the word exists and is valid, mark as valid; otherwise invalid.

Apply basic Bananagrams rules:

- Minimum 2 letters.  
- Reject inputs with spaces, numbers, or punctuation.  
- Reject obvious proper nouns (e.g., starting with capital letter if typed that way), but API result is the main gate.

**Definition display**  
- When valid: show at least one short definition from the API response.  
- If API returns multiple meanings, show the first one with part of speech if available.

**Banana visual state: ripe vs rotten**  
- Default neutral banana when no word checked yet.  
- Smooth state change on each check:  
  - Valid → “Ripe banana” illustration/color (bright yellow, happy expression, etc.).  
  - Invalid → “Rotten banana” illustration/color (brownish, sad/tilted).  
- Simple animation (e.g., fade/scale) is a bonus.

**Lightweight history of checked words**  
- Small scrollable list under the main result showing the last N words (e.g., 5–10).  
- Each entry: word + validity icon (✓ or ✗).  
- Clicking an entry re‑displays its result (optional).

**Bananagrams‑themed UI**  
- Color palette: yellows, off‑whites, browns, with high enough contrast for readability.  
- Large, readable font for the input and result (usable at table distance).  
- Simple layout that works on both desktop and mobile browsers (responsive columns/stacked layout).

### 3.2 V1 stretch features (still optional)

**Helper feature: suggest words from letters (original stretch)**  
- Simple input where user can paste letters (e.g., “aetp”) and see a few suggested valid words using the same dictionary.  
- This remains an optional, separate mode or future enhancement distinct from the new invalid‑word helper.

**Small UX polish**  
- Keyboard focus returns to input after each check.  
- Clear error message when the API is unreachable (“Check your internet” / “Dictionary service unavailable”).

### 3.3 New V2 features: invalid‑word suggestions

**Invalid word helper entry point**

- When a word is checked and marked Invalid, show a small CTA directly under the invalid message: e.g., “Nope… need ideas?”.  
- Suggestions are not shown automatically; they appear only after the user clicks this CTA.

**Suggestion behavior**

- Suggestions are generated only from the letters in the invalid word (rearrangements and subsets of those letters).  
- Suggestions must obey the same rules as standard validation:  
  - At least 2 letters, no spaces, no numbers/punctuation, no obvious proper nouns.  
  - Validated using the same dictionary API as the main check.  
- Show 3–5 suggestions per invalid word (e.g., “up to 5”, with a minimum of 0 if nothing valid can be found).  
- If generation exceeds ~3 seconds, stop and show a friendly message like “No good bananas from those letters.”

**Suggestion display and interaction**

- When the user taps “Need ideas?”, the UI expands dynamically under the invalid message (no navigation to another section).  
- Suggestions appear as clickable chips/pills (pill‑shaped elements) under the result.  
- Tapping a chip auto‑fills the main input with that word, and may optionally auto‑trigger validation (or require hitting Enter, depending on final implementation).  
- Suggestions fade in with a subtle animation to keep the experience smooth and playful.

**Implementation note (for dev, not UX)**

- The PRD stays agnostic about how suggestions are computed; they may use local word list logic, external APIs, or a combination, as long as they respect the constraints above and rely on the main dictionary API for final validity checks.

### 3.4 New V2 features: feedback system (“Spill the bananas”)

**Entry point**

- Desktop: a button placed in the footer (bottom area of the page) labeled “Spill the bananas”.  
- Mobile: a bottom button, still labeled “Spill the bananas”, positioned so it does not cover core actions.  
- Visual style: neutral color palette (e.g., grays/soft tones) with subtle styling so it does not distract from the main banana‑themed game UI.

**Feedback panel behavior**

- Clicking “Spill the bananas” opens a small in‑page slide‑out panel anchored from the bottom or side, without leaving the site.  
- Panel contents:  
  - Short title: “Spill the bananas”.  
  - A multi‑line text area where users describe their feedback or report issues.  
  - Optional category selector (e.g., dropdown with values like “Bug”, “Suggestion”, “Confusing result”).  
  - Submit button.

**Data handling and backend**

- On submit, the frontend sends the feedback payload to a Google Apps Script endpoint.  
- Google Apps Script writes each submission as a new row into a Google Sheet (fields such as timestamp, text, category, and optional metadata like mode or last checked word if desired in the future).  
- Users remain on the site; no Google Form UI is opened.

**Success and error states**

- On successful submission, the panel shows a short success message, e.g., “Banana received!” with a small icon, and may close after a short delay.  
- On error (e.g., Apps Script fails), show a non‑scary message such as “Couldn’t send your bananas. Try again later.” and keep the text the user entered so it isn’t lost.

---

## 4. Rules, content, and API choices

### Bananagrams rules applied (unchanged)

Words must:

- Be at least 2 letters long.  
- Appear in a “standard dictionary” used by the app (API source).  
- Not be proper nouns, abbreviations, acronyms, or obvious slang not found in the dictionary.

For casual play, any word recognized by the chosen dictionary API is considered valid, subject to the above filters.

The suggested words in V2 must follow the same rules and use the same dictionary checks as normal validation.

### Dictionary / word source

- Use a free dictionary API that returns both a “word exists” signal and definition(s).  
- Behavior:  
  - 200/OK with entries → valid word.  
  - 404 or empty payload → invalid word.  
- Clean and simplify definitions for display: pick the first definition string and trim long text.

For suggestions, internal logic may generate candidate words from the invalid word’s letters and then validate them via the same dictionary API.

---

## 5. UX and UI requirements

### Layout (base from V1)

Single‑page app with:

- Top area: title (“Banana Check” placeholder name), short description.  
- Middle: word input, “Check” button, banana graphic, validity label, and definition text.  
- Bottom: recent word history.

### V2 layout additions

- When a word is invalid, show the “Need ideas?” helper CTA directly under the invalid status/definition area.  
- On click, expand a suggestions section just below the invalid message, containing chips/pills for suggested words.  
- Footer (or bottom area) includes the “Spill the bananas” feedback button; on click, slide‑out panel overlays part of the page.

### Visual style

- Theme remains Bananagrams‑inspired, playful but not childish: yellows, off‑whites, browns, subtle shadows.  
- Suggestion chips follow the banana theme (e.g., light yellow pills with clear text) but remain visually secondary to the main result.  
- Feedback slide‑out is more neutral (e.g., light gray panel) so it doesn’t compete visually with the core game area.

### Interactions

- Enter key always triggers check if input not empty.  
- On submit:  
  - Show a loading micro‑state if API call takes noticeable time.  
  - After response, animate banana and update definition and history.  
- Clicking “Need ideas?”:  
  - Shows a loading state (e.g., spinning banana or subtle loader) while suggestions are generated/validated.  
  - Shows 3–5 suggestion chips or an empty-state message after up to ~3 seconds.  
- Clicking a suggestion chip:  
  - Auto‑fills the main input with that word, ready to (re)check.  
- Clicking “Spill the bananas”:  
  - Opens the slide‑out feedback panel.  
  - Feedback can be submitted without leaving the site; success and error states are clearly indicated.

---

## 6. Technical requirements

### Architecture

- Static front‑end only:  
  - HTML, CSS, and JavaScript (no backend server).  
  - Deployed as a GitHub Pages site from a GitHub repo with `index.html` as entry point.

### Tech constraints / choices

- Avoid Swift and Python.  
- Favor minimal stack:  
  - Option A: plain JS + minimal DOM manipulation (preferred for “vibe coding”).  
  - Option B (stretch): very small framework (e.g., Preact/Svelte) only if needed for state handling.  
- External calls only to:  
  - Dictionary API over HTTPS for validity and definitions.  
  - Google Apps Script endpoint for feedback submissions.

### Performance and reliability

- Page should load quickly on typical home Wi‑Fi and mobile data (small assets, compressed images).  
- Handle dictionary API errors gracefully with user‑friendly messages; no raw JSON or error codes shown.  
- For suggestion generation, cap total processing/validation around 3 seconds per request; if exceeded, show an empty-state message and stop further calls.  
- Feedback submissions should be debounced as needed to avoid accidental multiple sends; handle Apps Script errors with a friendly message.

---

## 7. Success criteria

- You can open the GitHub Pages URL during a game and check words with no console errors.  
- Friends can use the same URL on their own devices and understand the UI without explanation.  
- At least 90% of common English words behave as expected (valid + definition or invalid) using the dictionary API in casual playtests.  
- When words are invalid, the “Need ideas?” helper reliably provides 3–5 sensible suggestions or a clear “no suggestions” message within ~3 seconds.  
- Users can easily open “Spill the bananas”, submit feedback, and see a success message, with entries correctly stored in the connected Google Sheet.