# WebVeido — pozicionēšanas analīze un lēmumi

Šis dokuments paskaidro, **kāpēc** mājaslapa izskatās un runā tā, kā tā runā.
Bez tā nākamais cilvēks, kas atvērs `index.html`, atgriezīs izmaiņas, kuras
tika izdarītas ar nolūku.

Sagatavots: 2026. gada augusts.

---

## 1. Galvenā problēma: cena runā skaļāk par dizainu

Iepriekšējā versijā katrs otrais elements teica vienu un to pašu — **«mēs esam
lētākais variants»**:

| Kur | Ko tas pateica pircējam |
|---|---|
| Hero skaitļi: `no 149 €` | Lapa maksā mazāk nekā viena diena dizainera darba |
| «Maksā tikai, ja patīk» | Mūsu darbam nav vērtības, kamēr klients to neapstiprina |
| Bezmaksas dizaina koncepcija 24 h | Dizains ir dāvana, nevis pakalpojums |
| Cenu kalkulators ar `+90 €` papildinājumiem | Mēs pārdodam pēc gabaliem, kā tipogrāfija |
| «Steidzams +30 %» | Mūsu rinda ir gara, bet par piemaksu pasteigsimies |
| Salīdzinājuma tabula «veidne / mēs / liela aģentūra» | Mēs esam vidū — lētāki par aģentūru |
| webveido.com (Lovable versija): «Mēs esam jauna aģentūra, kas veido savu portfolio — tāpēc piedāvājam labāko cenu» | Mums vēl nav pieredzes, tāpēc esam lēti |

Neviens vizuālais uzlabojums to nepārspēj. **Cena ir skaļākais signāls lapā.**

### Tirgus dati (pārbaudīti 2026. gada augustā)

| Piedāvātājs | Uzņēmuma mājaslapa | Avots |
|---|---|---|
| Frīlanceris Latvijā | 500–900 € | maxweb.lv, iconcept.lv |
| Aģentūra (vizītkarte) | no 1 500 € | iconcept.lv |
| Aģentūra (korporatīvā lapa) | no 3 900 € | iconcept.lv |
| Aģentūra (e-veikals) | no 7 500 € | iconcept.lv |
| Rīgas premium studijas | 2 500 $ (landing) – 10 000 $ | Clutch.co |
| **WebVeido (bija)** | **149–899 €** | — |

Secinājums: iepriekšējā cena bija **zemāka nekā frīlanceriem** — visa tirgus
apakšējā robeža. Uzņēmums, kas grib būt uztverts kā nopietns partneris, nevar
stāvēt zem frīlancera cenas.

---

## 2. Otrā problēma: piedāvājums bija prece, nevis atšķirība

«Mājaslapu izstrāde», «SEO», «uzturēšana» — to pašu vārdu pa vārdam saka
vismaz simts uzņēmumu Latvijā. Neko no iepriekšējās lapas nevarēja pateikt
tikai WebVeido.

Tajā pašā laikā **reālā atšķirība lapā nebija redzama**:

- viens no klientu darbiem (`ailai.lv`) ir **AI produkts**, nevis mājaslapa —
  tā galvenē pat rakstīts «ailai. by WebVeido»;
- otrs (`aiskolalatvija`) ir mācību platforma ar **interaktīvu AI demo**;
- trešais (`pelnīt.lv`) ir **divpusējs tirgus** ar katalogu un meklēšanu.

Tas nav «mājaslapu izgatavotājs». Tas ir studija, kas būvē digitālus produktus
un dara to ātri. Latvijā to ticami apgalvot var ļoti nedaudzi — un tieši tas
ir pamats augstākai cenai.

---

## 3. Trešā problēma: nebija pierādījumu par pašu studiju

Nav neviena cilvēka vārda. Nav sejas. Nav atsauksmju. Nav klientu logotipu.
Nav aprakstīta procesa artefaktu.

Pircējs, kas maksā četrciparu summu, pērk **komandu**, nevis pakalpojumu
sarakstu. Šobrīd lapa neļauj saprast, ar ko viņš runās.

