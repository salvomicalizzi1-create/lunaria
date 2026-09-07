# LUNARIA

Un negozio che segue la luna invece del calendario. Tredici uscite l'anno, una
per ogni novilunio, e quando la luna passa quel capo finisce lì.

**Marchio di fantasia.** Non esiste una società con questo nome, i capi non sono
in vendita e le immagini sono generate. È un sito costruito per intero, non una
maquette: catalogo, scheda prodotto, carrello, cassa, ordini e account
funzionano davvero — solo, la cassa non incassa (vedi sotto).

Online: <https://lunaria-varco-net.vercel.app>

## Com'è fatto

Next.js 16 con App Router, due lingue vere (italiano e inglese, entrambe con il
loro prefisso: nessuna è la copia di seconda scelta dell'altra), TypeScript,
CSS scritto a mano su token generati.

La home è una pagina cinematografica: un video che scorre avanti e indietro col
dito, e le frasi che compaiono e spariscono sopra. Sotto, un negozio normale.

## Farlo partire

```bash
npm install
npm run dev
```

Poi <http://localhost:3000/it>.

Serve un `.env.local` con le chiavi Stripe **di prova**, che non sta nel
repository. Chiedile a chi tiene il progetto, o mettine di tue: la cassa
funziona con qualunque chiave `sk_test_`.

## Tre cose da sapere prima di toccare qualcosa

**Il pannello `/studio` esiste solo in sviluppo.** È un editor con anteprima dal
vivo: cambi un testo, un prezzo, un colore, e li scrive **nei file sorgente del
progetto**. Per questo in produzione quell'indirizzo e tutte le sue API
rispondono 404. Non è un guasto da sistemare: è la ragione per cui il pannello
può esistere.

**La cassa non può incassare, per costruzione.** `src/app/api/checkout/route.ts`
rifiuta qualunque chiave che non cominci per `sk_test_`. Si compra con la carta
di prova `4242 4242 4242 4242`, e non si muove un centesimo.

**`src/styles/theme.css` è generato**, non scritto. Nasce da
`src/design/tokens.ts` a ogni avvio e a ogni compilazione, e per questo non sta
nel repository. Se lo modifichi, la tua modifica sparisce al prossimo `npm run
dev`. I colori si cambiano nei token.

## Il cancello della compilazione

`npm run build` non compila e basta. Prima rigenera i token, poi **misura il
contrasto di ventitré coppie di colori** e si ferma se una scende sotto il
minimo leggibile, dicendo quale e di quanto. Poi controlla che il catalogo sia
coerente.

Un colore che rende un testo illeggibile non arriva online: si ferma qui.

## Struttura

```
src/app/[locale]/     le pagine, in due lingue
src/app/studio/       il pannello di modifica (solo in sviluppo)
src/components/       sezioni della home, schemi, primitivi
src/content/          it.json e en.json: ogni parola del sito
src/data/             capi, collezioni, lune, oracolo
src/design/tokens.ts  colori, scala del testo, spaziature
scripts/              generazione token e controllo contrasto
```

Le due lingue hanno **le stesse chiavi**: aggiungerne una sola a una delle due
lascia un buco che non dà errore e che nessuno nota.

## Pubblicare

Collegato a Vercel: quello che arriva su `main` si pubblica da solo. A mano:

```bash
npx vercel --prod
```

Le chiavi Stripe stanno nelle variabili d'ambiente di Vercel, mai nel codice.
