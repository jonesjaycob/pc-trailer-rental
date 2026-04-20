import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { Booking, Trailer, User } from "@/lib/db/schema";

export function ReminderPickupEmail({
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
      <Preview>Your trailer pickup is tomorrow</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Pickup tomorrow</Heading>
          <Text style={p}>Hi {user.name ?? "there"},</Text>
          <Text style={p}>
            Quick reminder that your rental of <strong>{trailer.name}</strong>{" "}
            starts <strong>tomorrow</strong>
            {booking.pickupTime ? ` at ${booking.pickupTime}` : ""}.
          </Text>
          <Section style={card}>
            <Text style={row}>
              <strong>Pickup:</strong> {booking.startDate}
              {booking.pickupTime ? ` at ${booking.pickupTime}` : ""}
            </Text>
            <Text style={row}>
              <strong>Return:</strong> {booking.endDate}
              {booking.returnTime ? ` by ${booking.returnTime}` : ""}
            </Text>
            <Text style={row}>
              <strong>Hitch required:</strong> {trailer.requiredHitchClass}
            </Text>
          </Section>
          <Text style={p}>
            <strong>Bring with you:</strong>
          </Text>
          <Text style={p}>
            • Your driver&apos;s license
            <br />• Your tow vehicle (rated for {trailer.gvwrLbs.toLocaleString()} lb GVWR)
            <br />• Proof of auto insurance
          </Text>
          <Text style={small}>
            Questions? Reply to this email or call us.
          </Text>
        </Container>
      </Body>
    </Html>
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
  fontSize: "26px",
  fontWeight: 700,
  color: "#1e3a2c",
  margin: "0 0 12px",
};
const p: React.CSSProperties = { fontSize: "15px", lineHeight: "1.5", color: "#222" };
const small: React.CSSProperties = { fontSize: "12px", color: "#888", marginTop: "24px" };
const card: React.CSSProperties = {
  backgroundColor: "#f6f4ef",
  padding: "16px",
  borderRadius: "6px",
  margin: "16px 0",
};
const row: React.CSSProperties = { margin: "4px 0", fontSize: "14px" };

export default ReminderPickupEmail;
