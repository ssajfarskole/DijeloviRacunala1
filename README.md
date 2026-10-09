# Anatomija računala (hrvatska inačica)

Interaktivni 3D atlas računalnog hardvera – hrvatski prijevod i statička inačica
otvorenog projekta [PC Anatomy](https://github.com/brickshow/pc-anatomy) (MIT).

## Struktura
```
index.html        ← početna stranica (stilovi, tekstovi i podaci su unutra)
js/viewer.js      ← 3D preglednik komponenti (three.js)
js/cpu-layers.js  ← 3D "rastavljivi" procesor (slojevi generirani u kodu)
fonts/            ← Space Grotesk (naslovi) + Manrope (tekst), lokalno, SIL OFL
vendor/three/     ← three.js lokalno (ne treba internet / CDN)
models/           ← 16 GLB modela (optimizirani: meshopt + WebP teksture, ukupno ~16 MB)
.nojekyll         ← da GitHub Pages ne obrađuje datoteke Jekyllom
```
Sve putanje su **relativne**, pa radi i na `https://korisnik.github.io/repo/` i u podmapi.

## Objava na GitHub Pages
1. Napravite novi repozitorij i prenesite **cijeli sadržaj ove mape** (zadržite strukturu mapa).
   Najveći model je ~6 MB pa je i prijenos kroz web-sučelje (Add file → Upload files) u redu.
2. *Settings → Pages → Build and deployment → Deploy from a branch* → grana `main`, mapa `/ (root)`.
3. Nakon minute-dvije stranica je na `https://<korisnik>.github.io/<repozitorij>/`.

## Lokalno pokretanje
Preglednici blokiraju učitavanje 3D modela preko `file://`, zato koristite mali poslužitelj:
```
python -m http.server 8000
```
pa otvorite http://localhost:8000 (ili VS Code ekstenzija *Live Server*).
Otvaranjem `index.html` dvoklikom tekst se prikaže, ali 3D prikaz neće raditi (stranica to i javlja).

## Slojevi CPU-a
Sekcija ima 3D model koji se rastavlja na 5 slojeva (klik na sloj na modelu, na popisu ili na čip), a svaka kartica sloja
ima SVG ilustracije: presjek procesora s označenim slojem i shematski pogled odozgo.
Ilustracije su u `index.html` (funkcije `figCross` i `figTop`), a 3D boje/razmaci u `js/cpu-layers.js`.

## Što je prevedeno
Sav sadržaj: naslovi, upute, gumbi, opisi 16 komponenti (pregled, specifikacije, funkcije, problemi)
i svih 5 slojeva CPU-a.

## Licence
- Fontovi Space Grotesk i Manrope: SIL Open Font License (`fonts/LICENSE-*.txt`).
- Kod: MIT (izvorni autor: brickshow). three.js: MIT (`vendor/three/LICENSE-three.txt`).
- 3D modeli: Creative Commons, autori su navedeni uz svaku komponentu. Model „RAM” je CC BY-NC-ND (nekomercijalno, bez izmjena).
  Modeli su ovdje samo tehnički optimizirani (kompresija/smanjenje tekstura) – za strogo poštovanje „NoDerivs”
  uvjeta kod RAM modela po potrebi zamijenite izvornom datotekom sa Sketchfaba.
