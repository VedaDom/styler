# Salon Management App — Product + Technical Plan

## 1) Goals and Scope

- Vision: A modern salon OS that captures business details, manages employees and assets, and supports both internal “working” bookings and customer-facing online bookings with pay-now or pay-later.
- Outcomes:
  - Google login and streamlined onboarding to set up the salon business.
  - Accurate availability derived from staff schedules and resource constraints.
  - Customer portal for self-serve bookings and payments.
  - Manager dashboard for operations, scheduling, and analytics.

## 2) Roles and Permissions

- Owner: Full control. Billing, global settings, locations, user management, reports.
- Manager: Staff, schedule, services, assets, bookings, selected settings.
- Receptionist: Create/modify internal bookings, check-in/out, take payments.
- Staff: View personal schedule, manage availability/time-off, mark services done.
- Customer: Book online, manage appointments, pay now or later, view history.

## 3) Core Modules and Features

### Authentication and Onboarding

- Google Login (OAuth2).
- Owner onboarding wizard: salon profile, time zone, business hours, holidays, policies (cancellation, deposits), tax/currency, branding, payments setup.
- Invite employees by email and assign roles.

### Salon Business Setup

- Business profile: name, description, logo, contact details, address(es).
- Time zone and business hours (global and per location).
- Policies: cancellation window, deposits, reschedule rules.
- Taxes and currency; service categories.

### Employees (Staff Management)

- Invitations via email; accept to create account or link Google.
- RBAC roles and permissions.
- Staff profile: skills/services, default durations, max daily bookings, buffer times.
- Working hours, availability overrides, time off.
- Commission rates and compensation notes (Phase 2).

### Services and Pricing

- Service catalog with categories; duration, price (fixed or staff-specific), buffer, required resources.
- Staff-specific overrides (price/duration).
- Add-ons/upsells (Phase 2), packages/memberships (Phase 3).

### Assets/Resources

- Define resources: rooms, chairs, stations, equipment with capacity and status.
- Map services to required resources and quantities.
- Resource calendars and maintenance/blackout blocks.

### Scheduling and Calendar

- Views: day/week timeline by staff or by resource.
- Overlays: working hours, breaks, time-off, resource maintenance.
- Drag-and-drop reassignment; conflict detection and resolution.
- Admin time blocks.

### Internal “Working” Bookings

- Create/edit/cancel walk-in/phone bookings.
- Assign service(s), staff, resource(s), customer, notes.
- Payments: pay now (card/terminal) or pay later; optional deposits.
- Status lifecycle: pending, confirmed, checked-in, completed, no-show, canceled.
- Check-in/out flow; tip capture (Phase 2).

### Online Booking Portal (Customer-Facing)

- Public pages: salon info, services, staff bios (optional), available slots.
- Booking flow: choose service(s) → choose staff (optional) → pick time → customer details/login/guest → pay now or later → confirmation + email/SMS.
- Customer dashboard: upcoming/past, cancel/reschedule within policy, receipts.

### Payments and Invoicing

- Pay now: Stripe (Payment Element/Checkout) with Apple Pay/Google Pay.
- Pay later: record cash or terminal payment; manual capture/mark-paid.
- Deposits (fixed/%); refund logic per policy.
- Itemized invoice: services, add-ons, tax, discounts, deposits, balance.
- Refunds and partial refunds.

### Notifications and Reminders

- Email (Resend) and SMS (Twilio).
- Triggers: booking created/updated/canceled, reminders (24h/3h), payment receipts, staff daily agenda.
- Brandable templates per salon/location.

### Reporting and Analytics

- KPIs: total bookings, revenue, utilization, no-show rate, channel mix (internal vs online), top services, staff performance.
- CSV export.

### Settings

- Business, locations, hours, taxes, policies, payment configuration.
- Roles/permissions, notification templates, branding, domain.

## 4) Key User Journeys

### Owner Onboarding

- Google login → create salon → profile/hours/policies → enable payments → invite staff → add services → set resources → go live.

### Receptionist Internal Booking

- New booking → select service(s) → staff/slot suggestions → customer lookup/create → pay now or later → confirmation → calendar updates.

### Customer Online Booking

- Browse services → optional staff selection → slot list (respects staff + resources + hours + buffers) → login/guest → pay now/later → confirmation + reminders → manage booking later.

### Cancel/Reschedule

- Enforce policy windows; compute deposit refunds; free up slots and resources.

## 5) Availability and Slot Generation

