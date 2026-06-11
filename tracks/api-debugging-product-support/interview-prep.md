# Interview prep: API Debugging for Product Support Engineers

## Verbal questions

### Walk me through how you debug a customer API failure.

**Model answer:** I start by making the request reproducible: method, endpoint,
environment, headers with secrets redacted, body, status code, response body,
timestamp, and request ID. Then I classify the failure: auth, permissions,
not-found, validation, rate limit, or server-side. I reproduce with `curl` or a
minimal script, compare expected vs actual behavior, and write the customer
update with evidence and next steps. If it needs engineering, I escalate with
request IDs, payload shape, impact, and what I ruled out.

**Follow-ups interviewers use:**

- What if the customer will not share headers?
- How do you avoid exposing secrets in an escalation?
- How do you know when to call it an outage?
- What would you include in the first customer update?

### A customer gets `401 invalid_api_key`. What do you check?

**Model answer:** I check whether the Authorization header is present and in the
expected format, whether the key belongs to the right environment, whether the
resource ID also belongs to that environment, and whether the key is expired or
revoked. I capture status, error code, and request ID before concluding.

**Follow-ups:**

- How is that different from `403`?
- How would you phrase the reply without blaming the customer?
- What if only one endpoint fails with that key?

### A request returns `422 validation_failed`, but the customer says the JSON is valid.

**Model answer:** Both can be true. The JSON can parse successfully while still
violating the endpoint schema. I would validate syntax with `jq`, then compare
field names, required fields, types, and allowed values against the API
contract. In the reply, I would say the body is syntactically valid JSON, but
the endpoint rejected specific fields.

**Follow-ups:**

- What artifact would you send engineering?
- What should you redact?
- How do you distinguish `400` from `422`?

### How do you triage `429` reports?

**Model answer:** I look for the endpoint, customer/account scope, timestamps,
`Retry-After`, request IDs, and retry behavior. One integration retrying too
quickly is different from platform-wide throttling. I ask whether the client is
honoring the delay and whether bursts line up with a job or deployment.

**Follow-ups:**

- What if there is no `Retry-After` header?
- What would you ask the customer to change?
- When would you escalate a rate-limit issue?

## Live exercise prompts

### Prompt 1: Minimal repro

You are given a failing customer request and a local API. Produce a `curl`
command that captures headers and body, then write three bullet points: expected
behavior, actual behavior, and request ID.

**Strong answer includes:** `-i`, redacted auth, exact endpoint, JSON body file,
status code, error code, request ID, and a cautious conclusion.

### Prompt 2: Customer update

Write a customer reply for a `422 validation_failed` caused by `"tags": "vip"`
instead of `"tags": ["vip"]`.

**Strong answer:** Acknowledges impact, explains the request-body mismatch in
plain language, avoids blame, gives the corrected shape, and offers to review a
redacted sample if failures continue.

### Prompt 3: Escalation

Escalate a suspected 500 from `POST /v1/messages`.

**Strong escalation:** includes account, endpoint, timestamp, request ID,
redacted payload shape, expected vs actual behavior, reproduction command,
frequency/scope, and what customer-side causes were ruled out.
