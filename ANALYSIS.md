# Inheritance Calculator — Rules & Test-Case Analysis

Sources: [rules/rules.txt](rules/rules.txt), [home-page.html](home-page.html) (input form), [questions.txt](questions.txt) (FAQ), and the 134 scraped cases in [test-cases/](test-cases/).
All 133 non-empty cases have category shares summing to exactly 1.

## 1. Inputs (home page, `tb1`..`tb29`)

| # | Input | Test-case name |
|---|---|---|
| 1 | Husband | Husband |
| 2 | Wives | Wife |
| 3 | Sons | Son |
| 4 | Daughters | Daughter |
| 5 | Grandsons (son's son) | GrandSon |
| 6 | Granddaughters (son's daughter) | GrandDaughter |
| 7 | Father | Father |
| 8 | Mother | Mother |
| 9 | Grandfather (father's father) | GrandFather |
| 10 | Paternal Grandmother | PaternalGrandMother |
| 11 | Maternal Grandmother | MaternalGrandMother |
| 12–13 | Full Brothers / Sisters | FullBrother / FullSister |
| 14–15 | Paternal Brothers / Sisters | PaternalBrother / PaternalSister |
| 16–17 | Maternal Brothers / Sisters | MaternalBrother / MaternalSister |
| 18–21 | Full / Paternal Nephews, their sons | FullNephew, PaternalNephew, … |
| 22–23 | Full / Paternal Paternal Uncles | FullUncle, PaternalUncle |
| 24–29 | Full / Paternal Cousins, their sons, grandsons | FullCousin, PaternalCousin, …, PaternalCousinsGrandSon |

[img/standard-heirs.png](img/standard-heirs.png) confirms that `PaternalUncle` is input 23, the father's paternal half-brother. Names for inputs 20, 21, 26, 27 and 28 never appear in the test cases.

### Family tree ([img/standard-heirs.png](img/standard-heirs.png))

The diagram uses the same numbers as the inputs above (1/2 = spouse).

```
 9 Grandfather ──┬─────────────────────────┐
10 Pat. Grandmother ─┐                     │        11 Mat. Grandmother
                     ├─ 22 Uncle (full)    │                │
 9 only ─────────────┴─ 23 Paternal Uncle  7 Father        8 Mother
                                           │    \        /    │
 22 → 24 Cousin → 26 Cousin's Son → 28 Cousin's Grandson
 23 → 25 Pat. Cousin → 27 Pat. Cousin's Son → 29 Pat. Cousin's Grandson
 Father + Mother → 12 Full Brother, 13 Full Sister
 Father only     → 14 Paternal Brother, 15 Paternal Sister
 Mother only     → 16 Maternal Brother, 17 Maternal Sister
 12 → 18 Nephew → 20 Nephew's Son
 14 → 19 Pat. Nephew → 21 Pat. Nephew's Son
 Deceased + 1/2 Spouse → 3 Son, 4 Daughter;  3 Son → 5 Grandson, 6 Granddaughter
```

What the diagram shows:
- **Highlighted (olive) heirs are the ones who can never be blocked (Rule 35):** Father, Mother, Spouse, Son, Daughter.
- **"Full" vs "Paternal" in a relative's name means the same thing on every branch.**
  - Full: shares both parents with the link above (e.g. the uncle shares both grandparents with the father).
  - Paternal: shares only the father, or only the grandfather for uncles.
  - Maternal half-siblings exist only at the sibling level. Their children inherit nothing.
- **Only male lines continue downward (Rule 28).**
  - Grandchildren come only through the son.
  - Nephews come only through brothers; cousins come only through uncles.
  - Every chain below the siblings is male (nephew → nephew's son, cousin → son → grandson).
  - Daughters, sisters and granddaughters have no descendants in the tree.
- **Mother's side:** only the maternal grandmother appears there. The mother's father is not an heir (Rule 39).
- **Branch structure:** each branch, read top to bottom, follows the residuary order of Rule 14:
  - descendants → father → siblings → grandfather → nephews → uncles → cousins
  - Full always comes before paternal at the same level.
  - The tree stops at 5 generations, matching the FAQ.

## 2. Pipeline the site follows (inferred from the "Calculation Steps")

1. **Blocking (Rule 13).** This step emits lines like "X blocks Y". A blocked heir still appears with share 0.
2. **Fixed shares (fard)** are assigned in this order: spouse → daughter → granddaughter → father (only when a male descendant exists) → mother → grandfather → grandmothers → full sister → paternal sister → maternal siblings.
3. **If the total is over 1, apply 'Awl (Rule 18):** scale every share proportionally.
   - Special case 18a/24, Akdariyya (#134).
4. **If the total is under 1, the residue goes to the highest-ranked residuary heir ('asaba, Rule 14).**
   - A male and female of the same class share it 2:1 (Rules 15/44).
5. **If residue remains and there is no 'asaba, apply Radd (Rule 19):** scale the non-spouse shares up proportionally. The spouse's share stays fixed.
6. **Special cases (Rules 21, 22, 23)** are applied on top of the above: Umar's case, the full-brother sharing case (Mushtaraka), and grandfather with siblings.

## 3. Key behaviours confirmed by the test cases

**Spouse**
- **Rules 1–2.** The spouse's share is halved when offspring exist, and wives share one portion equally.
  - Grandchildren count as offspring (#73).
  - Spouses never receive any Radd (#12, #18, #119, #121).

**Mother: 1/3 vs 1/6 (Rule 6)**
- The mother drops to 1/6 when there are 2 or more siblings of *any* type combined.
  - #44: 1 paternal brother + 1 maternal brother → 1/6.
  - #53, #110, #132 are similar.
- One sibling leaves her at 1/3 (#13, #19).
- **Siblings who are blocked still reduce her share.**
  - #38: Father + Mother + 2 full sisters → Mother gets 1/6.
  - #125: the father blocks the maternal brothers, but the mother still gets 1/6, so Umar's case does not apply (Rule 21c).

**Father (Rules 5, 16a, 17)**
- With a male descendant he gets a fixed 1/6 only (#51, #58, #86, #99).
- With only female descendants he gets 1/6 plus whatever residue is left:
  - #41: 1/4
  - #55: 3/8
  - #60: 5/24
  - #33: exactly 1/6, because nothing is left over
- **He is never cut off.** In 'Awl he keeps 1/6 before scaling (#115: 2/15).
  - The steps list does not show his fixed share in these cases, but the numbers include it.
- With no descendants he takes the whole residue (#50, #6).

**Umar's case (Rule 21)**
- Applies with a spouse + father + mother, no offspring, and fewer than 2 siblings.
- The mother gets 1/3 of what is left after the spouse's share, and the father gets the rest.
  - With a husband: H 1/2, M 1/6, F 1/3 (#9).
  - With a wife: W 1/4, M 1/4, F 1/2 (#10, #123).
- Does **not** apply with the grandfather instead of the father: #126 gives H 1/2, M 1/3, GF 1/6.

**Daughters and granddaughters (Rules 3, 4, 30)**
- One daughter gets 1/2; two or more share 2/3.
- With exactly one daughter, granddaughters get 1/6 to complete the 2/3 (#5, #15, #61).
- A grandson turns granddaughters into residuary heirs and takes the residue with them 2:1, even when there are 2+ daughters (#72, #83).
- A grandson alongside one daughter takes the residue (#47).

**Sisters (Rules 10, 11, 13g, 13i, 30)**
- With no descendants: one full sister gets 1/2, two or more share 2/3.
- A paternal sister gets 1/6 to complete the 2/3 when there is one full sister (#101, #110).
- **With female descendants, sisters become residuary heirs** (#3, #87, #88, #89, #91, #92). In that state they block:
  - paternal brothers (#103)
  - nephews (#104)
  - uncles (#105)
- **Without female descendants, a full sister in the 2/3 zone blocks no one.**
  - #65: 3 full sisters get 2/3 and the paternal brother takes the 1/12 residue.
  - #84, #129: the paternal brother and sister get 0 only because nothing is left over. They are not "blocked" in the steps.
- A full brother blocks paternal siblings (#95, #102).

**Maternal siblings (Rules 12, 33)**
- One gets 1/6; two or more share 1/3 equally, with no 2:1 male/female ratio.
- Only male descendants and male paternal ancestors block them.
  - ⚠ **#34 (2 daughters + 2 maternal brothers → maternal brothers get 1/3).** This follows the site's Rule 12 as written. Classical fiqh would have the daughters block them.
- **Mushtaraka (Rule 22), #11.** The setup is Husband + Mother + 2 full brothers + 2 maternal brothers. The fixed shares use up the whole estate, so the full brothers join the maternal brothers' 1/3 and share it equally: 1/12 each.
  - Paternal brothers do *not* get this treatment (#127: they get 0).

**Grandmothers (Rules 8, 9)**
- The mother blocks both grandmothers (#22, #95).
- When both grandmothers are present they share the 1/6 (#20: 1/12 each).
- Several paternal grandmothers split that portion between them (#66: 1/18 each).

**Grandfather (Rules 7, 17, 23, 24)**
- The father blocks him (#97, #106).
- With offspring he gets a fixed 1/6, and keeps it in 'Awl (#131, #133).
- **With siblings and no father or offspring (Rule 23), he gets the largest of three options:**
  - 1/6 of the estate
  - 1/3 of the residue
  - an equal split, counting him as one more brother
- #130: GF + 3 full brothers → 1/3 (from the 1/3-of-residue option); the brothers get 2/3.
- #132: Mother + GF + full sister + paternal brother + paternal sister.
  - GF gets 5/18, which is both 1/3 of the 5/6 left and his equal-split share.
  - The paternal siblings count toward that split; then the full sister takes her 1/2 from what remains.
  - The paternal brother and sister share the last 1/18 at 2:1 → 1/27 and 1/54.
- **Akdariyya, #134 (Rules 18a/24).**
  - Husband 1/2, Mother 1/3, GF 1/6, full sister 1/2 → scaled down to 3/9, 2/9, 1/9, 3/9.
  - GF and the full sister then pool their 4/9 and split it 2:1 → 8/27 and 4/27.

**Residuary order (Rule 14)**
- Covered by the cases down to the paternal cousin's grandson.
- Examples: #46, #48, #75 (paternal cousin's grandson), #42 (full cousin), #64 (uncle), #45 (nephew).

**'Awl examples:**
- #8 (scaled to 7ths)
- #108 (8ths)
- #110 and #122 (9ths)
- #111 and #115 (scaled to 10ths and 15ths)
- #112 (13ths)
- #114 (15ths)
- #116 (17ths)
- #117 (27ths, Minbariyya)

**Radd examples:**
- #12, #13, #14, #15, #16, #17, #18, #19, #20, #118, #119, #120, #121

## 4. Output format

- **"Shares by Category"** shows one row per heir type with the group total.
- **"Shares by Individual"** lists each person; when there are several they are numbered, e.g. "Daughter 1", "Daughter 2".
- **Fractions are reduced.**
  - A whole share shows as `1/1` in the category table and `1` in the individual table.
  - A zero share shows as `0/D` in the category table and `0` in the individual table. Here D is an unreduced internal denominator, e.g. 0/216 in #131 and 0/156 in #133.
- **Percentages** are rounded to 2 decimals with trailing zeros removed (50%, 12.5%, 33.33%).

## 5. Site defects in the reference data

- **#29** is empty: no heirs, no shares.
- **#127:** in the individual table each maternal brother shows 1/3, which should be 1/6. The category total of 1/3 is correct.
- **#11:** one step text is missing a value ("gets the share of while").
- **#134:** has a stray step about a paternal sister ("Paternal Sister's share is now 0/54") although there is none.
- **Granddaughter fixed shares are labelled "Daughter"** in the steps (#5, #42, #89, …).
- **Typos:** "Pateral Grandmother" (#20). #66 has an unreduced "3/12".

## 6. Rules not covered by any test case

- Rules 20, 25–27: a husband who is also a cousin, distant relatives (far relatives), and the state taking the estate.
- Maternal grandmother alone.
- Paternal sisters blocked by 2 full sisters.
- Granddaughters blocked by 2+ daughters with no grandson.
- Grandfather + siblings combined with a spouse.
- Any of the nephew's son and cousin's son variants.