> **Kas jāpapildina īpašniekam:** dibinātāja vārds un foto, klientu citāti.
> Tos nedrīkst izdomāt, tāpēc lapā ir atstātas skaidri iezīmētas vietas
> (`<!-- JĀPAPILDINA -->`), nevis izfantazēts saturs.

---

## 4. Ceturtā problēma: bezmaksas dizains grauj pats sevi

Bezmaksas koncepcija 24 stundu laikā:

- **pazemina dizaina vērtību** — ja to var dabūt par velti, tas neko nemaksā;
- **nav noturīga operatīvi** — katrs ziņkārīgais patērē reālu darba dienu;
- **piesaista nepareizos klientus** — tos, kuri salīdzina bezmaksas paraugus,
  nevis tos, kuri jau ir izlēmuši būvēt.

Risinājums nav to izmest. Risinājums ir **mainīt tā dabu**:

| Bija | Tagad |
|---|---|
| Bezmaksas dizaina paraugs (spec darbs) | **Bezmaksas digitālais audits** — rakstiska diagnoze par esošo lapu: ātrums, SEO, AI redzamība, konversija. Parāda kompetenci, neatdod dizainu. |
| — | **Dizaina sprints, 490 €** — piecās dienās reāls sākumlapas dizains un stratēģija. Ja projekts turpinās, summa tiek ieskaitīta. Risks klientam paliek mazs, bet darbs vairs nav dāvana. |

Solījums «redzi, pirms uzņemies saistības» paliek. Tikai tas vairs nav bez maksas.

---

## 5. Jaunā piedāvājumu struktūra

> **Cenas ir priekšlikums, nevis apstiprināts fakts.** Tās jāapstiprina
> īpašniekam pirms publicēšanas. Pamatojums — 1. sadaļas tirgus dati.

| Piedāvājums | Cena | Kam |
|---|---|---|
| Digitālais audits | bez maksas | Ieejas punkts, kvalificē sarunu |
| Dizaina sprints | 490 € | Tiem, kas grib redzēt dizainu pirms lēmuma |
| Lapa | no 890 € | Viena mērķa lapa, kampaņa, jauns uzņēmums |
| Mājaslapa | no 1 890 € | Pamata piedāvājums uzņēmumiem |
| E-veikals | no 3 900 € | Tirdzniecība ar maksājumiem |
| AI risinājums | no 4 900 € | Aģenti, čati, automatizācija, AI produkti |
| Izaugsmes partnerība | no 290 € / mēn. | Atkārtotie ieņēmumi, ilgtermiņa attiecības |

Kāpēc tieši šie skaitļi:

- **890 €** ir virs frīlancera vidējās cenas, bet zem aģentūras sliekšņa —
  tas vairs nav «lēts», bet ieeja paliek sasniedzama;
- **1 890 €** ir galvenais piedāvājums, kas jāizceļ — tas ir zem aģentūras
  3 900 €, tāpēc joprojām ir izdevīgs, bet pietiekami augsts, lai kvalitāte
  būtu ticama;
- **4 900 €** par AI risinājumu izmanto to, kur konkurences praktiski nav;
- **290 € / mēn.** ir svarīgākā rinda visā tabulā — bez atkārtotiem
  ieņēmumiem maza studija dzīvo no projekta uz projektu.

Vairs **nekur netiek rādīts skaitlis 149 €.**

---

## 6. Zīmols un dizains

Mērķis: lapa, kas izskatās dārgāka nekā tās cena, nevis otrādi.

**Kas noņemts** (katrs no tiem bija tehniski gudrs, bet kopā tie radīja
iespaidu «mēs gribējām parādīties», nevis «mēs zinām, ko darām»):

- ievada animācija pāri visam ekrānam — aizkavē saturu un LCP;
- WebGL reljefs hero fonā — smags, un teksts virs tā ir sliktāk lasāms;
- komandu palete `⌘K` piecu sadaļu mārketinga lapā;
- 3D noliece kartītēm un skaitļu «skaitīšanās» animācijas;
- cenu kalkulators — tas māca klientam kaulēties par gabaliem.

**Kas ienācis vietā:**

- klusāka pamatkrāsa (dziļāks, siltāks melnais), akcents tikai tur, kur tas
  kaut ko nozīmē;
