import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface Section {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Website Overview",
    paragraphs: [
      "Trade Rise FX is a proprietary trading firm platform offering funded trading accounts with one-step and two-step evaluations as well as instant funding. Traders can earn up to 90% profit split with 24-hour payouts under fair, transparent rules.",
      "The site combines a public marketing experience, a self-service user dashboard, a fully featured admin control panel, a multilingual live support chat, and an automated email notification system.",
    ],
  },
  {
    title: "2. Public Site Structure",
    paragraphs: ["The marketing site is organised into the following primary routes:"],
    bullets: [
      "/ — Home (hero, account types, features, steps, stats, referral, affiliate, rankings, payouts, FAQ, reviews, trust, support, CTA).",
      "/challenges — Two-step and one-step evaluation plans.",
      "/instant — Instant funding accounts.",
      "/reviews — Public customer reviews and ratings.",
      "/checkout — Purchase flow with crypto payment + payment-proof upload.",
      "/auth — Sign in, sign up, and password reset.",
      "/reset-password — Password reset confirmation.",
      "/unsubscribe — Email unsubscribe landing page.",
    ],
  },
  {
    title: "3. User Dashboard Features",
    paragraphs: ["After signing in, users access /dashboard with the following capabilities:"],
    bullets: [
      "View funded trading accounts (MT5 credentials, server, balance, status).",
      "Track order history and verification status.",
      "Referral program: unique referral code, referred users, 10% commission earnings.",
      "Wallet balance and lifetime earnings overview.",
      "Withdrawal requests (minimum $100) with method and payout details.",
      "Live support chat widget available on every page.",
      "Free-account credits from add-on purchases automatically applied.",
    ],
  },
  {
    title: "4. Admin Dashboard Features",
    paragraphs: ["Administrators access /admin and its sub-sections:"],
    bullets: [
      "/admin — Control panel overview.",
      "/admin/orders — Approve, reject, and inspect payment proofs and TXIDs.",
      "/admin/accounts — Provision and manage MT5 trading accounts for funded users.",
      "/admin/users — Manage user roles, view withdrawals, orders, referrals, commissions.",
      "/admin/reviews — Moderate customer reviews and ratings.",
      "/admin/chats — Real-time live support console with agent presence and status.",
      "/admin/emails — Outbound transactional email log with status and errors.",
      "/admin/trade-results — Upload trade screenshots, target individual users.",
      "/admin/documents — Generate, preview, download, and manage PDF documentation.",
    ],
  },
  {
    title: "5. Account Types and Rules",
    paragraphs: ["Trade Rise FX offers three evaluation paths:"],
    bullets: [
      "Two-Step Challenge — Phase 1 + Phase 2 targets, then funded.",
      "One-Step Challenge — Single evaluation phase before funding.",
      "Instant Funding — No evaluation, immediate live capital.",
      "Account sizes from $5K up to $400K.",
      "90% profit split for the trader.",
      "24-hour payouts after withdrawal request approval.",
      "Minimum 2-minute trade holding time to prevent latency abuse.",
      "No restrictions on news trading, weekend holds, or EAs (per plan).",
      "Add-on: free-next-account credit automatically granted on approval.",
    ],
  },
  {
    title: "6. Payment Verification System",
    paragraphs: [
      "Payments are accepted via cryptocurrency networks. At checkout the customer provides either a TXID or uploads a payment screenshot (any image/PDF, no size or dimension restriction). The order is recorded with verification_status = 'pending'.",
      "An admin reviews the order from /admin/orders and either approves or rejects it. Approval triggers referral commission credit (10% to the referrer), free-account-credit grant where applicable, and downstream account provisioning.",
    ],
    bullets: [
      "Immediate confirmation email to the customer: 'Payment received — under verification'.",
      "Admin approval transitions the order to 'confirmed' and credits commissions.",
      "Rejection refunds reserved free-account credits where applicable.",
      "Free-account redemption flow bypasses TXID/proof requirements.",
    ],
  },
  {
    title: "7. Support System",
    paragraphs: [
      "A floating live-chat widget is mounted globally. Visitors choose a language (English / Urdu / Hindi) and a mode (AI bot or live agent).",
      "The AI bot is powered by the Lovable AI Gateway and answers using a site-aware system prompt. If a visitor asks for an agent, the conversation is queued and surfaced in /admin/chats for support staff.",
    ],
    bullets: [
      "Real-time admin console with 2-second polling, ping audio, and toast notifications.",
      "Agent presence: Online, Busy, Offline.",
      "Three-pane layout: conversations list, message thread, support agents panel.",
      "Visitor identity persisted via cookie/localStorage; no account required.",
      "Offline-message fallback when no agents are online.",
      "Chat messages never trigger email notifications.",
    ],
  },
  {
    title: "8. Email Notification System",
    paragraphs: [
      "Transactional emails are sent through a dedicated sending domain (notify.traderisefx.com) using a queue-backed processor.",
    ],
    bullets: [
      "account-activated — sent when a funded account is provisioned.",
      "payment-received — sent immediately when a customer submits payment.",
      "Email queue processed by a scheduled cron route under /api/lovable/email/queue/process.",
      "Suppression list and per-recipient unsubscribe tokens supported.",
      "Full delivery log visible at /admin/emails (status, error, recipient, template).",
      "Live chat events are explicitly excluded from email notifications.",
    ],
  },
  {
    title: "9. Review & Rating System",
    paragraphs: [
      "Customers can leave star ratings and written reviews from /reviews. Reviews are moderated from /admin/reviews. Approved reviews surface on the home page and the dedicated reviews route.",
    ],
    bullets: [
      "Star rating (1–5) and free-text body.",
      "Owner-scoped row-level security: users can edit their own reviews.",
      "Admins can approve, hide, or remove any review.",
      "Approved reviews are publicly readable.",
    ],
  },
  {
    title: "10. Security Features",
    paragraphs: ["The platform follows a defence-in-depth approach across the stack."],
    bullets: [
      "Roles enforced via a dedicated user_roles table and a SECURITY DEFINER has_role() function.",
      "Row-level security enabled on every public table.",
      "Admin-only routes gated server-side via has_role(auth.uid(),'admin').",
      "Sensitive server functions execute under requireSupabaseAuth middleware.",
      "Service-role key never exposed to the browser; client.server.ts is import-protected.",
      "Storage buckets (payment-proofs, generated-documents, trade-results) are private with explicit policies.",
      "Webhook and public API routes verify signatures before processing.",
      "Email unsubscribe tokens are single-purpose and bound to the recipient.",
      "Protected profile fields (wallet balance, referral code, totals) cannot be modified by the user.",
    ],
  },
  {
    title: "11. Complete Website Structure",
    paragraphs: ["Routing map (TanStack Router file-based routes):"],
    bullets: [
      "Public: /, /challenges, /instant, /reviews, /checkout, /unsubscribe.",
      "Auth: /auth, /reset-password.",
      "User: /dashboard.",
      "Admin: /admin, /admin/orders, /admin/accounts, /admin/users, /admin/reviews, /admin/chats, /admin/emails, /admin/trade-results, /admin/documents.",
      "Public API: /api/public/* (webhooks, cron-triggered endpoints).",
      "Internal email: /lovable/email/queue/process, /lovable/email/transactional/send, /lovable/email/transactional/preview, /lovable/email/suppression.",
    ],
  },
  {
    title: "12. Technical Specifications",
    paragraphs: ["Stack and infrastructure summary:"],
    bullets: [
      "Frontend: React 19, TanStack Start v1, TanStack Router, Tailwind CSS v4, shadcn/ui.",
      "Backend: Lovable Cloud (Postgres + Auth + Storage + Realtime).",
      "Server logic: createServerFn (RPC) and TanStack server routes (HTTP).",
      "AI: Lovable AI Gateway (google/gemini models).",
      "Email: queue-backed transactional sending via notify.traderisefx.com.",
      "Hosting: Edge runtime (Cloudflare Workers via TanStack Start).",
      "Build: Vite 7.",
    ],
  },
];

