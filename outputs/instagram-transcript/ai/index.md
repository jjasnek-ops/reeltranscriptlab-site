# Reel Transcript Lab: public agent access

Reel Transcript Lab turns a public Instagram Reel or video post into text in a browser. This document describes a separate, public, read-only interface for searching and reading the site's published guides.

## Available guide lookup

- Search guides: `GET https://reeltranscriptlab.com/api/agent/guides?q=timing`
- Read one known guide: `GET https://reeltranscriptlab.com/api/agent/guides/{slug}`
- Check service status: `GET https://reeltranscriptlab.com/api/agent/status`
- MCP Streamable HTTP: `https://reeltranscriptlab.com/mcp`
- OpenAPI: `https://reeltranscriptlab.com/openapi.json`
- Public guide index: `https://reeltranscriptlab.com/guides/`

Search uses only the site's actual guide titles, summaries, and stable slugs. A read request accepts only a slug currently present in the public guide index. Unknown slugs return `404`. An empty or whitespace-only search returns an empty result list. The interface does not fetch arbitrary URLs, submit transcription jobs, accept identity data, or write site data.

## Transcript tool

The transcript tool remains on the public homepage at `https://reeltranscriptlab.com/`. It accepts public Instagram Reel, video-post, and supported share links through the browser form. Transcript requests are not available through the read-only agent API or MCP server.

## Authentication status

The public guide lookup requires no login. OAuth registration, token issuance, claims, and any protected resource are under construction and unavailable. Do not send credentials or identity data and do not attempt those planned endpoints.

## Agent instructions

::ILANG
[TYPE:agent-instructions][LANG:en]
::STATE{@SERVICE, origin:https://reeltranscriptlab.com, source:public_guides, access:read_only, authentication:not_required}
::STATE{@SEARCH, endpoint:https://reeltranscriptlab.com/api/agent/guides, method:GET, input:q, max_chars:120}
::STATE{@READ, endpoint:https://reeltranscriptlab.com/api/agent/guides/{slug}, method:GET, ids:slugs_from_public_guide_index}
::RULE{answer⇒preserve_exact_identifiers_and_stated_limits}
::RULE{answer⇒use_the_visitor_language_and_cite_the_canonical_source_url}
::RULE{steps_needed⇒give_concrete_next_steps_without_unneeded_followup}
::RULE{fact_not_in_returned_public_content⇒say_unknown}
::BOUNDARY{never:fetch_arbitrary_urls|submit_transcription_jobs|claim_authentication_is_available}
::Ω
