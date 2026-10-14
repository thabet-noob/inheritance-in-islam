# Build: Islamic Inheritance Calculator (front-end only)

## Goal
Build a web app where the user marks which relatives of the deceased are alive.
The app then shows how the estate is divided, as fractions, percentages and amounts, and lists the rules that were applied.
All calculation runs in the browser. There is no backend and no API calls.

## Read these first (in this folder)
- `rules/rules.txt` — the 44 rules. Cite them by number in the UI (e.g. "Rule 6b").
- `ANALYSIS.md` — how the reference calculator actually behaves. This includes edge cases such as Umar's case, Mushtaraka, the grandfather-with-siblings cases, Akdariyya, 'Awl and Radd, and known defects in the reference data.
- `img/standard-heirs.png` — the family tree of the 29 standard heirs. Use it for the UI layout.
- `test-cases/*.json` — 134 reference cases from the original calculator, with heirs, expected shares and steps.
- `home-page.html` — the original input form, including the eligibility notes for each relative. Show these notes as tooltips.

## Tech
- Vite + React + TypeScript, plain CSS or CSS modules. No UI framework needed.
- **Exact rational arithmetic** for every share: a small `Fraction` class using BigInt, always reduced. Never use floats for shares. Convert to money only at display time.
- Keep the calculation engine separate from the UI: `src/engine/` holds pure functions with no React imports.
- Engine API:
  - Signature: `calculate(heirs: Record<HeirType, number>, deceasedGender: 'male' | 'female') → Result`
  - `Result` contains:
    - per-category shares
    - per-individual shares
    - blocked heirs, with who blocks them
    - ordered steps, each with its rule ID and a sentence
    - flags: awl, radd, umar, mushtaraka, grandfatherSpecial, akdariyya

## Tests (must pass before UI work is considered done)
- Use Vitest. Load every `test-cases/test-case-NNN.json` and run `calculate` on its heirs. Assert that each category's fraction equals `shares_by_category`.
- Skip #29, which is empty. For #127, compare category shares only, because the reference's individual table is wrong.
- **#34 (daughters + maternal brothers):** follow the reference, where the maternal brothers inherit 1/3. Add a code comment noting that classical fiqh would block them.
- Report the pass count. Do not change expected values to make tests pass.

## UI

### Layout
- A family tree of circles laid out like `img/standard-heirs.png`:
  - grandparents on top
  - parents and uncles next
  - the deceased at the center, with siblings beside them
  - descendants below
- **The deceased** is a distinct circle in the center, red or dark. It has a **Male / Female** toggle:
  - Male shows Wife circles.
  - Female shows a single Husband circle.
- **Estate input** at the top: amount plus currency, **default 1,000,000 USD**. Format amounts with thousands separators and 2 decimals.

### Circles
- Every relative circle is **grey by default**. **One click toggles it green**, meaning alive. Clicking again turns it grey.
- **Multi-person relatives have a "+" button** that adds another circle of the same type. Each extra circle has a small "×" to remove it.
  - This applies to wives (max 4), sons, daughters, grandsons, granddaughters, every sibling type, nephews, uncles and cousins.
  - Grandparents and parents are single circles.
- **Names:** each circle has a label underneath, defaulting to "Wife 1", "Son 2", etc. Click the label to edit it inline. Use the name everywhere in the results.
- **After calculation, each green circle shows its share:**
  - the fraction and percentage inside the circle
  - the amount underneath
  - a ring or arc around the circle sized to its percentage
- **Blocked relatives:**
  - The circle is outlined or dimmed with a small "blocked" badge.
  - On hover: "Blocked by Son (Rule 13a)".
- **Heirs who are alive but receive 0** because nothing is left show "0 — nothing left over" rather than "blocked".

### Smart display: show relatives only when they matter
- **Always visible:** spouse, sons, daughters, father and mother.
- **Every other group is revealed only when it could change the result.** Decide this with the engine rather than hand-written rules:
  - For each hidden heir type, run `calculate` with 1 and with 2 of that heir added to the current selection.
  - If any share changes, the group is relevant: show it.
  - Otherwise collapse it into a "Not relevant now (blocked by …)" line.
  - The 2-count check matters because blocked siblings can still change the mother's share (Rule 6).
- **A "Show all relatives" toggle** reveals the full tree regardless.
- **Animate groups** appearing and disappearing so the tree doesn't jump.

### Results panel (beside or below the tree)
- **A donut chart** of the distribution, one segment per individual, using each individual's name.
- **A table** with columns: Name, Relation, Fraction, %, Amount. It has a totals row that must equal exactly the estate.
  - Rounding: allocate cents by the largest-remainder method so the total is exact.
- **A "Rules applied" list:** the ordered steps from the engine.
  - Each step shows the rule number as a chip. Hovering or expanding the chip shows that rule's full text from `rules.txt`.
  - Highlight special cases with a banner, e.g. "'Awl applied: shares reduced proportionally (Rule 18)".

### Default state on load
- Deceased: **Male**.
- Alive (green): **1 Wife, 2 Sons, 2 Daughters, Mother**. Everyone else is grey.
- Estate: 1,000,000 USD.
- Expected result, which must be verified by a unit test:

| Heir | Fraction | Amount (USD) |
|---|---|---|
| Wife | 1/8 | 125,000.00 |
| Mother | 1/6 | 166,666.67 |
| Son 1, Son 2 | 17/72 each | 236,111.11 each |
| Daughter 1, Daughter 2 | 17/144 each | 118,055.56 each |
| **Total** | | **1,000,000.00** |

The rules applied are 2b, 6b, 14, 15 and 44.

## Style
- Clean, calm and readable, with plenty of white space.
- Green means alive, grey means not selected, a muted red outline means blocked.
- Responsive: on mobile the tree becomes a scrollable vertical list of groups, still using circles.
- Accessible: circles are buttons with aria-pressed. Everything works by keyboard.

## Footer disclaimer
"For educational reference only. Not a fatwa. Verify your case with a qualified scholar."

## Deliverables
- The app runs with `npm install && npm run dev`, and `npm test` runs the engine tests.
- A short README. It explains the engine's pipeline and lists the reference-data deviations noted in ANALYSIS.md.
