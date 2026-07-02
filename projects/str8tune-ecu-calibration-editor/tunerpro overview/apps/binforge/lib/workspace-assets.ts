import { readdir } from "node:fs/promises";
import path from "node:path";

type AssetSummary = {
  count: number;
  files: string[];
};

async function walk(dir: string, root: string, files: string[]) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      await walk(fullPath, root, files);
      continue;
    }

    if (entry.name.toLowerCase().endsWith(".xdf") || entry.name.toLowerCase().endsWith(".bin")) {
      files.push(path.relative(root, fullPath));
    }
  }
}

export async function getWorkspaceAssetSummary(): Promise<AssetSummary> {
  const root = path.resolve(process.cwd(), "..", "..");
  const files: string[] = [];
  await walk(root, root, files);
  return {
    count: files.length,
    files: files.slice(0, 8),
  };
}
