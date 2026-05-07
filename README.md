# Cuchillo en Boca 🔪

App multideporte personal con integración Garmin.

---

## 🚀 Puesta en marcha (sigue estos pasos en orden)

### 1. Clona el repo y entra en él
```bash
git clone https://github.com/TU_USUARIO/cuchillo-en-boca.git
cd cuchillo-en-boca
npm install
```

### 2. Crea tu base de datos en Supabase
1. Ve a [supabase.com](https://supabase.com) → "New Project"
2. Dale un nombre (ej: `cuchillo-en-boca`) y elige la región más cercana
3. En el panel lateral → **SQL Editor** → pega y ejecuta el contenido de `supabase/migrations/001_init.sql`
4. Ve a **Project Settings → API** y copia la URL y la `anon key`

### 3. Configura las variables de entorno
```bash
cp .env.local.example .env.local
```
Abre `.env.local` y rellena:
- `NEXT_PUBLIC_SUPABASE_URL` → URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key de Supabase
- `GARMIN_EMAIL` → tu email de Garmin Connect
- `GARMIN_PASSWORD` → tu contraseña de Garmin Connect

### 4. Arranca en local
```bash
npm run dev
```
Abre http://localhost:3000

### 5. Despliega en Vercel
1. Sube el proyecto a GitHub: `git add . && git commit -m "init" && git push`
2. Ve a [vercel.com](https://vercel.com) → "New Project" → importa tu repo
3. En la configuración del proyecto, añade las mismas variables de entorno que tienes en `.env.local`
4. Deploy → en 2 minutos tienes la URL pública

---

## ⌚ Cómo funciona la sincronización con Garmin

Llama a `/api/garmin/sync` para importar:
- Horas de sueño del día
- HRV y Body Battery
- Últimas 5 actividades (running, gym, pádel, tenis…)

Puedes llamarlo manualmente desde el botón "Sync Garmin" en la app,
o automatizarlo con un cron job en Vercel (cada mañana a las 8h).

### Configurar sync automático en Vercel
Añade esto en `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/garmin/sync",
    "schedule": "0 8 * * *"
  }]
}
```

---

## 🛠️ Cómo añadir nuevas funcionalidades

1. Dile a Claude en el chat qué quieres añadir
2. Copia el código que te dé en los archivos correspondientes
3. `git add . && git commit -m "feat: lo que sea" && git push`
4. Vercel despliega automáticamente en ~2 min

---

## 📁 Estructura del proyecto

```
cuchillo-en-boca/
├── app/
│   ├── api/
│   │   ├── garmin/
│   │   │   ├── sync/route.ts     ← sincroniza con Garmin Connect
│   │   │   └── latest/route.ts   ← devuelve último sync
│   │   └── sessions/route.ts     ← CRUD de sesiones
│   ├── lib/
│   │   └── supabase.ts           ← cliente + tipos
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  ← dashboard principal
├── supabase/
│   └── migrations/
│       └── 001_init.sql          ← schema completo
├── .env.local.example
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```
