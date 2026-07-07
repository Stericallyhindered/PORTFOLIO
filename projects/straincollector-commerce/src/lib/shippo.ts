import type { ShippingAddress } from "./types";

const SHIPPO_BASE_URL = "https://api.goshippo.com";

function getHeaders() {
  return {
    Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

interface ShippoAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

interface ShippoValidationResult {
  is_valid: boolean;
  messages?: Array<{ text: string }>;
}

interface ShippoShipment {
  object_id: string;
  rates: ShippoRate[];
}

interface ShippoRate {
  object_id: string;
  provider: string;
  servicelevel: { name: string; token: string };
  amount: string;
  currency: string;
  estimated_days: number;
}

interface ShippoTransaction {
  object_id: string;
  status: string;
  tracking_number: string;
  tracking_url_provider: string;
  label_url: string;
  messages?: Array<{ text: string }>;
}

// ─── Validate Address ────────────────────────────────────────
export async function validateAddress(
  address: ShippingAddress
): Promise<ShippoValidationResult> {
  const res = await fetch(`${SHIPPO_BASE_URL}/addresses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: address.name,
      street1: address.street1,
      street2: address.street2 || "",
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country || "US",
      validate: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Shippo address validation failed: ${errorText}`);
  }

  const data = await res.json();
  return {
    is_valid: data.validation_results?.is_valid ?? false,
    messages: data.validation_results?.messages,
  };
}

// ─── Create Shipment ─────────────────────────────────────────
export async function createShipment(
  toAddress: ShippingAddress,
  customerEmail: string,
  customerPhone: string
): Promise<ShippoShipment> {
  const fromAddress: ShippoAddress = {
    name: process.env.ORIGIN_NAME || "StrainCollector",
    street1: process.env.ORIGIN_STREET || "",
    city: process.env.ORIGIN_CITY || "",
    state: process.env.ORIGIN_STATE || "",
    zip: process.env.ORIGIN_ZIP || "",
    country: process.env.ORIGIN_COUNTRY || "US",
    phone: process.env.ORIGIN_PHONE || "",
    email: process.env.ORIGIN_EMAIL || "",
  };

  const res = await fetch(`${SHIPPO_BASE_URL}/shipments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      address_from: fromAddress,
      address_to: {
        name: toAddress.name,
        street1: toAddress.street1,
        street2: toAddress.street2 || "",
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country || "US",
        phone: customerPhone,
        email: customerEmail,
      },
      parcels: [
        {
          length: "10",
          width: "8",
          height: "6",
          distance_unit: "in",
          weight: "2",
          mass_unit: "lb",
        },
      ],
      async: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Shippo create shipment failed: ${errorText}`);
  }

  return res.json();
}

// ─── Purchase Label ──────────────────────────────────────────
export async function purchaseLabel(
  rateId: string
): Promise<ShippoTransaction> {
  const res = await fetch(`${SHIPPO_BASE_URL}/transactions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      rate: rateId,
      label_file_type: "PDF",
      async: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Shippo purchase label failed: ${errorText}`);
  }

  return res.json();
}

// ─── Full Label Generation Flow ──────────────────────────────
export async function generateShippingLabel(
  toAddress: ShippingAddress,
  customerEmail: string,
  customerPhone: string
): Promise<{
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
} | null> {
  try {
    // 1. Create shipment and get rates
    const shipment = await createShipment(toAddress, customerEmail, customerPhone);

    if (!shipment.rates || shipment.rates.length === 0) {
      console.error("No shipping rates returned from Shippo");
      return null;
    }

    // 2. Find USPS Priority Mail rate (preferred) or cheapest rate
    let selectedRate = shipment.rates.find(
      (r) =>
        r.provider === "USPS" &&
        r.servicelevel.token === "usps_priority"
    );

    if (!selectedRate) {
      // Fall back to any USPS rate
      selectedRate = shipment.rates.find((r) => r.provider === "USPS");
    }

    if (!selectedRate) {
      // Fall back to cheapest rate
      selectedRate = shipment.rates.sort(
        (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
      )[0];
    }

    // 3. Purchase the label
    const transaction = await purchaseLabel(selectedRate.object_id);

    if (transaction.status !== "SUCCESS") {
      console.error("Label purchase failed:", transaction.messages);
      return null;
    }

    return {
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      labelUrl: transaction.label_url,
    };
  } catch (error) {
    console.error("Shipping label generation error:", error);
    return null;
  }
}
