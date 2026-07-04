import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust, Security & Privacy | TradeRiseFX" },
      {
        name: "description",
        content:
          "How TradeRiseFX protects your account, data, and payments — security practices, privacy commitments, and how to contact us.",
      },
      { property: "og:title", content: "Trust, Security & Privacy | TradeRiseFX" },
      {
        property: "og:description",
        content:
          "Security practices, data protection, and privacy commitments at TradeRiseFX.",
      },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">Trust, Security & Privacy</h1>
        <p className="mt-4 text-muted-foreground">
          We take the security of your account, your trading credentials, and your personal data
          seriously. This page summarizes the controls we have in place and what you can expect
          from us.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold">Account & authentication</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Authentication is handled by a managed identity provider with secure password hashing.</li>
            <li>Optional social sign-in (Google) is available; we never see your provider password.</li>
            <li>Sessions use short-lived bearer tokens with automatic refresh.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold">Data protection</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Row-level security ensures users can only access their own records.</li>
            <li>Sensitive fields (such as competition account credentials) are excluded from real-time broadcasts.</li>
            <li>All traffic is encrypted in transit via TLS; data is encrypted at rest by our hosting provider.</li>
            <li>Administrative access is restricted to a small, role-gated set of staff accounts.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold">Payments</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>We do not store full card numbers. Card payments are processed by PCI-compliant providers.</li>
            <li>Crypto payments are verified on-chain; transaction hashes are recorded for audit.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold">Privacy</h2>
          <p className="text-muted-foreground">
            We only collect the information necessary to operate your account, deliver trading
            challenges, and process payouts. We do not sell personal data. You may request a copy
            of your data or deletion of your account at any time.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold">Reporting a vulnerability</h2>
          <p className="text-muted-foreground">
            If you believe you have found a security issue, please contact our support team. We
            appreciate responsible disclosure and will investigate every report.
          </p>
        </section>

        <p className="mt-12 text-xs text-muted-foreground">
          This page describes our internal practices and is not an independent certification.
        </p>
      </div>
    </main>
  );
}
