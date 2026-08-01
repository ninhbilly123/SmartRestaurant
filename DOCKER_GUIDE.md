# Docker Guide

## Start

Open Docker Desktop first, then run:

```powershell
cd C:\Users\HP\Downloads\SE_Project\SmartRestaurant
docker compose up --build
```

## URLs

- Backend API: http://localhost:5000
- Admin frontend: http://localhost:3001/#/login
- Customer frontend: http://localhost:5173

Default admin account:

```text
username: admin
password: 123456
```

## Stop

```powershell
docker compose down
```

To reset database data and reinstall container dependencies from scratch:

```powershell
docker compose down -v
docker compose up --build
```

## Notes

- Backend local `.env` uses `DB_HOST=localhost`.
- Docker Compose overrides backend `DB_HOST` to `postgres`.
- Keep `NODE_ENV=development` for local Docker. If you set `NODE_ENV=production` and `DATABASE_URL`, the backend will connect to the remote database instead.
- Frontend `VITE_API_BASE_URL` must be `http://localhost:5000`, without `/api`, because the frontend code appends `/api` itself.
- The current backend email config reads `SENDGRID_API_KEY` and `SENDGRID_FROM`; the old `EMAIL_*` Gmail variables are not used unless you change `backend/src/config/email.js`.
- Cloudinary and MoMo features need real keys in `backend/.env`.
