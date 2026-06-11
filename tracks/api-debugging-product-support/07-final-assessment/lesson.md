---
title: Final assessment (closed book)
---
## Rules

This mirrors a live API support screen. No hints, no peeking at earlier
lessons. Explore the endpoint, inspect the provided payload, reproduce the
failure, fix the request, and write the customer update.

The customer reports:

> "Creating a run started failing after we added user input. We need to know
> whether the API is rejecting our request or if there is an outage."

You have:

- a local API at `http://127.0.0.1:8080`
- `/work/run-payload.json`
- one endpoint: `POST /v1/runs`
- one token: `live_final_789`

## Questions

Create `/work/final-request.sh` that sends a valid request and receives a
successful response.

Write `/work/customer-update.md` explaining:

- what failed
- what evidence supports the conclusion
- whether this looks request-specific or platform-wide
- what the customer should change next

When all checkpoints pass, the track is complete. Then drill
`interview-prep.md` from the track page.
