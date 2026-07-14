# QuickReportApp

## Purpose

QuickReportApp helps security guards convert raw logistics reports (copied from
Zalo) into a standardized Excel report in seconds, instead of typing everything
by hand into a spreadsheet.

Intended workflow:

```
Paste report text
      ↓
Parse text → extract known fields
      ↓
Detect missing required fields
      ↓
Show a modal to fill in only what's missing
      ↓
(Planned) attach photos: vehicle, ID card, seal
      ↓
Backend fills the Excel template (ExcelJS)
      ↓
Download the finished .xlsx
```

**Status: this is the target flow. It is fully implemented in the legacy
vanilla-JS frontend, and only partially implemented in the new React
frontend. See "Current State" below — do not assume both frontends work.**

---

## Current State — read this before changing anything

There are **two parallel frontends** in this repo right now, and they are not
in sync:

### 1. Legacy frontend — `public/` + root `app.js` (Express-served, vanilla JS)
- Served as static files directly by Express (`app.use(express.static(...public))`).
- `public/js/app.js` wires: textarea → `parseReportText` → `modalController.open()`.
- `public/js/modules/modal.js` renders a prefilled form modal, then a **preview
  step** (confirm/edit), then calls `onSubmit`, which POSTs to
  `/api/write-record` and downloads the returned `.xlsx` blob.
- **This is the only implementation that currently completes the full
  end-to-end flow.**

### 2. New frontend — `clients/` (React 19 + Vite + Tailwind v4)
- Runs on its own dev server (port 3001), not yet integrated as the served
  frontend for `app.js`.
- Currently **does not build/run correctly**. Concrete issues found:
  - `App.jsx` imports components from paths that don't exist
    (`@/components/desktop-top-nav`, `@/components/mobile-bottom-nav`,
    `@/components/create-report-button`, `@/components/report-chat`). The
    real files live under `components/layout/` and `components/report/` with
    PascalCase names. This only "works" today because of case-insensitive
    filesystems in local dev — it will fail on Linux/most CI/most hosts.
  - `components/report/index.js` re-exports a **default** export from
    `ReportChat.jsx`, but `ReportChat.jsx` only has named exports
    (`ReportChat`, `openReportChat`). This throws at module resolution.
  - `ReportFormModal` is never exported from `components/report/index.js`,
    even though `App.jsx` imports it from there.
  - `ReportChat.jsx` imports `checkIsValid` from `_#/modules/utils`, but that
    module only exports `buildTempRecordFromSupplementaryValues`.
    `checkIsValid` actually lives in `clients/src/utils/helper.js`.
  - `ReportChat.jsx`'s `handleSave` parses the pasted text and builds a temp
    record, then **discards it** — no modal, no API call. The "paste → detect
    missing → modal" flow is not wired on the React side.
  - `ReportFormModal.jsx` (the manual full-form path) **does** work end-to-end
    (submits to `/api/write-record`, downloads the file) — it's just not fed
    by the parser/chat flow.

### Backend is also currently broken
- `app.js` imports `buildWorkbookFromRecord` from `services/excel-export.js`,
  but **that file is empty**. The `/api/write-record` endpoint will throw at
  runtime as soon as it's hit.
- The real implementation of `buildWorkbookFromRecord` / `loadTemplate`
  exists, but in the wrong place: `clients/src/features/excel/exporter.js`
  and `template-loader.js`, inside the **frontend** source tree, importing
  Node built-ins (`path`, `url`) and `exceljs` directly. This cannot run in a
  browser bundle and was clearly meant to live in `services/` on the backend.

**Bottom line:** treat `public/` + root `app.js`/`services/` as the
currently-working system, and `clients/` as a rewrite-in-progress that needs
its import paths, exports, and Excel-generation logic fixed/moved before it
can replace the legacy frontend.

---

## Tech Stack

**Frontend (`clients/`)**
- React 19, Vite 8
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- `lucide-react` for icons
- Feature-based folder structure (`src/features/*`), UI components under
  `src/components/ui`

**Backend (root)**
- Node.js + Express 5
- ExcelJS (fills a `.xlsx` template rather than generating one from scratch)
- Multer (declared as a dependency, **not currently used** — no upload
  endpoint exists yet; the "attach photos" step is not implemented)
- `morgan` for request logging, `nodemon` for dev reload

