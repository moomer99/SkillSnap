# Supabase Edge Functions

**These files are vendored copies of functions that are already deployed to the
Supabase project (`dnraeyxjzdmpdvrkzyfd`).** They were pulled from the live
deployment into version control so the source is reviewable and diffable — not
because the repo is the deployment source.

## Editing a file here does NOT deploy it

There is no CI/CD step that deploys this directory. Deployment currently happens
out-of-band, via the **Supabase MCP** (`deploy_edge_function`) or the
**Supabase CLI** (`supabase functions deploy <slug>`). Changing a file in this
folder and committing it changes the repo and nothing else — production keeps
running the previously deployed version.

## The rule: deploy and commit together

Because the repo does not drive deployment, the repo and production drift apart
the moment one changes without the other. So:

> **Anyone who changes an edge function must deploy it AND commit the same change
> in the same piece of work.** Not one or the other. If you deploy without
> committing, the repo is stale. If you commit without deploying, production is
> stale and the next person who deploys from the repo may ship something that was
> never reviewed as live.

## Pulling / verifying against production

To refresh a vendored copy or check for drift, fetch the deployed source and
compare:

- MCP: `get_edge_function(project_id, function_slug)` returns `files[].content`.
- CLI: `supabase functions download <slug> --project-ref dnraeyxjzdmpdvrkzyfd`.

Compare the fetched `content` against the committed file with exact string
equality (not by eye). Content should be byte-identical; see the line-ending
note below.

## Layout notes

- Most functions are a single `‹slug›/index.ts`.
- `notify-email-changed` and `notify-password-changed` both import the shared
  modules in **`_shared/`** (`securityEmails.ts`, `securityNotice.ts`); those
  are bundled into each function at deploy time and must be kept here for the
  functions to build.
- `send-notification-email` ships a **`deno.json`** import map alongside its
  `index.ts`.

## Line endings

The repo normalizes text to **LF** (`core.autocrlf=true`, no `.gitattributes`),
so committed blobs are LF. Deployed sources are LF too, **except
`moderate-chat-media`, which is currently deployed with CRLF**. Its committed
copy here is LF and byte-identical once line endings are normalized; the next
time it is deployed from this repo, production will become LF and match. Line
endings are the one thing an exact-equality check may flag that is not a content
difference.
