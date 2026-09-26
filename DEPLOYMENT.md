# E-Voting System Deployment Notes

## Applications

- `e_voting_backend` — Node.js / Express API
- `e-voting-frontend` — React/Vite member portal
- `admin-panel` — React/Vite administrator portal
- MySQL — Aiven Cloud

## Environment variables

### Backend
Copy `.env.example` to `.env` and configure:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CORS_ORIGINS`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DEFAULT_BAR_ASSOCIATION`

`EMAIL_PASS` must be a Gmail App Password, not the normal Gmail password.

### Frontend
Set `VITE_API_BASE_URL` to the deployed backend API base, for example:

`https://YOUR-BACKEND-DOMAIN/api/v1`

### Admin panel
Set the same `VITE_API_BASE_URL`.

## Database

Use `database/evoting.sql` for a fresh MySQL database. It includes the registration OTP table used by the email-verification registration flow.

## Upload storage note

The current application stores profile and verification files under `e_voting_backend/uploads`. This works locally and for a simple university demo, but a free cloud web service may use an ephemeral filesystem. For a persistent production deployment, move uploads to object/cloud storage before relying on uploaded documents after restarts or redeployments.

## Health check

The backend exposes `/health` for deployment health checks.
