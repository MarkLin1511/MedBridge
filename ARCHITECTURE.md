**Architecture (PoC)**

Mermaid diagram (render with any mermaid viewer):

```mermaid
flowchart LR
  A[Portal A (Epic/MyChart)] -->|API / Scraper| X[Ingest Adapters]
  B[Portal B (Cerner/Other)] -->|API / Scraper| X
  X --> Backend[Backend API (FastAPI)]
  Backend --> DB[(Normalized DB / Postgres)]
  Backend --> Analytics[Analytics / UI]
  Patient[Patient device / wearable] -->|optional| Backend
  ProviderUI -->|read| Backend
```

Notes
- Use FHIR (Observation / DiagnosticReport) where available. Map lab test names to LOINC codes for normalization.
- Ingest adapters: prefer vendor APIs (SMART-on-FHIR). Fallback: browser automation scraper or HL7-to-FHIR bridge.
- Security: TLS everywhere, OAuth2 for provider access, per-patient consent, audit logs, encryption at rest.
- MVP: focus on lab Observations (USCDI lab fields) and a normalized patient timeline.
