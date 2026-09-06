/**
 * Dove si vede ogni gruppo di testi.
 *
 * Il pannello mostrava i nomi tecnici dei gruppi — `plp`, `pdp`, `gpsr` — che
 * non dicono niente a chi non ha scritto il codice. Una riga per ciascuno vale
 * più di qualunque altra cosa avrei potuto aggiungere: senza, si modifica alla
 * cieca e si scopre dopo di aver toccato la pagina sbagliata.
 */
/**
 * Su quale pagina si vede ogni gruppo.
 *
 * Serve perché l'anteprima mostra una pagina sola, e senza questa mappa
 * modificare il testo di un carrello guardando la home dà «salvato» e nessun
 * cambiamento — che è esattamente come sembra un difetto anche quando non c'è.
 * Il pannello ora ci porta lui, invece di lasciarti indovinare.
 */
export const PAGINA: Record<string, string> = {
  brand: '/', nav: '/', lang: '/', home: '/', footer: '/',
  hero: '/', ticker: '/', instrument: '/', collectionsHome: '/',
  meaning: '/', material: '/', oracle: '/', moons: '/', circle: '/',
  collectionsIndex: '/collezioni',
  plp: '/collezioni/fasi',
  price: '/collezioni/fasi',
  pdp: '/prodotto/arcani-xvii-la-stella',
  gpsr: '/prodotto/arcani-xvii-la-stella',
  cart: '/carrello',
  checkout: '/checkout',
  thanks: '/checkout/grazie',
  orders: '/ordini',
  returns: '/ordini',
  account: '/account',
  help: '/aiuto',
  legal: '/legale/privacy',
};

export const DOVE: Record<string, string> = {
  brand: 'Nome, motto e premessa. Il motto si vede nel piè di pagina.',
  nav: 'Le voci del menu in alto e del menu del telefono.',
  lang: 'Il pulsante che cambia lingua.',
  mode: 'Non più in uso.',
  home: 'Titolo e descrizione della home per i motori di ricerca e le condivisioni.',
  price: 'Le etichette accanto ai prezzi, ovunque compaiano.',
  footer: 'Il piè di pagina, in fondo a ogni pagina.',
  collectionsIndex: 'La pagina /collezioni, quella con tutte e cinque.',
  collectionsHome: 'La sezione delle cinque collezioni dentro la home.',
  plp: 'Le liste di capi: pagina di una collezione e pagina di una categoria.',
  pdp: 'La scheda di un singolo capo.',
  cart: 'Il carrello, sia il cassetto laterale sia la pagina.',
  checkout: 'La cassa, tutti e tre i passi.',
  thanks: 'La pagina che appare dopo aver pagato.',
  gpsr: 'I dati del fabbricante obbligatori in fondo alla scheda prodotto.',
  hero: 'Le frasi sopra il video, in cima alla home.',
  ticker: 'La striscia che scorre sopra l’intestazione.',
  instrument: 'La sezione della luna, subito sotto il video.',
  meaning: 'L’etichetta da museo della Stella, nella home.',
  material: 'La fascia chiara dei 240 grammi, nella home.',
  oracle: 'L’Oracolo: le tre carte da tenere premute.',
  moons: 'Le tredici lune, la fila che si scorre di lato.',
  circle: 'Il modulo di iscrizione in fondo alla home.',
  orders: 'La pagina «trova un ordine» e la ricevuta dell’ordine.',
  returns: 'Il modulo per chiedere un reso, dentro un ordine.',
  account: 'La pagina dell’account.',
  help: 'La pagina di aiuto.',
  legal: 'Le quattro pagine legali: privacy, cookie, recesso, condizioni.',
};
