# WebVeido — mājaslapa (latviešu versija)

Pilnībā pārstrādāta `webveido.com` latviešu versija. Statiska mājaslapa bez
būvēšanas soļa, bez ietvariem un bez ārējām JavaScript bibliotēkām.

> **Pirms izmaiņām izlasi [`STRATEGY.md`](STRATEGY.md).** Tur ir paskaidrots,
> kāpēc lapa runā tieši tā, kāpēc cenas ir tādas, kādas tās ir, un kāpēc daļa
> agrāko efektu ir noņemta ar nolūku. Bez tā konteksta izmaiņas mēdz atgriezt
> tieši to, kas tika novērsts.

```
STRATEGY.md            # pozicionēšanas analīze un lēmumi
index.html             # mājaslapa
portfolio.html         # darbu portfolio
admin.html             # administrācijas panelis (demonstrācija)
privatums.html         # privātuma politika

assets/css/main.css    # dizaina sistēma un visi stili
assets/css/motion.css  # parādīšanās, 3D un animācijas
assets/css/admin.css   # paneļa un diagrammu stili

assets/js/store.js     # pieteikumu glabātuve (kopīga abām lapām)
assets/js/main.js      # tēma, navigācija, BUJ, formu validācija
assets/js/motion.js    # 3D noliece, magnētiskās pogas, koda logs
assets/js/features.js  # ritināšanas progress, sīkdatnes, pieteikumi
assets/js/admin.js     # paneļa loģika

assets/img/            # logotips, favicon, OG attēls, ikona
robots.txt             # atļauts arī AI robotiem (GPTBot, ClaudeBot u. c.)
sitemap.xml
site.webmanifest
```

## Krāsu režīms

Noklusējums ir **tumšais režīms neatkarīgi no sistēmas iestatījuma** — tas ir
zīmola izskats. Gaišo režīmu lietotājs var ieslēgt ar pārslēgu galvenē, un izvēle
tiek saglabāta `localStorage` (`wv-theme`). Abas tēmas ir izstrādātas atsevišķi,
nevis iegūtas ar krāsu apgriešanu.

## Pozicionēšana

Lapa pārdod **digitālo studiju**, nevis lētas mājaslapas. Praktiski tas nozīmē:

- pirmajā ekrānā nav cenas un nav formas — vispirms apgalvojums, tad pierādījums;
- darbi ir uzreiz aiz hero, jo tie pārliecina labāk nekā jebkurš teksts;
- bezmaksas dizaina paraugs ir aizstāts ar **bezmaksas auditu** (rāda kompetenci)
  un **apmaksātu dizaina sprintu** (490 €, tiek ieskaitīts projektā);
- sākuma cenas: lapa no 890 €, mājaslapa no 1 890 €, e-veikals no 3 900 €,
  AI risinājums no 4 900 €, partnerība no 90 € mēnesī;
- skaitlis **149 €** lapā vairs neparādās nekur.

> **Cenas jāapstiprina īpašniekam.** Tās ir pamatots priekšlikums, balstīts uz
> Latvijas tirgus datiem, nevis apstiprināts cenrādis — skat. `STRATEGY.md`.

Ar nolūku noņemts: ievada animācija, WebGL hero aina, komandu palete (`⌘K`),
cenu kalkulators un salīdzinājuma tabula «veidne / mēs / liela aģentūra».
Katrs no tiem vai nu aizkavēja saturu, vai pozicionēja studiju kā lētāko variantu.

## Papildu funkcijas

1. **Sīkdatņu piekrišana + privātuma politika** — Eiropas uzņēmumam tas nav
   izvēles jautājums.
2. **Ritināšanas progress un aktīvās sadaļas iezīmēšana** navigācijā.
3. **Pieteikumu vēsture ar eksportu uz CSV**, ko lasa administrācijas panelis.

### Tiešā saziņa

Daļa apmeklētāju formu neaizpilda nekad, bet uzraksta ziņu uzreiz — tāpēc
blakus formai ir arī otrs ceļš:

- **WhatsApp poga** ekrāna stūrī (dators) un kājenes kontaktos;
- **pastāvīga darbību josla** telefonā, kas parādās, tiklīdz apmeklētājs ir
  aizritinājis garām pirmajam ekrānam (`initCtaBar` failā `main.js`).

Abas norāda uz `+371 25 235 368`. Ja numurs mainās, jāpārbauda `tel:`, `wa.me`
un JSON-LD `telephone`.

## Administrācijas panelis

`admin.html` — kopsavilkuma plāksnes, pieteikumu tabula ar filtru un meklēšanu,
detaļu panelis ar statusa maiņu, divas diagrammas, dzīvi lapas priekšskatījumi
un uzņēmuma dati.

> **Tā ir priekšpuses demonstrācija, nevis darba rīks.**
> Piekļuves kods (`webveido`) tiek pārbaudīts pārlūkā un **nesniedz nekādu
> drošību**. Pieteikumi glabājas `localStorage` — tie neaizceļo uz serveri, nav
> redzami citās ierīcēs un pazūd, notīrot pārlūka datus.
> Reālam darbam vajadzīgs servera galapunkts formām un servera puses
> autentifikācija panelim.

### Diagrammu krāsas

