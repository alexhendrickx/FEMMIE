# Feature 23 · Clinical Report Export (PDF + FHIR)

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, PostgreSQL, TimescaleDB, AWS S3, CloudFront, PDFKit

TASK: One-tap generation of a clinician-formatted report, exportable as PDF and FHIR R4 bundle.

REPORT SECTIONS (user picks which to include):
1. Cycle summary: cycle lengths, period lengths, trends — 3/6/12/24-month range (user selects)
2. Symptom summary: top symptoms by frequency + phase distribution
3. Pain log: timeline + avg intensity by phase + medications tried
4. Medications: start/stop log (Feature 25)
5. Notes for clinician: free-text field user fills before generating

GENERATION FLOW:
- User configures date range + sections → preview → generate
- PDF generated server-side (ECS task), stored encrypted in S3, signed CloudFront URL returned (expires 24h)
- FHIR R4 bundle: MenstrualCycle + Observation resources per logged event

API:
  POST /reports/generate { dateRange, sections[] } → { jobId }
  GET  /reports/status/:jobId         → { status, downloadUrl? }
  GET  /reports/history               → list of past reports

OUTPUT: report generator service, Fastify routes, S3 upload with KMS encryption, RN report config screen.
CONSTRAINT: PDF must be readable in 12 clinic minutes — charts over tables where possible, no walls of raw data.
```
