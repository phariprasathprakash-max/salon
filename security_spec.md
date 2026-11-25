# Security Specification — INSCAPE UNISEX SALON

## 1. Data Invariants
1. **Public Read Isolation**: Unauthenticated customers may read only published, active `services` (`isActive == true`), active `categories` (`isActive == true`), active `offers` (`isActive == true`), and public `salonSettings`. Customers may never read disabled services/categories/offers, `adminUsers`, `activityLogs`, or `mediaAssets`.
2. **Zero Public Writes**: Unauthenticated users and non-admin authenticated users cannot create, update, or delete any document in any collection.
3. **Verified Admin Gate**: Administrative writes require `request.auth != null && request.auth.token.email_verified == true` AND authorization via either the bootstrapped super-admin email (`phariprasath132007@gmail.com`) or an active `adminUsers/{request.auth.uid}` record (`isActive == true`).
4. **Numeric & Price Bounds**: Service `price` must be a number `>= 0` and `<= 1000000`; `offerPrice` (when non-null) must be `>= 0` and `<= 1000000`; `offer.discountPercent` must be `>= 0` and `<= 100`.
5. **Relational Integrity**: Creating or updating a `service` requires `exists(/databases/$(database)/documents/categories/$(incoming().categoryId))` so orphaned category references are prevented.
6. **Immutable Audit Trail**: `activityLogs` are append-only (`allow update, delete: if false`), `adminUid` must equal `request.auth.uid`, and `createdAt` must equal `request.time`.
7. **Strict Field Allowlisting & Size Bounds**: Every collection enforces `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, `isValidId()` regex on all path IDs, and explicit `.size()` limits on all strings.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated create on `/services/hack1` -> `PERMISSION_DENIED`
2. Unverified email admin token writing `/services/hack2` -> `PERMISSION_DENIED`
3. Non-admin signed-in user writing `/services/hack3` -> `PERMISSION_DENIED`
4. Admin writing `/services/bad_price` with `price: -50` -> `PERMISSION_DENIED`
5. Admin writing `/services/shadow` with extra ghost field `isVerified: true` -> `PERMISSION_DENIED`
6. Admin writing `/services/orphan` with nonexistent `categoryId: "does-not-exist"` -> `PERMISSION_DENIED`
7. Public user reading disabled service (`isActive: false`) -> `PERMISSION_DENIED`
8. Public user listing all services without `where('isActive', '==', true)` -> `PERMISSION_DENIED`
9. Public user reading `/adminUsers/uid1` or `/activityLogs/log1` -> `PERMISSION_DENIED`
10. Non-admin signed-in user self-registering into `/adminUsers/{theirUid}` with `role: "superadmin"` -> `PERMISSION_DENIED`
11. Admin trying to mutate or delete `/activityLogs/log1` -> `PERMISSION_DENIED`
12. Path ID poisoning (`/services/invalid.id$123` or >128 chars) -> `PERMISSION_DENIED`