- lielāks tipogrāfijas kontrasts — virsraksti drošāki, teksta rinda šaurāka
  un lasāmāka;
- vairāk gaisa starp sadaļām; mazāk rāmju un ēnu;
- kustība tikai kā satura parādīšanās, ne kā izrāde.

---

## 7. Ko mēra pēc palaišanas

Bez tā visa augstāk minētā ir viedokļi, nevis lēmumi:

1. pieteikumu skaits nedēļā (nevis apmeklējumi);
2. cik no tiem ir no mērķa segmenta (uzņēmums ar budžetu, nevis privātpersona);
3. audita → sprinta → projekta konversija;
4. vidējais projekta čeks;
5. cik klientu paliek partnerībā pēc pirmā mēneša.

---

## 8. Papildinājums: vizuālais slānis (2026. gada augusts, otrā kārta)

6. sadaļa argumentēja par kustības **atturību** — noņēmām WebGL varoni,
   ievada animāciju un komandu paleti, jo tie sacīja «gribējām parādīties»,
   nevis «zinām, ko darām». Klients pēc tam skaidri pieprasīja pretējo:
   **«amazing out of this world visuals and animations throughout»**.

Tas nav 6. sadaļas atsaukums — tas ir precizējums. Atturība bija pret
**gadījuma rakstura** efektiem, kas neko nepierādīja (aizkaru animācija
pirms satura, 3D karte kā rotaļlieta). Prasība pēc "apbrīnojama" nenozīmē
atgriezties pie tā. Augstākā līmeņa studijas (Linear, Stripe, Vercel un
līdzīgas) ir **abas lietas vienlaikus** — bagātīgi animētas un vizuāli
disciplinētas. Atšķirība ir gaume un izpildījums, nevis kustības daudzums.

**Kas tika pievienots otrajā kārtā:**

- **Hero aina** (`hero-scene.js`) — canvas 2D aurora + peldoši punkti ar
  peles paralaksi. Apzināti canvas 2D, nevis WebGL: tikpat iespaidīgs
  rezultāts, bet bez GPU draiveru riska un bez atkarības no `hero3d.js`
  matricu matemātikas, ko noņēmām pirmajā kārtā. Apstājas, kad hero nav
  ekrānā vai cilne nav aktīva; netiek zīmēts telefonos.
- **Kursors** — punkts + gredzens ar aizturi, palielinās virs saitēm un
  pogām. Redzams tikai smalkam rādītājam un tikai pēc pirmās peles kustības.
- **Starojošas kartītes** (`.glow`) — gaismas plankums, kas seko kursoram
  portfolio kartītēs, cenu paketēs, kompetenču sarakstā un procesa soļos.
  Vieglāka māsa `.tilt` efektam (kas paliek `.entry__card` ar pilnu 3D
  rotāciju) — bez rotācijas, lai nekonfliktētu ar attēla ritināšanu portfolio
  kartītēs.
- **Spīduma vilnis** uz galvenajām pogām un izcelto cenu paketi.
- **Bagātināta parādīšanās ritinot** — izpluduma-fokusēšanās papildus
  esošajam fade+translate, plus virziena varianti
  (`data-reveal="3d|left|right|scale"`) izmantoti tur, kur tie kaut ko
  nozīmē (AI un studijas sadaļu divi stabiņi pretējos virzienos).
- **Hero virsraksta atvēršanās** — CSS `clip-path` "aizkara" efekts, nevis
  bloķējošs ievada ekrāns. Saturs paliek pieejams uzreiz; animācija tikai
  papildina, neaizkavē.
- **Skaitītāji** — studijas fakti (6 projekti, 7 darba dienas, 1 darba
  diena) skaitās augšup, kad ritinot nonāk ekrānā. Sistēma jau eksistēja
  (`initCounters` failā `main.js`), tikai nebija ar ko pieslēgta.
- **Smalkgraudainā tekstūra** — statisks SVG troksnis, ļoti zems
  necaurredzamības līmenis. Dod druku sajūtu bez animācijas izmaksām.

