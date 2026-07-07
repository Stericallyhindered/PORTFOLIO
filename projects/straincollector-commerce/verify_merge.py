import json
import os

# Count clones in database
with open('data/clones.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    clone_count = len(data['clones'])

# Count images
image_count = len([f for f in os.listdir('strainpics') if os.path.isfile(os.path.join('strainpics', f))])

# Count strain folders
strain_folders = len([d for d in os.listdir('strains') if os.path.isdir(os.path.join('strains', d))])

print("=" * 60)
print("STRAINCOLLECTOR VERIFICATION")
print("=" * 60)
print(f"Total clones in database: {clone_count}")
print(f"Total images in strainpics/: {image_count}")
print(f"Total strain folders: {strain_folders}")
print("=" * 60)

# Show sample of strains
print("\nSample of merged strains:")
print("-" * 60)
for i, clone in enumerate(data['clones'][:10]):
    print(f"{i+1}. {clone['name']}")
    print(f"   Image: {clone['image']}")
    print()

