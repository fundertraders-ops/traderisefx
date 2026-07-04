import type { ComponentType } from 'react'
import { template as accountActivatedTemplate } from './account-activated'
import { template as paymentReceivedTemplate } from './payment-received'
import { template as referralAppliedTemplate } from './referral-applied'
import { template as commissionCreditedTemplate } from './commission-credited'
import { template as accountBreachedTemplate } from './account-breached'
import { template as phase2IssuedTemplate } from './phase2-issued'
import { template as competitionJoinedTemplate } from './competition-joined'
import { template as competitionBreachedTemplate } from './competition-breached'
import { template as competitionWinnerTemplate } from './competition-winner'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'account-activated': accountActivatedTemplate,
  'payment-received': paymentReceivedTemplate,
  'referral-applied': referralAppliedTemplate,
  'commission-credited': commissionCreditedTemplate,
  'account-breached': accountBreachedTemplate,
  'phase2-issued': phase2IssuedTemplate,
  'competition-joined': competitionJoinedTemplate,
  'competition-breached': competitionBreachedTemplate,
  'competition-winner': competitionWinnerTemplate,
}