**Shared**
- `configs/record-schema.js` is the single source of truth for field names,
  labels, aliases, Excel column mapping, and validators. Both the legacy
  frontend (`public/js`) and the backend (`services/record-validation.js`)
  import from it directly; the React frontend re-exports it via
  `clients/src/config/record-schema.js`. This is the right pattern — don't
  duplicate field lists elsewhere (see "Duplicated Logic" below for where
  that rule is already being broken).

---

## Folder Map (excluding node_modules, lockfiles, and build configs)

```
app.js                          # Express entry point, single POST /api/write-record
TODO.md

configs/
  record-schema.js              # single source of truth: fields, labels, aliases,
                                 # excel column map, validators, normalizers
  worksheet-config.js           # START_ROW / ROW_LIMIT / COL_LIMIT for the template

modules/                        # legacy shared parsing helpers (used by public/js)
  config.js                     # empty
  parser.js                     # parseReportText — duplicated, see below
  utils.js                      # buildTempRecordFromSupplementaryValues

services/
  record-validation.js          # validates request payload against RECORD_SCHEMA
  excel-export.js                # EMPTY — app.js imports from here and will crash

public/                         # legacy vanilla-JS frontend, statically served
  js/
    app.js                      # wires textarea -> parser -> modal -> POST -> download
    modules/
      modal.js                  # modal + preview/confirm UI, calls onSubmit

clients/                        # new React frontend (Vite, port 3001) — in progress
  index.html
  src/
    main.jsx
    App.jsx                     # BROKEN import paths, see "Current State"
    index.css / globals.css     # Tailwind v4 theme tokens (oklch palette, dark mode)
    components/
      layout/
        DesktopTopNav.jsx
        MobileBottomNav.jsx     # has the floating "+" button opening ReportChat
      report/
        CreateReportButton.jsx
        ReportChat.jsx          # paste-text modal — parses but doesn't submit
        ReportForm.jsx          # renders one <ReportField> per schema.formFields
        ReportField.jsx
        ReportFormModal.jsx     # manual full-form modal — this path actually works
        index.js                # BROKEN re-exports, see "Current State"
      ui/
        button.jsx              # small variant/size-based Button, no CVA dependency
    config/
      record-schema.js          # re-exports configs/record-schema.js
      worksheet-config.js       # re-exports configs/worksheet-config.js
      aliases.js                # LABELS (dup of schema.labels), PERSON_FIELDS,
                                 # GOODS_FIELDS, FIELD_ALIASES
    features/
      excel/
        exporter.js             # REAL buildWorkbookFromRecord logic — misplaced,
                                 # Node-only code sitting in the frontend tree
        template-loader.js      # loads __xlsx/Goods_Template.xlsx via Node fs — same issue
        index.js
      report/
        parser.js               # duplicate of modules/parser.js
        builder.js / normalizer.js / validator.js / index.js   # empty stubs
      image/
        compressor.js / uploader.js / index.js                 # empty stubs —
                                                                  # photo upload not built
      storage/
        indexed-db.js / local-storage.js / index.js             # empty stubs
    hooks/
      useDebounce.js / useLocalStorage.js                       # empty stubs
    utils/
      helper.js                 # checkIsValid (>=5 empty fields = invalid)
      array.js / date.js / object.js / string.js                # empty stubs
  public/
    assets/icons/icon.svg, assets/images/placeholder*.svg
    manifest.json
    service-workers.js          # empty placeholder, no actual SW registered
```

---

## Known Issues (found during this review)

**Blocking / will crash at runtime:**
1. `services/excel-export.js` is empty — `/api/write-record` will throw as
   soon as it's called, because `buildWorkbookFromRecord` is `undefined`.
2. `clients/src/components/report/index.js` re-exports a non-existent default
   export from `ReportChat.jsx`.
3. `clients/src/App.jsx` imports components from paths that don't match the
   actual filenames/casing.
4. `ReportChat.jsx` imports `checkIsValid` from a module that doesn't export it.

**Functional gaps (not crashes, but silently incomplete):**
5. The React "paste report" flow (`ReportChat.jsx`) parses text but never
   opens a review modal or calls the API — it's a dead end. Only the manual
   `ReportFormModal` full-form path actually submits and downloads.
6. Photo upload (vehicle/ID/seal photos) — mentioned in the intended
   workflow and in `package.json` (via `multer`) — has no implementation
   anywhere: `features/image/*` are empty stubs, and there is no
   `multer` middleware wired into `app.js`.
