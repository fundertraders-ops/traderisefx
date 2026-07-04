import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  referrerName?: string
  amount?: string
  orderId?: string
  rate?: string
  walletBalance?: string
  dashboardUrl?: string
  supportEmail?: string
}

const Email = ({
  referrerName = 'Trader',
  amount = '$0.00',
  orderId = '—',
  rate = '10%',
  walletBalance,
  dashboardUrl = 'https://traderisefx.com/dashboard',
  supportEmail = 'fxtradersrise@gmail.com',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You earned {amount} in referral commission</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Commission Credited 🎉</Heading>
        <Text style={text}>Hi {referrerName},</Text>
        <Text style={text}>
          One of your referrals just completed a verified purchase, and we've credited
          <strong> {amount}</strong> ({rate} commission) to your wallet from order{' '}
          <strong>{orderId}</strong>.
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>Commission</Text>
          <Text style={cardValue}>{amount}</Text>
          {walletBalance && (
            <>
              <Text style={cardLabel}>New wallet balance</Text>
              <Text style={cardValue}>{walletBalance}</Text>
            </>
          )}
        </Section>
        <Text style={text}>
          <Link href={dashboardUrl} style={cta}>Open your dashboard →</Link>
        </Text>
        <Hr style={hr} />
        <Text style={muted}>
          Questions? Email <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Commission Credited — Trade Rise FX',
  displayName: 'Referral commission credited',
  previewData: { referrerName: 'Jane', amount: '$28.90', orderId: 'AF-ABC123', rate: '10%', walletBalance: '$128.90' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { color: '#0f172a', fontSize: '22px', margin: '0 0 12px' }
const text = { color: '#1f2937', fontSize: '14px', lineHeight: '22px' }
const card = { backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const cardLabel = { color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const cardValue = { color: '#0f172a', fontSize: '15px', fontWeight: 600 as const, margin: '0 0 10px' }
const cta = { color: '#b8860b', fontWeight: 600 as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const muted = { color: '#6b7280', fontSize: '12px' }
const link = { color: '#b8860b' }
