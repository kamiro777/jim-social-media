# JIM Social Media App — Deployment

## Schritt 1: Supabase-Datenbank einrichten

1. Geh zu: https://rpbheglnhnpytxiunyij.supabase.co
2. Klick links auf "SQL Editor"
3. Klick auf "New query"
4. Kopiere den gesamten Inhalt aus `src/lib/schema.sql` und füge ihn ein
5. Klick "Run" — die Tabellen werden erstellt

## Schritt 2: App auf Vercel deployen

### Option A — Über GitHub (empfohlen):
1. Erstelle ein neues GitHub Repository (z.B. "jim-social-media")
2. Lade diesen Ordner hoch (oder nutze `git push`)
3. Geh zu vercel.com → "Add New Project"
4. Wähle dein GitHub Repository
5. Klick "Deploy" — fertig!

### Option B — Direkt über Vercel CLI:
1. Installiere: `npm install -g vercel`
2. Im Projektordner: `vercel`
3. Folge den Anweisungen

## Nach dem Deployment:
- Die App ist erreichbar unter: `https://jim-social-media.vercel.app` (oder ähnlich)
- Teile den Link mit deinem Team
- Keine Logins nötig — alle können sofort loslegen

## Datenbank-Seeding (optional):
Trage die Podcast-Episoden aus Notion manuell über die App ein,
oder kopiere das SQL aus schema.sql und ergänze INSERT-Statements.
