import rulesEn from '../data/rules.txt?raw';
import rulesAr from '../data/rules.ar.txt?raw';
import { AR_LETTERS, Lang } from '../i18n/strings';

// Parse a rules file into numbered blocks: "1) Husband [AnNisa 4:12]" ... up to the next "N)".
// Only the next expected number starts a block, so lists like "1) Son 2) Grandson" inside rule 14 don't.
function parse(txt: string): Map<number, string> {
  const blocks = new Map<number, string>();
  let current = 0;
  let buf: string[] = [];
  const flush = () => {
    if (current) blocks.set(current, buf.join('\n').trim());
  };
  for (const line of txt.replace(/\r/g, '').split('\n')) {
    const m = /^(\d+)\)\s/.exec(line);
    if (m && Number(m[1]) === current + 1) {
      flush();
      current += 1;
      buf = [line];
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

const BLOCKS: Record<Lang, Map<number, string>> = { en: parse(rulesEn), ar: parse(rulesAr) };
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LETTER: Record<Lang, string> = { en: '[a-z]', ar: `(?:${AR_LETTERS.map(escape).join('|')})` };

/** Full text for a rule id such as "6b" or "14": the rule's title plus the lettered sub-item when given. */
export function ruleText(id: string, lang: Lang = 'en'): string {
  const m = /^(\d+)([a-z])?$/.exec(id);
  if (!m) return '';
  const block = BLOCKS[lang].get(Number(m[1]));
  if (!block) return '';
  if (!m[2]) return block;
  const letter = lang === 'ar' ? AR_LETTERS[m[2].charCodeAt(0) - 97] : m[2];
  const lines = block.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^\\s*${escape(letter)}\\.\\s`).test(l));
  if (start < 0) return block;
  const next = new RegExp(`^\\s*${LETTER[lang]}\\.\\s`);
  const out = [lines[0], lines[start]];
  for (let i = start + 1; i < lines.length && !next.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n').trim();
}

export function ruleTitle(id: string, lang: Lang = 'en'): string {
  const m = /^(\d+)/.exec(id);
  const block = m ? BLOCKS[lang].get(Number(m[1])) : undefined;
  return block ? block.split('\n')[0].replace(/^\d+\)\s*/, '').replace(/\s*\[.*$/, '') : '';
}

export const ruleCount = (lang: Lang) => BLOCKS[lang].size;
