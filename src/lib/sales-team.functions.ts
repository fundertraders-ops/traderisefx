import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const RoleSchema = z.enum(['BDM', 'RM', 'ARM'])

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' })
  if (!data) throw new Error('Forbidden')
}

export const listSalesTeam = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { supabase } = context
    const { data: members, error } = await supabase
      .from('sales_team_members')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    const { data: entries, error: e2 } = await supabase
      .from('sales_business_entries')
      .select('*')
      .order('period_month', { ascending: false })
    if (e2) throw new Error(e2.message)
    return { members: members ?? [], entries: entries ?? [] }
  })

export const upsertSalesMember = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      full_name: z.string().min(1).max(120),
      email: z.string().email().max(200).optional().nullable(),
      role: RoleSchema,
      notes: z.string().max(2000).optional().nullable(),
      active: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabase } = context
    const payload = {
      full_name: data.full_name,
      email: data.email ?? null,
      role: data.role,
      notes: data.notes ?? null,
      active: data.active ?? true,
    }
    if (data.id) {
      const { error } = await supabase.from('sales_team_members').update(payload).eq('id', data.id)
      if (error) throw new Error(error.message)
      return { ok: true, id: data.id }
    }
    const { data: row, error } = await supabase
      .from('sales_team_members')
      .insert(payload)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, id: row.id }
  })

export const deleteSalesMember = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.from('sales_team_members').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const upsertBusinessEntry = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      member_id: z.string().uuid(),
      period_month: z.string().regex(/^\d{4}-\d{2}$/),
      business_volume: z.number().min(0).max(100_000_000),
      approved: z.boolean().optional(),
      description: z.string().max(2000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const payload = {
      member_id: data.member_id,
      period_month: `${data.period_month}-01`,
      business_volume: data.business_volume,
      approved: data.approved ?? false,
      description: data.description ?? null,
    }
    if (data.id) {
      const { error } = await context.supabase
        .from('sales_business_entries')
        .update(payload)
        .eq('id', data.id)
      if (error) throw new Error(error.message)
      return { ok: true, id: data.id }
    }
    const { data: row, error } = await context.supabase
      .from('sales_business_entries')
      .insert(payload)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, id: row.id }
  })

export const deleteBusinessEntry = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('sales_business_entries')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })
