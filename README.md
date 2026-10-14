# Inheritance in Islam — حاسبة المواريث الإسلامية

An Islamic inheritance calculator that runs entirely in the browser. Mark which relatives of the deceased are alive, and it shows each heir's share as a fraction, a percentage and an amount. Each result comes with the rules that were applied. The app is in Arabic by default, with an English version.

**▶ Try it live: [https://thabet-noob.github.io/inheritance-in-islam/](https://thabet-noob.github.io/inheritance-in-islam/)**

> For educational reference only. Not a fatwa. Verify your case with a qualified scholar.

## Features

- **Calculation**
  - Exact fractions for every share (no rounding errors), checked against 133 reference cases.
  - Covers all 29 standard heirs, including blocking (hajb), 'Awl, Radd, Umar's case (العمريتان), the Mushtaraka case, grandfather with siblings, and Akdariyya.
  - Bequest (wasiyya), limited to one third of the estate.
- **Interface**
  - Family-tree interface: click a circle to mark a relative alive, add wives and children, and rename anyone.
  - Only the relatives who could change the result are shown; the rest are listed with the reason.
  - Every step cites its rule, and the full rule text can be opened in Arabic or English.
  - Responsive from 320px phones to large screens, with dark mode.
- **Export and sharing**
  - Export a PDF report that includes the family tree.
  - Share links that rebuild the same calculation without including any names, to WhatsApp, X, LinkedIn, Facebook, Telegram or email.

## Getting started

Requires Node.js 18 or later.

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm test         # 155 tests, including the 133 reference cases
npm run build    # static site in app/dist/
```

## Repository structure

| Path | Contents |
|---|---|
| [app/](app/) | The web app (Vite + React + TypeScript). See [app/README.md](app/README.md) for the engine design. |
| [rules/rules.txt](rules/rules.txt) | The 44 inheritance rules the engine follows |
| [test-cases/](test-cases/) | 134 reference cases with expected shares, used by the test suite |
| [ANALYSIS.md](ANALYSIS.md) | How the rules and reference cases fit together, including edge cases and known defects in the reference data |
| [img/standard-heirs.png](img/standard-heirs.png) | Diagram of the 29 standard heirs |

## Credits and sources

The rules, the reference test cases, the FAQ (`questions.txt`), the input form (`home-page.html`) and the heirs diagram come from the **Islamic Inheritance Calculator at [ilmsummit.org](http://inheritance.ilmsummit.org/projects/inheritance/home.aspx)**. They are included with credit so the calculation can be checked against them, and they remain the property of their owners. The MIT license below covers this project's code only.

That site's own references are:
- *Inheritance — Regulations & Exhortations*, Muhammad Al-Jibaly
- *The Islamic Law of Succession*, Dr. A. Hussain

## License

Code released under the [MIT License](LICENSE). © 2026 [Thabet Chelligue](https://www.linkedin.com/in/thabet-chelligue-6119b217).
