---
title: Auth failures and wrong environments
---
Authentication failures are common, but they are easy to over-escalate. A
`401` usually means the server cannot accept the credential. A `403` usually
means it accepted the identity but the identity cannot perform that action.

In API support, auth also includes **environment matching**:

- production key against production resource
- test key against test resource
- production base URL when the customer says production
- test base URL when they are experimenting

Wrong-environment requests are especially tricky because the error can feel
like "your API rejected our valid key." The key may be valid, just not for that
environment.

## The ticket

> **Priority: High - Billing integration blocked**
>
> "GET `/v1/invoices/inv_200` returns `401 invalid_api_key` in production. Our
> token works in our test script, so this looks like a production outage."

```practice
{
  "type": "incident",
  "title": "Case file: production invoice auth failure",
  "prompt": "Read the evidence before making the request. Your job is to determine whether this points to platform auth downtime or a customer credential/environment mismatch.",
  "evidence": [
    "Customer says the failing resource is a production invoice.",
    "The provided token starts with test_sk_.",
    "The failing endpoint is /v1/invoices/inv_200.",
    "The response body says invalid_api_key, not permission_denied."
  ],
  "deliverable": [
    "Name the most likely hypothesis.",
    "Name the curl evidence that would prove it.",
    "Name what wording would be too strong for the first reply."
  ],
  "rubric": [
    "Checks credential environment before escalating.",
    "Captures status, error code, and request ID.",
    "Avoids calling an outage from one invalid-key response."
  ]
}
```

## Your task

Start the environment. Two tokens exist:

- `test_sk_customer_123`
- `live_sk_correct_456`

Create `/work/fixed-request.sh` that successfully fetches the production
invoice:

```bash
curl -i -sS \
  -H 'Authorization: Bearer live_sk_correct_456' \
  http://127.0.0.1:8080/v1/invoices/inv_200
```

Then write `/work/auth-findings.txt` with:

- the failing status
- the error code
- the likely root cause
- the customer-safe next step

```quiz
{ "questions": [
  { "q": "What is the safest first interpretation of a production request using a `test_sk_` token?",
    "options": ["The credential likely belongs to the wrong environment", "The platform is down globally", "The endpoint no longer exists"],
    "answer": 0,
    "explain": "Environment mismatch is a common cause of valid-looking credentials failing in production." }
] }
```

## Explain it

Out loud: *"How would you explain wrong-environment credentials without making
the customer feel blamed?"*
