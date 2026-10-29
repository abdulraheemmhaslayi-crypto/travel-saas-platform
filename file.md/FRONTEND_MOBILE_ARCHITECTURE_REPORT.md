# Travel SaaS Platform: Frontend and Mobile App Generation Report

## 1. Purpose
This report is a complete handoff for generating the frontend (Next.js) and mobile application (Flutter) code from the existing backend implementation in `backend/src`. It is based only on real backend code and APIs found in the repository. No routes, DTOs, or contracts have been invented.

## 2. Backend Source and Scope
The report is grounded in the following backend source areas:
- `backend/src/auth/*`
- `backend/src/bookings/*`
- `backend/src/trips/*`
- `backend/src/payments/*`
- `backend/src/users/*`
- `backend/src/notifications/*`
- `backend/src/search/*`
- `backend/src/tracking/*`
- `backend/src/fleet/*`
- `backend/src/admin/*`
- `backend/src/websocket/*`
- `backend/src/redis/*`
- `backend/src/database/entities/*`

## 3. Backend Architecture Overview

### 3.1 Core backend modules
- `AuthModule`: global auth provider, JWT access and refresh tokens, password reset, OTP, social login.
- `BookingsModule`: passenger booking lifecycle, create, list, cancel, update status, admin listing.
- `TripsModule`: trip search/public listing, create/edit by drivers/admin, assign driver, status updates, delete.
- `PaymentsModule`: Stripe and Razorpay integration, payment intent/order creation, webhook processing, wallet top-up.
- `UsersModule`: user profile, KYC submission, admin user management, suspend/delete, preferences.
- `NotificationsModule`: CRUD notifications, SSE streaming, unread count, preferences, Redis pub/sub, Kafka publish.
- `SearchModule`: route/trip search, autocomplete, filters, cached popular routes.
- `TrackingModule`: location updates, live trip location, nearby vehicle search, playback.
- `FleetModule`: fleet company/vehicle management, owner authorization, fleet analytics.
- `AdminModule`: platform admin reporting, approval panels, revenue/booking metrics, audit logs.
- `WebsocketModule`: real-time tracking gateway and event broadcast.

### 3.2 Infrastructure and services
- PostgreSQL via TypeORM entities.
- Redis for token blacklist, password reset tokens, SSE pub/sub, unread notification caching, live location state.
- Kafka for cross-service notification events.
- Stripe for payment intents and webhooks.
- Razorpay for order creation, signature verification, and webhooks.
- Environment-configured secrets via `ConfigService`.

## 4. Auth and Session Contract

### 4.1 Authentication flow
The backend uses JWT access/refresh tokens.
- Access token: `jwt.secret`, default expiry `24h`.
- Refresh token: `jwt.refreshSecret`, default expiry `7d`.
- Logout blacklists access token in Redis.
- `JwtAuthGuard` verifies `Authorization: Bearer <token>` and checks blacklist.
- `JwtStrategy` attaches `request.user` with user claims.

