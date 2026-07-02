import { EditorWorkspace } from "@/components/editor-workspace";
import { loadHelpPreview } from "@/lib/help-knowledge";
import { getWorkspaceAssetSummary } from "@/lib/workspace-assets";

export default async function EditorPage() {
  const [helpPreview, assetSummary] = await Promise.all([loadHelpPreview(), getWorkspaceAssetSummary()]);

  return <EditorWorkspace helpPreview={helpPreview} workspaceAssets={assetSummary} />;
}
