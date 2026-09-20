# Contributing to Betoch

We welcome contributions to build a safer, more transparent residential rental market in Ethiopia.

## 1. Development Workflow

1. Fork or branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Ensure local migrations and seeds run cleanly:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
3. Run the automated test suite before opening a PR:
   ```bash
   npm test
   ```
4. Build all workspaces to verify TypeScript strict mode:
   ```bash
   npm run build
   ```

## 2. Coding Standards
- Strict TypeScript throughout frontend and backend.
- Avoid `any` types wherever possible.
- Never write raw unparameterized SQL strings.
- Enforce Ethiopian legal protections (Proclamation 1320/2024 advance deposit caps).
