---
title: Rate limits, retries, and request IDs
---
A `429` means "too many requests" for the API's current policy. It does not
automatically mean the platform is broken. Good support triage asks:

- Which endpoint is being called?
- Is one customer affected or many?
- Does the response include `Retry-After`?
- Are retries respecting that hint?
- What request IDs anchor the evidence?

## The ticket

> **Priority: High - export sync delayed**
>
> "Our nightly export sync is failing intermittently. We see 429s and our
> retry job keeps hammering the endpoint."

The sandbox includes two captured responses in `/work/responses/`. You will
inspect them, then write the support summary.

```practice
{
  "type": "timeline",
  "title": "Reason about the retry loop",
  "prompt": "Use the captured responses to decide whether this looks like a single throttled integration, a missing retry delay, or a platform-wide outage.",
  "timeline": [
    { "time": "02:00:01", "event": "Export job sends first request to /v1/exports." },
    { "time": "02:00:02", "event": "API returns 429 with Retry-After: 30." },
    { "time": "02:00:03", "event": "Customer job retries immediately." },
    { "time": "02:00:04", "event": "API returns another 429 with a new request ID." }
  ],
  "deliverable": [
    "Name the likely retry mistake.",
    "Name the header the customer should honor.",
    "Name the request IDs you would include in an escalation."
  ],
  "rubric": [
    "Uses Retry-After as evidence.",
    "Does not call it platform-wide from one integration's retry loop.",
    "Captures at least two request IDs."
  ]
}
```

## Your task

Start the environment and inspect:

```bash
cat /work/responses/first.txt
cat /work/responses/second.txt
```

Then write `/work/rate-limit-summary.md` with:

- observed status
- `Retry-After` value
- both request IDs
- likely customer-side retry issue
- customer-safe next step

This is a non-coding lesson. The terminal is there because real support work
often starts with artifacts, not with writing a script.

```quiz
{ "questions": [
  { "q": "What should a client usually do when a 429 response includes `Retry-After: 30`?",
    "options": ["Wait about 30 seconds before retrying", "Retry immediately in a tight loop", "Switch to a random endpoint"],
    "answer": 0,
    "explain": "Retry-After tells the client how long to wait before trying again." }
] }
```

## Explain it

Out loud: *"Why is a 429 with Retry-After different from a generic API
failure?"*
