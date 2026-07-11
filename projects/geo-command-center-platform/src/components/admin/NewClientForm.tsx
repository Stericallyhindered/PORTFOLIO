"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewClientForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, websiteUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to create client");
      } else {
        setName("");
        setWebsiteUrl("");
        setOpen(false);
        // Best-effort refresh of server components.
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error creating client");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        New client
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        placeholder="Client name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-40"
      />
      <Input
        placeholder="https://client.com"
        value={websiteUrl}
        onChange={(e) => setWebsiteUrl(e.target.value)}
        className="h-8 w-52"
      />
      <Button size="sm" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </Button>
      <Button
        size="sm"
        type="button"
        variant="ghost"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
      >
        Cancel
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}

