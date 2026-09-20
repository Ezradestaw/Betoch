# Betoch Security Model & OWASP ASVS Alignment

Betoch implements security by design targeting **OWASP Application Security Verification Standard (ASVS) Level 2**.

## 1. Authentication & Session Management
- **Password Hashing:** Argon2id with memory cost `19456` and time cost `2`, resistant to GPU cracking and side-channel timing attacks.
- **Session Tokens:** Short-lived JWT access tokens (15-minute expiration) paired with HttpOnly, SameSite=Strict, Secure cookies for refresh tokens.
- **Brute Force Protection:** IP and endpoint rate-limiting via Fastify rate-limiter (100 requests per minute sliding window).

## 2. Authorization (Least Privilege & IDOR Protection)
- **Role-Based Access Control (RBAC):** Roles include `RENTER`, `OWNER`, and `ADMIN`.
- **Object-Level Authorization (BOLA/IDOR Prevention):** Every sensitive operation verifies ownership (`actor_id === resource.owner_id || actor.role === 'ADMIN'`).
- **UUIDv4 Primary Keys:** Prevents enumeration and sequential scraping attacks.

## 3. Sensitive Document Protection
- **National ID Numbers (Fayda / Kebele):** Masked on display (`FIN-••••-7801`). Stored as a salted SHA-256 hash for duplicate fraud detection.
- **Ownership Title Deeds (*Carta*):** Stored in private vaults and never exposed through public property APIs.

## 4. Payment Gateway Security
- **Telebirr RSA SHA256:** Outgoing transactions signed with the merchant private key; incoming webhook callbacks cryptographically verified using Ethio Telecom's public key.
- **Transaction Idempotency:** Payments tracked by unique `outTradeNo` to prevent double-charging or replay attacks.

## 5. File Upload Security
- **MIME & Extension Whitelisting:** Strictly limits uploads to verified image and PDF formats.
- **Cryptographic Filenames:** User-provided filenames are discarded and replaced with randomized UUIDs to prevent directory traversal (`../`) attacks.
