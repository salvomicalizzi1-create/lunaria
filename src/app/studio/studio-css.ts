/* Lo stile del pannello, tenuto come stringa e inserito dal componente.
   Non è un foglio importato: così non finisce nel CSS del sito, e il negozio
   non porta addosso una riga di uno strumento che esiste solo qui. */

export const STUDIO_CSS = `
.st, .st-loading {
  --ink: #0B1020; --ink2: #131A2E; --veil: #1E2740;
  --fg: #E7E9F0; --fg2: #A9B4CC; --acc: #8FA5D8; --gold: #D9B26A;
  --ok: #7E9E8E; --err: #C4726A;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: var(--fg); background: var(--ink);
}
.st-loading { display: grid; place-items: center; height: 100vh; color: #A9B4CC; }
.st { position: fixed; inset: 0; display: flex; flex-direction: column; }
.st * { box-sizing: border-box; }

.st-bar {
  display: flex; align-items: center; gap: 16px;
  padding: 10px 16px; border-bottom: 1px solid var(--veil); background: var(--ink2);
  flex: none;
}
.st-brand { font-size: 13px; letter-spacing: .22em; text-transform: uppercase; }
.st-brand b { color: var(--gold); font-weight: 500; }
.st-tabs { display: flex; gap: 4px; margin-inline-start: 12px; }
.st-tab {
  padding: 7px 14px; border: 1px solid transparent; background: none;
  color: var(--fg2); font: inherit; font-size: 13px; cursor: pointer; border-radius: 2px;
}
.st-tab:hover { color: var(--fg); }
.st-tab--on { color: var(--ink); background: var(--fg); }
.st-dirty { margin-inline-start: auto; font-size: 12px; color: var(--fg2); }
.st-save {
  padding: 9px 20px; border: 1px solid var(--gold); background: none; color: var(--gold);
  font: inherit; font-size: 13px; cursor: pointer; border-radius: 2px;
}

/* «Manda online» sta accanto a «Salva» ma non deve somigliargli: uno resta sul
   tuo computer, l'altro arriva al sito che vedono tutti. */
.st-online {
  padding: 9px 16px; margin-left: 8px;
  background: none; border: 1px solid var(--acc); color: var(--acc);
  font: inherit; font-size: 12px; letter-spacing: .06em; cursor: pointer; border-radius: 2px;
  white-space: nowrap;
}
.st-online:hover:not(:disabled) { background: var(--acc); color: var(--ink); }
.st-online:disabled { opacity: .45; cursor: default; }
.st-save:hover:not(:disabled) { background: var(--gold); color: var(--ink); }
.st-save:disabled { opacity: .35; cursor: default; }

.st-msg { position: relative; padding: 12px 44px 12px 16px; font-size: 13px; line-height: 1.5; flex: none; }
.st-msg p { margin: 0 0 4px; }
.st-msg--ok { background: color-mix(in srgb, #7E9E8E 20%, #0B1020); border-bottom: 1px solid #7E9E8E; }
.st-msg--err { background: color-mix(in srgb, #C4726A 20%, #0B1020); border-bottom: 1px solid #C4726A; }
.st-msg button { position: absolute; top: 8px; right: 12px; background: none; border: 0; color: inherit; cursor: pointer; font-size: 14px; }

.st-body { display: grid; grid-template-columns: minmax(420px, 1fr) minmax(420px, 1fr); flex: 1; min-height: 0; }
@media (max-width: 1100px) { .st-body { grid-template-columns: 1fr; } .st-preview { display: none; } }

.st-editor { overflow-y: auto; padding: 20px; border-inline-end: 1px solid var(--veil); }
.st-tools { margin-bottom: 20px; }
.st-search {
  width: 100%; padding: 11px 14px; font: inherit; font-size: 14px;
  background: var(--ink2); border: 1px solid var(--veil); color: var(--fg); border-radius: 2px;
}
.st-search:focus { outline: 2px solid var(--acc); outline-offset: 1px; }
.st-hint { margin: 10px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--fg2); max-width: 62ch; }
.st-hint code { background: var(--ink2); padding: 1px 5px; border-radius: 2px; font-size: 12px; }
.st-h2 { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--fg2); margin: 26px 0 12px; font-weight: 400; }

.st-group { border: 1px solid var(--veil); border-radius: 2px; margin-bottom: 8px; }
.st-group__h {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 12px 14px; background: var(--ink2); border: 0; color: var(--fg);
  font: inherit; font-size: 13px; cursor: pointer; text-align: left;
}
.st-group__h:hover { color: var(--acc); }
.st-count { font-size: 11px; color: var(--fg2); font-variant-numeric: tabular-nums; }
.st-group__b { padding: 6px 14px 14px; }

.st-vai {
  display: block; width: 100%; text-align: left;
  padding: 8px 14px; background: none; border: 0; border-bottom: 1px solid var(--veil);
  color: var(--acc); font: inherit; font-size: 12px; cursor: pointer;
}
.st-vai:hover { background: color-mix(in srgb, #8FA5D8 10%, transparent); }
.st-vai b { font-family: ui-monospace, monospace; font-weight: 400; }
.st-row { padding: 10px 0; border-bottom: 1px solid var(--veil); }
.st-row:last-child { border-bottom: 0; }
.st-row--dirty { box-shadow: inset 3px 0 0 var(--gold); padding-inline-start: 10px; }
.st-key { display: block; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg2); margin-bottom: 6px; }
.st-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 700px) { .st-two { grid-template-columns: 1fr; } }
.st-loc { font-size: 10px; color: var(--fg2); letter-spacing: .14em; }
.st textarea, .st input[type="text"], .st input:not([type]), .st input[type="number"], .st select {
  width: 100%; padding: 8px 10px; font: inherit; font-size: 13.5px; line-height: 1.5;
  background: var(--ink2); border: 1px solid var(--veil); color: var(--fg);
  border-radius: 2px; resize: vertical;
}
.st textarea:focus, .st input:focus, .st select:focus { outline: 2px solid var(--acc); outline-offset: 1px; }

.st-card { border: 1px solid var(--veil); border-radius: 2px; margin-bottom: 10px; padding: 12px; }
.st-card--dirty { box-shadow: inset 3px 0 0 var(--gold); }
.st-card__h { display: flex; align-items: center; gap: 12px; }
.st-card__h img { width: 44px; height: 55px; object-fit: cover; background: var(--ink2); flex: none; }
.st-card__t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.st-name { font-size: 14px !important; }
.st-name--en { color: var(--fg2) !important; font-size: 12.5px !important; }
.st-price { display: flex; align-items: center; gap: 5px; flex: none; }
.st-price span { color: var(--gold); font-size: 13px; }
.st-price input { width: 84px; text-align: right; font-variant-numeric: tabular-nums; }
.st-see { padding: 8px 12px; background: none; border: 1px solid var(--veil); color: var(--fg2); font: inherit; font-size: 12px; cursor: pointer; border-radius: 2px; flex: none; }
.st-see:hover { border-color: var(--acc); color: var(--acc); }

.st-variant { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--veil); }
.st-vname { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg2); }
.st-sizes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.st-size { display: flex; align-items: center; gap: 6px; background: var(--ink2); padding: 5px 8px; border-radius: 2px; }
.st-size > span { font-size: 12px; min-width: 30px; font-variant-numeric: tabular-nums; }
.st-size select { width: auto !important; font-size: 12px !important; padding: 4px 6px !important; }
.st-left { width: 54px !important; font-size: 12px !important; padding: 4px 6px !important; }

.st-swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
.st-sw { display: flex; align-items: center; gap: 10px; border: 1px solid var(--veil); padding: 8px; border-radius: 2px; }
.st-sw--dirty { box-shadow: inset 3px 0 0 var(--gold); }
.st-sw input[type="color"] { width: 42px; height: 42px; padding: 0; border: 1px solid var(--veil); background: none; cursor: pointer; flex: none; border-radius: 2px; }
.st-sw > div { min-width: 0; flex: 1; }
.st-sw__k { display: block; font-size: 11px; color: var(--fg2); margin-bottom: 3px; }
.st-sw__v { font-family: ui-monospace, monospace !important; font-size: 12px !important; text-transform: uppercase; }
.st-scale .st-row { display: grid; grid-template-columns: 130px 1fr 64px; gap: 12px; align-items: center; }
.st-scale .st-key { margin: 0; }
.st-sample { text-align: center; line-height: 1; overflow: hidden; color: var(--fg2); font-family: Georgia, serif; }

.st-imgs { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.st-img { border: 1px solid var(--veil); border-radius: 2px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.st-img img { width: 100%; aspect-ratio: 4/5; object-fit: cover; background: var(--ink2); }
.st-img__n { font-size: 11px; word-break: break-all; color: var(--fg); }
.st-img__s { font-size: 11px; color: var(--fg2); font-variant-numeric: tabular-nums; }
.st-img button { padding: 7px; background: none; border: 1px solid var(--veil); color: var(--fg2); font: inherit; font-size: 12px; cursor: pointer; border-radius: 2px; }
.st-img button:hover:not(:disabled) { border-color: var(--acc); color: var(--acc); }

.st-preview { display: flex; flex-direction: column; min-width: 0; }
.st-preview__bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--veil); background: var(--ink2); flex: none; }
.st-seg { display: flex; border: 1px solid var(--veil); border-radius: 2px; overflow: hidden; }
.st-seg button { padding: 5px 10px; background: none; border: 0; color: var(--fg2); font: inherit; font-size: 11px; cursor: pointer; }
.st-seg button.on { background: var(--fg); color: var(--ink); }
.st-path { flex: 1; font-family: ui-monospace, monospace !important; font-size: 12px !important; padding: 5px 8px !important; }
.st-preview__bar button:not(.st-seg button), .st-preview__bar a {
  padding: 6px 12px; background: none; border: 1px solid var(--veil); color: var(--fg2);
  font: inherit; font-size: 12px; cursor: pointer; border-radius: 2px; text-decoration: none;
}
.st-preview__bar button:hover, .st-preview__bar a:hover { border-color: var(--acc); color: var(--acc); }
.st-group__h > span:first-child { display: flex; flex-direction: column; gap: 3px; text-align: left; }
.st-dove { font-style: normal; font-size: 11.5px; color: var(--fg2); font-weight: 400; line-height: 1.4; }
.st-morta {
  margin-top: 8px; padding: 8px 10px; border-left: 2px solid var(--err);
  background: color-mix(in srgb, #C4726A 10%, transparent);
  font-size: 12px; line-height: 1.5; color: var(--fg2);
}
.st-morta b { color: var(--err); font-weight: 400; }
.st-dup {
  margin-top: 8px; padding: 8px 10px; border-left: 2px solid var(--gold);
  background: color-mix(in srgb, #D9B26A 9%, transparent);
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-size: 12px; line-height: 1.5; color: var(--fg2);
}
.st-dup b { color: var(--gold); font-weight: 400; }
.st-dup span { flex: 1; min-width: 220px; }
.st-dup button {
  padding: 6px 12px; background: none; border: 1px solid var(--gold); color: var(--gold);
  font: inherit; font-size: 12px; cursor: pointer; border-radius: 2px; white-space: nowrap;
}
.st-dup button:hover { background: var(--gold); color: var(--ink); }
.st-stage {
  flex: 1; min-height: 0; overflow: hidden; background: var(--ink);
  display: flex; align-items: flex-start; justify-content: center;
}
.st-pick { border-color: var(--gold) !important; color: var(--gold) !important; }
.st-pick--on { background: var(--gold) !important; color: var(--ink) !important; }
.st-pick__hint {
  margin: 0; padding: 7px 12px; font-size: 12px; color: var(--ink);
  background: var(--gold); flex: none;
}
.st-row--puntata { box-shadow: inset 3px 0 0 var(--acc); background: color-mix(in srgb, #8FA5D8 12%, transparent); }
.st-campo { display: block; margin-top: 10px; }
.st-campo--dirty { box-shadow: inset 3px 0 0 var(--gold); padding-inline-start: 8px; }
.st-campo__l { display: block; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg2); margin-bottom: 5px; }
.st-campo__a { display: block; font-size: 11.5px; color: var(--fg2); margin: 4px 0 6px; line-height: 1.45; }
.st-bil { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--veil); }
.st-bil .st-campo { margin-top: 4px; }
.st-card__n { font-family: Georgia, serif; font-size: 1.05rem; flex: 1; min-width: 0; }
.st-card__id { font-size: 11px; color: var(--fg2); }
.st-piu { margin-top: 12px; padding: 8px 12px; background: none; border: 1px dashed var(--veil); color: var(--acc); font: inherit; font-size: 12px; cursor: pointer; border-radius: 2px; }
.st-piu:hover { border-color: var(--acc); }

/* aggiungere, copiare, togliere ------------------------------------------ */
.st-az { display: flex; gap: 6px; flex: none; margin-left: auto; }
/* accanto al nome del colore, non sotto: e' un blocco solo se sta in una intestazione */
.st-az--p { display: inline-flex; margin-left: 10px; vertical-align: middle; }
.st-az__b {
  padding: 6px 10px; background: none; border: 1px solid var(--veil); color: var(--fg2);
  font: inherit; font-size: 11px; letter-spacing: .04em; cursor: pointer; border-radius: 2px;
  white-space: nowrap;
}
.st-az__b:hover { border-color: var(--acc); color: var(--acc); }
/* il secondo tocco toglie davvero: si vede che il pulsante ha cambiato natura */
.st-az__b--via { border-color: #C25B5B; color: #E08A8A; background: rgba(194, 91, 91, .12); }
.st-az__b--via:hover { border-color: #E08A8A; color: #F0B0B0; }

.st-aggiungi {
  padding: 8px 14px; background: none; border: 1px dashed var(--acc); color: var(--acc);
  font: inherit; font-size: 12px; cursor: pointer; border-radius: 2px; flex: none;
}
.st-aggiungi:hover { background: rgba(255, 255, 255, .04); }
.st-aggiungi--dentro { margin-top: 12px; border-color: var(--veil); color: var(--fg2); }
.st-aggiungi--dentro:hover { border-color: var(--acc); color: var(--acc); }

.st-piu-taglia {
  background: none; border: 1px dashed var(--veil); color: var(--fg2); font: inherit;
  font-size: 11px; padding: 5px 8px; border-radius: 2px; cursor: pointer; align-self: center;
}
.st-piu-taglia:hover { border-color: var(--acc); color: var(--acc); }

.st-via {
  background: none; border: none; color: var(--fg2); font: inherit; font-size: 12px;
  line-height: 1; padding: 3px 4px; cursor: pointer; opacity: .5; border-radius: 2px;
}
.st-via:hover { opacity: 1; color: #E08A8A; }
.st-size:focus-within .st-via { opacity: 1; }
.st-piu__b { margin-top: 10px; padding-top: 4px; border-top: 1px solid var(--veil); }
.st-frame { border: 0; background: var(--ink); transform-origin: top center; flex: none; }
`;
