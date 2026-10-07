import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_image(image_path):
    text = pytesseract.image_to_string(Image.open(image_path))
    
    text = text.lower()
    text = text.replace("\n", " ")
    text = text.replace("  ", " ")

    return text