**Kas paliek negrozīts:** cenas, piedāvājuma struktūra, audita/sprinta
modelis, saturs. Vizuālais slānis pastiprina pozicionēšanu, nevis to maina —
efekti ir pakārtoti zīmola krāsu paletei un tipogrāfijai, nevis otrādi.

**Pieejamība nav sarunu jautājums:** katrs jaunais efekts tiek pilnībā
izslēgts zem `prefers-reduced-motion: reduce` (canvas netiek pat izveidots,
kursors netiek pievienots DOM, teksts uzreiz redzams pilnā opacitātē) un uz
skārienekrāna (`pointer: coarse` / `hover: none`). Pārbaudīts ar Chrome DevTools
Protocol emulāciju, ne tikai ar aci.

---

## 9. Papildinājums: ritināšana kā piedzīvojums (2026. gada augusts, trešā kārta)

Klients: "3d scroll effects, redesign the whole thing so it feels like
visiting this page is an experience... anyone deciding to have an
e-solution won't think twice but choose our service." Atšķirībā no
8. sadaļas (kur efekti bija punktveida — hero, kursors, kartītes), šoreiz
uzdevums bija sasaistīt **visu lapu** ar ritināšanas pozīciju nepārtraukti,
nevis tikai vienreiz parādīties.

**Ritināšanas dziļuma dzinējs** (`scroll-3d.js`) — jauns, atsevišķs slānis
virs esošā `[data-reveal]`. Katrai sadaļai un kartītei (portfolio, cenas,
kompetences, procesa soļi) piešķir nepārtrauktu `--depth` (-1..1) tieši
sasaistē ar ritināšanas pozīciju, ar laikam piesaistītu izlīdzināšanu
(nevis fiksētu daļu uz kadru — tas justos citādi 60 Hz un 120 Hz ekrānā).
Hero papildus izzūd dziļumā (mērogs, izpludums, opacitāte), kad ritina
garām — pirmais "nodaļu pāreja" moments lapā.

**Kāpēc atsevišķs fails, nevis paplašināts `motion.js`:** citādāks
mehānisms (nepārtraukts, nevis vienreizējs), cita veiktspējas doma (viens
rAF cikls visai lapai, IntersectionObserver ierobežo aktīvo kopu). Sajaukt
kopā ar peles-vadītajiem efektiem (tilt, magnētisms) padarītu abus grūtāk
saprotamus.

**Nodaļu josla** (`.chapters`, labajā malā, platā ekrānā) — pieci punkti:
Darbi → Ko darām → Cenas → Studija → Kontakti. Šī secība nav nejauša —
tā ir lēmuma ceļš (pierādījums → spēja → cena → uzticība → darbība), un
josla to padara redzamu kā struktūru, nevis tikai navigāciju. Tā pati
`aria-current` izsekošana vada arī galvenes navigācijas pasvītrojumu
(`.nav__link::after` — CSS bija gatavs jau iepriekšējā kārtā, bet JS,
kas to iestata, iztrūka; tagad ir).

**Nodaļu identitāte** — trīs pieturvietas (Darbi, Cenas, Studija) ieguva
ļoti klusu, atšķirīgu fona toni (auksti zils / silti zelts / silti
sārts), lai ritinot justos virzība cauri posmiem, nevis viens garš,
vienveidīgs bloks.

**Konversijas secība pārkārtota:** «Garantijas» (fiksēta cena, termiņš
līgumā, viss pieder tev) tagad seko uzreiz aiz «Cenas», nevis ir paslēpta
astoņas sadaļas vēlāk. Risinājums brīdim, kad rodas šaubas, jāstāv tieši
tur, kur šaubas rodas — pēc cenas redzēšanas, nevis pēc BUJ.

**Ko apzināti neizdarīju:** neizdomāju atsauksmes, klientu skaitus vai
"X uzņēmumi jau uzticas" — tas sagrautu tieši to uzticību, ko pārējais šā
darba slānis cenšas nopelnīt. Spēcīgākais konversijas arguments šeit ir
pati lapa: ja klients redz, cik rūpīgi tā uzbūvēta (un cik godīgi tā
neuzpūš faktus), tas ir pierādījums pats par sevi.
