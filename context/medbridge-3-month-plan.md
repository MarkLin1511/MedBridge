# MedBridge
## 3-Month Product Plan

### Mission
MedBridge is building a universal, patient-controlled health record layer that ingests records from fragmented healthcare systems, normalizes them into one timeline, and makes them portable across care settings.

### Core Product Thesis
Healthcare did not fail to digitize. It failed to unify.

MedBridge solves that by combining:
- FHIR when available
- C-CDA when export exists
- OCR and AI when records are messy

## Beta Goals
- Let patients bring records from multiple sources into one place
- Turn structured and unstructured records into one normalized timeline
- Make outside records easier to review and share with providers
- Prove product value before attempting bidirectional EHR write-back

## Product Framework
- Ingest anything
- Normalize everything
- Share cleanly

## 3-Month Roadmap

### Month 1
#### Universal Intake Foundation

##### 1. Document Upload System
Problem solved:
Patients already have records, but they are trapped in PDFs, images, screenshots, and scanned paperwork.

Scope:
- Upload PDFs, images, screenshots, and scanned records
- Store originals securely
- Attach source name, provider, document date, and record type
- Show uploaded files inside the patient record experience

##### 2. OCR Pipeline
Problem solved:
Uploaded records are not useful if they stay as raw files.

Scope:
- Run OCR after upload
- Extract raw text from PDFs and images
- Track OCR status: pending, processing, complete, failed
- Save extracted text for downstream AI processing

##### 3. AI Record Extraction
Problem solved:
Raw OCR text must be turned into structured medical information before it becomes clinically useful.

Scope:
- Extract labs, medications, diagnoses, encounters, providers, and dates
- Add confidence scores to extracted fields
- Save structured drafts separately from confirmed timeline records

##### 4. Review Queue
Problem solved:
AI extraction is never perfect and must be reviewable.

Scope:
- Show low-confidence extracted records in a review queue
- Let users approve, edit, reject, or merge records
- Prevent uncertain records from silently entering the main timeline

### Month 2
#### Structured Interoperability

##### 5. Internal Normalization Layer
Problem solved:
Records from different systems need one shared schema before they can be used together.

Scope:
- Normalize all sources into MedBridge entities
- Standardize Patient, Medication, Observation, Condition, Encounter, and DocumentReference
- Preserve source provenance for every normalized record

##### 6. C-CDA / CCD Import
Problem solved:
Many EHRs can export records before they can sync live.

Scope:
- Accept C-CDA / CCD uploads
- Parse meds, allergies, conditions, encounters, labs, and demographics
- Insert parsed records into the normalized MedBridge layer

##### 7. FHIR Connector MVP
Problem solved:
Compatible portals should sync structured records without manual upload.

Scope:
- Support at least one SMART on FHIR-compatible portal
- Import read-only demographics, meds, labs, conditions, and encounters
- Track sync status and last successful sync time

##### 8. Deduplication and Reconciliation
Problem solved:
The same record can appear multiple times from different sources.

Scope:
- Detect likely duplicates
- Merge or group repeated records
- Preserve provenance while avoiding clutter in the timeline

### Month 3
#### Unified Timeline and Provider Workflow

##### 9. Unified Patient Timeline
Problem solved:
Care fragmentation comes from scattered data and no coherent patient story.

Scope:
- Show all records in one timeline
- Filter by source, record type, and date
- Show provenance and confidence indicators where relevant

##### 10. Provider-Ready Export Packet
Problem solved:
Patients still struggle to carry complete records into new visits.

Scope:
- Generate a summary packet
- Include medications, diagnoses, recent labs, encounters, and linked documents
- Export as PDF first

##### 11. Simple Share Flow
Problem solved:
Patients need a clean way to share records with new providers.

Scope:
- Generate a provider share link or downloadable packet
- Support basic access controls
- Track sharing in the audit log

##### 12. Trust and Operations Layer
Problem solved:
Healthcare products need visibility, traceability, and operational reliability.

Scope:
- Audit imports, uploads, syncs, shares, and access
- Improve import and sync error states
- Add internal tooling for debugging ingestion failures

## Why These Features First
- They solve the fragmentation problem immediately
- They work even when APIs are incomplete
- They avoid the hardest early challenge: bidirectional EHR write-back
- They create a valuable patient experience before deep enterprise integrations
- They prove that MedBridge can normalize messy real-world records

## Beta Success Criteria
By the end of the first 3 months, MedBridge should be able to prove:
- Patients can import records from multiple sources
- Uploaded documents can become structured draft medical data
- One timeline can unify records better than any single portal
- Patients can export or share a usable provider packet
- Providers can understand the source of each imported record

## Immediate Build Order
1. Document upload system
2. OCR pipeline
3. AI extraction

That sequence creates the first meaningful MedBridge workflow:

A patient uploads a medical record and sees it transformed into a structured draft that can eventually become part of one portable health timeline.
