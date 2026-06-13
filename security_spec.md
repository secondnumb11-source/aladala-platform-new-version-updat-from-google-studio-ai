# Security Specification for Justice Platform

## Data Invariants
1. A **User** profile can only be created by the authenticated user with the matching UID.
2. **Cases**, **Clients**, **Hearings**, **Tasks**, and **Invoices** are only accessible to authenticated staff members (lawyers, admins, researchers, secretaries).
3. **Clients** can only access their own data through the Client Portal (filtered by their specific client ID or linked account).
4. **Admins** have full access to all collections.
5. All writes must satisfy strict schema validation (types, sizes, required fields).
6. Timestamps (`createdAt`, `updatedAt`) must be server-generated.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a user profile with a UID that doesn't match the `request.auth.uid`.
2. **Privilege Escalation**: A non-admin user attempting to change their own `role` to `admin`.
3. **Unauthorized Access**: A `client` user attempting to list ALL `cases`.
4. **Data Poisoning**: Attempt to write a status string exceeding 100 characters.
5. **Orphaned Write**: Creating a `task` with a reference to a `caseNumber` that doesn't exist.
6. **Cross-Tenant Leak**: Client A attempting to `get` an `invoice` belonging to Client B.
7. **Bypassing Invariants**: Attempting to update `createdAt` field which should be immutable.
8. **Resource Exhaustion**: Sending a `name` field with 1MB of text.
9. **State Shortcut**: Changing a case `status` from `new` directly to `closed` without passing through `active` (if strict state machines are enforced).
10. **Malicious ID**: Using a document ID containing special characters like `../../../etc/passwd`.
11. **Timestamp Forgery**: Providing a `createdAt` date from 1999 instead of using `request.time`.
12. **Shadow Field**: Adding an unrequested field `isVerified: true` to a case document.

## Test Runner (Conceptual)
The `firestore.rules.test.ts` would verify that all the above payloads return `PERMISSION_DENIED` while valid payloads from identified roles are `ALLOWED`.
