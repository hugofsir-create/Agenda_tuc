# Security Spec - LogiTrack Contacts

## Data Invariants
- A contact must have a `client`, `city`, and `address`.
- A contact must belong to an `ownerId` which matches the creator's UID.
- Users can only read, update, or delete contacts they own.
- Document IDs must be valid strings (size <= 128, alphanumeric + underscores/hyphens).

## The Dirty Dozen Payloads (Target: /contacts/{contactId})

1. **Identity Spoofing**: Attempt to create a contact with `ownerId` of another user.
   - Payload: `{ "client": "Evil", "city": "Tucumán", "address": "123", "ownerId": "victim_uid" }`
   - Expected: PERMISSION_DENIED.

2. **Shadow Field Injection**: Attempt to add a field not in the schema.
   - Payload: `{ "client": "Test", "city": "T", "address": "A", "ownerId": "my_uid", "isAdmin": true }`
   - Expected: PERMISSION_DENIED (via `diff().affectedKeys().hasOnly()` or strictly defined `isValidContact`).

3. **Resource Poisoning (Large Client)**: Large string for client field.
   - Payload: `{ "client": "A".repeat(1000), ... }`
   - Expected: PERMISSION_DENIED.

4. **Resource Poisoning (Large ID)**: Large document ID.
   - Target: `/contacts/` + "A".repeat(200)
   - Expected: PERMISSION_DENIED.

5. **Resource Poisoning (Invalid ID)**: Special characters in ID.
   - Target: `/contacts/my!contact`
   - Expected: PERMISSION_DENIED.

6. **Unauthorized Read**: Attempt to get someone else's contact.
   - Expected: PERMISSION_DENIED.

7. **Unauthorized Write**: Attempt to update someone else's contact.
   - Expected: PERMISSION_DENIED.

8. **Type Mismatch (City)**: City as integer.
   - Payload: `{ "city": 123, ... }`
   - Expected: PERMISSION_DENIED.

9. **Missing Required Field**: No address.
   - Payload: `{ "client": "C", "city": "T", "ownerId": "U" }`
   - Expected: PERMISSION_DENIED.

10. **Immutable Field Update**: Try to change `ownerId`.
    - Expected: PERMISSION_DENIED.

11. **PII Leakage (List)**: Blanket list without owner filter. (Rules enforce query filter).
    - Expected: PERMISSION_DENIED if filter not matches uid.

12. **Denial of Wallet**: Large batch write. (Managed by Firebase limits, but rules can help by restricting size/count if needed).

## Test Implementation
A `firestore.rules.test.ts` would verify these scenarios using the Firebase Emulators or unit testing library.
