import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ResetPasswordEmailProps = {
  userName: string;
  resetUrl: string;
};

export function ResetPasswordEmail({
  userName,
  resetUrl,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Hero&apos;s Forge password</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={h1Style}>The Hero&apos;s Forge</Heading>
          <Text style={subtitleStyle}>Password Reset</Text>

          <Hr style={hrStyle} />

          <Text style={paragraphStyle}>Hi {userName},</Text>
          <Text style={paragraphStyle}>
            We received a request to reset the password for your Hero&apos;s
            Forge account. Click the button below to choose a new one.
          </Text>

          <Section style={buttonSectionStyle}>
            <Button href={resetUrl} style={buttonStyle}>
              Reset password
            </Button>
          </Section>

          <Text style={mutedStyle}>
            Or copy this link into your browser:
            <br />
            {resetUrl}
          </Text>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            This link expires in one hour. If you didn&apos;t request a
            password reset, you can safely ignore this email — your password
            will not change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

/* ── Inline styles (email clients don't support CSS classes) ─────── */

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#faf7f2",
  fontFamily: "'Georgia', 'Times New Roman', serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
};

const h1Style: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 600,
  color: "#1a1a1a",
  margin: "0 0 4px",
  fontStyle: "italic",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#888",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 24px",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e5e0d8",
  margin: "24px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#333",
  margin: "0 0 16px",
};

const buttonSectionStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#c83e1e",
  color: "#faf7f2",
  fontSize: "16px",
  fontWeight: 600,
  padding: "12px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const mutedStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#888",
  margin: "0 0 16px",
  wordBreak: "break-all" as const,
};

const footerStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#888",
  margin: 0,
};
