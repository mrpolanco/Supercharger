---
title: JSON body validation and schema mismatch
---
When an API returns `422`, the server usually understood the request but
rejected the data. That is different from malformed JSON. The payload may be
valid JSON and still violate the API contract.

Common schema mistakes:

- wrong field name: `customerId` instead of `customer_id`
- wrong type: `"tags": "vip"` instead of `"tags": ["vip"]`
- unsupported value: `"priority": "urgent"` when only `normal` and `high`
  are allowed
- missing required field

`jq` is useful here because it formats and validates JSON. `jq . file.json`
prints formatted JSON when the file is valid and errors when it is not.

## The ticket

> **Priority: Medium - ticket creation failing**
>
> "We copied the JSON from our integration and your API says the request is
> invalid. The body is in `/work/bad-ticket.json`."

```practice
{
  "type": "compare",
  "title": "Syntax error or schema error?",
  "prompt": "Before fixing the payload, decide what class of problem you are looking for.",
  "options": [
    "A: The JSON cannot be parsed at all.",
    "B: The JSON parses, but fields or values do not match the API contract."
  ],
  "deliverable": [
    "Run jq to determine whether the JSON parses.",
    "Name the field-level mistakes you expect a 422 to report."
  ],
  "rubric": [
    "Separates valid JSON from valid API input.",
    "Checks field names, value types, and allowed enum values.",
    "Avoids telling the customer their JSON is malformed if it is only schema-invalid."
  ]
}
```

## Your task

Start the environment, then inspect the bad payload:

```bash
jq . /work/bad-ticket.json
```

Create `/work/fixed-ticket.json` with a valid request body:

```json
{
  "customer_id": "cus_100",
  "priority": "high",
  "tags": ["vip", "login"],
  "summary": "Login failures after SSO change"
}
```

Then prove it with:

```bash
curl -i -sS \
  -H 'Content-Type: application/json' \
  --data @/work/fixed-ticket.json \
  http://127.0.0.1:8080/v1/tickets
```

Write `/work/schema-summary.txt` explaining the difference between a JSON
syntax problem and this schema problem.

## Explain it

Out loud: *"How would you tell a customer their payload is valid JSON but not a
valid request for this endpoint?"*
