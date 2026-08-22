# Speaker identity evidence

Speaker diarization answers which anonymous cluster spoke when. Attribution
answers which real person that cluster represents. Treat these as separate
claims with separate failure modes.

## Evidence hierarchy

Strongest evidence usually appears first, but evaluate the whole context:

1. `self_identification` — the cluster explicitly identifies itself.
2. `dialogue_identity_link` — an introduction or direct address binds a named
   participant to the cluster at a timestamp.
3. `human_audio_verification` or `user_verification` — a reviewer who knows the
   voice confirms the mapping.
4. `voice_reference_match` — a trusted known-speaker reference clip matches the
   cluster; record tool/model, reference hash, and score when available.
5. `publisher_metadata` / `authoritative_roster` — establishes who participated,
   but usually does not by itself bind a person to a cluster.
6. `conversational_context` — role, expertise, or first-person claims support an
   identity but may be misleading.
7. `llm_inference` — useful for proposing candidates, never for verification by
   itself.

The validator treats the first four types as binding evidence for `verified`.
`publisher_metadata`, `authoritative_roster`, `conversational_context`, and
`llm_inference` may support `candidate` or `probable` states.

## Status and confidence

- `unknown`: no identity asserted. `name` and `confidence` are null.
- `candidate`: a plausible named identity exists, but evidence is weak or
  incomplete.
- `probable`: multiple consistent signals or one strong non-binding signal make
  the identity likely; citation output still stays anonymous.
- `verified`: binding evidence supports the mapping and the evidence record is
  specific enough to audit.

Confidence is a numeric estimate from 0 to 1; it does not promote status. A
0.99 LLM guess remains unverified. Conversely, direct human verification may be
verified without pretending the numeric estimate is mathematically calibrated.

## Context before biometrics

For interviews and podcasts, the opening exchange often binds identities more
reliably and cheaply than a voice-recognition system:

```text
publisher roster + host introduction + named reply + stable diarization cluster
```

Use voice references when contextual evidence cannot resolve the mapping or when
independent corroboration is important. Obtain and use voice samples lawfully;
do not create a reusable biometric identity database unless the user explicitly
authorizes that broader scope.

## Citation rule

Citation-ready output may use a person's name only when the mapping is verified.
Keep the stable ID visible:

```text
[00:32:27.220-00:33:04.710] Alice Smith [SPEAKER_01]
```

Otherwise render:

```text
[00:32:27.220-00:33:04.710] SPEAKER_01
```

When a passage will be quoted or used as a lesson learned, review that passage
against the recording even if the global identity mapping is verified.

