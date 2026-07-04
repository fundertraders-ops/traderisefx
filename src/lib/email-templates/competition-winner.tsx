import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { customerName?: string; competitionName?: string; rank?: number; prizeAmount?: string; profitPct?: string }

const ordinal = (n: number) => ['1st', '2nd', '3rd'][n - 1] ?? `${n}th`

const Email = ({ customerName = 'Trader', competitionName = 'Monthly Trading Competition', rank = 1, prizeAmount = '$5,000', profitPct = '0%' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Congratulations — you placed {ordinal(rank)} and won {prizeAmount}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Heading style={brand}>Trade Rise FX</Heading></Section>
        <Heading as="h2" style={h2}>🏆 You placed {ordinal(rank)}!</Heading>
        <Text style={p}>Hi {customerName},</Text>
        <Text style={p}>You finished <strong>{ordinal(rank)}</strong> in the <strong>{competitionName}</strong> with a profit of <strong>{profitPct}</strong>.</Text>
        <Section style={card}>
          <Heading as="h3" style={h3}>Prize</Heading>
          <Text style={prize}>{prizeAmount}</Text>
        </Section>
        <Text style={p}>Our team will contact you shortly to arrange the payout.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d) => `Congratulations — you placed ${ordinal(d.rank ?? 1)} and won ${d.prizeAmount ?? ''}`,
  displayName: 'Competition Winner',
  previewData: { customerName: 'John', rank: 1, prizeAmount: '$5,000', profitPct: '12.4%' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#0f172a' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { borderBottom: '3px solid #C9A227', paddingBottom: '12px', marginBottom: '20px' }
const brand = { color: '#C9A227', fontSize: '24px', margin: 0 }
const h2 = { fontSize: '22px' }
const h3 = { fontSize: '14px', color: '#64748b', margin: 0 }
const p = { fontSize: '14px', lineHeight: '22px', color: '#334155' }
const card = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px', margin: '14px 0', textAlign: 'center' as const }
const prize = { fontSize: '32px', fontWeight: 700 as const, color: '#C9A227', margin: '8px 0 0' }
