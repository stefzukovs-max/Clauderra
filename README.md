# WebVeido — mājaslapa (latviešu versija)

Pilnībā pārstrādāta `webveido.com` latviešu versija. Statiska mājaslapa bez
būvēšanas soļa, bez ietvariem un bez ārējām JavaScript bibliotēkām.

```
index.html            # visa lapa, semantisks HTML + strukturētie dati
assets/css/main.css   # dizaina sistēma un visi stili
assets/css/motion.css # atvēruma efekts, 3D un animācijas
assets/js/main.js     # tēma, navigācija, BUJ, formu validācija
assets/js/motion.js   # atvērums, WebGL aurora, 3D noliece
assets/img/           # logotips, favicon, OG attēls, ikona
robots.txt            # atļauts arī AI robotiem (GPTBot, ClaudeBot u. c.)
sitemap.xml
site.webmanifest
```

## Palaišana

Nav ne atkarību, ne būvēšanas. Jebkurš statisks serveris der:

```bash
python3 -m http.server 8000
# atver http://127.0.0.1:8000
```

Publicēšanai pietiek ar failu augšupielādi (Netlify, Cloudflare Pages,
GitHub Pages, parasts hostings).

---

## Kas mainīts salīdzinājumā ar iepriekšējo (Lovable) versiju

**Konversija**

- Salabota **formas kārtība**. Iepriekš tālruņa lauks atradās *zem* nosūtīšanas
  pogas, tāpēc dabiskā aizpildes secība bija pārtraukta. Tagad: e-pasts →
  tālrunis → nozare → poga.
- Virs ekrāna apakšas pievienoti **četri pierādījuma rādītāji** (termiņš, cena,
  24 h, nulles risks) — iepriekš pirmajā ekrānā bija tikai virsraksts.
- Pievienota **uzticības josla** ar reģistrācijas numuru, līguma un valodas
  norādēm, kā arī atsevišķa **garantiju** sadaļa.
- Pievienotas **cenu paketes**. Cena vairs nav jāizprasa sarunā.

**Dizains**

- Noņemts oranžais gradients uz pogas, kas nesaskanēja ar karmīnsarkano zīmolu.
  Visa palete tagad ir viena saskaņota skala.
- Ieviesta pilna dizaina sistēma: krāsu marķieri, plūstošs tipogrāfijas mērogs
  (`clamp()`), 8pt atstatumu režģis, vienotas noapaļojuma un ēnu vērtības.
- Pievienota **gaišā tēma** ar pārslēgu; izvēle tiek saglabāta un tiek ņemta
  vērā sistēmas preference.

**Pieejamība**

- Ievadlauku kontrasts paaugstināts (iepriekš apmales bija gandrīz neredzamas).
- Saite «Pāriet uz galveno saturu», redzami fokusa rāmji, `aria-*` atribūti,
  kļūdu paziņojumi ar `role="alert"`.
- Ievērots `prefers-reduced-motion` un `prefers-contrast: more`.
- BUJ balstīts uz `<details>`, tāpēc darbojas arī bez JavaScript.

**Tehniskā daļa un SEO**

- Nulle atkarību. Nav React, nav Tailwind, nav paketes — tikai HTML, CSS un
  ~230 rindas JavaScript.
- Strukturētie dati: `ProfessionalService`, `WebSite`, `FAQPage` un trīs
  `Offer` ieraksti.
- Sakārtoti `robots.txt`, `sitemap.xml`, `site.webmanifest`, kanoniskā saite,
  `hreflang`, Open Graph un Twitter kartītes.
- Lapa darbojas arī tad, ja JavaScript neielādējas.

---

## Kas jāaizstāj pirms publicēšanas

Šie lauki ir **vietturi** — tie jānomaina uz reāliem datiem.

| Kur | Vietturis | Jādara |
|---|---|---|
| `index.html`, `README` | `+371 20 000 000` | Ielikt īsto tālruņa numuru (arī `tel:` saitēs un JSON-LD) |
| `index.html` | `info@webveido.com` | Pārbaudīt, vai adrese ir pareiza |
| JSON-LD | `addressLocality: "Rīga"` | Norādīt faktisko atrašanās vietu |
| Cenu sadaļa | **449 €** un **899 €** | Šīs paketes ir piedāvājums, nevis apstiprināti dati. Publiski zināma bija tikai sākuma cena **149 €** — pārējās jāapstiprina |
| Formas | `data-endpoint=""` | Skat. sadaļu «Formu pieslēgšana» |

