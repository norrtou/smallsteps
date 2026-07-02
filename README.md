# Small Steps 🌱

Ett litet verktyg som gör stora mål små. Skapa ett mål, och när ett steg känns
för stort trycker du **”För stort”** – då får du tre tomma rader att fylla med
mindre steg. Fortsätt så långt du behöver.

- Helt statiskt – ingen backend, ingen inloggning, ingen AI
- All data sparas i `localStorage` på din enhet
- Fungerar offline (service worker)
- Svenska och engelska (knappen uppe till höger)

## Filstruktur

```
index.html            Appen (enda sidan)
styles.css            All styling
app.js                All logik
sw.js                 Service worker för offline
manifest.webmanifest  PWA-manifest
icon.svg              App-ikon
```

## Kör lokalt

Service workern kräver en HTTP-server (inte `file://`):

```bash
python3 -m http.server 8000
# öppna http://localhost:8000
```

## Deploya till GitHub Pages

1. Skapa ett nytt repo på GitHub, t.ex. `small-steps` (Public, utan README).
2. Pusha koden:

   ```bash
   git remote add origin git@github.com:<ditt-användarnamn>/small-steps.git
   git push -u origin main
   ```

3. På GitHub: **Settings → Pages → Source: Deploy from a branch**,
   välj `main` och `/ (root)`, spara.
4. Efter någon minut ligger appen på
   `https://<ditt-användarnamn>.github.io/small-steps/`.

Alla sökvägar i koden är relativa, så appen fungerar direkt under
projekt-sökvägen utan ändringar.
