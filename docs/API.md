# Betoch REST API Reference

The Betoch API is structured under `/api/v1` and fully documented via OpenAPI at `/documentation`.

## 1. Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new tenant or landlord account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token using HttpOnly cookie | Cookie |
| `POST` | `/api/v1/auth/logout` | Invalidate session and clear refresh cookie | Public |
| `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile | Bearer Token |

## 2. Properties & Search Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/properties` | Search and filter listings (FTS, Sub-city, Rent) | Public |
| `GET` | `/api/v1/properties/:idOrSlug` | Detailed specifications, images, and owner profile | Public |
| `POST` | `/api/v1/properties` | Create multi-step verified property listing | OWNER / ADMIN |
| `GET` | `/api/v1/properties/my-listings` | List all listings belonging to current landlord | OWNER / ADMIN |

## 3. Rental Applications & Contracts

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/applications` | Submit application for a listing | RENTER / ADMIN |
| `GET` | `/api/v1/applications/my-applications` | Track submitted rental applications | RENTER / ADMIN |
| `GET` | `/api/v1/applications/property/:id` | Landlord view of applications for a listing | OWNER / ADMIN |
| `PATCH` | `/api/v1/applications/:id/status` | Accept or reject application | OWNER / ADMIN |
| `POST` | `/api/v1/contracts/complete-rental` | Finalize lease, set status to RENTED, compute 10% fee | OWNER / ADMIN |
| `GET` | `/api/v1/contracts/:id` | View confirmed contract details and commission invoice | Participants |

## 4. Payments & Telebirr

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/telebirr/initiate` | Initiate Telebirr payment and generate signed order | Authenticated |
| `POST` | `/api/v1/payments/telebirr/webhook` | Asynchronous callback handler with RSA signature verification | Telebirr Gateway |
| `POST` | `/api/v1/payments/mock-simulate/:outTradeNo` | Sandbox approval simulator for local development | Public |
| `GET` | `/api/v1/payments/:outTradeNo/status` | Inquire transaction status | Public |

## 5. Administration & Moderation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/analytics` | High-level platform KPIs and revenue volume | ADMIN |
| `GET` | `/api/v1/admin/verifications/pending` | Identity verification moderation queue | ADMIN |
| `POST` | `/api/v1/verification/:id/review` | Approve or reject Fayda/Kebele ID | ADMIN |
| `GET` | `/api/v1/admin/properties/pending` | Property title deed review queue | ADMIN |
| `POST` | `/api/v1/admin/properties/:id/review` | Approve or reject property verified badge | ADMIN |
| `GET` | `/api/v1/admin/reports` | Scam and abuse reports queue | ADMIN |
| `GET` | `/api/v1/admin/audit-logs` | Immutable audit log trail viewer | ADMIN |
