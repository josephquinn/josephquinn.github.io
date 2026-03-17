const qrForm = document.getElementById("qr-form");
const qrInput = document.getElementById("target-url");
const qrStatus = document.getElementById("qr-status");
const qrImage = document.getElementById("qr-image");
const downloadLink = document.getElementById("download-link");

const SAMPLE_QR =
  "https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=https%3A%2F%2Fexample.com";

qrImage.src = SAMPLE_QR;
downloadLink.href = SAMPLE_QR;

qrForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const targetUrl = qrInput.value.trim();
  if (!isValidUrl(targetUrl)) {
    qrStatus.textContent = "Enter a valid published URL.";
    qrInput.focus();
    return;
  }

  const qrUrl = buildQrUrl(targetUrl);
  qrImage.src = qrUrl;
  downloadLink.href = qrUrl;
  qrStatus.textContent = "QR code ready.";
});

function buildQrUrl(target) {
  const url = new URL("https://api.qrserver.com/v1/create-qr-code/");
  url.searchParams.set("size", "320x320");
  url.searchParams.set("format", "png");
  url.searchParams.set("data", target);
  return url.toString();
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (error) {
    return false;
  }
}
