# Jainam Biodata Site

Static Netlify-ready site for privately viewing curated girls biodata images from the WhatsApp group.

## Local Use

Open `index.html` through a local static server. The page asks for PIN `141100` before loading any biodata data or images.

## Data Contract

Add original images to `images/`.

Add extracted metadata to `data/biodata.json`:

```json
{
  "generatedAt": "2026-06-13T18:30:00+05:30",
  "duplicatesSkipped": 2,
  "records": [
    {
      "id": "whatsapp-message-id-or-stable-id",
      "messageId": "optional-whatsapp-message-id",
      "image": "./images/example.jpg",
      "imageHash": "sha256-of-original-image-bytes",
      "name": "Optional extracted name",
      "birthDate": "DD/MM/YYYY",
      "birthYear": 1998,
      "city": "Mumbai",
      "caste": "Optional caste",
      "nativePlace": "Optional native place",
      "religion": "Jain Deravasi",
      "sourcePostedAt": "2026-06-05T10:10:00+05:30",
      "sourceGenderRule": "Friday 07:00-18:00",
      "ocrLanguage": "english"
    }
  ]
}
```

## Required Curation Rules

- Process only the past 14 days unless the lookback window is intentionally changed.
- Include only Friday posts from 07:00 to 18:00 for girls biodata.
- Skip Saturday boy biodata posts.
- Skip non-English-only biodata unless English is present with another language.
- Never add duplicate biodata. Prefer `imageHash`; fall back to `messageId`.
- Keep original biodata images; do not replace them with OCR text.

## Netlify

Deploy this folder as a static site. No build command is required.

Important: the PIN gate is client-side privacy, not strong authentication. For real privacy on Netlify, add Netlify password protection, Basic Auth through a function/edge rule, or deploy behind a private access layer.
