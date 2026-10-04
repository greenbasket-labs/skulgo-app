# SkulGo Offline — Install and Offline Use

SkulGo Offline is designed so the Admin and Teacher workspaces keep their local data when the connection disappears.

## V1 rule

- Pairing/trust is a durable relationship.
- A network connection is temporary.
- Disconnecting does not delete local records.
- Attendance, CA, exams and other local work remain available offline.
- Real device-to-device sync is not considered complete until the Admin and Teacher applications are wired to the shared Sync transport.

## Installable web app

Admin and Teacher include a web app manifest and service worker.

For an HTTPS deployment, open the Admin or Teacher URL in a supported browser and use **Install app / Add to Home screen**.

The first successful load should be completed while online so the browser can cache the application shell. After that, the application shell can open without internet.

## Local development

Admin:
`node apps/admin/server.mjs`

Teacher:
`node apps/teacher/server.mjs`

The local workspaces continue to use browser/local stores and do not require an external service for normal local work.

## Important

An installed offline shell is not the same as cross-device synchronization. Do not treat a local browser copy as proof that a Teacher record has reached Admin. That requires a successful Sync acknowledgement.

## V1 acceptance

1. Open the workspace.
2. Create or load school data.
3. Record attendance/results.
4. Disconnect internet.
5. Refresh/reopen the installed app.
6. Confirm local data remains.
7. Reconnect only when synchronization is explicitly available.
