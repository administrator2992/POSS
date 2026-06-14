// supabase/functions/dana/index.ts
// DANA QRIS Payment Gateway — Supabase Edge Function (Deno)
// Handles: create-qris, status, cancel, webhook, redirect

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Environment Variables (set via Supabase Secrets) ───────────────────────
const DANA_ENV = Deno.env.get("DANA_ENV") || "sandbox";
const X_PARTNER_ID = Deno.env.get("X_PARTNER_ID") || "";
const MERCHANT_ID = Deno.env.get("DANA_MERCHANT_ID") || Deno.env.get("MERCHANT_ID") || X_PARTNER_ID;
const PRIVATE_KEY = Deno.env.get("DANA_PRIVATE_KEY") || ""; // base64 PKCS8 without headers
const PUBLIC_KEY = Deno.env.get("DANA_PUBLIC_KEY") || ""; // base64 X509 without headers
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FUNCTION_URL = Deno.env.get("FUNCTION_URL") || ""; // this function's public URL
const SUB_MERCHANT_ID = Deno.env.get("DANA_SUB_MERCHANT_ID") || "";
const STORE_ID = Deno.env.get("DANA_STORE_ID") || "";

const DANA_BASE_URL =
  DANA_ENV === "production"
    ? "https://api.saas.dana.id"
    : "https://api.sandbox.dana.id";

