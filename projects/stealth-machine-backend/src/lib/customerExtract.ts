/**
 * Extract customer info from chat message text (user or assistant).
 * Used to populate ChatSession and optionally register customers.
 */

export interface ExtractedCustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  serialNumber?: string;
  machineModel?: string;
}

// Common patterns for extraction
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
// Serial numbers: alphanumeric, often with dashes, 6-20 chars
const SERIAL_REGEX = /(?:serial|s\/n|sn|#)\s*[:\-]?\s*([A-Za-z0-9\-]{6,20})/gi;
const SERIAL_STANDALONE = /\b([A-Z]{2,4}[-]?\d{4,10}[A-Z0-9\-]*)\b/g; // e.g. SL-4020-ABC123

export function extractCustomerInfoFromText(text: string): ExtractedCustomerInfo {
  const result: ExtractedCustomerInfo = {};
  if (!text || typeof text !== 'string') return result;

  const t = text.trim();

  // Email
  const emails = t.match(EMAIL_REGEX);
  if (emails?.length) result.email = emails[0];

  // Phone
  const phones = t.match(PHONE_REGEX);
  if (phones?.length) result.phone = phones[0].replace(/\s/g, '');

  // Serial number (from "serial: XYZ" or "s/n ABC123" or standalone model-like codes)
  const serialMatch = t.match(SERIAL_REGEX);
  if (serialMatch) {
    const parts = serialMatch[0].split(/[:\-]\s*/);
    if (parts.length >= 2) result.serialNumber = parts[parts.length - 1].trim();
  }
  if (!result.serialNumber) {
    const standalone = t.match(SERIAL_STANDALONE);
    if (standalone?.length) {
      // Prefer longer alphanumeric that looks like serial (contains digits and letters)
      const likelySerial = standalone.find(s => /[0-9]/.test(s) && /[A-Za-z]/.test(s) && s.length >= 8);
      if (likelySerial) result.serialNumber = likelySerial;
    }
  }

  // Name: "I'm X" or "My name is X" or "This is X"
  const namePatterns = [
    /(?:i'm|i am|im|my name is|this is|call me|it's)\s+([A-Za-z][A-Za-z\s]{1,30})/gi,
    /(?:name is|named)\s+([A-Za-z][A-Za-z\s]{1,30})/gi,
  ];
  for (const re of namePatterns) {
    const m = t.match(re);
    if (m) {
      const part = m[0].replace(/^(i'm|i am|im|my name is|this is|call me|it's|name is|named)\s+/gi, '').trim();
      if (part.length >= 2 && part.length <= 50) {
        result.name = part;
        break;
      }
    }
  }

  // Machine model: common patterns "SL-4020", "SS3015", "BLT310", etc.
  const modelPatterns = [
    /\b(SL[\-\s]?\d{4}[A-Za-z]*|SS\d{4}[A-Za-z]*|BLT\d{3}[A-Za-z]*|FSCUT\d+[A-Za-z]*|SSX\d+)\b/gi,
    /\b(laser|fiber|press brake|co2|tube)\s+(model\s+)?([A-Za-z0-9\-]+)/gi,
  ];
  for (const re of modelPatterns) {
    const m = t.match(re);
    if (m) {
      const model = m[0].replace(/^(laser|fiber|press brake|co2|tube)\s+(model\s+)?/gi, '').trim();
      if (model.length >= 2) {
        result.machineModel = model;
        break;
      }
    }
  }

  return result;
}

/**
 * Merge extracted info into existing partial info (only set fields that are not already set).
 */
export function mergeExtractedInfo(
  existing: Partial<ExtractedCustomerInfo>,
  extracted: ExtractedCustomerInfo
): ExtractedCustomerInfo {
  return {
    name: existing.name || extracted.name,
    email: existing.email || extracted.email,
    phone: existing.phone || extracted.phone,
    serialNumber: existing.serialNumber || extracted.serialNumber,
    machineModel: existing.machineModel || extracted.machineModel,
  };
}
