#!/usr/bin/env python3
"""
Merge all strains from clone scraper into StrainCollector
This script will:
1. Parse the master_strains.html file
2. Extract all strain names and images
3. Copy images to strainpics/
4. Update data/clones.json with all new strains
5. Create strain folders in strains/ directory
"""

import json
import os
import shutil
import re
from pathlib import Path
from html.parser import HTMLParser

# Paths
CLONE_SCRAPER_DIR = Path(r"C:\Users\matt\Desktop\clone scraper")
STRAINCOLLECTOR_DIR = Path(r"C:\Users\matt\Desktop\straincollector")
MASTER_HTML = CLONE_SCRAPER_DIR / "master_strains.html"
MASTER_IMAGES = CLONE_SCRAPER_DIR / "master_images"
TARGET_IMAGES = STRAINCOLLECTOR_DIR / "strainpics"
TARGET_CLONES_JSON = STRAINCOLLECTOR_DIR / "data" / "clones.json"
TARGET_STRAINS_DIR = STRAINCOLLECTOR_DIR / "strains"


class StrainParser(HTMLParser):
    """Parse strain cards from HTML"""
    def __init__(self):
        super().__init__()
        self.strains = []
        self.current_strain = {}
        self.in_strain_card = False
        self.in_strain_name = False
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        # Detect strain card
        if tag == 'div' and attrs_dict.get('class') == 'strain-card':
            self.in_strain_card = True
            self.current_strain = {}
            
        # Get image
        if self.in_strain_card and tag == 'img':
            self.current_strain['image'] = attrs_dict.get('src', '')
            self.current_strain['alt'] = attrs_dict.get('alt', '')
            
        # Detect strain name div
        if self.in_strain_card and tag == 'div' and attrs_dict.get('class') == 'strain-name':
            self.in_strain_name = True
    
    def handle_data(self, data):
        if self.in_strain_name:
            self.current_strain['name'] = data.strip()
            self.in_strain_name = False
    
    def handle_endtag(self, tag):
        if tag == 'div' and self.in_strain_card:
            # Check if we have a complete strain
            if 'name' in self.current_strain and 'image' in self.current_strain:
                self.strains.append(self.current_strain.copy())
            self.in_strain_card = False


def slugify(text):
    """Convert name to slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def parse_strains():
    """Parse all strains from HTML"""
    print(f"Parsing {MASTER_HTML}")
    
    with open(MASTER_HTML, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    parser = StrainParser()
    parser.feed(html_content)
    
    print(f"Found {len(parser.strains)} strains")
    return parser.strains


def copy_images(strains):
    """Copy all images to strainpics folder"""
    print(f"\nCopying images to {TARGET_IMAGES}")
    TARGET_IMAGES.mkdir(exist_ok=True)
    
    copied = 0
    skipped = 0
    
    for strain in strains:
        image_path = strain.get('image', '')
        if not image_path:
            continue
            
        # Get source image path
        source_image = CLONE_SCRAPER_DIR / image_path
        
        if not source_image.exists():
            print(f"  Warning: Image not found: {source_image}")
            skipped += 1
            continue
        
        # Get target image name
        slug = slugify(strain['name'])
        ext = source_image.suffix
        target_image = TARGET_IMAGES / f"{slug}{ext}"
        
        # Copy image
        try:
            shutil.copy2(source_image, target_image)
            strain['local_image'] = f"strainpics/{slug}{ext}"
            copied += 1
            if copied % 50 == 0:
                print(f"  Copied {copied} images...")
        except Exception as e:
            print(f"  Error copying {source_image}: {e}")
            skipped += 1
    
    print(f"Copied {copied} images, skipped {skipped}")
    return strains


def create_strain_folders(strains):
    """Create strain folders with description.txt files"""
    print(f"\nCreating strain folders in {TARGET_STRAINS_DIR}")
    TARGET_STRAINS_DIR.mkdir(exist_ok=True)
    
    created = 0
    
    for strain in strains:
        slug = slugify(strain['name'])
        strain_dir = TARGET_STRAINS_DIR / slug
        strain_dir.mkdir(exist_ok=True)
        
        # Create description.txt
        desc_file = strain_dir / "description.txt"
        if not desc_file.exists():
            with open(desc_file, 'w', encoding='utf-8') as f:
                f.write(f"{strain['name']}\n\n")
                f.write("Premium genetics from verified sources.\n\n")
                f.write("Contact for availability and pricing.\n")
            created += 1
    
    print(f"Created {created} strain folders")


def update_clones_json(strains):
    """Update clones.json with all new strains"""
    print(f"\nUpdating {TARGET_CLONES_JSON}")
    
    # Load existing clones.json
    if TARGET_CLONES_JSON.exists():
        with open(TARGET_CLONES_JSON, 'r', encoding='utf-8') as f:
            clones_data = json.load(f)
    else:
        clones_data = {
            "packs": {
                "single": {
                    "id": "single",
                    "label": "Rooted Clone",
                    "quantity": 1,
                    "price": 100
                },
                "snip": {
                    "id": "snip",
                    "label": "Fresh Snip",
                    "quantity": 1,
                    "price": 50
                },
                "half": {
                    "id": "half",
                    "label": "Half Tray (25)",
                    "quantity": 25,
                    "price": 1250
                },
                "full": {
                    "id": "full",
                    "label": "Full Tray (50)",
                    "quantity": 50,
                    "price": 2750
                },
                "mixHalf": {
                    "id": "mixHalf",
                    "label": "Mix Half Tray (25)",
                    "quantity": 25,
                    "price": 1500
                },
                "mixFull": {
                    "id": "mixFull",
                    "label": "Mix Full Tray (50)",
                    "quantity": 50,
                    "price": 3000
                }
            },
            "clones": []
        }
    
    # Get existing clone slugs
    existing_slugs = {clone['slug'] for clone in clones_data['clones']}
    
    # Add new clones
    added = 0
    for strain in strains:
        slug = slugify(strain['name'])
        
        if slug not in existing_slugs:
            clone_entry = {
                "slug": slug,
                "name": strain['name'],
                "rarity": "Premium",
                "description": f"{strain['name']} - Elite verified genetics",
                "image": strain.get('local_image', '')
            }
            clones_data['clones'].append(clone_entry)
            added += 1
    
    # Sort clones by name
    clones_data['clones'].sort(key=lambda x: x['name'])
    
    # Save updated clones.json
    with open(TARGET_CLONES_JSON, 'w', encoding='utf-8') as f:
        json.dump(clones_data, f, indent=2, ensure_ascii=False)
    
    print(f"Added {added} new clones")
    print(f"Total clones in database: {len(clones_data['clones'])}")


def main():
    print("=" * 60)
    print("StrainCollector Clone Merger")
    print("=" * 60)
    
    # Parse strains from HTML
    strains = parse_strains()
    
    if not strains:
        print("No strains found!")
        return
    
    # Copy images
    strains = copy_images(strains)
    
    # Create strain folders
    create_strain_folders(strains)
    
    # Update clones.json
    update_clones_json(strains)
    
    print("\n" + "=" * 60)
    print("MERGE COMPLETE!")
    print("=" * 60)
    print(f"✓ {len(strains)} strains merged")
    print(f"✓ Images copied to {TARGET_IMAGES}")
    print(f"✓ Folders created in {TARGET_STRAINS_DIR}")
    print(f"✓ Database updated at {TARGET_CLONES_JSON}")
    print("\nYour StrainCollector website now has all strains!")


if __name__ == "__main__":
    main()

