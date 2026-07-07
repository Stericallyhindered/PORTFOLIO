/**
 * Copy strain images from the master_images database to public/strainpics/
 * Run with: node scripts/copy-images.mjs
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_DIR = join(ROOT, 'clone scraper', 'clonewebsite', 'master_images');
const DEST_DIR = join(ROOT, 'public', 'strainpics');

// Image mapping: target filename -> source filename
const IMAGE_MAP = {
  "animal_face.jpg": "mass_hydro_animal_face_clone.jpg",
  "apple_fritter.jpg": "mass_hydro_apple_fritter_clone.jpg",
  "blue_dream.webp": "mass_hydro_blue_dream_clone.webp",
  "bubba_kush.webp": "mass_hydro_bubba_kush_clone.webp",
  "cap_junky.jpg": "clone_conservatory_cap_junky.jpg",
  "double_runtz.jpg": "mass_hydro_double_runtz_clone.jpg",
  "gelonade.webp": "mass_hydro_gelonade_clone.webp",
  "gg4.jpg": "clone_conservatory_gg4.jpg",
  "ghost_og.png": "mass_hydro_ghost_og_clone.png",
  "glitter_bomb.webp": "mass_hydro_glitter_bomb_clone.webp",
  "green_crack.webp": "mass_hydro_green_crack_clone.webp",
  "hollywood.png": "mass_hydro_hollywood_clone.png",
  "london_pound_cake.jpg": "mass_hydro_london_pound_cake_clone.jpg",
  "mimosa.webp": "mass_hydro_mimosa_clone.webp",
  "octane_mintz.webp": "mass_hydro_octane_mintz_clone.webp",
  "oreoz.webp": "mass_hydro_oreoz_clone.webp",
  "oreo_blizzard.jpg": "mass_hydro_oreo_blizzard_clone.jpg",
  "pink_runtz.png": "mass_hydro_pink_runtz_clone.png",
  "pure_michigan.jpg": "mass_hydro_pure_michigan_clone.jpg",
  "rainbow_belts.jpg": "mass_hydro_rainbow_belts_x_runtz_clone.jpg",
  "rs_11.webp": "mass_hydro_rs_11_clone.webp",
  "scented_marker.webp": "mass_hydro_scented_marker_clone.webp",
  "sfv_og.webp": "mass_hydro_san_fernando_valley_og_sfv_og_clone.webp",
  "slapz.webp": "mass_hydro_slapz_clone.webp",
  "snowball.jpg": "mass_hydro_snowball_clone.jpg",
  "strawberry_cough.jpg": "mass_hydro_strawberry_cough_clone.jpg",
  "super_runtz.png": "mass_hydro_super_runtz_clone.png",
  "super_lemon_haze.webp": "mass_hydro_super_lemon_haze_clone.webp",
  "wedding_cake.webp": "mass_hydro_wedding_cake_clone.webp",
  "ice_cream_man.png": "mass_hydro_ice_cream_man_clone.png",
  "blue_zkittles.jpg": "mass_hydro_blue_zkittles_clone.jpg",
  "rainmaker.jpg": "mass_hydro_rainmaker_clone.jpg",
  "monster_cookies.jpg": "mass_hydro_monster_cookies_clone.jpg",
  "gelato_41.png": "clone_conservatory_gelato_41.png",
  "cereal_milk.jpg": "mass_hydro_cereal_milk_clone.jpg",
  "purple_punch.webp": "mass_hydro_purple_punch_clone.webp",
  "rozay.webp": "mass_hydro_rozay_clone.webp",
  "mac_1.webp": "mass_hydro_mac_1_clone.webp",
  "slurricane.webp": "mass_hydro_slurricane_clone.webp",
  "platinum_punch.jpg": "mass_hydro_platinum_punch_clone.jpg",
  "permanent_marker.webp": "mass_hydro_permanent_marker_clone.webp",
  "lemon_cherry_gelato.jpg": "mass_hydro_lemon_cherry_gelato_clone.jpg",
  "forbidden_fruit.webp": "mass_hydro_forbidden_fruit_clone.webp",
  "white_runtz.webp": "mass_hydro_white_runtz_clone.webp",
  "cherry_gas.jpg": "mass_hydro_cherry_gas_clone.jpg",
  "white_truffle.webp": "mass_hydro_white_truffle_clone.webp",
  "sour_diesel.webp": "mass_hydro_sour_diesel_clone.webp",
  "skywalker_og.webp": "mass_hydro_skywalker_og_clone.webp",
  "tahoe_og.jpg": "mass_hydro_tahoe_og_clone.jpg",
  "wifi_og.jpg": "mass_hydro_wifi_og_clone.jpg",
  "larry_og.jpg": "mass_hydro_larry_og_clone.jpg",
  "sunset_sherbet.jpg": "mass_hydro_sunset_sherbet_clone.jpg",
  "cherry_pie_og.jpg": "mass_hydro_cherry_pie_og_clone.jpg",
  "platinum_og.jpg": "mass_hydro_platinum_og_clone.jpg",
  "fruity_pebbles_og.webp": "mass_hydro_fruity_pebbles_og_clone.webp",
  "durban_poison.webp": "mass_hydro_durban_poison_clone.webp",
  "georgia_pie.webp": "mass_hydro_georgia_pie_clone.webp",
  "animal_cookies.jpg": "clone_conservatory_animal_cookies.jpg",
  "blue_zushi.webp": "mass_hydro_blue_zushi_clone.webp",
  "kush_mints.jpg": "mass_hydro_kush_mints_clone.jpg",
  "apples_bananas.jpg": "mass_hydro_apples_bananas_clone.jpg",
  "amnesia_hypro.jpg": "clone_conservatory_amnesia_hypro.jpg",
  "chem_91.jpg": "mass_hydro_chem_91_clone.jpg",
  "grape_ape.png": "mass_hydro_grape_ape_clone.png",
  "cookies_chem.webp": "mass_hydro_cookies_chem_clone.webp",
  "black_maple.jpg": "clone_conservatory_black_maple.jpg",
  "tropicana_cherry.webp": "mass_hydro_tropicana_cherry_clone.webp",
  "lavender.jpg": "mass_hydro_lavender_clone.jpg",
  "blue_dream_santa_cruz.png": "mass_hydro_blue_dream_santa_cruz_cut_clone.png",
  "mochi.webp": "mass_hydro_mochi_clone.webp",
  "gushers.webp": "mass_hydro_gushers_clone.webp",
  "sherbanger_22.webp": "mass_hydro_sherbanger_22_clone.webp",
  "banana_og.webp": "mass_hydro_banana_og_clone.webp",
};

// Create destination directory
if (!existsSync(DEST_DIR)) {
  mkdirSync(DEST_DIR, { recursive: true });
  console.log(`Created: ${DEST_DIR}`);
}

let copied = 0;
let skipped = 0;
let missing = 0;

for (const [destName, srcName] of Object.entries(IMAGE_MAP)) {
  const srcPath = join(SOURCE_DIR, srcName);
  const destPath = join(DEST_DIR, destName);

  if (!existsSync(srcPath)) {
    console.log(`  MISSING: ${srcName}`);
    missing++;
    continue;
  }

  if (existsSync(destPath)) {
    skipped++;
    continue;
  }

  try {
    copyFileSync(srcPath, destPath);
    copied++;
  } catch (err) {
    console.log(`  ERROR: ${destName} - ${err.message}`);
  }
}

console.log(`\nDone! Copied: ${copied}, Skipped: ${skipped}, Missing: ${missing}`);
console.log(`Total images in /public/strainpics/: ${copied + skipped}`);
