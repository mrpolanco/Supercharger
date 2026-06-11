# AI Platform Support Specialist - Requirements Analysis

## Summary

This fictional posting is a strong fit for a technical support engineer moving
into AI platform support. The role will likely test API debugging, SQL-based
investigation, command-line comfort, crisp customer communication, and the
ability to escalate with evidence rather than hunches.

Because a fictional `resume.md` is included, this prep demonstrates personal
gap analysis: each requirement is marked covered, partial, or gap with resume
evidence.

## Requirement Map

| Posting requirement | Resume evidence | Status | Prep focus |
|---|---|---|---|
| API troubleshooting for enterprise customers | RelayDesk experience with authentication headers, malformed JSON, pagination, webhooks, and rate limits | Covered | Practice verbal explanations and escalation summaries rather than basics. |
| Reproduce issues with command-line tools | Resume cites curl, browser developer tools, and small Bash scripts | Covered | Drill live exercises to stay fast under interview pressure. |
| SQL for support investigation | Resume cites PostgreSQL support tables for configuration, events, and feature flags | Covered | Use `sql-fundamentals` as a confidence-building track and screenshot-ready sample. |
| Customer-facing technical writing | Resume cites runbooks, KB articles, and incident updates | Covered | Prepare concrete examples with before/after impact. |
| AI product concepts: tokens, context windows, streaming responses | No direct resume evidence | Gap | Request a focused AI API support track. |
| SSO/OAuth/SAML or enterprise networking | Resume mentions SSO setup basics but not deep troubleshooting | Partial | Request an enterprise auth/networking primer if the interview loop emphasizes it. |
| Ambiguous incidents and calm escalation | Incident updates and support queues are relevant, but production incident ownership is not deeply evidenced | Partial | Prepare one structured incident story using Situation, Investigation, Evidence, Resolution. |

## Inferred Requirements

- The posting says "AI platform" and "unexpected model responses"; this prep
  assumes practical LLM API concepts such as token usage, context limits,
  streaming, and rate limits. Confirm the specific model/provider stack before
  doing product-specific study.
- The posting mentions "authentication failures" but not a protocol. Assuming
  API keys and bearer tokens are required; OAuth, SAML, and SSO are treated as
  preferred-depth topics rather than the first study priority.
- "Operational logs" could mean SQL tables, log search tools, or observability
  dashboards. This prep uses SQL first because it is already represented in the
  resume and in the bundled sample track.

## Highest-Leverage Gaps

1. AI API support fundamentals: context windows, token budgets, model-response
   troubleshooting, streaming failures, and rate-limit interpretation.
2. Enterprise authentication and networking depth if the interview panel leans
   toward large-company deployments.
3. Stronger incident story practice: the resume has support evidence, but the
   candidate should make ownership and communication explicit.
