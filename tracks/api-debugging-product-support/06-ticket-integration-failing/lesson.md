---
title: "Ticket: integration suddenly failing"
---
## The ticket

> **Priority: High - Acme Health**
>
> "Our message creation API call started failing after yesterday's deploy. We
> need to know whether your API changed or whether we are sending something
> wrong. This blocks our support workflow."

This lesson combines the full API support loop: reproduce, classify, capture
evidence, and write the update.

```practice
{
  "type": "incident",
  "title": "Case file: failing message creation",
  "prompt": "Before touching the terminal, identify what evidence will let you write a useful reply instead of a vague 'we are looking into it.'",
  "evidence": [
    "Customer reports a failure after their deploy.",
    "The blocked workflow creates support messages.",
    "A local reproduction file is provided at /work/customer-payload.json.",
    "The customer asks whether the API changed."
  ],
  "deliverable": [
    "Name the endpoint and method you need to reproduce.",
    "Name which response fields you need for escalation.",
    "Name what would count as evidence of customer-side request shape."
  ],
  "rubric": [
    "Starts with reproduction.",
    "Captures status, error code, and request ID.",
    "Plans a customer update with expected vs actual behavior."
  ]
}
```

## Your job

Start the environment. Inspect `/work/customer-payload.json`, then create
`/work/repro.sh` that sends it to:

```text
POST http://127.0.0.1:8080/v1/messages
```

Use:

```bash
curl -i -sS \
  -H 'Content-Type: application/json' \
  --data @/work/customer-payload.json \
  http://127.0.0.1:8080/v1/messages
```

Save the response:

```bash
bash /work/repro.sh | tee /work/message-response.txt
```

Then write `/work/ticket-update.md` with:

- expected behavior
- actual behavior
- status and error code
- request ID
- likely request issue
- next step for the customer

```practice
{
  "type": "response",
  "title": "Draft before checking",
  "prompt": "The check script can validate required evidence, but it cannot make your tone support-safe. Review your reply before running Check my work.",
  "rubric": [
    "Acknowledges customer impact.",
    "Names expected vs actual behavior.",
    "Cites request ID and error code.",
    "Explains the likely request issue without blame.",
    "Gives a concrete next step."
  ]
}
```

## Explain it

Out loud: *"Why is expected vs actual behavior useful in both customer replies
and engineering escalations?"*