- Inputs: service duration + buffer, staff working hours/time-off, resource capacity, existing bookings, prep/cleanup buffer, lead-time rules.
- Algorithm:
  1. Build free intervals per staff from working hours minus time-off and existing bookings.
  2. Intersect with resource capacity for required resources.
  3. Apply service buffers and salon policies.
  4. Return slots in salon’s timezone for the requested date range (e.g., 14 days).
- Edge cases: multi-service chains, linked services requiring same staff/resource, DST changes, overlapping resource requirements.

## 6) High-Level Data Model

- User(id, name, email, role, auth_provider, google_id?, phone)
- Salon(id, owner_id, name, description, logo_url, timezone, currency, tax_rate, policy_cancel_window, deposit_rules)
- Location(id, salon_id, name, address, phone, hours_json, holidays)
- Staff(id, salon_id, user_id?, role, bio, avatar_url, commission_rate?, active)
- StaffAvailability(id, staff_id, ruleset_json), StaffTimeOff(id, staff_id, start, end, reason)
- Service(id, salon_id, name, category, duration_min, price_cents, buffer_min, description, active)
- ServiceStaff(id, service_id, staff_id, price_cents_override?, duration_override_min?)
- Resource(id, salon_id, type, name, capacity, active)
- ServiceResource(id, service_id, resource_id, quantity_required)
- Customer(id, salon_id, user_id?, name, email, phone, notes)
- Booking(id, salon_id, location_id, customer_id, status, channel[internal|online], starts_at, ends_at, staff_id, total_cents, deposit_cents, balance_cents, notes)
- BookingItem(id, booking_id, service_id, staff_id, price_cents, duration_min)
- BookingResource(id, booking_id, resource_id)
- Payment(id, booking_id, provider[stripe|cash|terminal], amount_cents, status, intent_id, charge_id, refunded_cents)
- Invoice(id, booking_id, subtotal_cents, tax_cents, discount_cents, total_cents, currency)
- NotificationLog(id, type[email|sms], template, to, booking_id?, status, error?)
- AuditLog(id, salon_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)

## 7) Technical Architecture

- Frontend: Next.js (App Router) in `app/`; Tailwind + Headless UI/shadcn for UI.
- Backend:
  - Next.js server actions + API routes (Stripe webhooks).
  - ORM: Prisma.
  - DB: PostgreSQL (Neon or Supabase).
  - Auth: NextAuth with Google provider; RBAC guards/middleware.
  - Payments: Stripe Payment Element/Checkout; webhooks for success/failure/refund.
  - Email: Resend. SMS: Twilio.
  - Storage: S3-compatible (R2/Supabase Storage) for logos/avatars.
- Deployment: Vercel (web), DB on Neon/Supabase, env secrets via Vercel.
- Observability: pino logs, Sentry errors, Vercel Analytics.

## 8) Non-Functional and Compliance

- Security: OAuth best practices, HTTPS-only, least-privilege roles, audit logs, secure secret management.
- Privacy: PII minimization, encryption at rest where appropriate, data retention policy.
- Performance: <300ms slot generation for 14-day window; pagination; caching.
- Availability: 99.9% target; idempotent, retryable webhooks.
- Accessibility: WCAG AA for customer portal.
- Internationalization: currency and timezone handling; i18n-ready strings.
- Backups/Migrations: automated DB backups; Prisma migrations.

## 9) Milestones with Acceptance Criteria

- M0: Project setup
  - Linting/formatting, CI, environments, error tracking.
  - AC: Clean build and deploy pipeline.
- M1: Auth + Owner Onboarding
  - NextAuth (Google), create salon wizard.
  - AC: Owner logs in with Google and completes setup.
- M2: Services + Staff + Hours
  - CRUD services; invite staff; working hours + time off.
  - AC: Calendar renders correct availability without bookings.
- M3: Resources
  - CRUD resources; map to services; resource calendar.
  - AC: Resource constraints affect slot generation.
- M4: Internal Bookings
  - Receptionist flow; conflict detection; statuses.
  - AC: Bookings persist and update staff/resource calendars.
- M5: Online Booking Portal
  - Full public booking flow with slots and confirmation.
  - AC: Customer can book (guest or logged-in) and receives confirmation.
- M6: Payments
  - Stripe pay-now; pay-later; deposits; refunds; invoices.
  - AC: Payment events reconcile booking/invoice states.
- M7: Notifications
  - Email/SMS confirmations and reminders; logs.
  - AC: Tracked and delivered for key events.
