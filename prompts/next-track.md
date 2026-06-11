# Generate the next requested track

Arguments: optionally a prep id to limit the search to one prep.

Scan `preps/*/track-requests.json` **and the repo-root `track-requests.json`**
(standalone requests not tied to any prep, written by the home screen's
"Add track" button) for entries whose `status` indicates they have not been
generated yet. If none exist, say so and stop.

Pick the highest-`priority` pending request (ask if priorities tie across
preps), confirm the choice with the user, then generate it by following
`prompts/track.md` using the request's `id`, `title`, `level`, and `depth`.

When the track is complete, update that request's `status` in
`track-requests.json` so the GUI stops listing it as pending. Touch nothing
else in the prep.
