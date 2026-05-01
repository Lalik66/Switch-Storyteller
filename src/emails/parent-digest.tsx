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
} from "@react-email/components";
import type { ChildWeeklySummary } from "@/lib/parent-report";

export type ParentDigestEmailProps = {
  parentName: string;
  weekEnding: string;
  children: ChildWeeklySummary[];
};

export function ParentDigestEmail({
  parentName,
  weekEnding,
  children,
}: ParentDigestEmailProps) {
  const totalStories = children.reduce((a, c) => a + c.storiesCreated, 0);
  const totalWords = children.reduce((a, c) => a + c.totalWordsWritten, 0);
  const totalIncidents = children.reduce(
    (a, c) => a + c.moderationIncidents,
    0,
  );

  return (
    <Html>
      <Head />
      <Preview>
        {`Hero's Forge weekly — ${totalStories} stories, ${totalWords.toLocaleString()} words`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={h1Style}>
            The Hero&apos;s Forge
          </Heading>
          <Text style={subtitleStyle}>Weekly Digest — {weekEnding}</Text>

          <Hr style={hrStyle} />

          <Text style={greetingStyle}>
            Ahoy {parentName}! Here&apos;s what your young scribes have been up to
            this week.
          </Text>

          {/* Aggregate stats */}
          <Section style={statsRowStyle}>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={statCellStyle}>
                    <Text style={statValueStyle}>{totalStories}</Text>
                    <Text style={statLabelStyle}>Stories</Text>
                  </td>
                  <td style={statCellStyle}>
                    <Text style={statValueStyle}>
                      {totalWords.toLocaleString()}
                    </Text>
                    <Text style={statLabelStyle}>Words</Text>
                  </td>
                  <td style={statCellStyle}>
                    <Text style={statValueStyle}>{totalIncidents}</Text>
                    <Text style={statLabelStyle}>Incidents</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={hrStyle} />

          {/* Per-child breakdown */}
          {children.map((summary) => (
            <Section key={summary.child.id} style={childSectionStyle}>
              <Heading as="h2" style={h2Style}>
                {summary.child.displayName}
              </Heading>
              <Text style={childMetaStyle}>
                {summary.child.age} years &middot;{" "}
                {summary.child.contentStrictness} mode
              </Text>

              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td style={childStatCellStyle}>
                      <Text style={childStatValueStyle}>
                        {summary.storiesCreated}
                      </Text>
                      <Text style={childStatLabelStyle}>New stories</Text>
                    </td>
                    <td style={childStatCellStyle}>
                      <Text style={childStatValueStyle}>
                        {summary.totalWordsWritten.toLocaleString()}
                      </Text>
                      <Text style={childStatLabelStyle}>Words written</Text>
                    </td>
                    <td style={childStatCellStyle}>
                      <Text style={childStatValueStyle}>
                        {summary.totalPages}
                      </Text>
                      <Text style={childStatLabelStyle}>Pages</Text>
                    </td>
                  </tr>
                </tbody>
              </table>

              {summary.moderationIncidents > 0 && (
                <Text style={incidentStyle}>
                  {summary.moderationIncidents} moderation{" "}
                  {summary.moderationIncidents === 1
                    ? "incident"
                    : "incidents"}{" "}
                  this week — review in the parent dashboard.
                </Text>
              )}
            </Section>
          ))}

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            This weekly digest is sent automatically by The Hero&apos;s Forge.
            Visit your parent dashboard to see full details, read stories
            verbatim, and manage your children&apos;s settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ParentDigestEmail;

/* ── Inline styles (email clients don't support CSS classes) ─────── */

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#faf7f2",
  fontFamily:
    "'Georgia', 'Times New Roman', serif",
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

const greetingStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#333",
  margin: "0 0 20px",
};

const statsRowStyle: React.CSSProperties = {
  margin: "0 0 8px",
};

const statCellStyle: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "12px 8px",
};

const statValueStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 600,
  fontStyle: "italic",
  color: "#c83e1e",
  margin: "0",
  lineHeight: "1",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "6px 0 0",
};

const childSectionStyle: React.CSSProperties = {
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e5e0d8",
};

const h2Style: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#1a1a1a",
  margin: "0 0 2px",
};

const childMetaStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
};

const childStatCellStyle: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "8px 4px",
};

const childStatValueStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  fontStyle: "italic",
  color: "#1a1a1a",
  margin: "0",
  lineHeight: "1",
};

const childStatLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#999",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "4px 0 0",
};

const incidentStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#c83e1e",
  backgroundColor: "#fdf2f0",
  padding: "10px 12px",
  borderRadius: "6px",
  marginTop: "12px",
};

const footerStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#999",
  lineHeight: "1.5",
  margin: 0,
};
