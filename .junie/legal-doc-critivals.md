### High-ROI Missing Features — Strategic Assessment

The app's core value proposition is **eliminating the 24–48 hour legal document ping-pong in the B2B sales onboarding process**. Every feature should be evaluated against that single metric: *does it reduce the time-to-compliant-onboarding?*

Here is a prioritized breakdown of what's missing and how to implement it.

---

### 🥇 Priority 1: Onboarding Session State Machine (Highest ROI)

**What's missing:** The app can validate individual documents, but there is **no persistent onboarding session** that tracks the overall compliance state across all required document slots. The `OnboardingDocumentSlot` model exists in the schema but is never surfaced in the UI.

**Why it matters:** A sales rep currently has no single view showing "Client X has submitted 3 of 5 required documents, 1 is invalid." This is the core workflow the app is supposed to replace.

**How to implement:**
- **Backend**: Create a `POST /api/onboarding/sessions` endpoint that initializes a session with a predefined checklist of required `legal_doc_type` slots (e.g., Handelsregisterauszug, DPA, Haftpflichtversicherung, GmbH-Vertrag, Unterschriftenprobe).
- **Backend**: `GET /api/onboarding/sessions/{id}` returns the full session state: which slots are `PENDING`, `UPLOADED`, `VALID`, or `INVALID`.
- **Frontend**: A dedicated `/onboarding/:sessionId` page showing a checklist UI — each slot shows its status with a colored badge and the extracted info (VAT ID, HRB, parties) once validated.
- **Frontend**: The Onboarding Wizard (already linked in the sidebar) should be the entry point that creates a new session and guides the client through uploading each slot.

---

### 🥈 Priority 2: Client-Facing Shareable Onboarding Link

**What's missing:** Currently only internal users (sales team) can use the app. The client themselves cannot self-serve their document submission.

**Why it matters:** The biggest time sink is the back-and-forth email chain. If the client gets a link, uploads their documents, and sees *immediately* "Your Handelsregisterauszug is missing a signature on page 3," the ping-pong stops at the source.

**How to implement:**
- **Backend**: Add a `share_token` (UUID) to the `OnboardingSession` model. A `GET /api/onboarding/public/{share_token}` endpoint returns the session checklist without requiring JWT auth.
- **Backend**: A `POST /api/onboarding/public/{share_token}/upload` endpoint allows unauthenticated document upload into a specific slot, triggering validation immediately.
- **Frontend**: A minimal, branded `/onboarding/submit/{token}` page (no sidebar, no admin UI) that the client sees — just the checklist and upload buttons.

---

### 🥉 Priority 3: Automated Discrepancy Detection Across Documents (Cross-Document Consistency)

**What's missing:** The `compare_docs` / Golden Standard check exists as an LLM function but is only triggered manually per document. There is no **automatic cross-document consistency check** within a session.

**Why it matters:** A common failure mode is that the VAT ID on the DPA doesn't match the one on the Handelsregisterauszug, or the signatory name differs between documents. This is currently invisible.

**How to implement:**
- **Backend**: After all slots in a session reach `VALID` status, trigger a `POST /api/onboarding/sessions/{id}/cross-check` that:
    1. Fetches extracted info from all validated slots.
    2. Calls a new `llm.cross_check_consistency(extracted_infos: list[ExtractedInfo])` function that compares VAT IDs, HRB numbers, company names, and signatory names across all documents.
    3. Returns a `ConsistencyReport` with any discrepancies flagged.
- **Frontend**: Show a "Consistency Check" section at the bottom of the session view once all documents are uploaded.

---

### 4. Validation Result History & Audit Trail

**What's missing:** There is no persistent `ValidationResult` table in the database. Results are returned to the frontend but never stored. This means there is no audit trail and the admin metrics are meaningless (they count generic messages, not validations).

**Why it matters:** For legal compliance tooling, an audit trail is not optional — it's a selling point. "We can prove we checked this document on this date" is valuable to the client.

**How to implement:**
- **Backend**: Create a `validation_results` table: `id`, `session_id`, `doc_id`, `tenant_id`, `is_valid`, `missing_fields` (JSONB), `extracted_info` (JSONB), `compliance_notes` (JSONB), `created_at`.
- **Backend**: Persist every `validate_legal_document` call result to this table.
- **Backend**: Update `/api/admin/metrics` to count rows from `validation_results` instead of `messages` — making `validation_activity` actually meaningful.
- **Frontend**: Add a "Validation History" tab in the Admin page showing recent validation events with pass/fail status.

---

### 5. Email Notification on Session Completion / Failure

**What's missing:** There is no notification system. A sales rep has to manually check the app to see if a client has submitted documents.

**Why it matters:** The workflow breaks down if the sales rep doesn't know when to act. A simple email ("Client X has completed their onboarding — 1 document needs attention") closes the loop.

**How to implement:**
- **Backend**: Add a lightweight email service using `smtplib` or a provider like SendGrid/Resend. Trigger on two events:
    1. All slots in a session reach `VALID` → email the assigned sales rep: "Onboarding complete ✅"
    2. A slot reaches `INVALID` after client upload → email the client: "Your [DPA] needs correction: [missing_fields]"
- **Backend**: Store `assigned_sales_rep_email` and `client_email` on the `OnboardingSession` model.

---

### Summary Table

| Feature | ROI Impact | Implementation Effort |
|---|---|---|
| **Onboarding Session State Machine** | 🔴 Critical — core workflow | Medium (new DB table + 2 endpoints + 1 page) |
| **Client-Facing Shareable Link** | 🔴 Critical — eliminates email ping-pong | Medium (public auth bypass + minimal UI) |
| **Cross-Document Consistency Check** | 🟠 High — catches subtle errors | Low (new LLM prompt + 1 endpoint) |
| **Validation Result Persistence** | 🟠 High — audit trail + real metrics | Low (new DB table + persist on validate) |
| **Email Notifications** | 🟡 Medium — closes the workflow loop | Low (SMTP + 2 trigger points) |

The single highest-leverage change is the **Onboarding Session State Machine** — without it, the app is a collection of useful tools with no workflow glue. The **shareable client link** is the second most impactful because it removes the human (sales rep) as a bottleneck in the document submission step entirely.
