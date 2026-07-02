"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  clientId?: string;
  defaultBusinessName?: string;
};

export function GenerateGeoPackageForm({ clientId, defaultBusinessName }: Props) {
  const [businessName, setBusinessName] = useState(defaultBusinessName ?? "");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressLocality, setAddressLocality] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("US");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [areaServedText, setAreaServedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    const backendProjectId = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;
    if (!backendProjectId) {
      setMessage("No client selected");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const body = await fastapiFetch<{ deliverableId: string }>("/workflows/geo-package", {
        method: "POST",
        body: JSON.stringify({
          project_id: backendProjectId,
          businessName: businessName || undefined,
          phone: phone || undefined,
          logoUrl: logoUrl || undefined,
          imageUrl: imageUrl || undefined,
          serviceType: serviceType || undefined,
          streetAddress: streetAddress || undefined,
          addressLocality: addressLocality || undefined,
          addressRegion: addressRegion || undefined,
          postalCode: postalCode || undefined,
          addressCountry: addressCountry || undefined,
          latitude: latitude === "" ? undefined : Number(latitude),
          longitude: longitude === "" ? undefined : Number(longitude),
          areaServed:
            areaServedText.trim().length === 0
              ? undefined
              : areaServedText
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
        }),
      });
      setMessage(`Package generated (${body.deliverableId})`);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">Generate Schema + GEO Package</p>
        <p className="text-xs text-muted-foreground">
          Auto-build a production implementation plan with JSON-LD and prioritized
          GEO fixes from the latest crawl/audit data.
        </p>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Input
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <Input
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          placeholder="Service type (optional)"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        />
        <Input
          placeholder="Logo URL (optional)"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
        <Input
          placeholder="Hero image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <Input
          placeholder="Street address (optional)"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
        />
        <Input
          placeholder="City/locality (optional)"
          value={addressLocality}
          onChange={(e) => setAddressLocality(e.target.value)}
        />
        <Input
          placeholder="Region/state (optional)"
          value={addressRegion}
          onChange={(e) => setAddressRegion(e.target.value)}
        />
        <Input
          placeholder="Postal code (optional)"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
        <Input
          placeholder="Country code (optional, e.g. US)"
          value={addressCountry}
          onChange={(e) => setAddressCountry(e.target.value)}
        />
        <Input
          placeholder="Latitude (optional)"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />
        <Input
          placeholder="Longitude (optional)"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />
        <Input
          placeholder="Area served list (comma separated)"
          value={areaServedText}
          onChange={(e) => setAreaServedText(e.target.value)}
        />
        <Button onClick={generate} disabled={loading || !process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID}>
          {loading ? "Generating..." : "Generate GEO Package"}
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

