# Resources: API Debugging for Product Support Engineers

## Best free resource

**MDN HTTP docs** - especially status codes, headers, and request methods.
MDN is clear, current, and practical enough for support work:
https://developer.mozilla.org/en-US/docs/Web/HTTP

## One book worth buying

**HTTP: The Definitive Guide** by David Gourley and Brian Totty. It is older,
but still excellent for understanding how HTTP actually behaves under the
friendly surface of SDKs and dashboards. You do not need to read it cover to
cover; use it as a reference when headers, caching, proxies, or connection
behavior matters.

## Tool references

- `curl` manual: https://curl.se/docs/manpage.html
- `jq` manual: https://jqlang.github.io/jq/manual/

## What to skip

- Generic "REST in 10 minutes" posts that only show happy-path CRUD.
- Tutorials that hide headers, status codes, and request IDs behind an SDK.
- Advice that says every 5xx is automatically an outage or every 4xx is
  automatically the customer's fault. Support work lives in the evidence.
