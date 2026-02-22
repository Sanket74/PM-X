# Firebase Email Trigger

This function sends a welcome email whenever a new enrollment document is created in:

`artifacts/{appId}/public/data/leads/{leadId}`

Only documents with `intent: "enroll"` trigger email sending.

## 1) Install dependencies

```bash
npm --prefix functions install
```

## 2) Set required secrets

```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
```

Typical ports:
- TLS/STARTTLS: `587`
- SSL: `465`

## 3) Deploy functions

```bash
firebase deploy --only functions --project <your-project-id>
```

## 4) Verify behavior

1. Submit enroll form on website.
2. Check created lead document in Firestore.
3. Function updates document with:
- `emailStatus: "sent"` and `emailSentAt` on success
- `emailStatus: "failed"` and `emailError` on failure
