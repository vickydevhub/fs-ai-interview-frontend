# AI Interview Kit — Frontend

A Next.js + Tailwind frontend for creating, reviewing, editing, and practicing AI-generated interview preparation kits.

---

## 1. Assessment Scope

This frontend was implemented against the engineering assessment requirements for the AI Interview Kit application.

The UI supports:

- Authentication-aware dashboard and kit pages
- Creating interview kits from a job description and company URL
- Opening existing interview kits
- Company brief viewing and inline editing
- Role and requirements display
- Interview question management
- Question editing, adding, deleting, and reordering
- Moving questions between categories
- Flashcard management
- Flashcard practice
- Confidence and coverage tracking
- Preparation schedule viewing and editing
- Section-level regeneration
- Preservation of unrelated local edits during regeneration
- Generated/edited/pinned question state
- Loading, empty, and error states
- Responsive laptop and phone layouts
- Keyboard-friendly form controls

The implementation stays within the requested product scope and does not add unrelated search, analytics, or other features.

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