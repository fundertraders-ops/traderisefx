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
  accountType?: string
  accountSize?: string
  login?: string
  reason?: string
  breachedAt?: string
  supportEmail?: string
  websiteUrl?: string
}

const Email = ({
  customerName = 'Trader',
  accountType = '—',
  accountSize = '—',
  login = '—',
  reason = 'Rule violation',
  breachedAt = new Date().toLocaleString('en-US'),
  supportEmail = 'fxtradersrise@gmail.com',
  websiteUrl = 'https://traderisefx.com',
}: Props) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your trading account has been breached</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>Trade Rise FX</Heading>
          </Section>

          <Heading as="h2" style={h2}>Your Trading Account Has Been Breached</Heading>

          <Text style={p}>Hi {customerName},</Text>
          <Text style={p}>
            We're writing to let you know that your trading account has been marked as
            <strong> Breached</strong> due to a rule violation. Trading on this account
            is no longer permitted.
          </Text>

          <Section style={card}>
            <Row label="Account Type" value={accountType} />
            <Row label="Account Size" value={accountSize} />
            <Row label="Login" value={login} />
            <Row label="Breached At" value={breachedAt} />
          </Section>

          <Section style={reasonCard}>
            <Heading as="h3" style={h3}>Reason for Breach</Heading>
            <Text style={p}>{reason}</Text>
          </Section>

          <Text style={p}>
            Your account status has been updated to <strong>Breached</strong> in your
            client dashboard. You can review the details by signing in at{' '}
            <a href={`${websiteUrl}/dashboard`} style={link}>{websiteUrl}/dashboard</a>.
          </Text>

          <Hr style={hr} />

          <Text style={p}>
            If you believe this was a mistake or you have any questions, our support team is here to help.
            <br />
            Contact us at <a href={`mailto:${supportEmail}`} style={link}>{supportEmail}</a>
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
  subject: 'Important: Your Trading Account Has Been Breached',
  displayName: 'Account Breached',
  previewData: {
    customerName: 'John Doe',
    accountType: 'Challenge — 2 Step',
    accountSize: '$100,000',
    login: '50012345',
    reason: 'Daily Drawdown limit exceeded',
    breachedAt: new Date().toLocaleString('en-US'),
    supportEmail: 'fxtradersrise@gmail.com',
    websiteUrl: 'https://traderisefx.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#0f172a' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { borderBottom: '3px solid #dc2626', paddingBottom: '12px', marginBottom: '20px' }
const brand = { color: '#2563eb', fontSize: '24px', margin: 0 }
const h2 = { fontSize: '20px', color: '#b91c1c', marginTop: '8px' }
const h3 = { fontSize: '16px', color: '#0f172a', marginTop: '4px', marginBottom: '8px' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#334155' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const reasonCard = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const rowText = { fontSize: '14px', margin: '6px 0', color: '#0f172a' }
const rowLabel = { color: '#64748b', display: 'inline-block', minWidth: '140px' }
const rowValue = { fontWeight: 600 as const }
const link = { color: '#2563eb', textDecoration: 'underline' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '16px' }
