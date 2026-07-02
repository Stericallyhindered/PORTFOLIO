"use client";

import { Button } from "@/components/ui/button";

type Props = {
  packageId: string;
};

export function DeleteGeoPackageButton({ packageId }: Props) {
  async function remove() {
    const confirmed = window.confirm("Delete this GEO package?");
    if (!confirmed) return;
    const res = await fetch(`/api/geo-packages/${packageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={remove}>
      Delete
    </Button>
  );
}

