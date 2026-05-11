# EmotionAI — Manual Test Case Specification

This document describes manual test cases for the **EmotionAI** web application (Next.js frontend + Django REST API). Each case follows the project’s standard report layout: centered title block, metadata table, context fields, execution steps, comments, and final status.

**How to use:** Replace *TBD*, *DD-MM-YYYY*, and procedure results after execution. For negative scenarios, a step **passes** when the system correctly validates, blocks, or errors (expected behavior).

**Reference numbering:** Use Case IDs are internal traceability codes (e.g. `UC-AUTH-01`); **Test Case ID** is unique across this file (`TC-xxx`).

---

## Table of contents

1. [Landing, legal, and navigation](#group-1-landing-legal-and-navigation)
2. [Signup and registration](#group-2-signup-and-registration)
3. [Login and session](#group-3-login-and-session)
4. [Onboarding](#group-4-onboarding)
5. [Dashboard](#group-5-dashboard)
6. [Check-ins (express, history, detail, edit)](#group-6-check-ins)
7. [Local / hybrid storage (IndexedDB)](#group-7-local--hybrid-storage-indexeddb)
8. [Emotion detection APIs](#group-8-emotion-detection-apis)
9. [Insights and analytics](#group-9-insights-and-analytics)
10. [AI companion chat](#group-10-ai-companion-chat)
11. [Personalized recommendations](#group-11-personalized-recommendations)
12. [Calendar](#group-12-calendar)
13. [In-app notifications](#group-13-in-app-notifications)
14. [Web Push](#group-14-web-push)
15. [Settings, export, and account deletion](#group-15-settings-export-and-account-deletion)
16. [Supplementary UI routes](#group-16-supplementary-ui-routes)
17. [Cross-cutting: API, PWA, and resilience](#group-17-cross-cutting-api-pwa-and-resilience)

---

## Group 1: Landing, legal, and navigation

<div align="center">

### Landing page — load and primary navigation

**1**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-001 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-PUB-01 Landing* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify the public landing page loads and marketing links (Features, ML Models, Analytics) and auth CTAs work.* |
| **Product/Ver/Module:** | *EmotionAI website — landing (`/`)* |
| **Environment:** | *Modern web browser; frontend and optional backend reachable.* |
| **Assumptions:** | *No login required for `/`.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open `/` in a clean session (or incognito). | *Passed* |
| 2 | Scroll and use in-page anchors (Features, ML Models, Analytics). | *Passed* |
| 3 | Click **Sign in** and **Get Started**; confirm navigation to `/login` and `/signup`. | *Passed* |

| **Comments:** | *Record any broken anchors or layout issues on target viewports.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Privacy policy — public access

**2**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-002 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-PUB-02 Privacy* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To confirm the privacy page is reachable without authentication.* |
| **Product/Ver/Module:** | *EmotionAI website — `/privacy`* |
| **Environment:** | *Web browser.* |
| **Assumptions:** | *Route exists in app router.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Navigate to `/privacy`. | *Passed* |
| 2 | Verify content renders without console errors. | *Passed* |

| **Comments:** | *Note legal copy version if applicable.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Terms of use — public access

**3**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-003 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-PUB-03 Terms* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To confirm the terms page is reachable without authentication.* |
| **Product/Ver/Module:** | *EmotionAI website — `/terms`* |
| **Environment:** | *Web browser.* |
| **Assumptions:** | *Route exists in app router.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Navigate to `/terms`. | *Passed* |
| 2 | Verify content renders without console errors. | *Passed* |

| **Comments:** | *Record broken links from signup “agree to terms” if any.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 2: Signup and registration

<div align="center">

### Signup — successful registration

**4**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-004 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-01 Sign Up* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify a new user can register with valid details and is routed toward onboarding.* |
| **Product/Ver/Module:** | *Website signup module — `/signup`, `POST /api/auth/register/`* |
| **Environment:** | *Browser; Django API running; database available.* |
| **Assumptions:** | *Valid unique email; password and confirm password match; password meets API minimum length (8+).* |
| **Pre-Requisite:** | *Email not already registered.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Enter full name, email, password (≥8 chars), confirm password; enable terms agreement; submit. | *Passed* |
| 2 | Confirm API returns success, tokens stored in `localStorage`, user session established. | *Passed* |
| 3 | Confirm redirect to `/onboarding` (or equivalent post-signup flow). | *Passed* |

| **Comments:** | *Backend stores email lowercased; username mirrors email.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Signup — passwords do not match

**5**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-005 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-02 Sign Up validation* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To ensure mismatched passwords are rejected before or via API.* |
| **Product/Ver/Module:** | *Signup UI + `POST /api/auth/register/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Enter valid email and two different passwords; agree to terms; submit. | *Passed* |
| 2 | Verify client shows error (e.g. “Passwords do not match”) and no account is created. | *Passed* |

| **Comments:** | *If client passes through, API should return `confirm_password` error.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Signup — terms not accepted

**6**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-006 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-03 Sign Up validation* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify signup cannot complete without accepting terms.* |
| **Product/Ver/Module:** | *Signup UI* |
| **Environment:** | *Browser.* |
| **Assumptions:** | *Terms checkbox default unchecked.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Fill valid fields but leave terms unchecked; submit. | *Passed* |
| 2 | Verify error message and no API registration call (or no success). | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Signup — duplicate email

**7**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-007 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-04 Sign Up uniqueness* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To ensure duplicate emails are rejected with a clear message.* |
| **Product/Ver/Module:** | *Signup + `POST /api/auth/register/`* |
| **Environment:** | *Browser + API + DB.* |
| **Assumptions:** | *A user with target email already exists.* |
| **Pre-Requisite:** | *Create first account with email E; attempt second with same E.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Submit signup using existing email (case-insensitive), valid passwords, terms checked. | *Passed* |
| 2 | Verify HTTP 400 and user-visible error referencing existing email; no duplicate row. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Signup — password shorter than API minimum

**8**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-008 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-05 Password policy* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify passwords under 8 characters are rejected by the API.* |
| **Product/Ver/Module:** | *Signup + `RegisterSerializer` (min_length=8)* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Client may allow submit; server must enforce.* |
| **Pre-Requisite:** | *New email not in DB.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Use a 7-character password matching confirm; bypass or satisfy UI checks if any; submit. | *Passed* |
| 2 | Verify API validation error on `password` / request failure and no user created. | *Passed* |

| **Comments:** | *Document if UI should mirror min length before submit.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Signup — invalid email format

**9**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-009 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-06 Email validation* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify malformed emails are rejected.* |
| **Product/Ver/Module:** | *Signup + API* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *HTML5 or API email validation active.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Enter strings such as `not-an-email`, missing `@`, or empty email with otherwise valid fields. | *Passed* |
| 2 | Verify submission blocked or API 400; no user created. | *Passed* |

| **Comments:** | *List exact strings tested.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 3: Login and session

<div align="center">

### Login — successful authentication

**10**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-010 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-10 Login* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify registered users can log in and access the app shell (sidebar/header).* |
| **Product/Ver/Module:** | *`/login`, `POST /api/auth/login/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Valid user exists; onboarding may be complete or incomplete per data.* |
| **Pre-Requisite:** | *Known email/password.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Submit correct email and password. | *Passed* |
| 2 | Confirm JWTs stored and `GET /api/auth/me/` succeeds. | *Passed* |
| 3 | Confirm navigation to dashboard or expected post-login route. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Login — incorrect password

**11**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-011 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-11 Login negative* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify wrong password does not issue tokens.* |
| **Product/Ver/Module:** | *Login + API* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *User exists.* |
| **Pre-Requisite:** | *Valid email.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Enter valid email and wrong password; submit. | *Passed* |
| 2 | Verify error message and no access/refresh tokens stored. | *Passed* |

| **Comments:** | *Avoid disclosing whether email exists if security requirement applies.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Login — unknown user

**12**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-012 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-12 Login negative* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify login fails for unregistered email.* |
| **Product/Ver/Module:** | *Login + API* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Email not in database.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Submit email not registered with any password. | *Passed* |
| 2 | Verify failure and no session created. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Session — invalid token on protected load

**13**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-013 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-20 Session restore* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify corrupted or invalid `accessToken` in `localStorage` is cleared and user is sent to login.* |
| **Product/Ver/Module:** | *Auth context + `GET /api/auth/me/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Auth provider loads user on mount.* |
| **Pre-Requisite:** | *Manually set `localStorage.accessToken` to garbage string.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Set invalid token; reload a protected route (e.g. `/dashboard`). | *Passed* |
| 2 | Confirm tokens cleared and redirect to `/login`. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Token refresh — manual API check

**14**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-014 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-21 JWT refresh* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To confirm `POST /api/auth/token/refresh/` works with a valid refresh token (regression / tooling).* |
| **Product/Ver/Module:** | *Django Simple JWT* |
| **Environment:** | *API client (Postman/curl) or browser devtools.* |
| **Assumptions:** | *Refresh token stored from login.* |
| **Pre-Requisite:** | *Complete login once; copy `refreshToken`.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Call refresh endpoint with body `{"refresh": "<refresh_jwt>"}`. | *Passed* |
| 2 | Verify new access token in response. | *Passed* |

| **Comments:** | *Note whether SPA auto-refreshes or relies on re-login.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 4: Onboarding

<div align="center">

### Onboarding — complete first-time flow

**15**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-015 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-ONB-01 Onboarding* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify storage choice and permissions are submitted and user can reach the main app.* |
| **Product/Ver/Module:** | *`/onboarding`, `POST /api/auth/onboarding/`, `GET /api/auth/onboarding/`* |
| **Environment:** | *Browser + API; authenticated user with incomplete onboarding.* |
| **Assumptions:** | *Required “storage” permission remains enabled as designed.* |
| **Pre-Requisite:** | *New account or user flagged incomplete onboarding.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Step through onboarding UI: choose `cloud` / `local` / `hybrid`; toggle optional permissions. | *Passed* |
| 2 | Submit; verify API success and `onboarding_complete` true in profile/status. | *Passed* |
| 3 | Confirm redirect to dashboard (or expected destination). | *Passed* |

| **Comments:** | *Record browser permission prompts (notifications, mic, camera) if triggered.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Onboarding — already completed user redirected

**16**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-016 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-ONB-02 Onboarding guard* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To ensure users who finished onboarding are not stuck on onboarding when visiting `/onboarding`.* |
| **Product/Ver/Module:** | *Onboarding page + status API* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *User has `onboarding_complete` true.* |
| **Pre-Requisite:** | *Completed onboarding account.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Log in; navigate directly to `/onboarding`. | *Passed* |
| 2 | Verify automatic redirect away (e.g. dashboard) without duplicate submission errors. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 5: Dashboard

<div align="center">

### Dashboard — authenticated load with data

**17**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-017 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-DASH-01 Dashboard* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify dashboard widgets load using dashboard APIs.* |
| **Product/Ver/Module:** | *`/dashboard`, `/api/dashboard/*`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *User has at least one check-in (optional for richer widgets).* |
| **Pre-Requisite:** | *Logged in; onboarding complete.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open `/dashboard`. | *Passed* |
| 2 | Confirm stats, mood trend, emotion distribution, recent entries sections render without unhandled errors. | *Passed* |
| 3 | Use network tab to confirm calls to `stats`, `mood-trend`, `emotion-distribution`, `recent-entries`. | *Passed* |

| **Comments:** | *Capture screenshots for report if required.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Dashboard — API failure degradation

**18**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-018 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-DASH-02 Resilience* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify the UI does not crash when dashboard endpoints fail (client returns defaults/empty).* |
| **Product/Ver/Module:** | *Dashboard + `apiGetDashboardStats` / trends* |
| **Environment:** | *Browser; simulate API down or 500 via proxy/offline.* |
| **Assumptions:** | *Frontend implements soft failure for some dashboard calls.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Block or stop backend; reload `/dashboard`. | *Passed* |
| 2 | Verify page still renders with zero/empty placeholders rather than white screen. | *Passed* |

| **Comments:** | *Document which widgets still throw vs degrade.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 6: Check-ins

<div align="center">

### Express yourself — text check-in success

**19**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-019 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-01 Text entry* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify a text-type entry is created with required `text_content`.* |
| **Product/Ver/Module:** | *`/check-in/new`, `POST /api/assistant/entries/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Cloud or hybrid mode uses API create.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Choose text mode; enter non-empty journal text; save. | *Passed* |
| 2 | Verify `POST` succeeds and entry appears in `/check-in` list. | *Passed* |
| 3 | Open detail view `/check-in/[id]`; verify content and metadata. | *Passed* |

| **Comments:** | *Content is stored encrypted server-side; verify decryption in UI.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Express yourself — text entry missing content

**20**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-020 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-02 Text validation* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `entry_type=text` without `text_content` is rejected.* |
| **Product/Ver/Module:** | *Check-in create serializer* |
| **Environment:** | *Browser or API client.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Attempt to create text entry with empty/omitted `text_content` (via UI or direct API). | *Passed* |
| 2 | Verify 400 and descriptive field error; no orphan entry. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Check-in history — list and filters

**21**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-021 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-10 History* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify entries list loads and optional query filters (`type`, `emotion`) behave correctly.* |
| **Product/Ver/Module:** | *`/check-in`, `GET /api/assistant/entries/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Multiple entries exist.* |
| **Pre-Requisite:** | *Seed or create varied entries.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open history; confirm list matches API. | *Passed* |
| 2 | Apply filters available in UI (if any); confirm narrowed results. | *Passed* |

| **Comments:** | *If no UI filters, test via URL/query in devtools.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Check-in — edit existing entry

**22**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-022 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-11 Edit* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify partial update of an entry succeeds for owner.* |
| **Product/Ver/Module:** | *`/check-in/[id]/edit`, `PATCH /api/assistant/entries/{id}/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *User owns entry.* |
| **Pre-Requisite:** | *Existing entry id.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open edit page; change text/tags/title as supported; save. | *Passed* |
| 2 | Reload detail; verify persisted changes. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Check-in — delete entry

**23**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-023 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-12 Delete* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify delete removes entry and updates lists.* |
| **Product/Ver/Module:** | *Check-in UI + `DELETE /api/assistant/entries/{id}/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Confirmation modal if implemented.* |
| **Pre-Requisite:** | *Disposable test entry.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Delete entry from UI. | *Passed* |
| 2 | Confirm 204/200 behavior per API; entry absent from history and direct URL. | *Passed* |

| **Comments:** | *404 on repeat delete is acceptable.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Check-in — access another user’s entry (security)

**24**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-024 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-13 Authorization* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To ensure users cannot read or modify other users’ entry IDs.* |
| **Product/Ver/Module:** | *Entry detail API* |
| **Environment:** | *Two test accounts; API client.* |
| **Assumptions:** | *Backend scopes by `request.user`.* |
| **Pre-Requisite:** | *User A creates entry; obtain id.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | As User B, call `GET`/`PATCH`/`DELETE` on User A’s entry id with B’s token. | *Passed* |
| 2 | Verify 404 or 403 — not successful data leak. | *Passed* |

| **Comments:** | *Critical security test.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Express yourself — voice entry (happy path)

**25**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-025 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-03 Voice entry* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify voice capture flow saves an entry when mic permission granted.* |
| **Product/Ver/Module:** | *`/check-in/new` (voice), emotion microservice optional* |
| **Environment:** | *HTTPS or localhost; microphone available.* |
| **Assumptions:** | *Browser supports MediaRecorder.* |
| **Pre-Requisite:** | *Logged in; mic permission allowed.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Select voice mode; record short clip; stop and save. | *Passed* |
| 2 | Verify entry in history with type `voice` and reasonable duration/transcription fields if shown. | *Passed* |

| **Comments:** | *If microservice down, note graceful degradation message.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Express yourself — video entry (happy path)

**26**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-026 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-04 Video entry* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify video capture saves and optional facial emotion pipeline runs or fails safely.* |
| **Product/Ver/Module:** | *`/check-in/new` (video)* |
| **Environment:** | *Webcam available; secure context.* |
| **Assumptions:** | *User enabled video permission in onboarding if required.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Record short video; submit. | *Passed* |
| 2 | Verify entry persisted; emotion label confidence present or clear “unavailable” state. | *Passed* |

| **Comments:** | *Large file / timeout edge case optional.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 7: Local / hybrid storage (IndexedDB)

<div align="center">

### Local check-in — offline save and route id

**27**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-027 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-LOC-01 IndexedDB* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify local-only or hybrid flows store unsynced entries in IndexedDB and expose `local-` routes.* |
| **Product/Ver/Module:** | *`local-check-in-store.ts`, check-in pages* |
| **Environment:** | *Browser with IndexedDB; user chose local/hybrid in onboarding.* |
| **Assumptions:** | *Implementation merges local rows in history.* |
| **Pre-Requisite:** | *Account with local/hybrid storage preference.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Create entry while offline or in local mode per design. | *Passed* |
| 2 | Confirm history shows entry and detail URL uses `local-` prefix when applicable. | *Passed* |
| 3 | Inspect Application → IndexedDB → `emotion_assistant_checkins`. | *Passed* |

| **Comments:** | *Document sync behavior when back online for hybrid.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 8: Emotion detection APIs

<div align="center">

### Emotion — image detection valid payload

**28**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-028 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-EMO-01 Image API* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/assistant/emotion/detect/` returns prediction JSON when microservice is up.* |
| **Product/Ver/Module:** | *Emotion image microservice integration* |
| **Environment:** | *API + microservice running.* |
| **Assumptions:** | *Valid base64 image in `image_data`.* |
| **Pre-Requisite:** | *Auth token.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Send request with small valid JPEG/PNG base64. | *Passed* |
| 2 | Verify `predicted_emotion`, `confidence`, and `recommendations` object shape (may be empty if downstream down). | *Passed* |

| **Comments:** | *Attach sample redacted request/response in test evidence.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Emotion — image detection invalid payload

**29**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-029 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-EMO-02 Image validation* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify missing/invalid `image_data` returns 400.* |
| **Product/Ver/Module:** | *`EmotionImageRequestSerializer`* |
| **Environment:** | *API.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *Auth token.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | POST `{}` or malformed base64. | *Passed* |
| 2 | Verify 400 with serializer errors. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Emotion — text and audio detection

**30**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-030 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-EMO-03 Text/audio API* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST .../detect/text/` and `POST .../detect/audio/` endpoints with valid inputs.* |
| **Product/Ver/Module:** | *Assistant emotion routes* |
| **Environment:** | *API + microservices.* |
| **Assumptions:** | *Audio endpoint accepts multipart upload per implementation.* |
| **Pre-Requisite:** | *Auth token; sample wav/mp3.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Call text detection with short mood paragraph. | *Passed* |
| 2 | Call audio detection with short clip. | *Passed* |
| 3 | Verify structured response or documented error if service unavailable. | *Passed* |

| **Comments:** | *Split into two cases if failures need isolation.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Emotion — 7-class image model

**31**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-031 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-EMO-04 7-class* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/assistant/emotion/detect/7class/` returns 7-class labels when configured.* |
| **Product/Ver/Module:** | *7-class microservice* |
| **Environment:** | *API + microservice.* |
| **Assumptions:** | *Same payload contract as standard image detect.* |
| **Pre-Requisite:** | *Auth token.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Submit valid `image_data`. | *Passed* |
| 2 | Verify predictions map to expected 7-class set. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 9: Insights and analytics

<div align="center">

### Insights — overview and mood timeline

**32**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-032 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-INS-01 Insights* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify insights page consumes `GET /api/insights/overview/` and `GET /api/insights/mood-timeline/`.* |
| **Product/Ver/Module:** | *`/insights`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Sufficient historical entries for non-flat charts.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open `/insights`. | *Passed* |
| 2 | Change date range if UI offers; verify API query param `days` updates. | *Passed* |
| 3 | Verify charts/tables match API payloads. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 10: AI companion chat

<div align="center">

### Chat — send message and receive reply

**33**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-033 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHAT-01 Send* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/chat/send/` returns user + AI messages.* |
| **Product/Ver/Module:** | *`/chat`* |
| **Environment:** | *Browser + API + LLM/RAG backend if configured.* |
| **Assumptions:** | *Outbound AI dependencies may fail; record behavior.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Send a short wellness prompt. | *Passed* |
| 2 | Verify UI shows user bubble and AI response; optional `entry_reference` if linked. | *Passed* |

| **Comments:** | *Capture latency and error copy if model unavailable.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Chat — history and clear

**34**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-034 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHAT-02 History* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `GET /api/chat/history/` loads and `DELETE /api/chat/clear/` empties thread.* |
| **Product/Ver/Module:** | *`/chat`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Prior messages exist.* |
| **Pre-Requisite:** | *Send at least two messages first.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Reload chat; confirm history restored. | *Passed* |
| 2 | Trigger clear action; confirm API success and empty UI. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 11: Personalized recommendations

<div align="center">

### Recommendations — fetch bundle by emotion

**35**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-035 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-REC-01 Get* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/recommendations/get/` returns music/exercise/quote blocks per request.* |
| **Product/Ver/Module:** | *`/recommendations`, recommendation microservices* |
| **Environment:** | *Browser + API; Spotify/third-party keys if required.* |
| **Assumptions:** | *Valid emotion string.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Request recommendations for e.g. `anxious` with optional `types` array. | *Passed* |
| 2 | Verify tracks or fallback messaging; no uncaught UI error. | *Passed* |

| **Comments:** | *Note external API rate limits.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Recommendations — feedback and history

**36**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-036 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-REC-02 Feedback* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/recommendations/feedback/` and `GET .../history/` / `GET .../patterns/`.* |
| **Product/Ver/Module:** | *Recommendations UI + API* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Prior recommendation_id from get call.* |
| **Pre-Requisite:** | *Complete TC-035.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Submit like/dislike/skip/complete feedback for an item. | *Passed* |
| 2 | Load history and patterns endpoints; verify JSON structure. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Music hub page — load

**37**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-037 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-REC-03 Music page* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `/music` renders for authenticated users.* |
| **Product/Ver/Module:** | *`/music`* |
| **Environment:** | *Browser.* |
| **Assumptions:** | *Route not linked in sidebar but exists.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Navigate to `/music`. | *Passed* |
| 2 | Verify primary actions/links work without errors. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 12: Calendar

<div align="center">

### Calendar — month grid and navigation

**38**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-038 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CAL-01 Month* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `GET /api/calendar/month/?year=&month=` drives the calendar UI.* |
| **Product/Ver/Module:** | *`/calendar`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Entries exist on known dates.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open calendar; change month/year controls. | *Passed* |
| 2 | Verify network calls and cell labels (dominant emotion, counts). | *Passed* |

| **Comments:** | *Test February and leap year for boundary.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Calendar — day detail drill-down

**39**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-039 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CAL-02 Day* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `GET /api/calendar/day/?date=YYYY-MM-DD` lists entries for that day.* |
| **Product/Ver/Module:** | *`/calendar`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Date with data known.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Click a day with entries. | *Passed* |
| 2 | Verify list matches API; links to check-in detail work. | *Passed* |

| **Comments:** | *Test day with zero entries.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Calendar — month summary

**40**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-040 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CAL-03 Summary* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `GET /api/calendar/month-summary/` aggregates counts and averages.* |
| **Product/Ver/Module:** | *Calendar summary UI* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | View summary panel for current month. | *Passed* |
| 2 | Compare totals against raw entry count in DB or history. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 13: In-app notifications

<div align="center">

### Notifications — list, unread count, mark read

**41**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-041 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-NOT-01 In-app* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify notification list, unread badge polling, and mark-read flows.* |
| **Product/Ver/Module:** | *`/notifications`, `/api/notifications/*`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *At least one notification exists (use generator or `.../test/` if available).* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Open notifications page; confirm `GET /api/notifications/` payload. | *Passed* |
| 2 | Compare header badge with `GET /api/notifications/unread-count/`. | *Passed* |
| 3 | Mark single read and mark all read via UI; verify `POST .../mark-read/`. | *Passed* |

| **Comments:** | *Document notification types shown (session_reminder, mood_insight, etc.).* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Notifications — delete one and clear all

**42**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-042 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-NOT-02 Delete* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `DELETE /api/notifications/{id}/` and `DELETE /api/notifications/clear/`.* |
| **Product/Ver/Module:** | *Notifications UI* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *Multiple notifications exist.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Delete one notification; confirm removed from list. | *Passed* |
| 2 | Clear all; confirm empty state and API success. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 14: Web Push

<div align="center">

### Web Push — enable when server configured

**43**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-043 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-NOT-10 Web Push* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify enabling push in settings registers service worker, fetches VAPID key, and subscribes via `POST .../push/subscribe/`.* |
| **Product/Ver/Module:** | *Settings notifications, `web-push.ts`, `sw.js`* |
| **Environment:** | *Chrome/Edge; HTTPS or localhost; backend env has `WEB_PUSH_*` keys.* |
| **Assumptions:** | *User grants browser notification permission.* |
| **Pre-Requisite:** | *Logged in; push_notifications toggle available.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Enable push in settings; accept browser prompt. | *Passed* |
| 2 | Verify `GET .../push/vapid-key/` returns `enabled` and `publicKey`. | *Passed* |
| 3 | Verify subscription POST succeeds. | *Passed* |

| **Comments:** | *Optional: trigger test push from backend if endpoint exists.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Web Push — disable unsubscribes

**44**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-044 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-NOT-11 Web Push off* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify disabling push calls unsubscribe API and removes PushSubscription.* |
| **Product/Ver/Module:** | *Settings + `POST .../push/unsubscribe/`* |
| **Environment:** | *Supported browser.* |
| **Assumptions:** | *Prior active subscription from TC-043.* |
| **Pre-Requisite:** | *Completed TC-043.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Turn off push_notifications in settings. | *Passed* |
| 2 | Confirm `push/unsubscribe/` called and `reg.pushManager.getSubscription()` is null. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Web Push — unsupported browser / permission denied

**45**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-045 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-NOT-12 Web Push negative* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify graceful errors when Push API missing or permission denied.* |
| **Product/Ver/Module:** | *`syncWebPushSubscription`* |
| **Environment:** | *Old browser or user blocks notifications.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Attempt enable push in unsupported environment OR deny permission. | *Passed* |
| 2 | Verify user-readable error; app remains stable. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 15: Settings, export, and account deletion

<div align="center">

### Settings — profile PATCH (text + photo)

**46**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-046 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SET-01 Profile* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `PATCH /api/settings/profile/` and `PATCH /api/auth/me/` update visible profile data.* |
| **Product/Ver/Module:** | *`/settings`, `/profile/edit`* |
| **Environment:** | *Browser + API + Cloudinary (if picture upload).* |
| **Assumptions:** | *Image within allowed size/type.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Update names, bio, phone; save. | *Passed* |
| 2 | Upload profile picture; verify URL stored and renders in header/profile. | *Passed* |

| **Comments:** | *Record failure message if Cloudinary misconfigured.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Settings — notification, privacy, appearance, recommendations

**47**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-047 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SET-02 Preferences* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify each settings subsection GET/PATCH pair.* |
| **Product/Ver/Module:** | *`/api/settings/notifications|privacy|appearance|recommendations/`* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Toggle several notification flags; reload; values persist. | *Passed* |
| 2 | Change privacy storage mode (`cloud`/`local`/`hybrid`); persist. | *Passed* |
| 3 | Switch dark mode / color scheme / mood adaptive; persist. | *Passed* |
| 4 | Update music language, genres, market, fitness level; persist. | *Passed* |
| 5 | Open recommendation options endpoint via UI load; verify options populate. | *Passed* |

| **Comments:** | *Split into four cases if regression isolation needed.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Settings — export personal data

**48**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-048 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SET-03 GDPR export* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/settings/export-data/` downloads JSON.* |
| **Product/Ver/Module:** | *Settings export* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *User has entries to appear in export.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Trigger export from settings. | *Passed* |
| 2 | Verify file downloads, opens, contains expected sections (PII redacted in attachments). | *Passed* |

| **Comments:** | *Verify `Content-Disposition` filename handling.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Settings — delete account

**49**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-049 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SET-04 Account deletion* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `POST /api/settings/delete-account/` removes user and tokens invalidated.* |
| **Product/Ver/Module:** | *Danger zone in settings* |
| **Environment:** | *Staging only recommended.* |
| **Assumptions:** | *Confirmation step in UI.* |
| **Pre-Requisite:** | *Disposable test account.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Execute delete account flow. | *Passed* |
| 2 | Attempt `GET /api/auth/me/` with old token; expect 401. | *Passed* |
| 3 | Attempt login with old credentials; expect failure. | *Passed* |

| **Comments:** | *Irreversible — use dedicated test user.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 16: Supplementary UI routes

<div align="center">

### Profile view — load

**50**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-050 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-PRO-01 Profile* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `/profile` displays user stats and links to edit.* |
| **Product/Ver/Module:** | *`/profile`* |
| **Environment:** | *Browser.* |
| **Assumptions:** | *Logged in.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Navigate to `/profile`. | *Passed* |
| 2 | Verify data consistency with `/api/auth/me/`. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Exercises, quotes, tags, ML models pages

**51**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-051 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SUP-01 Auxiliary pages* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To smoke-test auxiliary routes: `/exercises`, `/quotes`, `/tags`, `/ml-models`.* |
| **Product/Ver/Module:** | *Auxiliary marketing/feature pages* |
| **Environment:** | *Browser.* |
| **Assumptions:** | *User may be logged in or out per route guard.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Visit each URL; confirm render without runtime error. | *Passed* |
| 2 | If page expects auth, confirm redirect or data load behavior matches design. | *Passed* |

| **Comments:** | *Split per route if defects found.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Group 17: Cross-cutting: API, PWA, and resilience

<div align="center">

### Emotions app — quick moods and mood stats API

**52**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-052 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-EMO-10 Emotions app* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To regression-test `POST/GET /api/emotions/quick-moods/` and `.../mood-stats/` if used by mobile or future UI.* |
| **Product/Ver/Module:** | *Django `emotions` app* |
| **Environment:** | *API client + auth.* |
| **Assumptions:** | *Endpoints mounted under `/api/emotions/`.* |
| **Pre-Requisite:** | *Valid JWT.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Call `quick-moods` per API contract (create/list as implemented). | *Passed* |
| 2 | Call `mood-stats` with expected query/body; verify aggregates. | *Passed* |

| **Comments:** | *Mark N/A if not yet wired to web UI.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### API base URL — wrong `NEXT_PUBLIC_API_URL`

**53**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-053 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-OPS-01 Configuration* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify the SPA surfaces network errors when API host is unreachable (mobile LAN testing).* |
| **Product/Ver/Module:** | *`API_URL` in `frontend/src/lib/api.ts`* |
| **Environment:** | *Build with wrong API URL or firewall block.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Point `NEXT_PUBLIC_API_URL` to invalid host; attempt login. | *Passed* |
| 2 | Verify user-visible error (not silent hang). | *Passed* |

| **Comments:** | *Document correct LAN IP procedure for phone testing.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Service worker — registration for push

**54**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-054 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-OPS-02 PWA* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify `public/sw.js` registers and does not break primary navigation.* |
| **Product/Ver/Module:** | *Service worker* |
| **Environment:** | *Chrome devtools → Application.* |
| **Assumptions:** | *HTTPS/localhost.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Load app; confirm service worker active. | *Passed* |
| 2 | Hard refresh and verify no stale bundle issues for main flows. | *Passed* |

| **Comments:** | *Update skipWaiting/clients.claim behavior if customized.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Logout — session cleared

**55**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-055 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-AUTH-30 Logout* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify logout removes tokens and onboarding flag and returns to login.* |
| **Product/Ver/Module:** | *Sidebar logout + `AuthContext`* |
| **Environment:** | *Browser.* |
| **Assumptions:** | *User logged in.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Click logout. | *Passed* |
| 2 | Confirm `localStorage` tokens removed; visit `/dashboard` ends at login or public shell. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Header / sidebar — responsive navigation

**56**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-056 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-UX-01 Navigation* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify primary nav links (Dashboard, Express Yourself, History, Insights, Chat, Recommendations, Calendar, Notifications, Settings) on desktop and mobile drawer.* |
| **Product/Ver/Module:** | *`Sidebar.tsx`, `Header.tsx`* |
| **Environment:** | *Mobile width + desktop width.* |
| **Assumptions:** | *Authenticated session.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | On desktop, visit each sidebar route; active state highlights correctly. | *Passed* |
| 2 | On mobile, open hamburger, navigate, overlay closes. | *Passed* |

| **Comments:** | *Include tablet breakpoint.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Boundary — extremely long text check-in

**57**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-057 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CHK-20 Boundary* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To evaluate behavior with very large paste (performance, limits, encryption).* |
| **Product/Ver/Module:** | *Text check-in* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Paste ≥50k characters (adjust to infra limits). | *Passed* |
| 2 | Save; verify success or clear validation message; app remains responsive. | *Passed* |

| **Comments:** | *Record max supported length if enforced.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Boundary — calendar month 1 and 12

**58**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-058 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-CAL-10 Boundary* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify January/December navigation and year rollover.* |
| **Product/Ver/Module:** | *Calendar* |
| **Environment:** | *Browser + API.* |
| **Assumptions:** | *None.* |
| **Pre-Requisite:** | *Logged in.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | From December, advance to next month → January next year. | *Passed* |
| 2 | From January, go previous month → December prior year. | *Passed* |

| **Comments:** | *None.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Security — CORS and credentials

**59**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-059 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SEC-01 CORS* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To confirm API rejects browser calls from disallowed origins (if CORS restricted).* |
| **Product/Ver/Module:** | *Django CORS configuration* |
| **Environment:** | *Malicious origin page or curl with Origin header.* |
| **Assumptions:** | *Security policy defined for deployment.* |
| **Pre-Requisite:** | *None.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | From unauthorized origin, attempt authenticated fetch. | *Passed* |
| 2 | Verify blocked per policy (no data leak). | *Passed* |

| **Comments:** | *N/A if development allows all origins.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

<div align="center">

### Rate limiting / abuse — chat and recommendations (if enabled)

**60**

</div>

|  |  |  |  |
| --- | --- | --- | --- |
| **Test Case ID:** | TC-060 | **QA Test Engineer:** | *TBD* |
| **Test case Version:** | 1.0 | **Reviewed By:** | *TBD* |
| **Test Date:** | *DD-MM-YYYY* | **Use Case Reference(s):** | *UC-SEC-02 Throttle* |

| **Revision History:** | *None* |
| --- | --- |
| **Objective:** | *To verify excessive requests return 429 or equivalent when throttling configured.* |
| **Product/Ver/Module:** | *Chat / recommendations endpoints* |
| **Environment:** | *Staging with limits.* |
| **Assumptions:** | *Throttling may be absent in dev.* |
| **Pre-Requisite:** | *Script or manual burst.* |

| Step No. | Execution description | Procedure result |
| --- | --- | --- |
| 1 | Send rapid repeated chat or recommendation requests. | *Passed* |
| 2 | Observe stable failure mode (429 + message) without server crash. | *Passed* |

| **Comments:** | *Mark N/A if no throttling.* |
| --- | --- |
| **Final Status:** | ***(Pending)*** |

---

## Appendix: Traceability matrix (summary)

| Area | Test case IDs |
| --- | --- |
| Public / legal | TC-001 – TC-003 |
| Signup | TC-004 – TC-009 |
| Login / session | TC-010 – TC-014, TC-055 |
| Onboarding | TC-015 – TC-016 |
| Dashboard | TC-017 – TC-018 |
| Check-ins | TC-019 – TC-026, TC-057 |
| Local storage | TC-027 |
| Emotion APIs | TC-028 – TC-031, TC-052 |
| Insights | TC-032 |
| Chat | TC-033 – TC-034 |
| Recommendations / music | TC-035 – TC-037 |
| Calendar | TC-038 – TC-040, TC-058 |
| Notifications | TC-041 – TC-042 |
| Web Push | TC-043 – TC-045 |
| Settings / account | TC-046 – TC-049 |
| Profile / auxiliary | TC-050 – TC-051 |
| Ops / security / UX | TC-053 – TC-054, TC-056, TC-059 – TC-060 |

---

*End of document — version 1.0*
