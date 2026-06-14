from pathlib import Path
import cv2
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

for image_path in Path("ocr-test").glob("*"):
    img = cv2.imread(str(image_path))

    if img is None:
        continue

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    text = pytesseract.image_to_string(gray, lang="eng+guj")

    print("=" * 80)
    print(image_path.name)
    print(text[:3000])
