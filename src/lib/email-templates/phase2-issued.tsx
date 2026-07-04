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
  phase1Login?: string
  accountType?: string
  accountSize?: string
  platform?: string
  serverName?: string
  loginEmail?: string
  loginPassword?: string
  issuedAt?: string
  supportEmail?: string
  websiteUrl?: string
  dashboardUrl?: string
}

const Email = ({
  customerName = 'Trader',
  phase1Login = '—',
  accountType = 'Phase 2 Challenge',
  accountSize = '—',
  platform = 'MetaTrader 5',
  serverName,
  loginEmail,
  loginPassword,
  issuedAt = new Date().toLocaleString('en-US'),
  supportEmail = 'fxtradersrise@gmail.com',
  websiteUrl = 'https://traderisefx.com',
  dashboardUrl = 'https://traderisefx.com/dashboard',
}: Props) => {
  const title = 'Congratulations — Phase 2 Account Issued'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You passed Phase 1. Your Phase 2 account is ready.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>Trade Rise FX</Heading>
          </Section>

          <Heading as="h2" style={h2}>{title}</Heading>
          <Text style={p}>Hi {customerName},</Text>
          <Text style={p}>
            Congratulations! You have successfully passed <strong>Phase 1</strong>{phase1Login !== '—' ? <> (account <strong>{phase1Login}</strong>)</> : null}.
            Your <strong>Phase 2</strong> trading account has now been created and assigned to you. Please check your
            dashboard or the details below to access your new Phase 2 credentials.
          </Text>

          <Section style={credsCard}>
            <Heading as="h3" style={h3}>Phase 2 Account Details</Heading>
            <Row label="Account Type" value={accountType} />
            <Row label="Account Size" value={accountSize} />
            <Row label="Trading Platform" value={platform} />
            {serverName ? <Row label="Server" value={serverName} /> : null}
            {loginEmail ? <Row label="Login / ID" value={loginEmail} /> : null}
            {loginPassword ? <Row label="Password" value={loginPassword} /> : null}
            <Row label="Issued" value={issuedAt} />
            <Text style={small}>
              Please keep these credentials safe and change your password after first login.
            </Text>
          </Section>

          <Text style={p}>
            Open your dashboard: <a href={dashboardUrl} style={link}>{dashboardUrl}</a>
          </Text>

          <Hr style={hr} />
          <Text style={p}>
            Need help? Contact us at <a href={`mailto:${supportEmail}`} style={link}>{supportEmail}</a>
            <br />Visit: <a href={websiteUrl} style={link}>{websiteUrl}</a>
          </Text>
          <Text style={footer}>© {new Date().getFullYear()} Trade Rise FX. All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}:</span> <span style={rowValue}>{value}</span>
    </Text>
  )
}

export const template = {
  component: Email,
  subject: 'Congratulations — Your Phase 2 Account Is Ready',
  displayName: 'Phase 2 Issued',
  previewData: {
    customerName: 'John Doe',
    phase1Login: '50012345',
    accountType: 'Phase 2 — $100,000',
    accountSize: '$100,000',
    platform: 'MetaTrader 5',
    serverName: 'TradeRiseFX-Live',
    loginEmail: '50098765',
    loginPassword: 'Temp@1234',
    issuedAt: new Date().toLocaleString('en-US'),
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
const credsCard = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const rowText = { fontSize: '14px', margin: '6px 0', color: '#0f172a' }
const rowLabel = { color: '#64748b', display: 'inline-block', minWidth: '140px' }
const rowValue = { fontWeight: 600 as const }
const link = { color: '#2563eb', textDecoration: 'underline' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '16px' }
