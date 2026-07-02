"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ClientOption = {
  id: string;
  name: string;
  websiteUrl: string;
};

type Props = {
  clients: ClientOption[];
  currentClientId?: string;
};

export function ActiveWebsiteSwitcher({ clients, currentClientId }: Props) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState(currentClientId ?? "");
  const [loading, setLoading] = useState(false);

  async function switchWebsite() {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/context/active-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled>
        No Website Selected
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 rounded-md border bg-background px-2 text-xs"
        value={selectedClientId}
        onChange={(e) => setSelectedClientId(e.target.value)}
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.websiteUrl}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        disabled={loading || selectedClientId === currentClientId}
        onClick={switchWebsite}
      >
        {loading ? "Switching active website..." : "Set Active Website"}
      </Button>
    </div>
  );
}

