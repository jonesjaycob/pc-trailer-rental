import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Booking, Trailer, User } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils";

type GenerateArgs = {
  booking: Booking;
  trailer: Trailer;
  user: User;
  signaturePngBytes?: Uint8Array;
};

export async function generateRentalAgreementPdf({
  booking,
  trailer,
  user,
  signaturePngBytes,
}: GenerateArgs): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Rental Agreement — ${trailer.name}`);
  pdf.setAuthor("Pell City Trailer Rentals");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([612, 792]); // Letter
  let y = 740;
  const left = 50;

  const heading = (text: string, size = 18) => {
    page.drawText(text, { x: left, y, size, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 8;
  };
  const line = (text: string, size = 10, font = regular) => {
    page.drawText(text, { x: left, y, size, font, color: rgb(0.15, 0.15, 0.15) });
    y -= size + 4;
  };
  const gap = (n = 10) => {
    y -= n;
  };

  heading("Trailer Rental Agreement");
  line("Pell City Trailer Rentals — Pell City, AL", 10, bold);
  gap(4);
  line(`Agreement #${booking.id.slice(0, 8).toUpperCase()}`);
  line(`Issued ${new Date().toLocaleDateString()}`);
  gap();

  heading("Renter", 13);
  line(`Name: ${user.name ?? "—"}`);
  line(`Email: ${user.email}`);
  if (user.phone) line(`Phone: ${user.phone}`);
  gap();

  heading("Trailer", 13);
  line(`${trailer.name} (${trailer.type.replace("_", " ")})`);
  line(`GVWR: ${trailer.gvwrLbs.toLocaleString()} lb | Tongue: ${trailer.tongueWeightLbs} lb`);
  line(`Required hitch: ${trailer.requiredHitchClass}`);
  gap();

  heading("Rental period", 13);
  line(`Pickup: ${booking.startDate}${booking.pickupTime ? ` at ${booking.pickupTime}` : ""}`);
  line(`Return: ${booking.endDate}${booking.returnTime ? ` by ${booking.returnTime}` : ""}`);
  gap();

  heading("Charges", 13);
  line(`Rental subtotal: ${formatCurrency(booking.subtotalCents)}`);
  line(`Tax:             ${formatCurrency(booking.taxCents)}`);
  line(`Total charged:   ${formatCurrency(booking.totalCents)}`, 10, bold);
  line(`Security deposit (held): ${formatCurrency(booking.depositCents)}`);
  gap();

  heading("Key terms", 13);
  const terms = [
    "1. Renter certifies they are 21+ with a valid driver's license.",
    "2. Renter is responsible for using a properly rated tow vehicle and hitch.",
    "3. Security deposit is authorized on card; released within 5 business days",
    "   of return if no damage is reported.",
    "4. Renter is responsible for damage beyond normal wear, cleaning fees,",
    "   and loss.",
    "5. Cancellation: 7+ days full refund; 3-6 days 50%; <72h no refund.",
    "6. No smoking in camp trailers. Pets allowed in camp trailers with a $75",
    "   cleaning fee added at pickup.",
  ];
  for (const t of terms) line(t, 9);
  gap();

  heading("Signature", 13);
  if (signaturePngBytes) {
    try {
      const png = await pdf.embedPng(signaturePngBytes);
      const dims = png.scale(0.4);
      page.drawImage(png, {
        x: left,
        y: y - dims.height,
        width: Math.min(dims.width, 220),
        height: Math.min(dims.height, 70),
      });
      y -= Math.min(dims.height, 70) + 6;
    } catch {
      line("[signature image failed to embed]", 9);
    }
  } else {
    line("[no signature captured]", 9);
  }
  line(`Signed electronically by ${user.name ?? user.email}`, 9);
  line(`on ${new Date().toISOString()}`, 9);

  return pdf.save();
}
