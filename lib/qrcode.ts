import QRCode from "qrcode";

export async function generateQRDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
