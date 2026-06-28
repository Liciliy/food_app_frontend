# Email Configuration Proposal

This document is a backend-to-frontend handoff for enabling production email delivery in the Food App backend.

## Current Infrastructure Reality

Cloudflare Email Sending was checked in the dashboard on 2026-06-28.

- Email Sending is not available on the current account plan.
- The dashboard currently shows `Purchase Workers Paid` before outbound sending can be enabled.
- Cloudflare Email Routing can still be used for inbound forwarding, but that does not solve public transactional outbound email on the free plan.

## Current Backend Status

The backend already creates email events for the main authentication flows:

- Registration verification through `dj-rest-auth` and `django-allauth`.
- Password reset through `dj-rest-auth`.
- Email MFA codes through `django-trench`.

Email verification is mandatory. The backend uses `FRONTEND_URL` to generate verification links that point to the frontend route:

```text
{FRONTEND_URL}/verify-email/{key}
```

Production email delivery was not previously configured correctly. The deployed backend used Django SMTP with the default Gmail host, empty SMTP credentials, and placeholder sender address `noreply@foodapp.com`.

## Recommended Path Right Now

Use Resend SMTP.

This is the best current path because:

- The backend already uses standard SMTP, so no backend architecture change is required.
- The frontend does not care which SMTP provider sends the message.
- The current Cloudflare account cannot send outbound email without a paid Workers plan.
- Resend supports SMTP relay with a simple API-key-based password.
- The free plan is usually enough for a small beta if daily traffic stays within the plan limits.

The chosen setup is:

1. Keep Cloudflare DNS for the domain.
2. Use a dedicated Resend sending subdomain.
3. Add the exact SPF and DKIM records provided by Resend in Cloudflare DNS.
4. Generate a Resend API key and use it as the SMTP password in the backend.
5. Revisit Cloudflare Email Service later only if keeping everything inside Cloudflare becomes more important than avoiding the monthly plan cost.

## Chosen Provider

Resend is the selected outbound email provider for this project.

Use a sender address on the verified Resend subdomain, for example:

```text
noreply@<your-resend-subdomain>
```

Examples if the subdomain is `mail.meal-hunter.uk`:

```text
noreply@mail.meal-hunter.uk
support@mail.meal-hunter.uk
```

## Cloudflare Paid Option

Cloudflare Email Service SMTP is still a valid option, but only after upgrading to Workers Paid.

Why it is still attractive:

- The domain and frontend are already on Cloudflare.
- Django can keep using normal SMTP settings.
- The sending domain can stay aligned with the existing zone.

Cloudflare pricing at the time of review:

- Email Routing is available on Workers Free and Workers Paid.
- Sending to arbitrary recipients requires Workers Paid.
- Workers Paid includes 3,000 outbound emails per month.
- Additional outbound email is $0.35 per 1,000 emails.
- Sending to verified destination addresses is free but is not enough for public user registration.

## Backend Environment Variables

Set these values in `.env.remote_config`, then deploy so they are copied to `/opt/food_app/.env` on the VM:

```dotenv
FROM_EMAIL=noreply@<your-resend-subdomain>
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=<resend-api-key>
```

Alternative STARTTLS configuration if the backend prefers explicit TLS upgrade:

```dotenv
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=<resend-api-key>
```

Cloudflare-specific example, only if Workers Paid is enabled:

```dotenv
FROM_EMAIL=noreply@meal-hunter.uk
EMAIL_HOST=smtp.mx.cloudflare.net
EMAIL_PORT=465
EMAIL_USE_TLS=False
EMAIL_USE_SSL=True
EMAIL_HOST_USER=api_token
EMAIL_HOST_PASSWORD=<cloudflare-email-sending-api-token>
```

Also keep the existing frontend URL and CORS settings:

```dotenv
FRONTEND_URL=https://meal-hunter.uk
CORS_ALLOWED_ORIGINS=https://meal-hunter.uk,https://www.meal-hunter.uk,http://localhost:5173,http://127.0.0.1:5173
```

Do not commit the real `EMAIL_HOST_PASSWORD` value.

## Immediate Next Steps

1. In Resend, confirm the chosen sending subdomain shows as `verified`.
2. In Resend, create an API key for SMTP sending.
3. Put the Resend SMTP values into the backend production environment.
4. Set `FROM_EMAIL` to a mailbox on the verified subdomain.
5. Deploy the backend so the new SMTP settings reach production.
6. Run a real registration flow and verify that the email arrives and the frontend verification link works.
7. Test resend-verification from the login flow.

If Resend still shows the domain as pending, wait for DNS propagation and recheck the SPF and DKIM records in Cloudflare.

## Provider Selection Notes

### Best Free-First Choices

#### Brevo

- Best fit if the goal is public production email on a zero budget.
- Free tier is easy to start and does not require changing the Django email flow.
- Good default choice for registration verification, password reset, and MFA emails.
- Main tradeoff: this moves outbound email outside Cloudflare.

#### Resend

