# Sukhmal Dry Fruits

Premium dry fruits, nuts, and gift hampers storefront.

```
.
├── frontend/     website (React)
├── backend/      API (FastAPI + MongoDB) — optional for a static launch
├── data/         price list & product spreadsheet
├── docs/         PRD, sitemap, user flows
└── scripts/      catalog / image import helpers
```

## Deploy the website (frontend)

The shop works as a static site. Product photos and copy are already in `frontend/`.

1. In Netlify or Vercel, set the site root / base directory to `frontend`
2. Build command: `npm run build`
3. Publish directory: `build`

Local production check:

```bash
cd frontend
npm install
npm run build
```

SPA routes (`/product/...`, `/category/...`) are covered by `frontend/public/_redirects` (Netlify) and `frontend/vercel.json` (Vercel).

## Optional: API

Cart, auth, and payments need the backend and a MongoDB database.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set MONGO_URL and DB_NAME
uvicorn server:app --reload --port 8000
```

Then in `frontend/.env`:

```
REACT_APP_BACKEND_URL=http://localhost:8000
```

If that variable is empty, the website uses the built-in catalog and still runs.
