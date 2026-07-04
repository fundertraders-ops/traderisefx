import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { customerName?: string; accountLogin?: string; reason?: string }

const Email = ({ customerName = 'Trader', accountLogin = '—', reason = 'Drawdown limit exceeded.' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Competition account {accountLogin} disqualified</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={brand}>Trade Rise FX</Heading></Section>
        <Heading as="h2" style={h2}>Competition Account Disqualified</Heading>
        <Text style={p}>Hi {customerName},</Text>
        <Text style={p}>Your competition account <strong>{accountLogin}</strong> has been disqualified.</Text>
        <Section style={card}><Text style={p}><strong>Reason:</strong> {reason}</Text></Section>
        <Text style={p}>You can join again next month — a new competition is created automatically on the 1st.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Competition account disqualified',
  displayName: 'Competition Breached',
  previewData: { customerName: 'John', accountLogin: '50012345', reason: 'Max drawdown 22% exceeded 20%' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#0f172a' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { borderBottom: '3px solid #dc2626', paddingBottom: '12px', marginBottom: '20px' }
const brand = { color: '#dc2626', fontSize: '24px', margin: 0 }
const h2 = { fontSize: '20px' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#334155' }
const card = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '14px 0' }
