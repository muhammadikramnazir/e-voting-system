# E-Voting Project Audit

## Current architecture

- Member frontend: `e-voting-frontend`
- Admin panel: `admin-panel`
- API: `e_voting_backend`
- MySQL: Aiven Cloud
- Email: Gmail SMTP with Gmail App Password

## Functional areas found in the project

- Member registration/login
- Registration email OTP verification
- Forgot-password email OTP flow
- Member profile and profile photo
- Lawyer verification and document upload
- Elections
- Positions
- Candidates
- Voting and duplicate-vote protection in the database
- Results
- Notices
- Support requests
- Admin login
- Optional admin 2FA OTP
- Admin password reset
- Admin dashboard/profile/settings
- Maintenance mode
- Automatic election status synchronization
- Optional automatic results publishing

## Changes applied in this audit pass

1. Rebuilt the member API helper so existing frontend calls remain compatible instead of requiring page-by-page rewrites.
2. Restored all required named API exports, including `getElectionCandidates` and `createSupportRequest`.
3. Made `loginUser`, `updateProfile`, `updatePassword`, `getElectionById`, `castVote`, and support APIs compatible with the argument patterns already used by the current pages.
4. Added environment-based API URLs for member frontend and admin panel, with localhost only as a development fallback.
5. Removed production dependence on hardcoded `localhost` API/upload URLs.
6. Added frontend/admin `.env.example` files.
7. Added backend `/health` endpoint for deployment health checks.
8. Added `registration_verifications` to the main database schema so a fresh database includes the registration OTP flow.
9. Removed the MySQL-shell-incompatible `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` lines from the fresh-install schema because those columns are already declared in the table definitions.
10. Added deployment metadata for a Node backend and Vite SPA deployments.
11. Made login show the success message after registration OTP verification.
12. Unified login/register submit-button sizing and disabled states.
13. Preserved the existing member visual identity and the blue administrator theme rather than replacing the established design.
14. Kept the existing mobile/tablet layouts and added deployment-safe configuration without changing the application's core visual language.

## Important deployment item: uploaded files

The current backend stores profile photos and lawyer verification documents on local disk under `e_voting_backend/uploads`.

This works locally and for a simple demo, but many cloud web services use ephemeral filesystems. A persistent object-storage service should be added before relying on uploaded documents after a restart/redeploy.

## Credentials

Do not commit `.env` files. The final source package intentionally excludes `.env` and local uploaded files.

Backend email variables are:

- `EMAIL_USER`
- `EMAIL_PASS`

`EMAIL_PASS` must be a Gmail App Password.

The administrator account is controlled by:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

If admin 2FA is enabled, `ADMIN_EMAIL` must be a real mailbox the administrator can access.