7. Client-side storage (`features/storage/*`, `hooks/useLocalStorage.js`) is
   scaffolded but unimplemented — no offline/draft support yet despite this
   being mentioned as a goal.

**Maintainability risks:**
8. `parseReportText`/`getFieldValueFromLine` exist in three places:
   `modules/parser.js`, `public/js/modules/parser.js`, and
   `clients/src/features/report/parser.js`. They're already drifting slightly
   (e.g. inconsistent handling of the commented-out `liDoRaVaoCong` field).
   Any parsing fix has to be applied three times or it will silently diverge.
9. Field labels are defined twice: `RECORD_SCHEMA.labels` in
   `configs/record-schema.js` (the shared contract) and again in
   `clients/src/config/aliases.js` as `LABELS`/`PERSON_FIELDS`/`GOODS_FIELDS`.
   `PERSON_FIELDS` looks like leftover scaffolding for a second Excel sheet
   type that isn't used anywhere (`template-loader.js` hardcodes
   `loadTemplate("Goods")`).
10. API base URL (`http://localhost:3000`) is hardcoded in both
    `public/js/app.js` and `clients/src/components/report/ReportFormModal.jsx`
    — no env-based config, will break outside local dev.
11. `clients/src/features/excel/*` contains backend-only logic (Node `path`,
    `url`, `exceljs`, filesystem template loading) sitting inside the Vite
    frontend bundle. Even once import paths are fixed, this code cannot run
    in a browser and needs to move to `services/` on the backend — it looks
    like it's actually the intended fix for issue #1 above, just filed in the
    wrong directory.

---

## Architecture Notes

- **Shared schema pattern is correct and worth keeping**: `configs/record-schema.js`
  centralizes field names, Excel column mapping, aliases, and validators, and
  both frontend and backend import the same file (directly on the backend,
  via a re-export on the frontend). Once the duplication in `aliases.js` and
  the three parser copies are resolved, this becomes a genuinely solid
  single-source-of-truth setup.
- **Compound fields** (e.g. `hoTen_ThuocCtyDonVi`, `soCont_SoSeal`) are
  resolved consistently through `resolveCompoundField`/`joinNonEmptyValues`
  in `record-schema.js`, and reused for both the payload builder and the
  validator. Good — don't reintroduce ad hoc string concatenation elsewhere.
- **Binary search for the next empty Excel row** (`findEmptyPairRow` in
  `features/excel/exporter.js`) is a reasonable optimization for appending to
  a large template, but currently unreachable dead code until it's moved to
  the backend and actually wired into `services/excel-export.js`.

---

## Coding Rules

- Functional components only, hooks for state/effects.
- Keep UI components (`ReportField`, `Button`) free of business logic;
  parsing/validation stays in `configs/` and `services/`/`features/*`.
- Single source of truth for field metadata: `configs/record-schema.js`.
  Do not add a second labels/aliases map without folding it into this file.
- SOLID / DRY, but avoid introducing abstractions before there's a second
  concrete use case.
- No new dependencies without a clear, current need (Multer is already an
  example of a dependency added ahead of its feature).

---

## Immediate Priorities (before adding new features)

1. Fix backend: implement `services/excel-export.js` for real (move/adapt
   the logic currently stranded in `clients/src/features/excel/*`), so
   `/api/write-record` stops crashing.
2. Fix `clients/` import paths and `components/report/index.js` exports so
   the React app actually builds and runs.
3. Wire `ReportChat.jsx` to actually open a review modal with parsed values
   and submit, matching what `public/js/modules/modal.js` already does.
4. Decide: retire `public/` once `clients/` reaches parity, or keep it as a
   fallback — but stop developing both in parallel with drifting logic.
5. Deduplicate `parseReportText` into one module both frontends import
   (the alias setup already supports this via the `_#/` path alias).

## Mid-Term Roadmap (from TODO.md)

- Harden `/api/write-record` payload validation (already partially done in
  `services/record-validation.js`; extend alias handling).
- Add a persistence layer (SQLite) so records aren't only written to Excel —
  enables listing/editing/filtering later.
- Split "save a record" from "generate workbook from saved records" into two
  endpoints.
- Implement the photo upload step (Multer is already installed for this).
- PWA basics: real service worker (`service-workers.js` is currently empty),
  installable manifest (already present).
- Test coverage for parsing, validation, and Excel export.
