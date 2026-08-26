# Architecture

The repository separates immutable human-authored requirements, transcript
evidence preparation, and the browser application that presents conference
lessons with transcript-grounded retrieval.

## System design

```mermaid
flowchart LR
    K[KERNEL: human-authored authority] --> S[Derived specs and validation]
    A[Audio/video and publisher metadata] --> G[get-transcript]
    G --> R[Immutable acquired transcript]
    R --> F[fix-transcript]
    F --> C[Corrected timestamped words]
    A --> D[Anonymous diarization backend]
    C --> J[Timestamp reconciliation]
    D --> J
    J --> I[attribute-speakers evidence map]
    I --> O[Citation-ready attributed transcript]
    C --> APP[Conference recap web app]
    O --> APP
    APP --> RET[Browser retrieval]
    RET --> API[Server-side model API]
```

Transcript responsibilities are intentionally non-overlapping:

- `get-transcript` owns acquisition and source provenance.
- `fix-transcript` owns proposed and verified word corrections.
- `attribute-speakers` owns anonymous speaker labels, identity evidence, and
  citation-safe rendering. It cannot change words or timestamps.

The app keeps the API key server-side, retrieves relevant transcript passages in
the browser, and sends only selected excerpts to the allowed model endpoint.

## User journey

```mermaid
flowchart TD
    U[Open conference recap] --> H[Choose a highlighted session]
    H --> T[Read fixed transcript]
    T --> V{Inspect evidence?}
    V -->|Compare wording| RAW[Overlay original transcript]
    V -->|Check speaker| SPK[View verified name plus stable speaker ID]
    V -->|Ask a question| Q[Transcript-grounded chat]
    RAW --> T
    SPK --> T
    Q --> E[Review cited excerpt and timestamp]
```

Speaker identities that are not verified remain anonymous in citation-ready
output. Review-only output may show a candidate name with an explicit question
mark.
