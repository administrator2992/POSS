# POSS - DANA QRIS Developer Integration & Production Go-Live Guide

This document provides a developer-focused summary of the DANA QRIS integration in the POSS POS system, detailing the current Sandbox implementation and the steps required to transition to Production.

---

## 1. Summary of What Was Done

During the development and UAT phase, several adjustments were made to align the codebase with DANA's API requirements and resolve integration bottlenecks:

### A. Transition to SNAP Generate QRIS Endpoint (Service Code 47)
* **Problem**: The Host-to-Host (H2H) Order creation API (`/payment-gateway/v1.0/debit/payment-host-to-host.htm` under Service Code `54`) returned a `4005402 PAYOPTION_NOT_SUPPORTED` error. This indicated that the merchant account was not configured to generate QRIS directly via host-to-host debit payments.
* **Solution**: Shifted the integration to DANA's official SNAP Generate QRIS endpoint:
  * **Endpoint**: `/v1.0/qr/qr-mpm-generate.htm`
  * **Service Code**: `47` (Merchant Presented Mode)
  * This endpoint is designed specifically for creating dynamic QR codes that can be scanned by customer e-wallets.

### B. Sandbox ID Mapping (Shop and Division IDs)
* **Problem**: When using internal DANA IDs for `storeId` (e.g. `216660000003446945190`) and `subMerchantId`/division (e.g. `216650000003446944192`), the API threw a `4044708: Invalid Merchant / SHOP_NOT_EXIST` error.
* **Solution**: Evaluated the merchant configuration via the Merchant Management query endpoints and mapped internal IDs to their corresponding **external IDs**:
  * **Division ID** (`216650000003446944192`) maps to external division ID `5d94f0d0`.
  * **Shop ID** (`216660000003446945190`) maps to external shop ID `431c8d5c`.
  * Configured these external values as environment variables (`DANA_SUB_MERCHANT_ID` and `DANA_STORE_ID`) to resolve the merchant validation issues.

### C. Bypass Server-Side Cancel API
* **Problem**: Calling the DANA Transaction Cancel API (`/payment-gateway/v1.0/debit/cancel.htm`) on dynamic QRIS transactions returned a `5005701 Internal Server Error` from DANA Sandbox, as QRIS (Service Code `47`) payments do not support server-side cancellation.
* **Solution**: Updated the `handleCancel` logic in the Supabase Edge Function to bypass DANA API calls. It now stops the client-side polling controller and marks the order status as `CANCELLED` directly in the local database (`dana_orders`).

### D. Safe API Response Parsing
* **Problem**: Emptier network payloads or webhook simulator test sweeps in Sandbox caused JSON parsing exceptions when the endpoint returned empty strings.
* **Solution**: Updated `danaApiCall` in [index.ts](file:///d:/POSS/supabase/functions/dana/index.ts#L218-L224) to verify if the text response body is empty before executing `JSON.parse()`.

### E. Checkout UI Layout & Compact Overlay
* **Problem**: The QRIS modal overlay was oversized (`280x280` QR code + high padding margins), causing layout clipping/vertical overflow on smaller tablet screens.
* **Solution**: Optimized the UI in [PaymentScreen.tsx](file:///d:/POSS/src/components/tablet/PaymentScreen.tsx):
  * Scaled the QRIS QR image size down to `180x180`.
  * Tightened card paddings (`p-5` instead of `p-8`) and reduced margins.
  * Added vertical scroll capability (`overflow-y-auto`) to the container to ensure the "Batalkan" (Cancel) button remains accessible on low-resolution viewports.

---

## 2. Production Go-Live Guide

Transitioning the DANA QRIS integration from Sandbox to Production requires swapping sandbox testing credentials with verified production certificates and IDs.

### Step 1: Obtain Production Credentials
Work with the DANA Merchant Integration team to obtain:
* **Production Merchant ID & Partner ID**: The principal business identifiers.
* **Production External Shop ID (Store ID)**: Representing the physical point-of-sale outlet.
* **Production External Division ID (Sub-Merchant ID)**: If your business is organized under multiple divisions.

### Step 2: Generate and Exchange Production Certificates
DANA SNAP uses asymmetric RSA-SHA256 signatures for authentication:
1. **Generate a 2048-bit RSA Private Key** and Public Key on your machine:
   ```bash
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -outform PEM -out public.pem
   ```
2. **Format Private Key**: DANA requires private keys to be in **PKCS#8** format. Convert your private key:
   ```bash
   openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private.pem -out private_pkcs8.pem
   ```
3. **Upload to DANA Portal**: Log into the DANA production developer portal and upload your `public.pem`.
4. **Download DANA Public Key**: Retrieve DANA's official production public key from their portal.
5. **Base64 Encode Keys**: Remove the PEM headers (`-----BEGIN...`, `-----END...`) and newlines from both your PKCS#8 private key and DANA's public key. The keys must be configured as a single line of base64 text for the environment secrets.

### Step 3: Configure Supabase Production Secrets
Set up your environment variables on the production Supabase project using the Supabase CLI or Dashboard:

```powershell
# Set DANA environment to production
npx supabase secrets set DANA_ENV="production"

# Update credentials
npx supabase secrets set X_PARTNER_ID="<your_production_partner_id>"
npx supabase secrets set DANA_MERCHANT_ID="<your_production_merchant_id>"
npx supabase secrets set DANA_STORE_ID="<your_production_external_shop_id>"
npx supabase secrets set DANA_SUB_MERCHANT_ID="<your_production_external_division_id>"

# Configure keys (single-line Base64 string without PEM headers)
npx supabase secrets set DANA_PRIVATE_KEY="<base64_of_your_pkcs8_private_key>"
npx supabase secrets set DANA_PUBLIC_KEY="<base64_of_dana_production_public_key>"

# Public URL of your deployed function
npx supabase secrets set FUNCTION_URL="https://<your-project-id>.supabase.co/functions/v1/dana"
```

### Step 4: Configure the Webhook Endpoint
1. Deploy the final edge function code to your production project:
   ```bash
   npx supabase functions deploy dana
   ```
2. In the production DANA Developer Portal, configure your Webhook Notification URL.
3. Set the webhook URL to:
   `https://<your-project-id>.supabase.co/functions/v1/dana/webhook`
4. Subscribe to the **QRIS Payment Webhook Notification** topic.

### Step 5: Perform Go-Live Verification (Penny Testing)
Before launching to cashiers, run a live end-to-end payment test:
1. Generate a QRIS order for a nominal amount (e.g. `IDR 1,000` or `IDR 5,000`).
2. Scan the generated QR code using a real DANA wallet app (or any bank QRIS scanner).
3. Complete the payment transaction in the app.
4. **Verification checklist**:
   * [ ] Verify that the cashier tablet receives the success notification and automatically transitions to the receipt screen.
   * [ ] Verify that the database order status in `dana_orders` is updated to `SUCCESS` with the correct `paid_at` timestamp.
   * [ ] Review the Supabase Edge Function logs to ensure webhook signature verification succeeds and no warnings are thrown.
