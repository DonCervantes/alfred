# ALFRED — GitBook setup (ALF-005)

Repo source for the public docs site: **`docs/gitbook/`**.

## Create the space (once)

1. Sign in at [app.gitbook.com](https://app.gitbook.com).  
2. **New space** → name **ALFRED Docs** (or `alfred`).  
3. Prefer **Git Sync** / GitHub integration:
   - Connect this repository.
   - Set docs root / sync path to `docs/gitbook`.
   - Branch: `main` (or your default).
4. Confirm `.gitbook.yaml` + `SUMMARY.md` import as the table of contents.

If Git Sync is unavailable: **Import** markdown from `docs/gitbook/` manually, keeping the same folder layout.

## Publish

1. Review preview in GitBook.  
2. Publish the space (public or unlisted for dogfood).  
3. Optional later: custom domain `docs.alfred.*` (ALF-001: pages.dev first).  
4. Paste the live URL below and in the root README.

**Live docs URL:** https://odyssey-15.gitbook.io/alfred-docs/

## Next ticket

**ALF-050** — expand Quickstart + Protocol excerpt for a polished public cut (screenshots, deeper ABI notes).

## Local preview tip

Any Markdown preview of `docs/gitbook/SUMMARY.md` is enough while iterating; GitBook is the published surface.
