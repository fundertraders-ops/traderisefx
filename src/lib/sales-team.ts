/**
 * Salary tiers per the BDM/RM/ARM compensation policy.
 * Applied to a member's APPROVED monthly business volume.
 *
 * Tiers (use highest qualifying threshold):
 *   $2,000  -> $500
 *   $5,000  -> $1,500
 *   $10,000 -> $3,500
 *   $20,000 -> $8,000
 *
 * Volumes below $2,000 earn a proportional small-business commission
 * using the $2,000 -> $500 rate (i.e. 25%).
 */
export const SALARY_TIERS = [
  { volume: 20000, salary: 8000 },
  { volume: 10000, salary: 3500 },
  { volume: 5000, salary: 1500 },
  { volume: 2000, salary: 500 },
] as const

export const SMALL_BUSINESS_RATE = 500 / 2000 // 25%

export function computeSalary(volume: number): {
  salary: number
  tier: string
  isProportional: boolean
} {
  if (volume <= 0) return { salary: 0, tier: '—', isProportional: false }
  for (const t of SALARY_TIERS) {
    if (volume >= t.volume) {
      return {
        salary: t.salary,
        tier: `$${t.volume.toLocaleString()}+ tier`,
        isProportional: false,
      }
    }
  }
  return {
    salary: Math.round(volume * SMALL_BUSINESS_RATE * 100) / 100,
    tier: 'Small business (proportional)',
    isProportional: true,
  }
}

export function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthKeyFromDate(iso: string): string {
  return iso.slice(0, 7)
}
