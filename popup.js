// Base32 decode implementation
function base32Decode(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  base32 = base32.toUpperCase().replace(/=+$/, "");

  let bits = "";
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i]);
    if (val === -1) throw new Error("Invalid base32 character");
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  return bytes;
}

// Generate TOTP code
async function generateTOTP(secret, time = Date.now()) {
  const epoch = Math.floor(time / 30000);
  const timeBytes = new ArrayBuffer(8);
  const timeView = new DataView(timeBytes);
  timeView.setUint32(4, epoch, false);

  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, timeBytes);
  const hashArray = new Uint8Array(signature);

  const offset = hashArray[hashArray.length - 1] & 0x0f;
  const binary =
    ((hashArray[offset] & 0x7f) << 24) |
    ((hashArray[offset + 1] & 0xff) << 16) |
    ((hashArray[offset + 2] & 0xff) << 8) |
    (hashArray[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, "0");
  return otp;
}

// Parse otpauth URL
function parseOtpAuthUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "otpauth:" || urlObj.host !== "totp") {
      throw new Error("Invalid otpauth URL");
    }

    const secret = urlObj.searchParams.get("secret");
    if (!secret) throw new Error("No secret found");

    const issuer = urlObj.searchParams.get("issuer") || "";
    const label = decodeURIComponent(urlObj.pathname.slice(1));

    return { secret, issuer, label };
  } catch (e) {
    throw new Error("Invalid URL format");
  }
}

// UI Elements
const inputSection = document.getElementById("input-section");
const viewerSection = document.getElementById("viewer-section");
const totpUrlInput = document.getElementById("totp-url");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const totpCodeEl = document.getElementById("totp-code");
const progressFill = document.getElementById("progress-fill");
const errorEl = document.getElementById("error");

let updateInterval = null;

// Copy to clipboard
totpCodeEl.addEventListener("click", async () => {
  const code = totpCodeEl.textContent;
  if (code && code !== "------" && code !== "ERROR") {
    try {
      await navigator.clipboard.writeText(code);
      const original = totpCodeEl.textContent;
      totpCodeEl.textContent = "COPIED";
      setTimeout(() => {
        totpCodeEl.textContent = original;
      }, 500);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  }
});

// Update TOTP display
async function updateTOTP(secret) {
  try {
    const code = await generateTOTP(secret);
    totpCodeEl.textContent = code;

    const remaining = 30 - Math.floor((Date.now() / 1000) % 30);
    const progress = (remaining / 30) * 100;
    progressFill.style.width = progress + "%";
  } catch (e) {
    totpCodeEl.textContent = "ERROR";
  }
}

// Start TOTP updates
function startTOTPUpdates(secret) {
  if (updateInterval) clearInterval(updateInterval);

  updateTOTP(secret);
  updateInterval = setInterval(() => {
    updateTOTP(secret);
  }, 1000);
}

// Save button handler
saveBtn.addEventListener("click", async () => {
  errorEl.textContent = "";
  const url = totpUrlInput.value.trim();

  if (!url) {
    errorEl.textContent = "Please enter a URL";
    return;
  }

  try {
    const parsed = parseOtpAuthUrl(url);
    await browser.storage.local.set({ totpData: parsed });

    inputSection.style.display = "none";
    viewerSection.style.display = "block";
    startTOTPUpdates(parsed.secret);
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

// Delete button handler
deleteBtn.addEventListener("click", async () => {
  if (updateInterval) clearInterval(updateInterval);
  await browser.storage.local.remove("totpData");

  viewerSection.style.display = "none";
  inputSection.style.display = "block";
  totpUrlInput.value = "";
  errorEl.textContent = "";
});

// Load saved data on popup open
browser.storage.local.get("totpData").then((result) => {
  if (result.totpData) {
    inputSection.style.display = "none";
    viewerSection.style.display = "block";
    startTOTPUpdates(result.totpData.secret);
  }
});
