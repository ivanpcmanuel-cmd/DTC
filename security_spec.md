# Security Specification for DTC Manager Pro

## Data Invariants
1. A user profile document ID under `/users/{userId}` must match the user's authenticating UID (`request.auth.uid`).
2. Authentication is strictly required for accessing any collections.
3. Access rights are determined based on the user's role stored in the `/users/{userId}` document.
4. Admins have complete read/write access to all collections.
5. Users cannot elevate their own role.

## The "Dirty Dozen" Payloads
1. User profile creation with spoofed role "admin" (should be denied).
2. Unauthenticated write attempt to `/students/{studentId}` (should be denied).
3. Creation of a transaction with spoofed metadata without matching fields (should be denied).
4. Profile modification attempt by another user (should be denied).
5. Unauthorized read to admin transactions by a viewer (should be denied).
6. Non-admin deleting a course or staff member (should be denied).
7. Invalid ID format used in a path (should be denied).
8. Missing required fields in a new student profile (should be denied).
9. Modifying immune field `createdAt` on a resource (should be denied).
10. System settings document overwritten with unauthorized fields by a non-admin (should be denied).
11. Bypassing client-side filters on list queries (should be denied).
12. Forging transactions list with `isAdminOnly: true` as staff (should be denied).
