### Legal Copilot: Onboarding Wizard & Validation Service

To solve the "legal document ping-pong" in your sales process, you can extend your existing architecture with a specialized **Onboarding Wizard** and a **Validation Service**. This implementation leverages your current `ExtractionService` and `LLMService` to provide real-time feedback to clients.

---

### 1. Feature Specifications

#### **A. The "Onboarding Wizard" (React Frontend)**
*   **Structured Multi-Step Flow:** A guided UI that replaces generic file uploads with specific "slots" for required documents (e.g., *Handelsregisterauszug*, *DPA/DSGVO*, *Haftpflichtversicherung*).
*   **Real-time Validation Feedback:** Instead of a simple "Upload Success" message, the UI displays a "Checking Document..." state, followed by instant AI-driven results (e.g., "Missing signature on page 4").
*   **Extracted Data Confirmation:** A dedicated view showing the AI-extracted metadata (e.g., VAT ID, Registered Office) for the client to verify before submission.
*   **Progress Dashboard:** A summary view for both the client and the sales team showing the "Compliance Health" of the onboarding process.

#### **B. The "Validation Service" (FastAPI Backend)**
*   **Document Classification:** Automatically identifies if the uploaded file matches the expected type (e.g., ensuring a client didn't upload a recipe instead of a contract).
*   **Requirements Check (LLM-based):** A service that evaluates the document against a "Legal Checklist" using your existing LLM infrastructure.
*   **Metadata Extraction:** Specifically targeting German legal identifiers like *USt-IdNr*, *HRB-Nummer*, and authorized signatories (*Vertretungsberechtigte*).
*   **Discrepancy Reporting:** Comparing the uploaded text against your company's "Golden Standard" clauses and highlighting deviations.

---

### 2. Implementation Strategy

You can implement this by adding a new service layer and a specialized API route without changing your existing core logic.

#### **Backend Implementation (Python/FastAPI)**

1.  **New Service: `ValidationService`**
    Create a new file `backend/services/validation.py` that orchestrates the flow:
    *   Call `extraction.extract_text(file_path, mime_type)` to get the raw content.
    *   Call a new `llm.validate_legal_document(text, doc_type)` method.

2.  **Specialized "Legal Verification" Prompt:**
    In `backend/services/llm.py`, add a function that uses a structured prompt like this:
    ```text
    Role: German Legal Compliance Auditor
    Task: Validate the provided [DOC_TYPE] against the following criteria:
    1. Presence of a handwritten or qualified electronic signature.
    2. Document date must be within the last 90 days.
    3. Must include a valid German VAT ID (USt-IdNr).
    
    Content: [EXTRACTED_TEXT]
    
    Output Format: JSON { "is_valid": bool, "errors": [], "extracted_info": {} }
    ```

3.  **API Route:**
    Add a new endpoint in `backend/api/routes/documents.py`:
    `POST /api/documents/validate-onboarding`
    This route will handle the upload, trigger the `ValidationService`, and return the JSON result immediately to the frontend.

#### **Frontend Implementation (React)**

1.  **Route & Component:**
    Add a new route `/onboarding/wizard` and a corresponding component.
2.  **Stateful Uploaders:**
    Use a state machine to track the status of each document: `PENDING` -> `UPLOADING` -> `VALIDATING` -> `READY` or `ERROR`.
3.  **Integration:**
    When a file is selected, call the new `/validate-onboarding` endpoint. Use the returned `errors` array to show toast notifications or red highlights directly on the "Step" in the wizard.

---

### 3. Why this works for your German Sales context
*   **Language Precision:** By using GPT-4o via your `LLMService`, the system understands complex *Juristendeutsch* and can map it to your internal compliance rules.
*   **Zero Infrastructure Change:** You are simply "piping" data through your existing extraction and LLM services with new instructions.
*   **Immediate ROI:** You eliminate the 24-48 hour delay of a manual legal review by giving the client a "Self-Correction" tool at the point of entry.