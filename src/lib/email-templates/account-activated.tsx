import * as React from 'react'
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
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  orderId?: string
  accountType?: string
  accountSize?: string
  purchaseDate?: string
  platform?: string
  serverName?: string
  loginEmail?: string
  loginPassword?: string
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
  purchaseDate = new Date().toLocaleString('en-US'),
  platform = 'MetaTrader 5',
  serverName,
  loginEmail,
  loginPassword,
  supportEmail = 'fxtradersrise@gmail.com',
  websiteUrl = 'https://traderisefx.com',
  isAdminCopy,
  customerEmail,
}: Props) => {
  const title = isAdminCopy
    ? 'New Account Activated (Admin Copy)'
    : 'Your Trading Account Has Been Successfully Activated'

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
              A new trading account has been activated for{' '}
              <strong>{customerName}</strong>
              {customerEmail ? ` (${customerEmail})` : ''}.
            </Text>
          ) : (
            <>
              <Text style={p}>Hi {customerName},</Text>
              <Text style={p}>
                Congratulations! Your payment has been confirmed and your trading
                account is now live. Your login details are below.
              </Text>
            </>
          )}

          <Section style={card}>
            <Row label="Customer Name" value={customerName} />
            <Row label="Order ID" value={orderId} />
            <Row label="Account Type" value={accountType} />
            <Row label="Account Size" value={accountSize} />
            <Row label="Purchase Date" value={purchaseDate} />
            <Row label="Trading Platform" value={platform} />
            {serverName ? <Row label="Server" value={serverName} /> : null}
          </Section>

          {(loginEmail || loginPassword) && (
            <Section style={credsCard}>
              <Heading as="h3" style={h3}>Login Credentials</Heading>
              {loginEmail ? <Row label="Login Email / ID" value={loginEmail} /> : null}
              {loginPassword ? <Row label="Login Password" value={loginPassword} /> : null}
              <Text style={small}>
                Please keep these credentials safe. Change your password after first login.
              </Text>
            </Section>
          )}

          <Heading as="h3" style={h3}>Account Rules</Heading>
          <Text style={p}>
            • Minimum trade holding time: <strong>2 minutes</strong>.<br />
            • No prohibited strategies (HFT, arbitrage, tick scalping).<br />
            • Trade responsibly within the daily and overall loss limits of your plan.<br />
            • Full rules are available on our website.
          </Text>

          <Hr style={hr} />

          <Text style={p}>
            Need help? Contact us at{' '}
            <a href={`mailto:${supportEmail}`} style={link}>{supportEmail}</a>
            <br />
            Visit: <a href={websiteUrl} style={link}>{websiteUrl}</a>
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} Trade Rise FX. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}:</span>{' '}
      <span style={rowValue}>{value}</span>
    </Text>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data?.isAdminCopy
      ? `New Account Activated — Order ${data?.orderId ?? ''}`.trim()
      : 'Your Trading Account Has Been Successfully Activated',
  displayName: 'Account Activated',
  previewData: {
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    orderId: 'TRF-12345',
    accountType: 'Challenge — 2 Step',
    accountSize: '$100,000',
    purchaseDate: new Date().toLocaleString('en-US'),
    platform: 'MetaTrader 5',
    serverName: 'TradeRiseFX-Live',
    loginEmail: '50012345',
    loginPassword: 'Temp@1234',
    supportEmail: 'fxtradersrise@gmail.com',
    websiteUrl: 'https://traderisefx.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#0f172a' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { borderBottom: '3px solid #2563eb', paddingBottom: '12px', marginBottom: '20px' }
const brand = { color: '#2563eb', fontSize: '24px', margin: 0 }
const h2 = { fontSize: '20px', color: '#0f172a', marginTop: '8px' }
const h3 = { fontSize: '16px', color: '#0f172a', marginTop: '20px', marginBottom: '8px' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#334155' }
const small = { fontSize: '12px', color: '#64748b', marginTop: '8px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const credsCard = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const rowText = { fontSize: '14px', margin: '6px 0', color: '#0f172a' }
const rowLabel = { color: '#64748b', display: 'inline-block', minWidth: '140px' }
const rowValue = { fontWeight: 600 as const }
const link = { color: '#2563eb', textDecoration: 'underline' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '16px' }
