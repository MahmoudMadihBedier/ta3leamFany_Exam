# Ta3leamFanyExam — نظام الاختبارات الإلكترونية

A lightweight client-side web application for delivering timed electronic exams and saving results to a Google Sheets spreadsheet. UI in Arabic. Designed for schools to run timed tests and store results (with offline retry support).

## Features
- RTL Arabic UI using Bootstrap 4
- Timed exam with automatic submission on timeout
- Randomized question selection and per-subject weighting
- Client-side validation for school code, student info and answers
- Results saved to Google Sheets via Google Apps Script (supports POST and GET)
- Local retry queue (localStorage) when network fails

## Tech stack
- Plain HTML/CSS/JS
- jQuery, Bootstrap 4
- Google Apps Script (Web App) for writing to Google Sheets

## Project structure
- index.html
- js/
  - config.js — app and Google Sheets configuration
  - School.js, Student.js, Exam.js, backendServices.js, app.js — main application code
- css/ — style files
- README.md — this file

## Quick start

Prerequisites:
- Google account with access to a Google Sheet
- A modern browser (Chrome/Firefox)
- Optional: a static server (Live Server extension or `python`)

1. Open the project folder and serve files locally:
   - Using Python 3:
     ```
     python3 -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser.
   - Or open [index.html](http://_vscodecontentref_/0) via Live Server in VS Code.

2. Configure Google Sheets / Apps Script:
   - Create a Google Sheet and add header row matching [SHEETS_CONFIG.columns](http://_vscodecontentref_/1) in [config.js](http://_vscodecontentref_/2):
     ```
     Timestamp | School | Student Name | Class | Score | Percentage | Status | Answers
     ```
   - Open Google Apps Script (Extensions → Apps Script) for that spreadsheet and paste the provided robust `doPost` / `doGet` script. Run the `setup()` function once to store the spreadsheet ID (or manually set `scriptProp`).
   - Deploy the script as a Web App:
     - Execute as: Me
     - Who has access: Anyone, even anonymous
     - Deploy and copy the Web App URL.

3. Update client config:
   - Set `SHEETS_CONFIG.scriptUrl` in `js/config.js` to the Web App URL you copied.

4. Test flow:
   - Open app, enter school code (use codes in `config.js`), fill student info, take the exam and submit.
   - Open browser DevTools → Network to inspect request and response.

## Notes & troubleshooting

- Empty request body on server:
  - Use URL encoded `data` param (client uses `URLSearchParams({ data: JSON.stringify(...) })`). The recommended Apps Script handles `e.parameter.data`, `e.postData.contents` (JSON or form data) and direct `e.parameter` fields.
  - Redeploy Apps Script after edits.
  - Ensure Web App access is set to "Anyone, even anonymous" or appropriate auth for your setup.

- CORS / Permissions:
  - Google Apps Script Web Apps normally allow requests from browsers if deployed correctly. If you see CORS issues, re-deploy or check execution/access settings.

- GET support:
  - The example Apps Script accepts `GET` with `?data=<json>` or direct query parameters. GET size is limited; prefer POST for large payloads (Answers field can be long).

- Offline / Retry:
  - Failed submissions are saved to `localStorage` (`pendingExamSubmissions`). Use the app retry logic (or call `backendServices.retryPendingSubmissions()` from console) to resend.

## Debugging tips
- Look for `console.debug("Prepared submissionData:", submissionData)` in the browser console to confirm payload.
- In Network tab, verify:
  - Request URL equals your Apps Script URL
  - Request method (POST/GET) and request payload (should contain `data` when using URL encoded form)
  - Response body — Apps Script returns JSON with `result: "success"` or error details
- If response contains "No data received" or blank body, confirm deployment and that `setup()` was run.

## Contributing
- Fork, create a feature branch, open a PR. Keep code small and focused.
- Please include tests or manual reproduction steps for bugfixes.

## License
MIT License — see LICENSE file.

## Contact / Support
Open an issue with:
- Steps to reproduce
- Browser console logs (network request and response)
- The Apps Script `doPost`/`doGet` code (if modified)