import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  competitionName?: string
  accountSize?: string
  login?: string
  password?: string
  server?: string
  platform?: string
  dailyDrawdown?: string
  maxDrawdown?: string
  endsAt?: string
}

const Email = ({
  customerName = 'Trader',
  competitionName = 'Monthly Trading Competition',
  accountSize = '$20,000',
  login = '—',
  password = '—',
  server = 'TradeRiseFX-Demo',
  platform = 'MetaTrader 5',
  dailyDrawdown = '10%',
  maxDrawdown = '20%',
  endsAt = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're entered in the {competitionName}. Here are your credentials.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={brand}>Trade Rise FX</Heading></Section>
        <Heading as="h2" style={h2}>You're in, {customerName}!</Heading>
        <Text style={p}>Welcome to the <strong>{competitionName}</strong>. Your free {accountSize} competition account is ready.</Text>
        <Section style={card}>
          <Heading as="h3" style={h3}>Account Credentials</Heading>
          <Row label="Login" value={login} />
          <Row label="Password" value={password} />
          <Row label="Server" value={server} />
          <Row label="Platform" value={platform} />
          <Row label="Account Size" value={accountSize} />
        </Section>
        <Section style={card}>
          <Heading as="h3" style={h3}>Rules</Heading>
          <Row label="Daily Drawdown" value={dailyDrawdown} />
          <Row label="Max Drawdown" value={maxDrawdown} />
          <Row label="Ends" value={endsAt} />
        </Section>
        <Text style={p}>Prizes: 1st $5,000 · 2nd $2,000 · 3rd $1,000. Top profit % wins. Good luck!</Text>
        <Hr style={hr} />
        <Text style={footer}>© {new Date().getFullYear()} Trade Rise FX</Text>
      </Container>
    </Body>
  </Html>
)

function Row({ label, value }: { label: string; value: string }) {
  return (<Text style={rowText}><span style={rowLabel}>{label}:</span> <span style={rowValue}>{value}</span></Text>)
}

export const template = {
  component: Email,
  subject: "You're in — Monthly Trading Competition credentials",
  displayName: 'Competition Joined',
  previewData: { customerName: 'John', login: '50012345', password: 'Demo@1234', endsAt: 'Jun 30, 2026' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#0f172a' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { borderBottom: '3px solid #C9A227', paddingBottom: '12px', marginBottom: '20px' }
const brand = { color: '#C9A227', fontSize: '24px', margin: 0 }
const h2 = { fontSize: '20px', marginTop: '8px' }
const h3 = { fontSize: '16px', marginTop: '4px', marginBottom: '8px' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#334155' }
const card = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', margin: '14px 0' }
const rowText = { fontSize: '14px', margin: '6px 0' }
const rowLabel = { color: '#64748b', display: 'inline-block', minWidth: '140px' }
const rowValue = { fontWeight: 600 as const }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const }
