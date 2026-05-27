import sys
import os
from PIL import Image

def process_logo():
    input_path = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/7ebcf3ae-f224-4063-aebd-71b551951bbb/media__1779804653382.png'
    output_path = 'c:/Users/ADMIN/OneDrive/Desktop/main_directory_homepage/src/assets/haveda_logo.png'

    print(f"Loading logo from {input_path}...")
    img = Image.open(input_path)

    # 1. Upscale by 2x using Lanczos for higher quality / smoother edges
    w, h = img.size
    img_large = img.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    img_rgba = img_large.convert("RGBA")

    # 2. Make background transparent (white/near-white pixels)
    data = img_rgba.getdata()
    new_data = []
    
    for item in data:
        r, g, b, a = item
        # If the pixel is very close to white, make it transparent
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, a))
            
    img_rgba.putdata(new_data)

    # 3. Crop bounding box of non-transparent pixels to trim any empty margins
    bbox = img_rgba.getbbox()
    if bbox:
        img_rgba = img_rgba.crop(bbox)
        
    print(f"Saving transparent logo to {output_path}...")
    img_rgba.save(output_path, "PNG")
    print("Logo processing completed successfully.")

if __name__ == "__main__":
    process_logo()
