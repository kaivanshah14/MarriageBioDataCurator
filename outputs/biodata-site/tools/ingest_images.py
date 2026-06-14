import argparse
import hashlib
import json
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import pytesseract

    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
except ImportError:
    pytesseract = None


DOB_RE = re.compile(r"\b([0-3]?\d)[/\-.]([01]?\d)[/\-.]((?:19|20)\d{2})\b")
DOB_PATTERNS = [
    re.compile(r"DOB\s*[:\-]?\s*([0-3]?\d[/\-\.][01]?\d[/\-\.](?:19|20)\d{2})", re.I),
    re.compile(
        r"DATE OF BIRTH\s*[:\-]?\s*([0-3]?\d[/\-\.][01]?\d[/\-\.](?:19|20)\d{2})", re.I
    ),
]
ENGLISH_RE = re.compile(r"[A-Za-z]{3,}")
TEXT_DOB_RE = re.compile(
    r"(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s*((?:19|20)\d{2})", re.IGNORECASE
)

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

SECT_ALIASES = {
    "Sthanakwasi": [
        "sthanakwasi",
        "sthanakvasi"
    ],
    "Deravasi": [
        "deravasi",
        "derawasi"
    ],
    "Digambar": [
        "digambar",
        "digamber"
    ],
    "Terapanthi": [
        "terapanthi",
        "terapanth"
    ],
    "Murtipujak": [
        "murtipujak",
        "murti pujak",
        "murti pujak jain"
    ],
    "Shwetambar": [
        "shwetambar",
        "swetambar"
    ]
}


def extract_sect(text):
    lower = (text or "").lower()

    for canonical_name, aliases in SECT_ALIASES.items():
        for alias in aliases:
            if alias in lower:
                return canonical_name

    return ""

KNOWN_CASTE_KEYWORDS = [
    "dashashrimali",
    "dasha shrimali",
    "vishashrimali",
    "visha shrimali",
    "ghoghari",
    "kutchi gurjar",
    "oswal",
    "porwad",
    "vijapuri",
    "Vijapur 27 Visha Shrimali",
    "Vijapur 27 Vishashrimali",
    "Vijapur 27 Dashashrimali",
    "Vijapur 27 Dasha Shrimali",
    "Vijapur 27",
]

def infer_caste(text):
    lower = (text or "").lower()

    for caste in KNOWN_CASTE_KEYWORDS:
        if caste in lower:
            return caste.title()

    return ""

def parse_args():
    parser = argparse.ArgumentParser(
        description="Ingest WhatsApp biodata images into the static site data file."
    )
    parser.add_argument(
        "--manifest",
        required=True,
        help="JSON file containing WhatsApp image messages.",
    )
    parser.add_argument("--site", default=".", help="Path to biodata-site folder.")
    parser.add_argument("--lookback-days", type=int, default=14)
    parser.add_argument(
        "--now", default=None, help="ISO datetime override for testing."
    )
    return parser.parse_args()


