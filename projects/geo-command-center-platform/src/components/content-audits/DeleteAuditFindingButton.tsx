"use client";

import { Button } from "@/components/ui/button";

type Props = {
  auditId: string;
};

export function DeleteAuditFindingButton({ auditId }: Props) {
  async function onDelete() {
    const confirmed = window.confirm("Delete this audit finding?");
    if (!confirmed) return;
    const res = await fetch(`/api/content-audits/${auditId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onDelete}>
      Delete
    </Button>
  );
}

