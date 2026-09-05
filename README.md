# AI Interview Kit — Frontend

A Next.js + Tailwind frontend for creating, reviewing, editing, and practicing AI-generated interview preparation kits.

## 1. Assessment Scope

This frontend was implemented against the engineering assessment requirements for the AI Interview Kit application.

The UI supports:

- Authentication-aware dashboard and kit pages
- Creating and opening interview kits
- Company brief viewing and inline editing
- Role and requirements display
- Interview question management
- Flashcard management
- Preparation schedule viewing and editing
- Flashcard practice
- Coverage and confidence tracking
- Section-level regeneration while preserving unrelated local edits
- Responsive laptop/phone layouts
- Loading, empty, and error states
- Immediate local UI updates for editing and reordering

The implementation intentionally stays within the requested product scope and does not add unrelated search, analytics, or other features.

---

## 2. Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios
- Next.js App Router

The frontend communicates with the Node.js/Express backend through the configured API base URL.

---

## 3. Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── kits/
│       ├── new/
│       │   └── page.tsx
│       └── [id]/
│           └── page.tsx
│
├── components/
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   ├── Loading.tsx
│   └── ErrorMessage.tsx
│
├── lib/
│   ├── api.ts
│   └── auth.ts
│
└── types/
    └── index.ts
```

---

## 4. Environment Configuration

Create `.env.local` in the frontend project:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

For deployment, replace the value with the deployed backend API URL.

Example:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

Do not commit secrets to the frontend environment.

---

## 5. Running the Frontend

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The application normally runs at:

```text
http://localhost:3000
```

Create a production build:

```bash
npm run build
```

Start the production build:

```bash
npm start
```

---

# 6. Authentication

Protected application pages use `ProtectedRoute`.

The frontend checks authentication through:

```text
GET /api/kits
```

Unauthenticated users are redirected to:

```text
/login
```

Logout uses:

```text
POST /api/auth/logout
```

The Axios client is configured with:

```ts
withCredentials: true
```

so the backend session cookie can be used.

---

# 7. Interview Kit Builder

The main builder is:

```text
src/app/kits/[id]/page.tsx
```

The page provides the complete kit editing workflow.

## Company Brief

Users can:

- View company summary
- View what the company does
- Edit both fields inline
- Save changes
- Cancel editing
- Regenerate the company brief

The save operation uses:

```text
PATCH /api/kits/:id
```

Only the `company_brief` section is sent when saving the brief.

---

# 8. Interview Questions

The question builder supports:

### Edit

Users can edit:

- Question prompt
- Answer outline

### Add

Users can create a new question with:

- Prompt
- Answer outline
- Category
- Difficulty

### Delete

Questions can be deleted individually.

### Reorder

Questions can be moved:

- Up
- Down

The UI updates immediately and then persists the new ordering.

### Move Between Categories

Each question has a category selector so it can be moved to another existing category.

### Difficulty

The UI supports the required difficulty range:

```text
1 = easier
2 = medium
3 = harder
```

---

# 9. Generated / Edited / Pinned State

The frontend distinguishes manually changed questions from generated questions.

A question becomes locally protected when the user:

- Edits it
- Adds it
- Moves it
- Reorders it

Protected questions are displayed with:

```text
Edited / pinned
```

This state is stored locally per kit using browser `localStorage`.

The storage key follows:

```text
ai-interview-kit-builder-{kitId}
```

This avoids adding another backend API requirement while still allowing the browser to remember which questions must survive section regeneration.

---

# 10. Section Regeneration

The existing backend regeneration endpoint returns a complete regenerated kit.

The frontend does **not** replace the complete current kit with that response.

Instead, the frontend requests regeneration and merges only the selected section.

Supported regeneration actions:

### Company Brief

Only:

```text
company_brief
```

is replaced.

### Question Category

Only questions belonging to the selected category are regenerated.

Questions marked as edited/pinned are retained.

### Schedule

Only:

```text
schedule
```

is replaced.

This prevents unrelated user edits from being clobbered by regeneration.

For example:

```text
User edits Question A
        ↓
User regenerates Technical category
        ↓
Question A remains
        ↓
