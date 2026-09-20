# Betoch Threat Model (STRIDE Framework)

## 1. Threat Analysis Summary

| Threat Category | Potential Attack Vector | Impact | Betoch Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates landlord to collect deposits | High | Mandatory Title Deed (*Carta*) validation and Fayda Digital ID verification before listings receive the Verified Property badge. |
| **Tampering** | Attacker modifies Telebirr payment callback to mark unpaid commission as completed | Critical | Cryptographic RSA SHA256 signature verification using official Ethio Telecom public keys. |
| **Repudiation** | User denies submitting an application or altering contract terms | Medium | Append-only immutable `audit_logs` capturing actor ID, timestamp, IP address, user agent, and payload. |
| **Information Disclosure** | Scraping sensitive landlord identity documents or national IDs | High | Sensitive verification documents stored in private vaults. National ID numbers masked in APIs (`FIN-••••-7801`). |
| **Denial of Service** | Flooding search endpoints or property creations | Medium | Fastify rate limiter (100 req/min sliding window), database statement timeouts, connection pooling. |
| **Elevation of Privilege** | Tenant modifies role to Admin to approve their own verification | Critical | Server-side role enforcement on all admin routes via `requireRole(UserRole.ADMIN)`. |

## 2. Residual Risks & Future Mitigations
- **In-Person Physical Property Fraud:** While Title Deeds are authenticated, on-site physical inspection can be integrated as an optional Tier 3 badge ("Betoch Field Inspected").
- **Live KYC Provider:** Direct biometric liveness verification via the national Fayda API will be integrated once their public developer API is generally available.
