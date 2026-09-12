import zipfile
import xml.etree.ElementTree as ET
import re
import os

pptx_path = r"C:\Users\debma\Downloads\SIH26032_Nexora.pptx"

if not os.path.exists(pptx_path):
    print(f"File not found: {pptx_path}")
    exit(1)

print(f"Inspecting PPTX: {pptx_path}")

with zipfile.ZipFile(pptx_path, 'r') as z:
    # Find all slide files and sort them numerically
    slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
    def extract_slide_num(filename):
        nums = re.findall(r'\d+', filename)
        return int(nums[-1]) if nums else 0
    slide_files.sort(key=extract_slide_num)
    
    print(f"Total Slides Found: {len(slide_files)}\n" + "="*50)
    
    for idx, slide_file in enumerate(slide_files, 1):
        content = z.read(slide_file)
        tree = ET.fromstring(content)
        
        # Extract text from all 'a:t' (text) XML tags in PowerPoint namespaces
        slide_texts = []
        for elem in tree.iter():
            if elem.tag.endswith('}t') and elem.text:
                text = elem.text.strip()
                if text:
                    slide_texts.append(text)
        
        print(f"\n--- SLIDE {idx} [{slide_file}] ---")
        if slide_texts:
            for line in slide_texts:
                print(f"  • {line}")
        else:
            print("  (No text found on this slide)")
            
    print("\n" + "="*50 + "\nInspection complete.")