- M8: Reporting + Polish
  - KPI dashboard; CSV export; A11y/perf improvements.
  - AC: KPIs visible; lighthouse score >90 on portal.

## 10) Risks and Mitigations

- Availability complexity: Start with single-service bookings; add multi-service chains later; strong unit/integration tests.
- Payment edge cases: Rely on Stripe webhooks and idempotency keys; sandbox tests.
- Time zones/DST: Store UTC; convert per salon/customer timezone; use robust libraries.
- SMS deliverability: Fallback to email; verify sender IDs/alphanumeric senders where supported.

## 11) Metrics

- Bookings (internal vs online), conversion rate, no-show rate.
- Revenue, average order value, deposits collected/refunded.
- Staff utilization and rebooking rate.
- Portal funnel drop-offs.

## 12) Open Questions

- Multi-location in v1 or v2?
- Default deposits per service or global?
- Google Calendar sync (one-way or bi-directional) in v1?
- Tip handling and terminal integration timing?

---

# Project Checklist

## Milestones

- ### Recently Completed
  - README: project-specific content added to `README.md`.
  - Mobile dashboard layout optimized to avoid vertical scrolling on small screens.
  - Navigation chevrons added to menu buttons in `app/page.tsx`.
  - Secrets cleanup: removed committed Firebase Admin JSON from history and pushed clean branch.
  - `.gitignore`: added `styler-1d75b-firebase-adminsdk.json`.
  - CI: GitHub Actions workflow added to lint, typecheck, and build.
  - Code style: Prettier configured and `npm run format` script added.
  - Env: `.env.example` created with required variables.
  - Logging: pino logger singleton in `lib/logger.ts`.
- [ ] M0: Project Setup
  - [x] TypeScript configured
  - [x] ESLint configured
  - [x] Prettier configured
  - [x] CI pipeline (GitHub Actions)
  - [x] Sentry integration
  - [x] pino logging
  - [x] .env example committed; Vercel envs pending
  - [x] Prisma + PostgreSQL; baseline migration
- [ ] M1: Auth + Onboarding
  - [x] NextAuth with Google provider
  - [ ] Role model (Owner/Manager/Receptionist/Staff/Customer)
  - [ ] Onboarding wizard: profile, timezone, hours, policies, tax
  - [ ] Invite staff via email

### Next Priorities

- Implement onboarding wizard MVP (profile, timezone, hours)
- Define role model (Owner/Manager/Receptionist/Staff/Customer) and seed roles
- Services CRUD (category, duration, price, buffer)
- Staff CRUD + working hours; calendar base rendering (no bookings)
- RBAC guards on server actions and protected routes
- [ ] M2: Services + Staff + Hours
  - [ ] Services CRUD (category, duration, price, buffer)
  - [ ] Staff CRUD, skills mapping, working hours
  - [ ] Time-off and availability overrides
  - [ ] Calendar shows availability (no bookings)
- [ ] M3: Resources
  - [ ] Resource types, capacity, status
  - [ ] Service-resource mapping
  - [ ] Resource maintenance/blackouts
- [ ] M4: Internal Bookings
  - [ ] Receptionist flow with conflict detection
  - [ ] Status lifecycle (pending/confirmed/checked-in/completed/no-show/canceled)
  - [ ] Deposits and pay-later option
  - [ ] Check-in/out flow
- [ ] M5: Online Booking Portal
  - [ ] Public pages (info, services, staff bios)
  - [ ] Slot listing respecting staff + resources + buffers
  - [ ] Guest and logged-in booking
  - [ ] Confirmation page + email/SMS
- [ ] M6: Payments
  - [ ] Stripe pay-now (Payment Element/Checkout)
  - [ ] Record pay-later and mark as paid in-salon
  - [ ] Deposits (fixed/%) with refund rules
  - [ ] Invoices and receipts
- [ ] M7: Notifications
  - [ ] Email/SMS templates
  - [ ] Triggers (create/update/cancel/reminders)
  - [ ] Delivery logs + failure handling
- [ ] M8: Reporting + Polish
  - [ ] KPI dashboard + CSV export
  - [ ] Accessibility AA, performance optimization, QA

## Cross-cutting

- [ ] RBAC guards on server actions and routes
- [ ] Audit logging for critical actions
- [ ] Backup strategy and restore test
- [ ] Seed scripts for demo data
- [ ] Error boundaries and toast notifications

---
