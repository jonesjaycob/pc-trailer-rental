import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";
import type { Booking, Trailer, User } from "@/lib/db/schema";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function BookingConfirmationEmail({
  booking,
  trailer,
  user,
}: {
  booking: Booking;
  trailer: Trailer;
  user: User;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your trailer rental is confirmed</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re booked.</Heading>
          <Text style={p}>Hi {user.name ?? "there"},</Text>
          <Text style={p}>
            Your reservation for <strong>{trailer.name}</strong> is confirmed. Details are
            below. Bring your driver&apos;s license to pickup.
          </Text>

          <Section style={card}>
            <Row label="Trailer" value={trailer.name} />
            <Row label="Pickup" value={`${booking.startDate}${booking.pickupTime ? ` at ${booking.pickupTime}` : ""}`} />
            <Row label="Return" value={`${booking.endDate}${booking.returnTime ? ` by ${booking.returnTime}` : ""}`} />
            <Row label="Required hitch" value={trailer.requiredHitchClass} />
          </Section>

          <Section style={card}>
            <Row label="Rental subtotal" value={fmt(booking.subtotalCents)} />
            <Row label="Tax" value={fmt(booking.taxCents)} />
            <Row label="Total charged" value={fmt(booking.totalCents)} bold />
            <Row label="Deposit held" value={fmt(booking.depositCents)} />
          </Section>

          <Text style={p}>
            Your signed rental agreement:{" "}
            {booking.rentalAgreementUrl ? (
              <Link href={booking.rentalAgreementUrl}>download PDF</Link>
            ) : (
              "will be available shortly in your dashboard."
            )}
          </Text>

          <Hr />
          <Text style={small}>
            Pell City Trailer Rentals · Pell City, AL · Questions? Reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Text style={bold ? rowBold : row}>
      <span style={{ color: "#666" }}>{label}: </span>
      {value}
    </Text>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f4ef",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: "24px 0",
};
const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px",
  borderRadius: "8px",
};
const h1: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#1e3a2c",
  margin: "0 0 12px",
};
const p: React.CSSProperties = { fontSize: "15px", lineHeight: "1.5", color: "#222" };
const small: React.CSSProperties = { fontSize: "12px", color: "#888" };
const card: React.CSSProperties = {
  backgroundColor: "#f6f4ef",
  padding: "16px",
  borderRadius: "6px",
  margin: "16px 0",
};
const row: React.CSSProperties = { margin: "4px 0", fontSize: "14px" };
const rowBold: React.CSSProperties = { ...row, fontWeight: 700 };

export default BookingConfirmationEmail;
