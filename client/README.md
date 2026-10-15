# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


REQUIREMENTS OF AURORABANK

| Step  | Name                  | Main fields                                                     |
| ----- | --------------------- | --------------------------------------------------------------- |
| **1** | Personal Details      | First name, last name, birth date, passport number, citizenship |
| **2** | Contact Details       | Phone number, email                                             |
| **3** | Address Details       | Country, city, address, postal code                             |
| **4** | Identity Verification | Passport/ID upload, OCR, selfie/verification if required        |
| **5** | Security              | Password, confirm password                                      |


User submits personal details
UIN and other personal information.
Uploads passport/ID images.
Check temporary OCR block
If the user is blocked, reject the request with 429.
Block duration: 1 hour.
Limit OCR requests
Maximum 5 OCR requests per hour per UIN.
On the 6th request, block the user for 1 hour.
Limit failed document attempts
Maximum 3 failed document-processing attempts.
Retry counter is stored for 24 hours.
After reaching the limit, return 423 Locked.
Process the document
Send uploaded document images to the OCR/Textract service.
Extract required identity fields.
Handle unsupported documents
If the document cannot be recognized, return 400 DOCUMENT_NOT_RECOGNIZED.
Tell the user to upload a passport or ID card.
Handle OCR service failures
Service unavailable → 503
Timeout → 504
Incomplete OCR data → 500
Unexpected error → 500
Compare OCR data with manually entered data
Compare extracted fields against PersonalDetailsDto.
If they don't match, return 400 MISMATCH.
Include the mismatched fields.
Reset document retry counter after success
Successful verification deletes the document retry counter.
Generate registration token
Generate a unique UUID after successful verification.
Store consent
Save:
registration token
consent timestamp
personal details