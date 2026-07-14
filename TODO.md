# TODO

> Reordered after a full codebase review (see PROJECT_CONTEXT.md for details).
> Section 1 used to say "recently completed" — some of those items are not
> actually true right now (see Section 0). Fix those before building anything
> new on top of them.

## 0. Blocking bugs (found during review — do these first)

These aren't nice-to-haves, they mean core paths currently crash or don't run.

- [ ] `services/excel-export.js` is empty. `app.js` imports
      `buildWorkbookFromRecord` from it — `/api/write-record` will throw the
      moment it's hit. The real implementation already exists, just in the
      wrong place: `clients/src/features/excel/exporter.js` +
      `template-loader.js`. Move/adapt that logic into `services/`.
- [ ] `clients/src/App.jsx` imports components from paths that don't match
      real files (`@/components/desktop-top-nav`, `@/components/mobile-bottom-nav`,
      `@/components/create-report-button`, `@/components/report-chat`). Fix
      the import paths to match `components/layout/*` and `components/report/*`.
- [ ] `clients/src/components/report/index.js` re-exports a default export
      from `ReportChat.jsx` that doesn't exist (it only has named exports).
      Also missing an export for `ReportFormModal`, which `App.jsx` needs.
- [ ] `ReportChat.jsx` imports `checkIsValid` from `_#/modules/utils`, but
      that module doesn't export it — it lives in `clients/src/utils/helper.js`.
      Fix the import.
- [ ] `ReportChat.jsx`'s `handleSave` parses text into `tempRecord` and then
      discards it — no modal, no submit. Wire it to actually show a review
      step and call the API (mirror what `public/js/modules/modal.js`
      already does correctly).

## 1. Already working (confirmed during review)

- [x] Legacy vanilla-JS frontend (`public/js/app.js` + `modules/modal.js`)
      completes the full flow: paste → parse → prefill modal → preview/confirm
      → POST → download `.xlsx`.
- [x] `ReportFormModal.jsx` (manual full-form entry in the React app) submits
      to `/api/write-record` and downloads the result — this path is fine on
      its own, it's just not fed by the parser/chat flow yet.
- [x] Shared schema (`configs/record-schema.js`) is used consistently by the
      backend validator and both frontends for field names, labels, and
      Excel column mapping.
- [x] Time/field normalization (`normalizeTime`, compound field resolution)
      is centralized and reused for both payload building and validation.

## 2. Consolidation (do before adding features, not after)

- [ ] `parseReportText`/`getFieldValueFromLine` currently exist in three
      places (`modules/parser.js`, `public/js/modules/parser.js`,
      `clients/src/features/report/parser.js`) and are already slightly out
      of sync. Pick one canonical location (likely `modules/parser.js`,
      imported via the existing `_#/` alias) and delete the other two.
- [ ] `clients/src/config/aliases.js` duplicates `RECORD_SCHEMA.labels` as a
      separate `LABELS` object, plus unused `PERSON_FIELDS`/`GOODS_FIELDS`
      scaffolding for a sheet type that isn't implemented
      (`template-loader.js` hardcodes `loadTemplate("Goods")`). Either wire up
      the second sheet type or delete the dead scaffolding.
- [ ] Decide the fate of `public/`: once `clients/` reaches parity (see
      Section 0), retire the vanilla-JS frontend rather than maintaining two
      versions of the same parsing/modal logic in parallel.

## 3. Harden validation & error handling

- [ ] Validate `req.body.tempRecord` before JSON parsing (partially done in
      `services/record-validation.js` — extend edge-case coverage).
- [ ] Add stricter schema checks for required fields and types.
- [ ] Normalize additional aliases (id/cccd, soCont/soSeal — already partly
      handled via `RECORD_SCHEMA.aliases`, verify coverage is complete).
- [ ] Avoid hardcoded `http://localhost:3000` in `public/js/app.js` and
      `ReportFormModal.jsx` — move to an env-driven API base URL so
      production builds don't silently point at localhost.

## 4. File I/O and error handling (backend)

- [ ] Avoid relying on a fixed temp path if possible.
- [ ] Clean up temp files on error or if the download is interrupted.
- [ ] Add clearer logging for export failures (currently just
      `console.error` + generic 500 in `app.js`).

## 5. Frontend UX

- [ ] Show success/failure feedback after submit (partially present in
      `ReportFormModal` via `message` state; not present at all in
      `ReportChat`, which currently has no feedback since it doesn't submit).
- [ ] Support entering multiple records in one session before exporting.

## 6. Photo upload (not started)

- [ ] `multer` is already a dependency but has no endpoint wired into
      `app.js` — no upload route exists yet.
- [ ] `clients/src/features/image/{compressor,uploader,index}.js` are empty
      stubs. Decide: client-side compression before upload, or raw upload +
      server-side processing.
- [ ] Design how photos (vehicle, ID card, seal) attach to a record —
      inline in the same request as `write-record`, or a separate upload
      endpoint referenced by record ID.

## 7. Mid-term: persistence layer

- [ ] Add SQLite for record storage.
- [ ] Create a `records` table matching the current field model in
      `configs/record-schema.js`.
- [ ] Persist each record to DB instead of only writing directly to Excel.
- [ ] Split into two endpoints: one to save a record, one to generate a
      workbook from saved records.

## 8. Client-side storage (scaffolded, not implemented)

- [ ] `clients/src/features/storage/{local-storage,indexed-db,index}.js` and
      `clients/src/hooks/useLocalStorage.js` are all empty. Needed for
      draft-saving / offline support before this is worth advertising as a
      feature.

## 9. PWA / mobile readiness

- [ ] `clients/public/service-workers.js` is currently just a comment
      (`// load a watcher`) — no actual service worker registered anywhere.
- [ ] `manifest.json` already exists and looks correct; verify it's actually
      linked from `index.html` (currently it is not referenced there).
- [ ] Basic offline support once the storage layer (Section 8) exists.

## 10. Advanced record management

- [ ] View/edit/delete existing records (depends on Section 7 persistence
      layer existing first).
- [ ] Filter by date, shift, company.

## 11. Excel template quality

- [ ] Confirm formatting, borders, and merged cells survive repeated writes
      (current `addBorder` logic in `features/excel/exporter.js` only
      touches the newly written row — verify this matches the template's
      existing style).
- [ ] Add a timestamped filename on export (currently hardcoded to
      `quick-report.xlsx` in `app.js`, and `report_${Date.now()}.xlsx` in
      `ReportFormModal.jsx` — pick one convention and make it consistent
      across both frontends).

## 12. Test coverage

- [ ] Unit tests for `configs/record-schema.js` (normalization, compound
      fields, validators) — this is the highest-value place to start since
      both frontends and the backend depend on it.
- [ ] Unit tests for `parseReportText`/`getFieldValueFromLine` once
      consolidated into one module (Section 2).
- [ ] Integration test for `/api/write-record` once
      `services/excel-export.js` is actually implemented.

## 13. Project housekeeping

- [ ] Add a README describing setup (`clients/` runs on Vite port 3001,
      backend on Express port 3000, two separate `npm install`s currently
      needed) and which frontend is authoritative.
- [ ] Add linting/formatting config — none currently present.
- [ ] Add an `npm test` script (currently just `echo "Error: no test specified"`).