// ─── Supabase Client ────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── CORS Helper ────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ─── Timestamp Formatting (GMT+7) ───────────────────────────────────────────
function formatTimestamp(): string {
  const now = new Date();
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = gmt7.getUTCFullYear();
  const m = String(gmt7.getUTCMonth() + 1).padStart(2, "0");
  const d = String(gmt7.getUTCDate()).padStart(2, "0");
  const hh = String(gmt7.getUTCHours()).padStart(2, "0");
  const mm = String(gmt7.getUTCMinutes()).padStart(2, "0");
  const ss = String(gmt7.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`;
}

// ─── DANA Signing (Web Crypto API — Deno compatible) ───────────────────────

/**
 * Strip PEM headers/footers and return pure base64 content.
 */
function stripPemHeaders(pem: string): string {
  return pem
    .replace(/-----BEGIN[^-]+-----/g, "")
    .replace(/-----END[^-]+-----/g, "")
    .replace(/\s/g, "");
}

/**
 * Import a PKCS8 private key (base64) as a CryptoKey.
 */
async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const binaryDer = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Import an X509 public key (base64) as a CryptoKey.
 */
async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const binaryDer = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/**
 * SHA-256 hash of a string, returned as hex.
 */
async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate SNAP B2B signature: RSA-SHA256 sign, base64 output.
 */
async function signSnapB2B(
  httpMethod: string,
  endpointUrl: string,
  requestBody: string,
  timestamp: string
): Promise<string> {
  const hash = await sha256Hex(requestBody);
  const stringToSign = `${httpMethod}:${endpointUrl}:${hash}:${timestamp}`;

  const base64Key = stripPemHeaders(PRIVATE_KEY);
  const key = await importPrivateKey(base64Key);

  const encoded = new TextEncoder().encode(stringToSign);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoded
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify SNAP B2B signature (for webhook verification).
 */
async function verifySnapB2B(
  httpMethod: string,
  endpointUrl: string,
  requestBody: string,
  timestamp: string,
  signatureBase64: string
): Promise<boolean> {
  const hash = await sha256Hex(requestBody);
  const stringToSign = `${httpMethod}:${endpointUrl}:${hash}:${timestamp}`;

  const base64Key = stripPemHeaders(PUBLIC_KEY);
  const key = await importPublicKey(base64Key);

  const encoded = new TextEncoder().encode(stringToSign);
  const signature = Uint8Array.from(atob(signatureBase64), (c) =>
    c.charCodeAt(0)
  );

  return await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    encoded
  );
}

// ─── DANA API Headers ───────────────────────────────────────────────────────
async function buildDanaHeaders(
  method: string,
  endpoint: string,
  body: string,
  debug = false
): Promise<Record<string, string>> {
  const timestamp = formatTimestamp();
  const signature = await signSnapB2B(method, endpoint, body, timestamp);
  const externalId = "sdk" + crypto.randomUUID().slice(3);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-TIMESTAMP": timestamp,
    "X-SIGNATURE": signature,
    ORIGIN: FUNCTION_URL || SUPABASE_URL,
    "X-PARTNER-ID": X_PARTNER_ID,
    "X-EXTERNAL-ID": externalId,
    "CHANNEL-ID": "95221",
  };

  if (debug && DANA_ENV === "sandbox") {
    headers["X-Debug-Mode"] = "true";
  }

  return headers;
}

/**
 * Make a signed request to DANA API.
 */
async function danaApiCall(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const bodyStr = JSON.stringify(body);
  const headers = await buildDanaHeaders("POST", endpoint, bodyStr, true);

  console.log("=== DANA API REQUEST ===");
  console.log("Endpoint:", endpoint);
  console.log("Headers:", JSON.stringify(headers, null, 2));
  console.log("Payload:", bodyStr);
  console.log("========================");

  const res = await fetch(`${DANA_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: bodyStr,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("DANA API Raw Error Response:", errBody);
    throw new Error(
      `DANA API ${res.status}: ${errBody}`
    );
  }

  const resText = await res.text();
  if (!resText || resText.trim() === "") {
    return { success: true, empty: true };
  }
  return JSON.parse(resText);
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

async function handleCreateQris(req: Request): Promise<Response> {
  const { amount, orderId, items } = await req.json();

  if (!amount || amount <= 0) {
    return json({ error: "Invalid amount" }, 400);
  }

  const partnerReferenceNo = (orderId || `POSS-${Date.now()}`).substring(0, 25);

  // Validity: 15 minutes from now (GMT+7)
  const validUpTo = new Date(Date.now() + 15 * 60 * 1000);
  const gmt7Date = new Date(validUpTo.getTime() + 7 * 60 * 60 * 1000);
  const validityStr =
    gmt7Date.toISOString().replace("Z", "+07:00").slice(0, 19) + "+07:00";

  // Request body matching SNAP Generate QRIS (Service Code 47)
  const requestBody = {
    merchantId: MERCHANT_ID,
    subMerchantId: SUB_MERCHANT_ID || undefined,
    storeId: STORE_ID,
    partnerReferenceNo,
    amount: { value: amount.toFixed(2), currency: "IDR" },
    validityPeriod: validityStr,
    additionalInfo: {
      envInfo: {
        sourcePlatform: "IPG",
        terminalType: "SYSTEM",
        orderTerminalType: "WEB",
      },
    },
  };

  try {
    // Generate QRIS endpoint (Service Code 47)
    const endpoint = `/v1.0/qr/qr-mpm-generate.htm`;
    const response = (await danaApiCall(
      endpoint,
      requestBody
    )) as Record<string, unknown>;

    // Save order to Supabase
    await supabase.from("dana_orders").upsert({
      reference_no: partnerReferenceNo,
      amount,
      status: "PENDING",
      dana_response: response,
    });

    return json({
      success: true,
      referenceNo: partnerReferenceNo,
      referenceId: (response as any)?.referenceNo || null,
      qrContent: (response as any)?.qrContent || null,
      qrUrl: (response as any)?.qrUrl || null,
    });
  } catch (error) {
    console.error("DANA create-qris error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

async function handleStatus(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const referenceNo = url.pathname.split("/").pop() || "";

  if (!referenceNo) {
    return json({ error: "referenceNo is required" }, 400);
  }

  try {
    // QRIS MPM Query endpoint (Service Code 47)
    const endpoint = `/v1.0/qr/qr-mpm-query.htm`;
    const statusResponse = (await danaApiCall(endpoint, {
      originalPartnerReferenceNo: referenceNo,
      originalReferenceNo: "",
      merchantId: MERCHANT_ID,
      serviceCode: "47",
    })) as Record<string, unknown>;

    // QRIS MPM query returns latestTransactionStatus:
    // "00" = success, "01" = initiated, "03" = paying, "04" = refunded, etc.
    const txStatus = (statusResponse as any)?.latestTransactionStatus || "";
    const paid = txStatus === "00";
    const statusLabel = txStatus === "00" ? "SUCCESS" : 
                        txStatus === "01" ? "INITIATED" :
                        txStatus === "03" ? "PAYING" :
                        txStatus === "04" ? "REFUNDED" : "UNKNOWN";

    // Update order in Supabase
    await supabase
      .from("dana_orders")
      .update({ status: statusLabel, dana_response: statusResponse })
      .eq("reference_no", referenceNo);

    return json({ success: true, referenceNo, status: statusLabel, paid, details: statusResponse });
  } catch (error) {
    // Fall back to DB status
    const { data } = await supabase
      .from("dana_orders")
      .select("status")
      .eq("reference_no", referenceNo)
      .single();

    return json({
      success: true,
      referenceNo,
      status: data?.status || "UNKNOWN",
      paid: data?.status === "SUCCESS",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function handleCancel(req: Request): Promise<Response> {
  const { referenceNo } = await req.json();

  if (!referenceNo) {
    return json({ error: "referenceNo is required" }, 400);
  }

  try {
    // QRIS transactions (Service Code 47) do not have a server-side cancellation endpoint.
    // The POS application just stops polling and marks the local order as cancelled.
    await supabase
      .from("dana_orders")
      .update({ status: "CANCELLED" })
      .eq("reference_no", referenceNo);

    return json({ success: true, referenceNo, status: "CANCELLED" });
  } catch (error) {
    console.error("DANA cancel error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

async function handleWebhook(req: Request): Promise<Response> {
  try {
    const bodyText = await req.text();
    const timestamp = req.headers.get("X-TIMESTAMP") || "";
    const signature = req.headers.get("X-SIGNATURE") || "";

    if (PUBLIC_KEY && timestamp && signature) {
      const valid = await verifySnapB2B(
        "POST",
        "/dana",
        bodyText,
        timestamp,
        signature
      );
      if (!valid) {
        console.error("Webhook signature verification failed");
        return json({ success: false, error: "Invalid signature" }, 400);
      }
    }

    const payload = JSON.parse(bodyText);
    const refNo = payload?.originalPartnerReferenceNo;

    console.log("DANA webhook received:", refNo);

    if (refNo) {
      await supabase
        .from("dana_orders")
        .update({
          status: "SUCCESS",
          dana_response: payload,
          paid_at: new Date().toISOString(),
        })
        .eq("reference_no", refNo);
    }

    return json({ success: true });
  } catch (error) {
    console.error("DANA webhook error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
}

function handleRedirect(url: URL): Response {
  const partnerReferenceNo = url.searchParams.get("partnerReferenceNo") || "";
  const acquirementId = url.searchParams.get("acquirementId") || "";

  // Update order in Supabase (fire-and-forget)
  if (partnerReferenceNo) {
    supabase
      .from("dana_orders")
      .update({ status: "SUCCESS", paid_at: new Date().toISOString() })
      .eq("reference_no", partnerReferenceNo)
      .then(() => {})
      .catch(() => {});
  }

  // Simple success page — the installed app polls /status/:ref or
  // listens to Supabase Realtime, so no postMessage needed.
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Pembayaran Berhasil</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fff7ed, #ffedd5); }
    .card { background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 400px; }
    .icon { width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; }
    h1 { color: #166534; margin: 0 0 8px; }
    p { color: #6b7280; margin: 0 0 4px; font-size: 14px; }
    .ref { font-family: monospace; color: #9ca3af; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10003;</div>
    <h1>Pembayaran Berhasil!</h1>
    <p>Transaksi DANA QRIS Anda telah diterima.</p>
    <p>Anda bisa menutup halaman ini.</p>
    <div class="ref">${partnerReferenceNo ? `Ref: ${partnerReferenceNo}` : ""}</div>
  </div>
  <script>
    // Auto-close if opened in a popup/in-app browser
    try { window.close(); } catch(e) {}
    setTimeout(function() { try { window.close(); } catch(e) {} }, 5000);
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
  });
}

// ─── Health Check ───────────────────────────────────────────────────────────
function handleHealth(): Response {
  return json({
    status: "ok",
    env: DANA_ENV,
    partnerId: X_PARTNER_ID ? `${X_PARTNER_ID.slice(0, 4)}***` : "NOT_SET",
    merchantId: MERCHANT_ID ? `${MERCHANT_ID.slice(0, 4)}***` : "NOT_SET",
    hasPrivateKey: !!PRIVATE_KEY,
    hasPublicKey: !!PUBLIC_KEY,
    hasSupabase: !!SUPABASE_URL,
  });
}

// ─── Main Router ────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Route based on path suffix
    if (path.endsWith("/health") || path.endsWith("/dana")) {
      if (req.method === "GET") return handleHealth();
    }

    if (path.endsWith("/create-qris") && req.method === "POST") {
      return await handleCreateQris(req);
    }

    if (path.includes("/status/") && req.method === "GET") {
      return await handleStatus(req);
    }

    if (path.endsWith("/cancel") && req.method === "POST") {
      return await handleCancel(req);
    }

    if (path.endsWith("/webhook") && req.method === "POST") {
      return await handleWebhook(req);
    }

    if (path.endsWith("/redirect") && req.method === "GET") {
      return handleRedirect(url);
    }

    return json({ error: "Not found", path }, 404);
  } catch (error) {
    console.error("Unhandled error:", error);
    return json(
      {
        error: "Internal error",
        message: error instanceof Error ? error.message : "Unknown",
      },
      500
    );
  }
});