- Selected provider for this project.
- Strong option for a small beta because the free plan includes 3,000 emails per month.
- The free plan is limited to 100 emails per day, so it is best for low daily auth traffic.
- Supports SMTP relay, so the backend can keep the same settings shape.
- Good choice if monthly volume matters more than peak daily bursts.

#### SMTP2GO

- Strong fallback if the team wants a plain SMTP-first product.
- Free tier is 1,000 emails per month and 200 emails per day.
- Good operational fit for Django because SMTP relay is the main integration path.

#### MailerSend

- Usable, but less attractive as a first choice for this app.
- Free tier is only 500 emails per month.
- Their pricing page says the free plan still requires account approval and billing details.
- Better as a backup option than the primary recommendation.

### Approaches That Are Only Good For Testing

#### Cloudflare verified-recipient sending

- Free plan sending to verified destination addresses is useful for internal QA.
- It is not enough for public user registration, because end users will not be pre-verified in the Cloudflare account.

#### Personal mailbox SMTP

- Gmail, Outlook, or similar personal mailbox SMTP is not a good production path for app auth flows.
- It usually creates deliverability, throttling, policy, and account-risk problems.

#### Self-hosted mail server

- This is only "free" in license cost, not in operational cost.
- Deliverability work, bounce handling, abuse prevention, DKIM/SPF/DMARC tuning, and reputation management are all on the team.
- Not recommended for this app.

## Cloudflare Setup Steps

Only follow this section if the account is upgraded to Workers Paid.

1. In Cloudflare, open **Compute** > **Email Service** > **Email Sending**.
2. Onboard the sending domain, for example `meal-hunter.uk`.
3. Let Cloudflare add the required DNS records for SPF, DKIM, DMARC, and bounce handling.
4. Create an API token with Email Sending permission.
5. Store that token as `EMAIL_HOST_PASSWORD` in the backend production environment.
6. Use a sender address on the onboarded domain, for example `noreply@meal-hunter.uk`.
7. Deploy the backend with `make deploy` or the existing deployment workflow.

DNS propagation is usually quick on Cloudflare, but allow up to 24 hours before treating deliverability as broken.

## Frontend Status

The frontend already covers part of the auth-email flow and still has a few gaps.

### Registration

Call:

```text
POST /api/auth/registration/
```

After a successful registration response, show a state telling the user to check their email before logging in.

Current status: implemented.

### Email Verification Link

The email link points to:

```text
https://meal-hunter.uk/verify-email/{key}
```

The frontend route should extract `{key}` and submit it to the backend verification endpoint:

```text
POST /api/auth/registration/verify-email/
```

Expected body:

```json
{
  "key": "<key-from-url>"
}
```

After success, send the user to login or show a verified-account state.

Current status: implemented.

### Resend Verification Email

Support a resend action when a user did not receive the email:

```text
POST /api/auth/registration/resend-email/
```

The frontend should avoid aggressive retries. A simple manual button with a short cooldown is enough.

Current status: implemented, but adding a visible cooldown would still be a good cleanup.

### Password Reset

Password reset emails should use the same SMTP configuration. The frontend should keep its existing password reset flow aligned with the backend `dj-rest-auth` endpoints under:

```text
/api/auth/password/reset/
/api/auth/password/reset/confirm/
```

Current status: not implemented yet in the frontend.

### Email MFA

Email MFA codes are sent by `django-trench`. The frontend should treat these as short-lived codes and use the backend MFA endpoints under:

```text
/api/auth/mfa/
```

Check Swagger/ReDoc for exact trench-generated request shapes before building screens around them.

Current status: not implemented yet in the frontend.

## Production Validation Checklist

Backend checks:

- `python manage.py check` passes with `DEBUG=False`.
- The VM can connect to the selected SMTP host and port.
- Production `.env` contains the selected provider SMTP variables.
- `DEFAULT_FROM_EMAIL` resolves to `noreply@meal-hunter.uk`.
- SPF, DKIM, and DMARC are valid for the chosen sender domain.
- A test registration sends an email to a real inbox.
- The verification link opens the frontend route and verifies through the backend.

Frontend checks:

- Registration success does not imply immediate usable login when email verification is mandatory.
- `/verify-email/{key}` exists and handles success, expired key, and invalid key states.
- Resend email is available from the relevant screen.
- Password reset and MFA screens show user-friendly waiting and retry states.

## Recommended Decision

Use Resend.

This is the right fit for the current project state because the domain is already being onboarded there and the frontend does not need any vendor-specific changes.

Use SMTP2GO if the team wants a straightforward SMTP-only operational model.

Upgrade to Cloudflare Workers Paid later only if consolidating email into Cloudflare is worth the monthly plan cost.

AWS SES remains a good low-cost long-term option, but it is not the fastest zero-budget setup because onboarding and sandbox restrictions are more involved.

## Notes

Cloudflare Email Routing is useful for receiving or forwarding mail, but it is not a replacement for arbitrary outbound registration emails on the free plan.

Switching from one SMTP provider to another should not require frontend code changes, because the frontend only depends on backend auth endpoints, not on the email vendor.

The backend should not send marketing or bulk email through this path. Keep it for transactional messages: registration confirmation, password reset, MFA, and system notifications.
