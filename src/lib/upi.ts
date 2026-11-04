import QRCode from "qrcode";

export interface UpiPaymentDetails {
  upiId?: string;
  payeeName?: string;
  amount: number;
  orderId: string;
}

export const GALLERY_UPI_CONFIG = {
  upiId: process.env.NEXT_PUBLIC_GALLERY_UPI_ID || "amvifineart@icici",
  payeeName: process.env.NEXT_PUBLIC_GALLERY_PAYEE_NAME || "AMVI Fine Art Gallery",
  bankDetails: {
    accountHolder: "AMVI Fine Art Private Limited",
    accountNumber: "000405012938",
    ifscCode: "ICIC0000004",
    bankName: "ICICI Bank, Nariman Point Branch, Mumbai",
    accountType: "Current Account",
  },
};

/**
 * Generates an NPCI-compliant UPI payment intent string.
 * e.g., upi://pay?pa=amvi@icici&pn=AMVI+Fine+Art&am=28500.00&cu=INR&tr=order_123&tn=AMVI+Artwork+Order+order_123
 */
export function generateUpiUrl({
  upiId = GALLERY_UPI_CONFIG.upiId,
  payeeName = GALLERY_UPI_CONFIG.payeeName,
  amount,
  orderId,
}: UpiPaymentDetails): string {
  const formattedAmount = Number(amount).toFixed(2);
  const transactionNote = encodeURIComponent(`AMVI Artwork Acquisition Order ${orderId.slice(0, 8)}`);
  const encodedPayee = encodeURIComponent(payeeName);

  return `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodedPayee}&am=${formattedAmount}&cu=INR&tr=${encodeURIComponent(
    orderId
  )}&tn=${transactionNote}`;
}

/**
 * Generates an SVG data URL for the UPI payment QR code
 * completely offline with zero external API dependencies.
 */
export async function generateQrCodeSvg(upiUrl: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(upiUrl, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#18181b", // zinc-900
        light: "#ffffff",
      },
    });

    const base64Svg = Buffer.from(svgString).toString("base64");
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    console.error("[UPI QR Error] Failed to generate QR SVG:", error);
    throw new Error("Could not generate UPI QR Code.");
  }
}