### 4.2 Auth endpoints
|  Endpoint                    |  Method   | Auth| Description                                                          |
|------------------------------|-----------|-----|----------------------------------------------------------------------|
| `POST /auth/register`        | public    | no  | Register new user and return `user`, `accessToken`, `refreshToken`.  | 
| `POST /auth/login`           | public    | no  | Login with `email` or `phone` and password.                          | 
| `POST /auth/request-otp`     | public    | no  |  Request OTP for phone-based login/verification.                     |
| `POST /auth/verify-otp`      | public    | no  | Verify OTP and login/create tokens.                                  |
| `POST /auth/resend-otp`      | public    | no  | Resend OTP.                                                          |
| `POST /auth/refresh-token`   | public    | no  | Exchange `refreshToken` for new tokens.                              |
| `POST /auth/forgot-password` | public    | no  | Send password reset email link.                                      |
| `POST /auth/reset-password`  | public    | no  | Reset password using reset token.                                    |
| `POST /auth/change-password` | protected | yes | Change password when logged in.                                      |
| `POST /auth/logout`          | protected | yes | Invalidate current access token.                                     |
| `POST /auth/social-login`    | public    | no  | Login/register with social provider payload.                         | 
| `GET /auth/profile`          | protected | yes | Get current authenticated user profile.                              |
|-----------------------------------------------------------------------------------------------------------------------|
### 4.3 Auth request/response shapes
From `backend/src/auth/dto/auth.dto.ts` and `auth.service.ts`:
- `RegisterDto`      : `email`, `phone`, `password`, `userType`, `firstName`, `lastName`.
- `LoginDto`         : `email?`, `phone?`, `password`, `ip?`.
- `VerifyOtpDto`     : `phone`, `otp`.
- `ResendOtpDto`     : `phone`.
- `RefreshTokenDto`  : `refreshToken`.
- `ForgotPasswordDto`: `email`.
- `ResetPasswordDto` : `token`, `newPassword`.
- `ChangePasswordDto`: `currentPassword`, `newPassword`.
- `SocialLoginDto`   : `provider`, `token`, `email`, `firstName`, `lastName`, `profileImage`.
- `Auth response`    : `user`, `accessToken`, `refreshToken`, `expiresIn`.

### 4.4 User payload returned on auth
`sanitizeUser()` in `auth.service.ts` returns a user object with safe profile fields, plus role/permissions from the database.

## 5. Payment Contract

### 5.1 Stripe path
- `POST /payments/stripe/create-payment-intent` -> create Stripe payment intent with amount and optional bookingId.
- Response: `{ clientSecret, paymentId }`.
- Webhook endpoint verifies `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)` and handles:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 5.2 Razorpay path
- `POST /payments/razorpay/create-order` -> create Razorpay order with amount and optional bookingId.
- Response: `{ orderId, amount, currency, keyId, paymentId }`.
- Payment verification uses HMAC SHA256 over `orderId|paymentId`.
- Webhook endpoint verifies signature on raw JSON body and handles:
  - `payment.captured`
  - `payment.failed`

### 5.3 Wallet and transaction flows
- User wallet top-up and transaction history are available through wallet endpoints.
- Payments are stored in `Payment` entity and updated on webhook success/failure.

## 6. Notification Contract

### 6.1 Endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /notifications` | protected | yes | List notifications with `page`, `limit`, `unreadOnly`, `type`.
| `GET /notifications/unread-count` | protected | yes | Get unread notification count and cache metadata.
| `GET /notifications/stream` | protected | yes | SSE stream for live notification events.
| `PATCH /notifications/mark-read` | protected | yes | Mark selected notification IDs as read or mark all.
| `PATCH /notifications/mark-all-read` | protected | yes | Mark all notifications as read.
| `DELETE /notifications/:id` | protected | yes | Delete a notification.
| `GET /notifications/preferences` | protected | yes | Get notification preferences.
| `PATCH /notifications/preferences` | protected | yes | Update notification preferences.

### 6.2 Event delivery
- `NotificationsService.createNotification()` saves notification and calls `sendToUser()`.
- `sendToUser()` sends SSE events to subscribed user subjects plus Redis pub/sub.
- Push notifications are stubbed but the backend logs push actions and can be extended to FCM/APNs.

### 6.3 SSE contract
- SSE endpoint uses a reactive `Observable<MessageEvent>` from `NotificationsService.subscribeToUserEvents(userId)`.
- Each emitted event has stringified `data` with title, body, type, data, timestamp.

### 6.4 Notification payload
- `NotificationResponseDto`: `id`, `title`, `body`, `type`, `data`, `isRead`, `readAt`, `createdAt`.
- `NotificationPreferencesDto` includes toggles such as `emailEnabled`, `pushEnabled`, `smsEnabled`, `bookingAlerts`, `paymentAlerts`, `tripUpdates`, `promotionalEmails`, `supportReplies`, `quietHoursStart`, `quietHoursEnd`.

