import { Activity, DollarSign, Globe, Star, Users } from "lucide-react";

const stats = [
  { icon: DollarSign, value: "$500,000+", label: "Paid Out" },
  { icon: Users, value: "10,000+", label: "Traders Registered" },
  { icon: Activity, value: "2,500+", label: "Active Accounts" },
  { icon: Globe, value: "120+", label: "Countries Served" },
  { icon: Star, value: "Excellent", label: "Trader Feedback" },
];

export function Stats() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm md:grid-cols-5">
          {stats.map((stat, i) => (
            <div key={stat.label} className="border-b border-border p-6 text-center last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-gold/10 text-gold">
                <stat.icon size={20} />
              </div>
              <div className="text-2xl font-black tracking-tight md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