def read_json(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path, payload):
    with Path(path).open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_dt(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def is_friday_girl_window(posted_at):
    return posted_at.weekday() == 4 and 7 <= posted_at.hour < 18


def guess_name(text):
    lines = [x.strip() for x in (text or "").splitlines() if x.strip()]

    for line in lines[:20]:
        line = re.sub(r"\s+", " ", line)

        if len(line) < 5:
            continue

        if re.search(r"\d", line):
            continue

        if any(
            keyword in line.lower()
            for keyword in [
                "date",
                "height",
                "weight",
                "education",
                "occupation",
                "father",
                "mother",
                "contact",
                "email",
                "address",
                "religion",
                "caste",
                "native",
                "profession",
            ]
        ):
            continue

        words = line.split()

        if 2 <= len(words) <= 5:
            uppercase_ratio = sum(1 for c in line if c.isupper()) / max(
                1, sum(1 for c in line if c.isalpha())
            )

            if uppercase_ratio > 0.5:
                return line.title()

    return ""


def ocr_image(path):
    if cv2 is None or pytesseract is None:
        return ""

    image = cv2.imread(str(path))
    if image is None:
        return ""

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    config = "--oem 3 --psm 6"

    text = pytesseract.image_to_string(
        gray,
        lang="eng+guj",
        config=config
    )

    text = (
        text.replace("™", "")
            .replace("”", '"')
            .replace("“", '"')
            .replace("’", "'")
            .replace("‘", "'")
    )

    return text


def extract_sect(text):
    lower = (text or "").lower()

    for sect in KNOWN_SECTS:
        if sect in lower:
            return sect.title()

    return ""

def birth_date_from_text(text):
    text = text or ""

    for pattern in DOB_PATTERNS:
        match = pattern.search(text)

        if match:
            value = match.group(1)

            parts = re.split(r"[/\-.]", value)

            if len(parts) == 3:
                day, month, year = parts

                return (
                    f"{int(day):02d}/{int(month):02d}/{year}",
                    int(year)
                )

    match = TEXT_DOB_RE.search(text)

    if match:
        day, month_text, year = match.groups()

        month = MONTHS.get(month_text.lower())

        if month:
            return (
                f"{int(day):02d}/{month:02d}/{year}",
                int(year)
            )

    match = DOB_RE.search(text)

    if match:
        day, month, year = match.groups()

        return (
            f"{int(day):02d}/{int(month):02d}/{year}",
            int(year)
        )

    return None, None

def infer_religion(text):
    if "jain" in (text or "").lower():
        return "Jain"

    return ""

def field_from_text(text, labels):
    for label in labels:
        pattern = re.compile(rf"{label}\s*[:\-]\s*([^\n\r,]+)", re.IGNORECASE)
        match = pattern.search(text or "")
        if match:
            return " ".join(match.group(1).strip().split())
    return ""


def is_english_or_dual_language(text):
    return bool(ENGLISH_RE.search(text or ""))


def main():
    args = parse_args()
    site = Path(args.site)
    manifest = read_json(args.manifest)
    now = parse_dt(args.now) if args.now else datetime.now().astimezone()
    cutoff = now - timedelta(days=args.lookback_days)
    data_path = site / "data" / "biodata.json"
    images_dir = site / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    existing = (
        read_json(data_path)
        if data_path.exists()
        else {"records": [], "duplicatesSkipped": 0}
    )
    records = existing.get("records", [])
    seen = {record.get("imageHash") or record.get("messageId") for record in records}
    seen.discard(None)
    duplicates = int(existing.get("duplicatesSkipped", 0) or 0)

    for message in manifest.get("messages", []):
        posted_at = parse_dt(message["postedAt"])
        if posted_at < cutoff or not is_friday_girl_window(posted_at):
            continue

        source_image = Path(message["imagePath"])
        image_hash = sha256_file(source_image)
        dedupe_key = image_hash or message.get("messageId")
        if dedupe_key in seen:
            duplicates += 1
            continue

        text = ocr_image(source_image)
        if text and not is_english_or_dual_language(text):
            continue

        birth_date, birth_year = birth_date_from_text(text)
        extension = source_image.suffix.lower() or ".jpg"
        target_name = (
            f"{posted_at.strftime('%Y%m%d-%H%M%S')}-{image_hash[:12]}{extension}"
        )
        target_path = images_dir / target_name
        shutil.copy2(source_image, target_path)

        name = field_from_text(
            text, ["Name", "Bride Name", "Candidate Name", "Girl Name"]
        )

        if not name:
            name = guess_name(text)
        
        religion = infer_religion(text)
        sect = extract_sect(text)
        caste = infer_caste(text)
        records.append(
            {
                "id": message.get("messageId") or image_hash,
                "messageId": message.get("messageId", ""),
                "image": f"./images/{target_name}",
                "imageHash": image_hash,
                "name": name,
                "birthDate": birth_date or "",
                "birthYear": birth_year,
                "city": field_from_text(
                    text,
                    [
                        "City",
                        "Current City",
                        "Residence",
                        "Location",
                        "Place of Residence",
                        "Current Location",
                        "Current Place of Residence"
                    ],
                ),
                "sect": sect,
                "caste": field_from_text(text, ["Caste","Community", "Samaj", "Jati"]),
                "nativePlace": field_from_text(
                    text, ["Native", "Native Place", "Village","Native Village", "Hometown", "Home Town", "Native Town", "Native City", "Home City", "Mosal"]
                ),
                "religion": religion,
                "sourcePostedAt": posted_at.isoformat(),
                "sourceGenderRule": "Friday 07:00-18:00",
                "ocrLanguage": "eng+guj" if text else "not-run",
                "ocrSourceLength": len(text),
                "ocrPreview": text[:1000],
            }
        )
        seen.add(dedupe_key)

    payload = {
        "generatedAt": now.isoformat(),
        "source": "whatsapp-web",
        "rules": {
            "genderSource": "posting-schedule",
            "girlsWindow": "Friday 07:00-18:00",
            "lookbackDays": args.lookback_days,
        },
        "duplicatesSkipped": duplicates,
        "records": records,
    }
    write_json(data_path, payload)


if __name__ == "__main__":
    main()
