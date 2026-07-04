import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Trade Rise FX'
const SENDER_DOMAIN = 'notify.traderisefx.com'
const FROM_DOMAIN = 'notify.traderisefx.com'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface EnqueueOptions {
  templateName: string
  recipientEmail: string
  templateData?: Record<string, any>
  idempotencyKey?: string
}

/**
 * Render a registered template and enqueue it for sending via the email queue.
 * Returns { ok: true } on success, { ok: false, reason } on failure. Logs are
 * written to email_send_log either way so the admin panel reflects the result.
 */
export async function enqueueTransactionalEmail(opts: EnqueueOptions): Promise<{
  ok: boolean
  reason?: string
  messageId?: string
}> {
  const { templateName, recipientEmail, templateData = {} } = opts
  const messageId = crypto.randomUUID()
  const idempotencyKey = opts.idempotencyKey ?? messageId
  const normalizedEmail = recipientEmail.trim().toLowerCase()

  const template = TEMPLATES[templateName]
  if (!template) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: normalizedEmail,
      status: 'failed',
      error_message: `Template '${templateName}' not registered`,
    })
    return { ok: false, reason: 'template_not_found' }
  }

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('email')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: normalizedEmail,
      status: 'suppressed',
      error_message: 'Recipient is on the suppression list',
    })
    return { ok: false, reason: 'suppressed' }
  }

  // Ensure unsubscribe token
  let unsubscribeToken: string | null = null
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()
  if (existing && !existing.used_at) {
    unsubscribeToken = (existing as any).token
  } else if (!existing) {
    const newToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .upsert({ email: normalizedEmail, token: newToken }, { onConflict: 'email' })
    const { data: re } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()
    unsubscribeToken = (re as any)?.token ?? newToken
  }

  // Render
  let html: string
  let plainText: string
  try {
    const element = React.createElement(template.component, templateData)
    html = await render(element)
    plainText = await render(element, { plainText: true })
  } catch (err) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: normalizedEmail,
      status: 'failed',
      error_message: `Render failed: ${err instanceof Error ? err.message : String(err)}`,
    })
    return { ok: false, reason: 'render_failed' }
  }

  const resolvedSubject =
    typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  // Log pending
  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: normalizedEmail,
    status: 'pending',
  })

  const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: normalizedEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  } as never)

  if (enqueueError) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: normalizedEmail,
      status: 'failed',
      error_message: `Enqueue failed: ${enqueueError.message}`,
    })
    return { ok: false, reason: 'enqueue_failed' }
  }

  return { ok: true, messageId }
}
