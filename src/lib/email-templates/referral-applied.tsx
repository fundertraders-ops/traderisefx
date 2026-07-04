import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  orderId?: string
  referralCode?: string
  amount?: string
  supportEmail?: string
  websiteUrl?: string
}

const Email = ({
  customerName = 'Trader',
  orderId = '—',
  referralCode = '—',
  amount,
  supportEmail = 'fxtradersrise@gmail.com',
  websiteUrl = 'https://traderisefx.com',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your referral code was applied — Trade Rise FX</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Referral Code Applied Successfully</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>
          We've recorded your referral code <strong>{referralCode}</strong> against order{' '}
          <strong>{orderId}</strong>{amount ? ` for ${amount}` : ''}. Once your payment is
          verified by our team, your referrer's commission will be credited automatically.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>Order</Text>
          <Text style={cardValue}>{orderId}</Text>
          <Text style={cardLabel}>Referral Code</Text>
          <Text style={cardValue}>{referralCode}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={muted}>
          Questions? Email <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link> or visit{' '}
          <Link href={websiteUrl} style={link}>{websiteUrl}</Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Referral Code Applied — Trade Rise FX',
  displayName: 'Referral applied (buyer)',
  previewData: { customerName: 'Jane', orderId: 'AF-ABC123', referralCode: 'GOLD42', amount: '$289' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { color: '#0f172a', fontSize: '22px', margin: '0 0 12px' }
const text = { color: '#1f2937', fontSize: '14px', lineHeight: '22px' }
const card = { backgroundColor: '#fff8e6', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const cardLabel = { color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const cardValue = { color: '#0f172a', fontSize: '15px', fontWeight: 600 as const, margin: '0 0 10px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const muted = { color: '#6b7280', fontSize: '12px' }
const link = { color: '#b8860b' }
