---
title: Reading API requests like evidence
---
An API support ticket is not just a complaint plus a status code. It is a small
evidence packet. Your job is to reconstruct what the customer tried, what the
server understood, and what still needs proof.

An **API** is a contract between software systems. A request usually has:

- **method**: the action, such as `GET` to read or `POST` to create
- **URL/path**: the resource being addressed, such as `/v1/invoices/inv_200`
- **headers**: metadata, such as `Authorization`, `Content-Type`, or request IDs
- **body**: JSON or another payload sent with the request
- **response status**: the server's high-level result, such as `200`, `401`,
  `404`, or `422`
- **response body**: the details, often including an error code or message

For support work, the request is evidence only when it is specific enough to
reproduce. "The API is broken" is not evidence. "POST `/v1/tickets` with this
JSON returns `422 invalid_field` and request ID `req_9a3`" is evidence.

## Why interviewers probe this

API debugging sits in the middle of product support. It tests whether you can:

1. separate customer code from platform behavior
2. reproduce a failure without the customer's whole application
3. read error messages without overclaiming
4. hand engineering a report they can act on
5. explain the next step to the customer clearly

That is why a good answer includes request shape, status code, error body,
timestamp, environment, and request ID. A great answer also says what has been
ruled out.

```practice
{
  "type": "compare",
  "title": "Which ticket can you act on?",
  "prompt": "Compare these two customer reports. Which one gives you enough evidence to start reproducing, and what is missing from the weaker one?",
  "options": [
    "A: Our integration stopped working this morning. Please fix your API.",
    "B: GET /v1/invoices/inv_200 returns 401 in production when we use bearer token test_sk_123. The response body says invalid_api_key and the request ID is req_auth_042."
  ],
  "deliverable": [
    "Choose A or B.",
    "Name the fields that make it reproducible.",
    "Name two follow-up questions for the weaker report."
  ],
  "rubric": [
    "Prioritizes method, path, status, error code, environment, and request ID.",
    "Asks for the exact request shape rather than a screenshot only.",
    "Avoids assuming the platform is down before scope is known."
  ],
  "modelAnswer": "B is actionable because it includes method, path, status, environment, token type, error code, and request ID. A needs the endpoint, timestamp, environment, request headers with secrets redacted, response status/body, and whether all customers or one integration is affected."
}
```

## Common status codes in support

| Status | What it usually means | Support caution |
|---|---|---|
| `400` | malformed request | Check JSON shape and required fields. |
| `401` | unauthenticated | Token missing, malformed, expired, or from wrong environment. |
| `403` | authenticated but not allowed | Permissions, plan, scope, or account state. |
| `404` | resource not found | Wrong ID, wrong environment, or no access to that resource. |
| `409` | conflict | Duplicate create, state mismatch, idempotency issue. |
| `422` | understood request, invalid data | Field names, types, allowed values, schema. |
| `429` | too many requests | Rate limit, retry behavior, request burst. |
| `5xx` | server-side failure | Still reproduce and capture request ID before escalating. |

```quiz
{ "questions": [
  { "q": "Which detail most helps engineering find one failed API request in server logs?",
    "options": ["Request ID", "The customer's company logo", "The browser window size"],
    "answer": 0,
    "explain": "Request IDs are designed to correlate a customer-visible failure with backend logs." },
  { "q": "Why is 'production vs test environment' part of API triage?",
    "options": ["Wrong-environment credentials can create failures that look like platform bugs", "Test environments never return errors", "Production requests do not need headers"],
    "answer": 0,
    "explain": "A test key, test resource ID, or wrong base URL can produce auth and not-found failures even when the platform is healthy." }
] }
```

## Explain it

Out loud: *"What five fields do I need before I can call an API ticket
reproducible, and why does each one matter?"*
