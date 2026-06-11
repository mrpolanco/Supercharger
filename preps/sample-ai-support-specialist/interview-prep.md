# AI Platform Support Specialist - Interview Prep

## Likely Questions

### "A customer says your API is randomly failing. How do you investigate?"

Model answer:

I would first separate symptoms from evidence: when it started, affected
endpoints, request IDs, status codes, approximate volume, and whether all users
or one account is affected. Then I would reproduce with the smallest request I
can, preserving headers and payload shape while removing unnecessary variables.
If it is intermittent, I would compare successful and failed examples and look
for rate limits, payload size, auth scope, timeout, or account configuration
differences. If I escalate, I include reproduction steps, expected vs actual
behavior, impact, timestamps, request IDs, and what I already ruled out.

Follow-ups:

- What would change if failures are all `401`?
- What would change if failures are `429`?
- How do you respond while engineering is still investigating?

### "Explain a SQL join bug that can affect support investigation."

Model answer:

An inner join only returns rows with matches on both sides. That is useful when
you only want complete records, but risky in support because missing related
data can be the bug. For example, if I join customers to subscriptions with an
inner join, customers with failed or missing subscription rows disappear from
the result. In an investigation, I often start with the entity the customer
reported, then use a left join to preserve that entity while checking which
related data is absent.

Follow-ups:

- When would you use an inner join intentionally?
- How can NULL values affect filters?
- How would you explain the result to a non-SQL teammate?

### "What AI-specific support issues would you expect?"

Model answer:

I would expect context-window limits, token budget surprises, rate limits,
streaming response handling, schema or JSON formatting issues, and confusion
between model behavior and API errors. For example, a customer might describe a
"truncated response" that is actually a max-token limit, stop reason, client
timeout, or streaming parser bug. I would inspect the request parameters,
response metadata, client logs, and any provider request IDs before naming the
cause.

Follow-ups:

- How would you explain tokens to a customer?
- How do you debug streaming differently from a normal JSON response?
- How do you avoid overpromising about model determinism?

## Talking Points From The Sample Resume

- Lead with RelayDesk API debugging when asked about technical depth.
- Use PostgreSQL support-table work when asked about data investigation.
- Use runbooks and KB articles when asked about scaling support knowledge.
- Use the 96% CSAT metric when asked how you balance technical accuracy with
  customer empathy.

## Questions To Ask The Interviewer

- Which issues most often require engineering escalation today?
- What evidence makes an escalation especially useful to your engineering
  team?
- How much of the role is reactive ticket work versus improving docs, tooling,
  or internal support workflows?
- Which AI concepts do new support hires usually need the most help learning?
