# Asch Lecture QR Tool

This folder contains a small mobile page for your classroom conformity exercise.

## Recommended setup

Use the static page first. It is the simplest option and works well for a lecture:

- Students scan a QR code.
- They enter an email address.
- The page assigns them to the confederate or control condition.
- Their phone shows a private message.
- Tapping `Next` erases the message.

By default, the page uses a deterministic hash of the email address to create a stable 80/20 split. That means the same email gets the same condition every time, even after a refresh.

In hash mode, email addresses stay on the student's device and are not sent anywhere.

If you want a central assignment log in Google Sheets, the folder also includes an optional Google Apps Script backend.

## Files

- `index.html`: the student-facing page
- `app.js`: assignment logic and condition messages
- `styles.css`: shared styling
- `qr.html`: instructor page for generating the QR code image
- `qr.js`: QR generator logic
- `GOOGLE_FORMS_TEMPLATES.md`: copy-ready text for two fallback Google Forms
- `google-apps-script/Code.gs`: optional backend for logging assignments to a Sheet

## Quick start with GitHub Pages

1. Upload the contents of this folder to a GitHub Pages repository.
2. Open `app.js` and update `CONFIG.lectureTitle` if you want a different title.
3. Leave `assignmentMode: "hash"` unless you want the Google Sheets backend.
4. Publish the site on GitHub Pages.
5. Open `qr.html`, paste the published URL for `index.html`, and download the PNG.
6. Put that QR image on the slide right before your Asch line cards.

Your published student link will usually look like:

`https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/lecture-asch-qr/`

## Optional: use the Google Sheets backend

If you want to log which email received which condition:

1. Create a Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Paste in `google-apps-script/Code.gs`.
4. Deploy the script as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the web app URL.
6. In `app.js`, change:

```js
assignmentMode: "remote",
remoteEndpoint: "YOUR_WEB_APP_URL",
```

The frontend uses JSONP rather than `fetch`, which avoids cross-origin issues when the page is hosted on GitHub Pages.

## Important lecture note

This app is designed to make the messages private on students' phones. It does not stop students from deliberately showing their screens to each other. The privacy gate and the wording make that less likely, but you should still verbally tell them to keep their screen to themselves.

## Google Forms fallback

If you prefer to create two separate Google Forms instead of relying on the built page, use the copy in `GOOGLE_FORMS_TEMPLATES.md`. That approach still needs this page or some other assignment method to decide who gets which form.
