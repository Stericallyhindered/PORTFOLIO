import { readFile } from "node:fs/promises";
import path from "node:path";
import type { HelpPreview } from "@/lib/types";

type ManifestCategory = {
  name: string;
  pages: string[];
};

type ManifestFile = {
  includedCount: number;
  categories: ManifestCategory[];
};

export async function loadHelpPreview(): Promise<HelpPreview> {
  const manifestPath = path.resolve(process.cwd(), "..", "..", "research", "tunerpro_bin_editing_manifest.json");
  const sourcePath = path.resolve(process.cwd(), "..", "..", "research", "tunerpro_bin_editing_sourcepack.md");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ManifestFile;
  const sourcePack = await readFile(sourcePath, "utf8");
  const sectionHeadings = sourcePack
    .split("\n")
    .filter((line) => line.startsWith("## source/"))
    .slice(0, 8)
    .map((line) => line.replace("## ", ""));

  return {
    includedPages: manifest.includedCount,
    categories: manifest.categories.map((category) => ({
      name: category.name,
      count: category.pages.length,
    })),
    sampleSections: sectionHeadings,
  };
}