## 7. Realtime Tracking Contract

### 7.1 WebSocket gateway
- Namespace: `/tracking`.
- Authenticated handshake: client must send JWT token in handshake auth header/query.
- Rooms:
  - `user:${userId}`
  - `trip:${tripId}`
  - `driver:${driverId}`
  - `admin:emergency`

### 7.2 Client events
| Event | Payload | Description |
|---|---|---|
| `joinTrip` | `{ tripId }` | Join a trip room for updates.
| `leaveTrip` | `{ tripId }` | Leave a trip room.
| `driverLocation` | `{ tripId, latitude, longitude, bearing, speed, timestamp }` | Driver sends live location updates.
| `passengerLocation` | `{ tripId, latitude, longitude, timestamp }` | Passenger share location/ETA.
| `subscribeToDriver` | `{ driverId }` | Subscribe to driver-specific updates.
| `emergencyAlert` | `{ tripId, userId, message, latitude?, longitude? }` | Send emergency alert.

### 7.3 Server emits
- `locationUpdate`: broadcast updated coordinates to passengers and drivers.
- `emergencyAlert`: emergency notifications to involved users and admin room.
- `tripUpdate`: status or assignment changes.
- `passengerNearby`: notifications of nearby passenger/driver.
- `driverOnline` / `driverOffline` or similar presence events may exist through Redis presence state.

### 7.4 Tracking queries
The backend also supports HTTP queries for location and nearby vehicles:
- `GET /tracking/live-location/:tripId`
- `GET /tracking/nearby-vehicles` with query params
- `GET /tracking/trip-location-history/:tripId`
- `GET /tracking/live-trip-location/:tripId`
- `GET /tracking/playback/:tripId`

## 8. Search Contract

### 8.1 Endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /trips/search` | public | no | Search trips by origin/destination/date/filters.
| `GET /search/trips` | public | no | Global trip search, likely includes filters and query.
| `GET /search/autocomplete` | public | no | Autocomplete for routes/locations.
| `GET /search/popular-routes` | public | no | Popular route suggestions.
| `GET /search/filters` | public | no | Available filter metadata.

### 8.2 Search behavior
- Search service uses TypeORM query builder and cached route data.
- Filters are based on vehicle, trip, and provider attributes.
- Autocomplete returns route/location suggestions.

## 9. User, Booking, Trip, Fleet, and Admin Contracts

### 9.1 User endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /users/profile` | protected | yes | Current user profile.
| `PATCH /users/profile` | protected | yes | Update profile fields.
| `POST /users/submit-kyc` | protected | yes | Submit KYC documents/data.
| `GET /users` | protected | role-based | Admin list users.
| `PATCH /users/:id/verify-kyc` | protected | admin | Approve/reject KYC.
| `PATCH /users/:id/suspend` | protected | admin | Suspend user.
| `DELETE /users/:id` | protected | admin | Delete user.

### 9.2 Booking endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /bookings` | protected | yes | Create a booking.
| `GET /bookings/mine` | protected | yes | Get current user bookings.
| `GET /bookings/:id` | protected | yes | Get booking details.
| `PATCH /bookings/:id/cancel` | protected | yes | Cancel booking.
| `PATCH /bookings/:id/status` | protected | role-based | Update booking status.
| `GET /bookings/admin` | protected | admin | Admin all bookings.

### 9.3 Trip endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /trips` | public | no | List/search trips.
| `POST /trips` | protected | driver/admin | Create trip.
| `PATCH /trips/:id` | protected | driver/admin | Update trip.
| `PATCH /trips/:id/status` | protected | driver/admin | Update trip status.
| `PATCH /trips/:id/assign-driver` | protected | admin | Assign driver.
| `DELETE /trips/:id` | protected | admin | Delete trip.
| `GET /trips/admin` | protected | admin | Admin trip list.

