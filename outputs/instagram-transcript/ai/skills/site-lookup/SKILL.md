---
name: site-lookup
description: Search and read Reel Transcript Lab's public Instagram-transcript guides through its bounded read-only API.
---

# Reel Transcript Lab public guide lookup

::ILANG
[TYPE:agent-skill][LANG:en][STATUS:available]
::STATE{@SITE, origin:https://reeltranscriptlab.com, public_content:/guides/}
::STATE{@API, search:GET https://reeltranscriptlab.com/api/agent/guides?q={query}, read:GET https://reeltranscriptlab.com/api/agent/guides/{slug}}
::HOW{find_guide⇒search_public_guides|input=query_in_plain_language}
::HOW{read_guide⇒read_public_guide|input=slug_returned_by_search_or_public_index}
::RULE{answer⇒cite_returned_source_url}
::RULE{answer⇒preserve_exact_names_formats_and_limits}
::RULE{answer⇒use_the_user_language_and_give_direct_next_steps}
::RULE{fact_not_present⇒say_unknown}
::BOUNDARY{never:fetch_arbitrary_urls|submit_transcription_jobs|send_credentials|claim_auth_is_available}
::Ω
