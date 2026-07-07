import json
import random

# Load all clones
with open('data/clones.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

clones = data['clones']

print("=" * 80)
print(" " * 20 + "STRAINCOLLECTOR STRAIN SHOWCASE")
print("=" * 80)
print(f"\n🌿 Total Strains Available: {len(clones)}")
print("\n" + "-" * 80)
print("🔥 FEATURED STRAINS (Random Sample):")
print("-" * 80)

# Show 20 random strains
random_strains = random.sample(clones, min(20, len(clones)))

for i, strain in enumerate(random_strains, 1):
    print(f"\n{i}. {strain['name']}")
    print(f"   Rarity: {strain['rarity']}")
    print(f"   Image: {strain['image']}")

print("\n" + "=" * 80)
print("\n💎 LEGENDARY STRAINS (If Present):")
print("-" * 80)

# Look for famous strains
legendary = ['Blue Dream', 'OG', 'Kush', 'Gelato', 'Cookies', 'Zkittlez', 
             'Wedding Cake', 'Gary Payton', 'Runtz', 'Sherbet']

found_legendary = []
for clone in clones:
    for legend in legendary:
        if legend.lower() in clone['name'].lower():
            found_legendary.append(clone)
            break

if found_legendary:
    for strain in found_legendary[:15]:
        print(f"✨ {strain['name']}")
else:
    print("Scanning for legendary genetics...")

print("\n" + "=" * 80)
print("🎯 Ready to browse all strains at: http://localhost:8000/index.html")
print("=" * 80)

