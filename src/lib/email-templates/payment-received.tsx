import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  orderId?: string
  accountType?: string
  accountSize?: string
  amount?: string
  network?: string
  purchaseDate?: string
  supportEmail?: string
  websiteUrl?: string
  isAdminCopy?: boolean
  customerEmail?: string
}

const Email = ({
  customerName = 'Trader',
  orderId = '—',
  accountType = '—',
  accountSize = '—',
  amount,
  network,
  purchaseDate = new Date().toLocaleString('en-US'),
  supportEmail = 'fxtradersrise@gmail.com',
  websiteUrl = 'https://traderisefx.com',
  isAdminCopy,
  customerEmail,
}: Props) => {
  const title = isAdminCopy
    ? 'New Order Received (Admin Copy)'
    : 'Purchase Confirmation — Account Activated'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>Trade Rise FX</Heading>
          </Section>

          <Heading as="h2" style={h2}>{title}</Heading>

          {isAdminCopy ? (
            <Text style={p}>
              A new order has been placed and the account has been automatically activated.
            </Text>
          ) : (
            <>
              <Text style={p}>Hi {customerName},</Text>
              <Text style={p}>
                Thank you for your purchase. This email is your <strong>receipt</strong> — your
                account has been <strong>activated instantly</strong>. Details below:
              </Text>
            </>
          )}

          <Section style={card}>
            <Row label="Order ID" value={orderId} />
            <Row label="Plan" value={accountType} />
            <Row label="Account Size" value={accountSize} />
            {amount ? <Row label="Price" value={amount} /> : null}
            {network ? <Row label="Network" value={network.toUpperCase()} /> : null}
            <Row label="Purchase Date" value={purchaseDate} />
            <Row label="Status" value="Active" />
            {isAdminCopy && customerEmail ? <Row label="Customer" value={customerEmail} /> : null}
          </Section>

          <Hr style={hr} />

          <Text style={muted}>
            Questions? Reply to this email or contact us at{' '}
            <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>.
          </Text>
          <Text style={muted}>
            <Link href={websiteUrl} style={link}>{websiteUrl}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <Text style={rowStyle}>
    <span style={rowLabel}>{label}:</span> <span style={rowValue}>{value}</span>
  </Text>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data?.isAdminCopy
      ? `New order — ${data?.accountType ?? ''} ${data?.accountSize ?? ''} (${data?.orderId ?? ''})`.trim()
      : `Receipt — ${data?.accountType ?? 'Account'} ${data?.accountSize ?? ''} activated`.trim(),
  displayName: 'Purchase Receipt (Account Activated)',
  previewData: {
    customerName: 'Jane Doe',
    orderId: 'AF-ABC123',
    accountType: 'Funded Account',
    accountSize: '$50K',
    amount: '$289',
    network: 'bep20',
  },
} satisfies TemplateEntry

const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '24px' }
const header: React.CSSProperties = { paddingBottom: 16, borderBottom: '1px solid #eaeaea' }
const brand: React.CSSProperties = { color: '#0a0a0a', fontSize: 22, margin: 0 }
const h2: React.CSSProperties = { color: '#0a0a0a', fontSize: 20, marginTop: 24 }
const p: React.CSSProperties = { color: '#333333', fontSize: 14, lineHeight: '22px' }
const muted: React.CSSProperties = { color: '#666666', fontSize: 12, lineHeight: '20px' }
const card: React.CSSProperties = { background: '#f7f7f8', border: '1px solid #eaeaea', borderRadius: 8, padding: 16, marginTop: 16 }
const rowStyle: React.CSSProperties = { color: '#0a0a0a', fontSize: 13, margin: '4px 0' }
const rowLabel: React.CSSProperties = { color: '#666666', display: 'inline-block', minWidth: 120 }
const rowValue: React.CSSProperties = { color: '#0a0a0a', fontWeight: 600 }
const hr: React.CSSProperties = { borderColor: '#eaeaea', margin: '20px 0' }
const link: React.CSSProperties = { color: '#b8860b' }