Posmu diagramma izmanto **viena toņa secīgu skalu** (nevis kategoriālu paleti),
jo posmi ir sakārtoti secībā. Skala ir pārbaudīta uz gaišuma monotonitāti un
kontrasta pret virsmu; noslēgtajiem pieteikumiem ir atsevišķs neitrāls tonis.
Katrs stabiņš ir tieši apzīmēts ar nosaukumu un skaitu, tāpēc nozīme nekad
nav atkarīga tikai no krāsas.

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
- Pievienota **gaišā tēma** ar pārslēgu; izvēle tiek saglabāta. Noklusējums ir
  tumšais režīms neatkarīgi no sistēmas iestatījuma.

**Pieejamība**

- Ievadlauku kontrasts paaugstināts (iepriekš apmales bija gandrīz neredzamas).
- Saite «Pāriet uz galveno saturu», redzami fokusa rāmji, `aria-*` atribūti,
  kļūdu paziņojumi ar `role="alert"`.
- Ievērots `prefers-reduced-motion` un `prefers-contrast: more`.
- BUJ balstīts uz `<details>`, tāpēc darbojas arī bez JavaScript.

**Tehniskā daļa un SEO**

- Nulle atkarību. Nav React, nav Tailwind, nav paketes — tikai HTML, CSS un
  vaniļas JavaScript.
- Strukturētie dati: `ProfessionalService`, `WebSite`, `FAQPage` un četri
  `Offer` ieraksti.
- Sakārtoti `robots.txt`, `sitemap.xml`, `site.webmanifest`, kanoniskā saite,
  `hreflang`, Open Graph un Twitter kartītes.
- Lapa darbojas arī tad, ja JavaScript neielādējas.

---

## Kas jāaizstāj pirms publicēšanas

Šie lauki ir **vietturi** — tie jānomaina uz reāliem datiem. Tālrunis, e-pasts
un uzņēmuma nosaukums jau ir salāgoti ar webveido.com: `+371 25 235 368`,
`support@webveido.com`, SIA «Daina Z».

| Kur | Vietturis | Jādara |
|---|---|---|
| JSON-LD | `addressLocality: "Rīga"` | Norādīt faktisko atrašanās vietu |
| Cenu sadaļa | 890 / 1 890 / 3 900 / 4 900 € | Pamatots priekšlikums, nevis apstiprināts cenrādis. Jāapstiprina īpašniekam — pamatojums `STRATEGY.md` |
| `#studija` | dibinātāja vārds un foto | Lapā ir iezīmēta vieta (`JĀPAPILDINA`). Spēcīgākais uzticības elements, un to nedrīkst izdomāt |
| Visa lapa | klientu atsauksmes | Nav nevienas. Kad būs, jāpapildina arī JSON-LD ar `Review` |
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

Lapā **nav atsauksmju**, jo nebija pieejami reāli klientu citāti. Izdomātas
atsauksmes būtu maldinošas. Kad tādas būs, tās var pievienot kā jaunu sadaļu un
papildināt JSON-LD ar `Review` vai `AggregateRating`.

## Portfolio

`portfolio.html` un sadaļa «Darbi» sākumlapā rāda sešus reālus projektus ar
tiešām saitēm. Sākumlapā ir pirmie trīs, pilnajā lapā — visi seši ar nozaru
filtru.

Katrai kartītei ir **īsts ekrānuzņēmums pilnā lapas garumā**. Redzama tiek
augšdaļa; uz peles vai tastatūras fokusa attēls lēni aizritina lapu līdz
apakšai, tāpēc apmeklētājs redz visu darbu, neatverot to. Blakus ir tās pašas
lapas mobilais skats. Uz skārienekrāna, kur peles nav, kartīte uzreiz rāda
garāku izgriezumu.

Nosaukumi, apraksti un nozaru apzīmējumi ir rakstīti pēc lapu **reālā satura**
(nolasīts ar zemāk aprakstīto rīku), nevis pēc adreses nosaukuma.

### Ekrānuzņēmumu un datu ievākšana

Repozitorijā ir `tools/fetch-portfolio.mjs` — tas atver katru klienta lapu īstā
pārlūkā, nolasa virsrakstu ar aprakstu un uztaisa divus ekrānuzņēmumus:

```bash
node tools/fetch-portfolio.mjs
```

Rezultāts:

| Fails | Kas tas ir |
|---|---|
| `assets/img/darbi/<slug>.jpg` | visa lapa, 1280 px plata (līdz 3400 px augsta) |
| `assets/img/darbi/<slug>-mobile.jpg` | viens telefona ekrāns, 390 × 844 |
| `tools/portfolio-data.json` | virsraksti, apraksti un sadaļu nosaukumi |

Pirms attēla uzņemšanas skripts lēni izritina lapu (lai nostrādā parādīšanās
animācijas), aizver sīkdatņu joslas un noņem redaktora nozīmītes. Ja mainās
attēla izmērs, jāatjauno arī `width`/`height` atribūti `portfolio.html` un
`index.html` — tie novērš izkārtojuma lēkāšanu ielādes laikā.

Skriptam vajag tīkla piekļuvi klientu domēniem. Ja vides tīkla politika tos
bloķē, tas godīgi pateiks `0 no 6` un neuztaisīs ekrānuzņēmumus no pārlūka
kļūdas lapām. Pārbaudīt politiku var ar:

```bash
curl -sS "$HTTPS_PROXY/__agentproxy/status"
```

Vidē, kur izejošais HTTPS iet caur starpniekserveri, skripts pārlūkam padod
`--proxy-server` un `--ssl-version-max=tls1.2` — daļa pārtverošo starpnieku
aizver savienojumu, ieraugot Chrome TLS 1.3 sasveicināšanos. Šifrēšana paliek,
sertifikātu pārbaude netiek izslēgta.

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
