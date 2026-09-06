/**
 * tokens.ts -> src/styles/theme.css
 *
 * Runs in predev and prebuild, so the CSS can never drift from the TypeScript.
 * Never edit theme.css by hand: it is overwritten every time.
 *
 * The tokens are imported, not parsed. Node strips the types on its own, so
 * there is no hand-written mini-parser to get wrong.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  colour, space, layout, screens, font, type,
  leading, tracking, measure, radius, shadow, motion,
} from '../src/design/tokens.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../src/styles/theme.css');

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const lines = [];
const push = (k, v) => lines.push(`  --${k}: ${v};`);
const group = (label, obj, prefix) => {
  lines.push(`  /* ${label} */`);
  for (const [k, v] of Object.entries(obj)) push(prefix ? `${prefix}-${kebab(k)}` : kebab(k), v);
};

lines.push('/* GENERATED from src/design/tokens.ts by scripts/tokens-to-css.mjs.');
lines.push('   Do not edit: every build overwrites this file. */');
lines.push('@theme {');
group('colour', colour, 'color');
group('space', space, 'spacing');
group('layout', layout, 'layout');
group('breakpoints', screens, 'breakpoint');
group('families', font, 'font');
group('type scale', type, 'text');
group('leading', leading, 'leading');
group('tracking', tracking, 'tracking');
group('measure', measure, 'measure');
group('shape', radius, 'radius');
group('elevation', shadow, 'shadow');
group('motion', motion, null);
lines.push('}');
lines.push('');

/* The semantic roles the components actually use.
   The page has one ground and it is night, so these are simply the roles. The
   light set below is not a second mode: it is the bone-coloured band the page
   opens up in the middle of itself, and a component inside it never knows the
   difference — it asks for --canvas and --fg like everything else. */
const roles = {
  canvas: 'ink', panel: 'ink2', rule: 'veil', 'rule-strong': 'edge',
  fg: 'silver', 'fg-2': 'argento',
  accent: 'aurora', gold: 'zolfo', sage: 'verderame', rose: 'peonia',
  danger: 'errore', focus: 'aurora',
};
const rolesDay = {
  canvas: 'moonlight', panel: 'moonlight2', rule: 'hairline', 'rule-strong': 'edge-ink',
  fg: 'ink-text', 'fg-2': 'ink-muted',
  accent: 'aurora-ink', gold: 'zolfo-ink', sage: 'verderame-ink', rose: 'peonia-ink',
  danger: 'errore-ink', focus: 'aurora-ink',
};
/* A role pointing at a colour that does not exist produces a var() that resolves
   to nothing, and the surface it paints simply disappears without an error
   anywhere. That is how --panel was blank for a while, so it stops the build. */
const colourNames = new Set(Object.keys(colour).map(kebab));
const roleBlock = (sel, map) => {
  lines.push(`${sel} {`);
  for (const [role, token] of Object.entries(map)) {
    if (!colourNames.has(token)) {
      console.error(`tokens-to-css: role --${role} points at --color-${token}, which is not a colour in tokens.ts`);
      process.exit(1);
    }
    lines.push(`  --${role}: var(--color-${token});`);
  }
  lines.push('}');
  lines.push('');
};
roleBlock(':root', roles);
/* the one light island, in the middle of the dark page */
roleBlock('.island-day', rolesDay);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`theme.css written: ${Object.keys(colour).length} colours, ${lines.length} lines`);
