# AI Platform Support Specialist - Study Plan

## Priority 1: SQL Investigation

Track: `sql-fundamentals`

Drill the full track. The posting explicitly asks for SQL, and the resume
claims PostgreSQL support-table experience. The interview risk is not "do you
know SELECT"; it is whether you can use SQL to answer a messy customer question
without accidentally hiding rows through NULL logic or bad joins.

Focus lessons:

- `02-select-and-filter`: explain why NULL comparisons surprise support teams.
- `03-joins`: practice narrating why an inner join can make customer records
  disappear.
- `05-ticket-missing-rows`: use the ticket as a model for customer-impact
  communication.
- `06-final-assessment`: use as a closed-book confidence check.

## Priority 2: API Reproduction

Requested track: `api-debugging-for-ai-support`

The resume has API support evidence, but the posting needs fast reproduction
with payloads, headers, status codes, and customer-facing explanations. Create
or study a track that covers curl, JSON request bodies, auth headers, 400 vs
401 vs 429 failures, and escalation-quality reproduction notes.

## Priority 3: AI-Specific Support Concepts

Requested track: `llm-api-support-fundamentals`

This is the biggest resume gap. Study practical concepts rather than model
theory: context windows, token usage, stop reasons, streaming responses,
rate-limit headers, safety refusals, and how to distinguish product behavior
from integration bugs.

## Priority 4: Enterprise Auth and Networking

Requested track: `enterprise-auth-networking-primer`

Treat this as secondary unless the recruiter says the loop includes enterprise
deployment troubleshooting. Aim for enough fluency to ask good questions:
identity provider, service provider, redirect URI, bearer token, SAML
assertion, proxy, allowlist, DNS, and TLS.

## Interview Practice

Prepare three stories:

- A customer API issue you reproduced from incomplete information.
- A time SQL or logs changed your understanding of the root cause.
- A time you escalated to engineering with evidence and reduced back-and-forth.

For each story, include the customer impact, reproduction steps, expected vs
actual behavior, evidence, and what changed afterward.
