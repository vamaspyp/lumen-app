# A63 · POTENCIAL / Supabase ↔ React contract (2026-10-02)

Authority: POV A63; V46/V51/V52/V53/V55/V56/V58/V62. Scope is **additive, non-breaking infrastructure**, not Source equivalence/matching activation.

## Existing free expression (preserved)
`public.lumen_s2_set_life_context(p_adjustable text,p_external text,p_potential text)` stores the person's editable free-text Potencial in `gf_private.life_context.potential`, requiring authentication and memory consent.

## New RPCs (migration 20261002120000)
- `lumen_potential_snapshot()` → `{memory_allowed:boolean,potential:string|null,manifestations:[{id:string,text:string,status:'candidate'|'confirmed',source_kind:string,revision:number,updated_at:string}]}`. With no memory consent, returns no personal data.
- `lumen_potential_manifestation_set(p_text:string,p_inference_id?:string|null,p_reject?:boolean)` → `{state:'success',id:string,status:'confirmed'|'rejected'}`. No id creates a person-confirmed open manifestation; own id corrects or rejects; another person's id is unavailable. Rejection requires id. 1–500 chars for creation/correction. Requires memory consent.

Both RPCs are SECURITY DEFINER, empty search_path, authenticated-only; `anon` has no EXECUTE. The manifestation is stored in existing `gf_core.inferences` with `inference_kind='potential_manifestation'`; not a score, diagnosis, canonical capability, or required matching key.

React integration: read snapshot only when authenticated; render the editable free-text `potential` separately from revisable manifestations. Preserve `memory_allowed=false` as an empty/private state. Do not send the person's private potential into public Source discovery or treat legacy `capacity_keys` as Potencial.

## Boundaries / next gate
The existing `lumen_s1_moment_constellation`, `lumen_source_discover`, and legacy `capacity_keys` are intentionally unchanged. Universal-wisdom concept/equivalence matrix remains staged until provenance/curation and A66–A68 Source gates. Matching convergence requires separate end-to-end tests (covered, partial, NO_MATCH, safety, cross-user), followed by HUMAN/EXPERIENCE PASS. This migration alone does not close A63.

Evidence: GitHub commit c9e5a37e6f30c11df45096cdea7f1bb50eaa0bb3; Supabase migration `a63_open_potential_contract` applied successfully; both functions verified present, authenticated EXECUTE true and anon EXECUTE false.