# Islamic Inheritance Calculator

A web app that runs entirely in the browser. You mark which relatives of the deceased are alive, and it shows each heir's share as a fraction, a percentage and an amount, along with the rules that were applied.

```bash
npm install
npm run dev    # http://localhost:5173
npm test       # engine tests against the 133 reference cases
npm run build  # static build in dist/
```

## Structure

| Path | Purpose |
|---|---|
| `src/engine/fraction.ts` | Exact rational arithmetic on BigInt, so shares never use floats |
| `src/engine/heirs.ts` | The 29 standard heirs, with labels and eligibility notes |
| `src/engine/calculate.ts` | The calculation engine (pure, no UI imports) |
| `src/engine/relevance.ts` | Decides whether a relative group could change the result, which drives the "smart display" |
| `src/engine/money.ts` | Splits the estate into cents by largest remainder, so the total is exact |
| `src/ui/*`, `src/App.tsx` | Family-tree UI, results and rules list |
| `src/data/rules.txt` | Copy of `../rules/rules.txt`; rule chips show its text |
| `tests/engine.test.ts` | Runs every case in `../test-cases/` plus the default scenario |

## Engine pipeline

`calculate(heirs, gender)` runs these steps in order:

1. **Blocking (Rule 13).** Each living heir excludes the relatives it ranks above, e.g. a son blocks siblings. A blocked heir appears with a zero share and a note of who blocks them.
2. **Prescribed shares (Rules 1–12).** These are the fixed fractions for each relative. Siblings still count toward the mother's 1/3 → 1/6 drop even when they are blocked.
3. **Special cases:**
   - Umar's case (Rule 21)
   - grandfather with siblings (Rule 23)
   - Akdariyya (Rules 18a, 24)
4. **'Awl (Rule 18) or residue (Rule 14):**
   - If the shares exceed 1, every share is scaled down proportionally ('Awl).
   - Otherwise the residuary heirs, in rank order, take what is left; a male and female of the same class split it 2:1 (Rules 15, 44).
   - A father or grandfather with only female descendants takes both his 1/6 and the residue (Rule 16a).
5. **Radd (Rule 19).** If something remains and there is no residuary heir, it is returned proportionally to everyone except the spouse.
   - If only a spouse remains, the leftover goes to them (Rule 26).
6. **Mushtaraka (Rule 22).** Full brothers never receive less than maternal siblings.

## Deviations from the reference data (see ../ANALYSIS.md)

- **#29 is skipped:** it is empty on the reference site.
- **#127 is checked on category shares only:** the reference's individual table shows 1/3 per maternal brother where 1/6 is correct.
- **#34 (daughters + maternal brothers):** the engine follows the reference, so the maternal brothers inherit 1/3. This is the site's Rule 12 ("no male offspring"). Classical fiqh would have the daughters block them.
- **Step wording** is the engine's own and does not reproduce the site's text verbatim. The tests compare shares only.
