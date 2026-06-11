---
title: Reproducing customer failures with curl
---
`curl` is the fastest way to turn a vague API ticket into a reproducible
artifact. You do not need to memorize every option. For support debugging, you
need a small working set:

- `-i` includes response headers, which often contain request IDs and retry
  hints.
- `-sS` keeps output quiet unless there is an error.
- `-H 'Header: value'` adds a header.
- `-X POST` sets a method when needed.
- `--data @file.json` sends a JSON body from a file.

> **Tip:** `curl` is the command-line HTTP client used here. It sends requests
> from the terminal so you can reproduce customer failures without their app.

## The ticket

> **Priority: Medium - Northstar Retail**
>
> "Our integration gets a 404 for order `ord_missing`, but the customer insists
> the order exists. Can you check whether your API is down?"

```practice
{
  "type": "diagnosis",
  "title": "Plan the reproduction",
  "prompt": "Before starting the environment, decide what your first curl command must prove.",
  "deliverable": [
    "Name the exact endpoint you will request.",
    "Name why you should include response headers.",
    "State one conclusion you should not make from a single 404."
  ],
  "rubric": [
    "Reproduces the exact resource ID.",
    "Captures headers and body.",
    "Does not call the platform down from one resource-specific failure."
  ]
}
```

## Your task

Start the environment. A small API is running locally at
`http://127.0.0.1:8080`.

Create `/work/repro.sh` that runs this exact kind of request:

```bash
curl -i -sS http://127.0.0.1:8080/v1/orders/ord_missing
```

Then run it:

```bash
bash /work/repro.sh | tee /work/repro-response.txt
```

Write `/work/notes.txt` with three lines:

```text
status=<status-code>
request_id=<request-id>
support_conclusion=<one cautious sentence>
```

The right conclusion is not "the API is down." It should say what the
reproduction proves and what remains unknown.

```quiz
{ "questions": [
  { "q": "Why use `curl -i` during support reproduction?",
    "options": ["It includes response headers such as request IDs", "It makes the request faster", "It turns every response into JSON"],
    "answer": 0,
    "explain": "Headers often contain request IDs, retry hints, and other support evidence." }
] }
```

## Explain it

Out loud: *"What does a 404 on one resource prove, and what does it not prove?"*