### Formu pieslēgšana

Kamēr `data-endpoint` ir tukšs, forma atver lietotāja e-pasta programmu ar jau
sagatavotu vēstuli. Tas darbojas bez servera, bet reālam darbam labāk pieslēgt
pieteikumu saņemšanu:

```html
<form id="lead-form" data-endpoint="https://formspree.io/f/XXXX" ...>
```

Der jebkurš serviss, kas pieņem `POST` ar `FormData` un atbild ar 2xx
(Formspree, Web3Forms, Basin vai savs galapunkts). Kļūdas gadījumā lietotājam
tiek parādīta e-pasta adrese kā rezerves variants.

### Kas apzināti netika pievienots

Lapā **nav atsauksmju un portfolio sadaļas**, jo nebija pieejami reāli klientu
dati. Izdomātas atsauksmes vai izdomāti darbi būtu maldinoši, tāpēc to vietā ir
garantiju sadaļa. Kad būs reāli projekti un atsauksmes, tos var pievienot kā
jaunu sekciju un papildināt JSON-LD ar `Review` vai `AggregateRating`.

---

## Kustības un 3D slānis

Viss vizuālais slānis ir atdalīts divos failos (`motion.css`, `motion.js`) un
uzbūvēts kā papildinājums: ja tie neielādējas, lapa darbojas nemainīgi.
Ārējo bibliotēku nav — arī 3D fons ir rakstīts tieši uz WebGL.

**Atvēruma efekts.** Zīmola zīme uzzīmējas ar `stroke-dashoffset`, burti ienāk
ar `rotateX`, pēc tam tumšais aizkars sadalās sešās lamelēs un 3D telpā
paceļas uz augšu, atklājot hero sadaļu.

- Rādās **reizi sesijā** (`sessionStorage`), nevis katrā lapas atvēršanā.
- Ir poga «Izlaist»; efektu pārtrauc arī klikšķis, `Esc`, ritināšana vai
  pieskāriens.
- Netiek rādīts, ja ieslēgta samazināta kustība.
- Bez JavaScript to neieslēdz vispār, un galvenē ir 4,5 s drošības vārsts,
  kas atbloķē lapu, ja `motion.js` neielādējas.

**Hero aurora.** Fragmentu ēnotājs ar domēna izliekšanu (`fbm` trokšņa
slāņi). Zīmējas 0,55× izšķirtspējā ar 30 kadriem sekundē, aptur zīmēšanu,
kad hero nav ekrānā vai cilne nav aktīva, un maigi seko kursoram. Telefonos
netiek zīmēta vispār — tur akumulatora izmaksas ir lielākas par ieguvumu.
Ja WebGL nav pieejams, paliek CSS gradients.

**3D noliece.** Kartītes, cenu paketes un hero forma seko kursoram ar
`perspective` + `rotateX/rotateY`; ikonas un virsraksti ir pacelti ar
`translateZ`, tāpēc rodas dziļums. Atspīdums seko kursora pozīcijai.
Uz skārienekrāniem noliece netiek izmantota.

### Ko ievērot, mainot šo slāni

- `data-reveal="3d"` un `.tilt` **nedrīkst būt uz viena elementa**.
  `[data-reveal].is-visible` specifiskums ir (0,2,0) un tas iesaldētu
  noliecei nepieciešamo `transform`.
- Peldēšanas animācija izmanto atsevišķo `translate` īpašību, nevis
  `transform`, lai nekonfliktētu ar nolieci.
- `perspective()` kopā ar `rotateX()` **paplašina elementa projicēto
  robežkastu**. Tieši tāpēc `html` ir `overflow-x: clip` — bez tā platie
  bloki atklāšanas laikā rada horizontālu ritjoslu.

## Fonti

Izmantoti Google Fonts (`Inter` + `Outfit`) ar `preconnect` un sistēmas
rezerves saimi, tāpēc lapa izskatās korekti arī tad, ja fonti neielādējas.
Ja vēlas pilnīgu neatkarību no ārējiem serveriem, fontus var lejupielādēt,
novietot `assets/fonts/` un aizstāt `<link>` ar `@font-face`.

## Pārlūku atbalsts

Chrome, Edge, Firefox un Safari pēdējās divas versijas. Izmantotās modernās
iespējas (`color-mix()`, `:focus-visible`, `text-wrap: balance`,
`backdrop-filter`) noklusējuma gadījumā degradējas korekti.
