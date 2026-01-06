# Feature Plan: Subscription Import (CSV & Image)

## 1. Overview
Allow users to import subscription data from external sources (Bank CSV statements, PDF statements, or Payment Slips/Screenshots) to reduce manual data entry effort.

## 2. Location & UX
**Selected Approach:** **Header Action Button + Modal**

### Target Page: `src/pages/add-subscription.tsx`

### UI Components
1.  **Header Button:**
    *   Add an "Import" icon button (FileText or UploadCloud icon) to the right side of the Header in `add-subscription.tsx`.
    *   Clicking this opens the **Import Dialog**.

2.  **Import Dialog (Modal):**
    *   **Title:** "Import Subscriptions"
    *   **Body:** 
        *   Tab 1: **Statement (CSV)** - Drop zone for `.csv` files.
        *   Tab 2: **Image (Slip/PDF)** - Drop zone for images/PDFs.
    *   **Footer:** "Cancel" and "Process" buttons.

3.  **Result View (Import Review) - *CRITICAL STEP*:**
    *   **Never save directly.** Always show a preview table first.
    *   **Columns:** 
        *   Checkbox (Select to import)
        *   Date (Parsed)
        *   Original Description (From CSV)
        *   Matched Name (Editable, auto-guessed)
        *   Amount (Parsed)
        *   Category (Auto-guessed or default)
    *   **Actions:** 
        *   Bulk Select/Deselect.
        *   Inline editing for Name/Amount/Category.
        *   "Delete" row (remove from import list).
    *   **Bottom Action:** "Confirm Import [N] Items".

## 3. Technical Strategy

### A. CSV Import (Client-Side) - *Phase 1 Priority*
- **Library:** `papaparse`
- **Mapping Logic (Heuristic):**
    - **Header Detection:** scan for keywords to identify columns:
        - `Date`: "date", "time", "วัน", "เวลา"
        - `Description`: "description", "memo", "details", "merchant", "รายการ"
        - `Amount`: "amount", "debit", "withdrawal", "จำนวน", "ถอน"
    - **Data Cleaning:**
        - Remove currency symbols (฿, THB, $).
        - Handle negative numbers (convert to positive for expense tracking).
    - **Smart Name Matching:**
        - Simple `includes` check: if desc has "Netflix" -> Name = "Netflix", Category = "Entertainment".
        - Use a predefined `KEYWORD_MAP` constant.

### B. Header Integration
- Modify `src/pages/add-subscription.tsx` to add the icon button in the top header section.

## 4. Implementation Steps

### Step 1: UI Setup
1.  Create `ImportDialog` component (using `shadcn/ui` Dialog).
2.  Update `add-subscription.tsx` to include the "Import" button in the header.
3.  Connect the button to open the Dialog.

### Step 2: CSV Parsing Logic
1.  Install `papaparse`.
2.  Create `src/lib/importUtils.ts` with:
    - `parseCSV(file)` function.
    - `mapCSVToTransactions(data)` function with the heuristic logic.
3.  Handle file selection in `ImportDialog` and pass file to parser.

### Step 3: Review & Save
1.  Create `ImportReviewTable` component to display parsed results.
2.  Implement `bulkCreateSubscriptions` method in `subscriptionService`.
3.  Save selected items to Supabase.