const SITE_NAME = "Trade Rise FX";
const DOC_TITLE = "Trade Rise FX — Complete Platform Documentation";

const GOLD = rgb(0.83, 0.68, 0.21);
const DARK = rgb(0.07, 0.09, 0.15);
const TEXT = rgb(0.15, 0.17, 0.21);
const MUTED = rgb(0.45, 0.48, 0.55);
const LINE = rgb(0.85, 0.85, 0.88);
const BG = rgb(0.98, 0.98, 0.99);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 64;

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildDocumentationPdf(opts: { generatedAt: Date }): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(DOC_TITLE);
  pdf.setAuthor(SITE_NAME);
  pdf.setSubject("Complete platform documentation");
  pdf.setCreator(SITE_NAME);
  pdf.setProducer(SITE_NAME);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const dateStr = opts.generatedAt.toUTCString();

  // ---- Cover page ----
  const cover = pdf.addPage([PAGE_W, PAGE_H]);
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: DARK });
  cover.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8, color: GOLD });
  cover.drawText(SITE_NAME, { x: MARGIN_X, y: PAGE_H - 200, size: 36, font: bold, color: rgb(1, 1, 1) });
  cover.drawText("Complete Platform Documentation", { x: MARGIN_X, y: PAGE_H - 240, size: 18, font, color: GOLD });
  cover.drawRectangle({ x: MARGIN_X, y: PAGE_H - 270, width: 80, height: 2, color: GOLD });
  const coverLines = [
    "An end-to-end reference covering every page, feature,",
    "user flow, admin function, payment flow, support system,",
    "email notification, and security control on the platform.",
  ];
  coverLines.forEach((line, i) => {
    cover.drawText(line, { x: MARGIN_X, y: PAGE_H - 320 - i * 18, size: 12, font, color: rgb(0.85, 0.86, 0.9) });
  });
  cover.drawText(`Generated: ${dateStr}`, { x: MARGIN_X, y: 80, size: 10, font, color: rgb(0.7, 0.72, 0.78) });
  cover.drawText("traderisefx.com", { x: MARGIN_X, y: 64, size: 10, font: bold, color: GOLD });

  // ---- Content pages ----
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN_TOP;

  const drawHeader = (p: any) => {
    p.drawRectangle({ x: 0, y: PAGE_H - 36, width: PAGE_W, height: 36, color: BG });
    p.drawText(SITE_NAME, { x: MARGIN_X, y: PAGE_H - 24, size: 9, font: bold, color: DARK });
    p.drawText("Platform Documentation", { x: PAGE_W - MARGIN_X - 140, y: PAGE_H - 24, size: 9, font, color: MUTED });
    p.drawLine({ start: { x: MARGIN_X, y: PAGE_H - 38 }, end: { x: PAGE_W - MARGIN_X, y: PAGE_H - 38 }, thickness: 0.5, color: LINE });
  };
  const drawFooter = (p: any, n: number) => {
    p.drawLine({ start: { x: MARGIN_X, y: 48 }, end: { x: PAGE_W - MARGIN_X, y: 48 }, thickness: 0.5, color: LINE });
    p.drawText(`Page ${n}`, { x: PAGE_W - MARGIN_X - 40, y: 34, size: 9, font, color: MUTED });
    p.drawText(SITE_NAME, { x: MARGIN_X, y: 34, size: 9, font, color: MUTED });
  };

  drawHeader(page);

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    drawHeader(page);
    y = PAGE_H - MARGIN_TOP;
  };

  const ensure = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) newPage();
  };

  // Table of contents
  ensure(40);
  page.drawText("Table of Contents", { x: MARGIN_X, y, size: 20, font: bold, color: DARK });
  y -= 28;
  SECTIONS.forEach((s) => {
    ensure(18);
    page.drawText(s.title, { x: MARGIN_X, y, size: 11, font, color: TEXT });
    y -= 16;
  });
  y -= 8;

  const maxWidth = PAGE_W - MARGIN_X * 2;

  for (const section of SECTIONS) {
    ensure(34);
    page.drawText(section.title, { x: MARGIN_X, y, size: 15, font: bold, color: DARK });
    y -= 6;
    page.drawRectangle({ x: MARGIN_X, y: y - 2, width: 36, height: 2, color: GOLD });
    y -= 18;

    for (const para of section.paragraphs) {
      const lines = wrapText(para, font, 10.5, maxWidth);
      for (const line of lines) {
        ensure(14);
        page.drawText(line, { x: MARGIN_X, y, size: 10.5, font, color: TEXT });
        y -= 14;
      }
      y -= 4;
    }

    if (section.bullets) {
      for (const b of section.bullets) {
        const lines = wrapText(b, font, 10.5, maxWidth - 14);
        ensure(14);
        page.drawText("•", { x: MARGIN_X, y, size: 11, font: bold, color: GOLD });
        for (let i = 0; i < lines.length; i++) {
          ensure(14);
          page.drawText(lines[i], { x: MARGIN_X + 14, y, size: 10.5, font, color: TEXT });
          y -= 14;
        }
      }
      y -= 6;
    }

    y -= 10;
  }

  // Footers with page numbers (skip cover at index 0)
  const pages = pdf.getPages();
  for (let i = 1; i < pages.length; i++) {
    drawFooter(pages[i], i);
  }

  const bytes = await pdf.save();
  return { bytes, pageCount: pages.length };
}