### 9.4 Fleet endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `POST /fleet` | protected | fleet owner/admin | Create fleet.
| `PATCH /fleet/:id` | protected | fleet owner/admin | Update fleet.
| `DELETE /fleet/:id` | protected | fleet owner/admin | Delete fleet.
| `POST /fleet/:id/vehicles` | protected | fleet owner/admin | Add vehicle to fleet.
| `GET /fleet` | protected | role-based | List fleets.
| `GET /fleet/:id/analytics` | protected | fleet owner/admin | Fleet analytics.

### 9.5 Admin endpoints
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /admin/metrics` | protected | admin | Platform KPIs and dashboard metrics.
| `GET /admin/pending-approvals` | protected | admin | Pending items list.
| `GET /admin/active-trips` | protected | admin | Active trips summary.
| `GET /admin/bookings` | protected | admin | Admin bookings list.
| `GET /admin/payments` | protected | admin | Admin payments list.
| `GET /admin/audit-logs` | protected | admin | Audit log history.
| `PATCH /admin/settings/commission` | protected | admin | Update commission or platform settings.

## 10. Frontend (Next.js) Architecture Guidance

### 10.1 Recommended structure
- `src/app/`: Next.js app router pages for public and authenticated views.
- `src/components/`: reusable UI components.
- `src/lib/api.ts`: typed API client with Axios or Fetch.
- `src/hooks/`: custom hooks for auth, notifications, realtime.
- `src/context/AuthContext.tsx`: manage auth state and refresh logic.
- `src/context/SocketContext.tsx`: manage WebSocket connection and events.
- `src/store/`: optional global state using Zustand or Context.
- `src/types/`: shared request/response types.

### 10.2 Auth flow in Next.js
- On login/register, store `accessToken` and `refreshToken` securely in HttpOnly cookie or secure storage.
- Add `Authorization: Bearer <accessToken>` to protected requests.
- Implement refresh token middleware to call `POST /auth/refresh-token` when access token expires.
- Logout calls `POST /auth/logout` and clears stored tokens.
- Profile page uses `GET /auth/profile`.

### 10.3 Notifications UI
- Fetch list via `GET /notifications`.
- Show unread count from `GET /notifications/unread-count`.
- Open SSE connection to `GET /notifications/stream` after login.
- Mark read via `PATCH /notifications/mark-read` or `PATCH /notifications/mark-all-read`.
- Preference page uses `GET /notifications/preferences` and `PATCH /notifications/preferences`.

### 10.4 Realtime UI
- Use WebSocket client to connect to `/tracking` namespace with auth token.
- Join trip rooms on trip detail page with `joinTrip`/`leaveTrip`.
- Listen for `locationUpdate`, `tripUpdate`, `emergencyAlert`.
- For drivers, send `driverLocation` updates periodically.
- For passengers, optionally send `passengerLocation` if sharing live location.

### 10.5 Search and booking flow
- Public search page calls `GET /trips/search` and/or `GET /search/trips`.
- Autocomplete uses `GET /search/autocomplete`.
- Popular routes widget from `GET /search/popular-routes`.
- Booking flow:
  1. search trips
  2. select trip
  3. call `POST /bookings`
  4. handle payment through Stripe or Razorpay endpoints
  5. show booking/confirmation state

### 10.6 Payment UI contracts
- Stripe create intent: request `amount`, optional `bookingId`.
- Razorpay create order: request `amount`, optional `bookingId`.
- Web app should securely present `clientSecret` / `orderId` and `keyId` to payment SDK.
- Handle payment success/failure via backend webhook and poll payment status if necessary.

### 10.7 Admin panel
- Build admin pages only for users with `role = ADMIN` or `SUPER_ADMIN`.
- Use `GET /admin/metrics`, `GET /admin/pending-approvals`, `GET /admin/active-trips`, `GET /admin/bookings`, `GET /admin/payments`, `GET /admin/audit-logs`.
- Provide user/admin management pages for `GET /users`, KYC approvals, suspend/delete.

### 10.8 Shared type generation
- Prefer generating client types from backend DTOs and entities.
- Important shared types:
  - `User`, `Role`, `Permission`
  - `AuthTokens`
  - `NotificationResponse`
  - `Trip`, `Booking`, `Payment`, `Fleet`, `LiveLocation`
  - `SearchFilters`, `RouteSuggestion`

### 10.9 Deployment notes
- Backend `frontendUrl` is required for password reset links.
- Store secrets in environment variables, not frontend code.

## 11. Mobile (Flutter) Architecture Guidance

### 11.1 Recommended structure
- `lib/main.dart`: app entry and route setup.
- `lib/services/api_service.dart`: REST API client and auth token management.
- `lib/providers/auth_provider.dart`: auth state, token refresh, current user.
- `lib/providers/notification_provider.dart`: notifications list, unread count, SSE connection.
- `lib/providers/tracking_provider.dart`: realtime location and WebSocket integration.
- `lib/screens/*`: auth screens, home/search, trip details, booking, wallet, profile, notifications, admin screens.
- `lib/models/*`: typed Dart models for API payloads.
- `lib/widgets/*`: reusable UI components.

### 11.2 Auth flow in Flutter
- Use secure storage for `accessToken` and `refreshToken`.
- Add auth header to each protected request.
- Auto-refresh tokens from `POST /auth/refresh-token`.
- Logout calls `POST /auth/logout` and clears tokens.
- Social login can map provider payload to `POST /auth/social-login`.

### 11.3 Notification handling
- Use HTTP calls for listing and preferences.
- Attach SSE client to `GET /notifications/stream` for live updates.
- On new SSE event, display local in-app notifications and update unread badge.
- Provide mark-read and delete operations.

### 11.4 Realtime and tracking
- Use a WebSocket client connecting to `/tracking` with JWT.
- Send driver location updates during active trips using `driverLocation`.
- Subscribe to `tripId` room for live passenger updates.
- Handle `emergencyAlert` events in-app.

### 11.5 Booking and search UX
- Public search screen uses `GET /trips/search` and search filters.
- Trip detail and seat selection should follow backend trip structure and pricing.
- Payment flows must integrate with Stripe/Razorpay using returned `clientSecret` or `orderId`.
- Wallet top-up flows should call wallet endpoints from `payments` module.

### 11.6 Role-based UI
- Passenger app: search, book, payments, notifications, profile, support.
- Driver app: trip management, location tracking, trip assignment, earnings.
- Fleet owner admin: fleet vehicle management and fleet analytics.
- Platform admin: admin dashboard, approvals, audit logs.

## 12. Environment Variables and Runtime Configuration
Exact backend config keys from `ConfigService` usage:
- `jwt.secret`
- `jwt.refreshSecret`
- `jwt.expiration` (default `24h`)
- `jwt.refreshExpiration` (default `7d`)
- `stripe.secretKey`
- `stripe.currency` (`INR` default)
- `stripe.webhookSecret`
- `razorpay.keyId`
- `razorpay.keySecret`
- `FRONTEND_URL` (password reset links)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`

## 13. Important Implementation Notes
- `Support` module appears incomplete or commented out in backend sources and should not be generated until the backend contract is finalized.
- Real-time event names and payloads must match the gateway contract exactly.
- UI should not assume additional endpoints beyond those implemented in the backend.
- Email/SMS delivery is currently stubbed; push notifications are logged by backend and require external provider integration.

## 14. Recommended Code Generation Strategy
1. Generate a typed API client for each backend module.
2. Derive shared DTOs/models from the backend source when possible.
3. Implement auth token lifecycle first, then notification/SSE and realtime socket layers.
4. Build search/booking flows from public search endpoints.
5. Add admin and fleet screens only after the core passenger/driver flows are validated.

## 15. Summary
This report is a faithful translation of the backend API and architecture, intended for safe frontend and mobile generation. Use the exact endpoint contracts above, and avoid inventing extra behavior. If any missing endpoint or DTO is required, update the backend code first and then regenerate the client contract.
//