Other regenerated technical questions are refreshed
```

---

# 11. Flashcards

The flashcard builder supports:

- View front
- Reveal answer
- Edit
- Add
- Delete

Manually edited or added cards are marked as edited locally.

The flashcard structure follows:

```text
id
front
back
requirement_ids
```

---

# 12. Flashcard Practice

The Practice section implements the required one-card-at-a-time workflow.

A practice session:

1. Selects one flashcard
2. Shows the front
3. Lets the user reveal the answer
4. Allows a confidence rating from 1–5
5. Marks the card as covered
6. Moves to the next card

Confidence:

```text
1 = lowest confidence
5 = highest confidence
```

Practice state is stored locally per kit.

The next practice session prioritizes:

1. Uncovered cards
2. Lower-confidence cards

This means cards the user is least confident about appear earlier in later sessions.

The UI also displays:

```text
Covered: X/Y
```

---

# 13. Preparation Schedule

The schedule displays exactly the number of days generated for the kit.

Each day includes:

- Day number
- Focus
- Minutes
- Question IDs

Users can edit:

- Focus
- Minutes
- Question IDs

Question IDs are validated against the questions currently present in the kit before saving.

The schedule can also be regenerated independently.

The frontend preserves the rest of the kit when the schedule is regenerated.

---

# 14. Loading, Empty and Error States

The frontend includes explicit states for:

### Loading

Example:

```text
Loading interview kit...
```

### Empty

Examples:

```text
No questions available.
```

```text
No flashcards available.
```

### Errors

API errors are shown using the reusable `ErrorMessage` component.

Save and regeneration actions also show appropriate progress text such as:

```text
Saving...
Regenerating...
Deleting...
```

Buttons are disabled while the relevant operation is running.

---

# 15. Responsive and Keyboard-Friendly UI

The UI uses Tailwind responsive utilities and works across:

- Laptop
- Desktop
- Phone-sized layouts

Forms use standard:

- Inputs
- Textareas
- Selects
- Buttons
- Details/summary controls

This keeps the builder usable with both mouse/touch and keyboard navigation.

---

# 16. Data Persistence

Kit content is persisted through the backend API using:

```text
PATCH /api/kits/:id
```

The frontend updates the visible state immediately for editing/reordering operations and then persists the change.

Local browser state is used for builder metadata that is not part of the existing kit schema:

- Edited/pinned question IDs
- Edited flashcard IDs
- Brief edited marker
- Flashcard confidence
- Flashcard coverage

This avoids overwriting the server's canonical kit content while supporting the requested editing and practice experience.

---

# 17. Long-Running Generation and Regeneration

Generation/regeneration operations can take time.

The frontend therefore:

- Shows progress text
- Disables conflicting actions while the operation is active
- Keeps the current kit in memory
- Merges only the regenerated section
- Does not replace unrelated edits

This is especially important for section regeneration because the backend currently returns a full generated kit.

---

# 18. Important API Contract

The frontend expects the backend to provide endpoints equivalent to:

```text
POST   /api/auth/logout
GET    /api/kits
GET    /api/kits/:id
PATCH  /api/kits/:id
DELETE /api/kits/:id
POST   /api/kits/:id/regenerate
```

The frontend uses the existing backend regeneration endpoint and performs section-level merging on the client.

---

# 19. Validation Expectations

The frontend performs basic interaction-level validation, including:

- Required question prompt before adding
- Required flashcard front before adding
- Positive schedule minutes
- Existing question IDs when editing schedule assignments

The backend remains responsible for authoritative validation of the final kit structure and persisted data.

---

# 20. Testing / Verification

Before submission, run:

```bash
npm run build
```

Then start the application:

```bash
npm run dev
```

Verify the following manually:

### Authentication

- Register
- Login
- Logout
- Protected page redirects

### Kit

- Open existing kit
- Delete kit

### Company Brief

- Edit
- Save
- Cancel
- Regenerate

### Questions

- Edit
- Save
- Add
- Delete
- Move up/down
- Change category
- Regenerate category
- Confirm edited/pinned questions survive regeneration

### Flashcards

- Add
- Edit
- Delete
- Reveal answer

### Practice

- Start practice
- Reveal answer
- Set confidence
- Mark cards covered
- Finish session
- Start another session and verify low-confidence/uncovered cards are prioritized

### Schedule

- Edit day
- Save focus/minutes/question IDs
- Regenerate schedule
- Confirm other kit sections remain unchanged

---

# 21. Assessment Alignment

The frontend implementation addresses the requested product areas:

| Requirement | Frontend Support |
|---|---|
| View generated kit | Yes |
| Company brief | Yes |
| Role and requirements | Yes |
| Edit questions | Yes |
| Reorder questions | Yes |
| Move question category | Yes |
| Add question | Yes |
| Delete question | Yes |
| Edit answer outline | Yes |
| Edit flashcards | Yes |
| Add/delete flashcards | Yes |
| Section regeneration | Yes |
| Preserve unrelated edits | Yes |
| Preserve edited questions | Yes |
| Generated/edited state | Yes |
| Practice flashcards | Yes |
| Reveal answers | Yes |
| Confidence tracking | Yes |
| Covered/uncovered tracking | Yes |
| Least-confidence ordering | Yes |
| Schedule display | Yes |
| Schedule editing | Yes |
| Schedule regeneration | Yes |
| Loading states | Yes |
| Empty states | Yes |
| Error states | Yes |
| Responsive UI | Yes |
| Keyboard-friendly controls | Yes |

---

# 22. Final Build Checklist

Run:

```bash
npm install
npm run build
```

If the build succeeds, start the frontend:

```bash
npm run dev
```

Then verify the complete user flow:

```text
Register
   ↓
Login
   ↓
Dashboard
   ↓
Create/Open Kit
   ↓
Review Company + Role + Requirements
   ↓
Edit Questions
   ↓
Edit/Reorder/Move Questions
   ↓
Edit/Add/Delete Flashcards
   ↓
Practice Flashcards
   ↓
Edit Schedule
   ↓
Regenerate Individual Sections
   ↓
Verify Edits Are Preserved
```

## 23. Scope Note

No new backend endpoint was introduced for frontend section regeneration.

The frontend uses the existing full-kit regeneration endpoint as a generation source and merges only the requested section into the currently edited kit. This was intentionally done to avoid changing the existing backend implementation while preventing unrelated frontend edits from being overwritten.
