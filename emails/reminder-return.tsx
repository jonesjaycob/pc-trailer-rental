import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { Booking, Trailer, User } from "@/lib/db/schema";

export function ReminderReturnEmail({
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
      <Preview>Return your trailer today</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Return today</Heading>
          <Text style={p}>Hi {user.name ?? "there"},</Text>
          <Text style={p}>
            Today is the return day for <strong>{trailer.name}</strong>.
            {booking.returnTime
              ? ` Please have it back by ${booking.returnTime}.`
              : ""}
          </Text>
          <Text style={p}>
            Before you return:
          </Text>
          <Text style={p}>
            • Remove all personal items and trash
            <br />• Sweep out the interior (camp trailers)
            <br />• Dump grey and black tanks (camp trailers)
            <br />• Fill up fuel if any was used
          </Text>
          <Text style={p}>
            After a clean inspection, your security deposit hold is released
            within 5 business days.
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

export default ReminderReturnEmail;
