# Inheritance in Islam — حاسبة المواريث الإسلامية

[![CI & Deploy](https://github.com/thabet-noob/inheritance-in-islam/actions/workflows/ci.yml/badge.svg)](https://github.com/thabet-noob/inheritance-in-islam/actions/workflows/ci.yml)
[![Live site](https://img.shields.io/badge/live-thabet--noob.github.io-0b5d4f)](https://thabet-noob.github.io/inheritance-in-islam/)
[![License: MIT](https://img.shields.io/badge/license-MIT-b88a2e)](LICENSE)

A free Islamic inheritance (mīrāth) calculator that runs entirely in the browser. You mark which relatives of the deceased are alive, enter the estate, and it shows each heir's share as a fraction, a percentage and an amount, with the rule behind every share. Arabic by default, with a full English version.

### ▶ Try it: **[thabet-noob.github.io/inheritance-in-islam](https://thabet-noob.github.io/inheritance-in-islam/)**

> ⚠️ For educational reference only. Not a fatwa. Please confirm your case with a qualified scholar.

---

## Example

The app opens on a ready-made example: **Salem Rashid Al Dhaheri** leaves an estate of **1,000,000 AED** with a **100,000 AED bequest**. His wife, son, two daughters, mother and paternal grandfather are alive; his father has died; his uncle is blocked by the son.

| Heir | Rule | Share of the net estate | Amount (AED) |
|---|---|---|---|
| Bequest (wasiyya) | Within ⅓ | — | 100,000.00 |
| *Bequest subtotal* | | | *100,000.00* |
| Wife | 2b | 1/8 | 112,500.00 |
| Son | 14, 15 | 13/48 | 243,750.00 |
| Each daughter (×2) | 14, 15 | 13/96 | 121,875.00 |
| Mother | 6b | 1/6 | 150,000.00 |
| Grandfather | 7a | 1/6 | 150,000.00 |
| Uncle | 13a | Blocked by the son | 0 |
| *Heirs' subtotal* | | 1 | *900,000.00* |
| **Total** | | | **1,000,000.00** |

## Features

### Accurate calculation
- **Exact fractions:** shares are computed with BigInt rational arithmetic, never floating point. Amounts are split by the largest-remainder method, so they always add up to the estate to the cent.
- **All 29 standard heirs:** spouses, descendants, parents and grandparents, the three kinds of siblings, nephews, uncles and cousins.
- **Every classical case:**
  - blocking (ḥajb)
  - the 2:1 ratio for residuary heirs
  - ʿAwl and Radd
  - Umar's case (العُمَريّتان)
  - the Mushtaraka case
  - grandfather with siblings
  - Akdariyya
- **Bequest (wasiyya):** paid before the heirs and capped at one third of the estate, with a warning if it exceeds the limit.
- **Checked against 133 reference cases:** taken from scholars' textbooks (see [Accuracy](#accuracy-and-tests)).

### A family tree you click
- Relatives are laid out as a family tree. Click a circle to mark someone alive: it turns green and shows its share.
- Add wives (up to 4), sons, daughters and siblings with **+**, and give everyone a real name.
- **Smart display:** only relatives who could change the result are shown. The others are listed with the reason (e.g. "blocked by the son").
- Blocked heirs show a red **محجوب** badge with the rule that blocks them.

### Results you can understand
- Summary tiles, a bar chart and a full table: fraction, percentage of the estate and amount for each person.
- **Rules applied:** every step cites its rule; click a rule to read its full text (44 rules, in Arabic and English).
- Banners explain special cases such as ʿAwl, Radd and Umar's case when they occur.

### Arabic and English
- Right-to-left Arabic interface, with correct singular/dual/plural forms, gender agreement (محجوب / محجوبة) and grammatical case.
- One click switches to English. Example names are translated; names you type are kept as written.

### Export and sharing
- **PDF report:** includes the family tree, the results and the rules. It is rendered at laptop width on every device, so phones produce the same compact A4 report as computers.
- **Share links:** reopen the exact same calculation. They carry relations and amounts only, never names.
- One-tap sharing to WhatsApp, X, LinkedIn, Facebook, Telegram and email, or the phone's own share sheet.

### Works everywhere
- Responsive from 320px phones to large screens; the tree scales itself to fit.
- Dark mode, reduced-motion support, large touch targets and keyboard access.

## Privacy

- **Everything is calculated in your browser.** There is no server and no account, and names and amounts are never uploaded.
- **Anonymous, cookie-free statistics** ([Umami](https://umami.is)) count visits, PDF downloads, shares per channel and rules opened. They never record names, amounts, heirs or the contents of share links. They respect *Do Not Track* and only run on the live site.
- To exclude your own visits, run this in your browser console on the live site: `localStorage.setItem('umami.disabled', 1)`.

## How the calculation works

`calculate(heirs, gender)` in [app/src/engine/calculate.ts](app/src/engine/calculate.ts) runs these steps in order:

1. **Blocking (Rule 13).** Living heirs exclude the relatives they outrank.
2. **Prescribed shares (Rules 1–12).** Fixed Qurʾanic fractions for spouses, parents, grandparents, daughters, sisters and maternal siblings.
3. **Special cases.** Umar's case (21), grandfather with siblings (23) and Akdariyya (18a, 24).
4. **ʿAwl (Rule 18) or residue (Rule 14).** If shares exceed the estate, they are scaled down proportionally. Otherwise the residuary heirs take what remains, males and females of the same class at 2:1 (Rules 15, 44).
5. **Radd (Rule 19).** Any remainder with no residuary heir returns to the heirs, except the spouse.
6. **Mushtaraka (Rule 22).** Full brothers never receive less than maternal siblings.

Details are in [app/README.md](app/README.md) and [ANALYSIS.md](ANALYSIS.md).

## Accuracy and tests

- **155 automated tests,** including the **133 reference cases** in [test-cases/](test-cases/). For each case, every category share and every individual share must match exactly.
- **Run on every push** by GitHub Actions; the site is only redeployed when all tests pass.
- **Where the reference data has gaps or errors,** the app follows the reference:
  - **#29** is empty on the reference site and is skipped.
  - **#127:** the reference table shows the wrong share per maternal brother, so only the category totals are compared.
  - **#34 (daughters with maternal brothers):** the app follows the reference rule, under which maternal brothers inherit. Classical fiqh would have the daughters block them.

## Tech stack

| | |
|---|---|
| App | React 18, TypeScript, Vite |
| Calculation | Pure TypeScript engine with BigInt fractions, no UI imports |
| Tests | Vitest |
| PDF | html-to-image + jsPDF, loaded only when exporting |
| Font | IBM Plex Sans Arabic, bundled locally via Fontsource |
| Statistics | Umami Cloud (cookie-free) |
| Hosting | GitHub Pages, deployed by GitHub Actions |

## Getting started

Requires **Node.js 18 or later**.

```bash
git clone https://github.com/thabet-noob/inheritance-in-islam.git
cd inheritance-in-islam/app
npm install
npm run dev      # http://localhost:5173
npm test         # run the 155 tests
npm run build    # type-check and build the static site into app/dist/
```

Useful URL options: `?lang=en` opens the app in English; a `#s=…` share link opens a shared calculation.

## Deployment

Every push to `main` runs [.github/workflows/ci.yml](.github/workflows/ci.yml):
1. Install dependencies, run the tests and build.
2. If everything passes, publish `app/dist/` to GitHub Pages.

Pull requests are tested but never published. A release is live about a minute after pushing.

## Project structure

```
├── app/                    The web app — see app/README.md
│   ├── src/engine/         Calculation engine: fractions, heirs, rules, money, relevance
│   ├── src/i18n/           Arabic & English text and step messages
│   ├── src/ui/             Family tree, results, rules, sharing, PDF export
│   ├── src/data/           The 44 rules in English and Arabic
│   └── tests/              Engine, translation and share-link tests
├── test-cases/             134 reference cases (JSON + readable text)
├── rules/rules.txt         The 44 inheritance rules
├── ANALYSIS.md             How the rules and reference cases fit together
├── img/standard-heirs.png  Diagram of the 29 standard heirs
└── .github/workflows/      CI and GitHub Pages deployment
```

## Credits and sources

The rules, the reference test cases, the FAQ (`questions.txt`), the input form (`home-page.html`) and the heirs diagram come from the **Islamic Inheritance Calculator at [ilmsummit.org](http://inheritance.ilmsummit.org/projects/inheritance/home.aspx)**. They are included with credit so the calculation can be checked against them, and they remain the property of their owners. That site's own references are:

- *Inheritance — Regulations & Exhortations*, Muhammad Al-Jibaly
- *The Islamic Law of Succession*, Dr. A. Hussain

## License

The code is released under the [MIT License](LICENSE); it does not cover the reference material credited above.

© 2026 [Thabet Chelligue](https://www.linkedin.com/in/thabet-chelligue-6119b217)
