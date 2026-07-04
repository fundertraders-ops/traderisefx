import { DollarSign, Users, Activity, Globe } from "lucide-react";

const stats = [
  {
    icon: DollarSign,
    value: "$500,000+",
    label: "Paid Out",
  },
  {
    icon: Users,
    value: "10,000+",
    label: "Traders Registered",
  },
  {
    icon: Activity,
    value: "2,500+",
    label: "Active Accounts",
  },
  {
    icon: Globe,
    value: "120+",
    label: "Countries Served",
  },
];

export function Stats() {
  return (
    <section className="py-20 bg-card/30 border-y border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">
            Track record
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            Our Numbers Speak for Themselves
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-background/60 hover:border-gold/30 transition-colors"
            >
              <div className="size-12 rounded-full bg-gold/10 grid place-items-center text-gold mb-4">
                <stat.icon size={22} />
              </div>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
