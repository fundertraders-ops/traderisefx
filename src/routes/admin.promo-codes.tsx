import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Save, Tag } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import { listPromoCodes, upsertPromoCode, deletePromoCode } from "@/lib/promo-codes.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/promo-codes")({
  head: () => ({ meta: [{ title: "Promo Codes — Trade Rise FX Admin" }] }),
  component: AdminPromoCodesPage,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-sm">Not found</div>,
});

type Row = {
  id: string;
  code: string;
  discount_percent: number;
  created_by: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function AdminPromoCodesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchList = useServerFn(listPromoCodes);
  const upsertFn = useServerFn(upsertPromoCode);
  const deleteFn = useServerFn(deletePromoCode);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/promo-codes" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const listQ = useQuery({
    queryKey: ["promo-codes"],
    queryFn: () => fetchList(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const upsertMut = useMutation({
    mutationFn: (vars: any) => upsertFn({ data: vars }),
    onSuccess: () => {
      toast.success("Promo code saved");
      qc.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Promo code deleted");
      qc.invalidateQueries({ queryKey: ["promo-codes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const [newCode, setNewCode] = useState("");
  const [newPct, setNewPct] = useState("15");
  const [newCreatedBy, setNewCreatedBy] = useState("");

  if (loading || adminQ.isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-gold" /></div>;
  }
  if (!user || adminQ.data?.isAdmin !== true) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Admin access required.</div>;
  }

  const items = (listQ.data?.items ?? []) as Row[];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Nav />
          <header className="pt-24 px-6 flex items-center gap-3">
            <SidebarTrigger />
            <AdminBreadcrumb currentPage="Promo Codes" />
          </header>
          <main className="px-6 py-8 max-w-5xl w-full mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><Tag className="text-gold" /> Promo Codes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage discount codes customers can apply at checkout. Codes are case-insensitive.
              </p>
            </div>

            <section className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Plus size={16} className="text-gold" /> Create new code</h2>
              <div className="grid sm:grid-cols-4 gap-3">
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="Code (e.g. EARNWITHUSAMA)"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.replace(/[^A-Za-z0-9_\-]/g, ""))}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="Discount %"
                  value={newPct}
                  onChange={(e) => setNewPct(e.target.value)}
                />
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="Created by"
                  value={newCreatedBy}
                  onChange={(e) => setNewCreatedBy(e.target.value)}
                />
                <Button
                  onClick={() => {
                    const pct = Number(newPct);
                    if (!newCode.trim()) return toast.error("Enter a code");
                    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return toast.error("Discount must be 0-100");
                    upsertMut.mutate({
                      id: null,
                      code: newCode.trim(),
                      discount_percent: pct,
                      created_by: newCreatedBy.trim() || null,
                      active: true,
                    }, {
                      onSuccess: () => { setNewCode(""); setNewPct("15"); setNewCreatedBy(""); },
                    });
                  }}
                  disabled={upsertMut.isPending}
                >
                  {upsertMut.isPending ? <Loader2 size={14} className="animate-spin" /> : "Add code"}
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="font-semibold mb-4">Existing codes</h2>
              {listQ.isLoading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground">No promo codes yet.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((row) => (
                    <PromoRow
                      key={row.id}
                      row={row}
                      onSave={(payload) => upsertMut.mutate({ id: row.id, ...payload })}
                      onDelete={() => {
                        if (confirm(`Delete promo code ${row.code}?`)) deleteMut.mutate(row.id);
                      }}
                      saving={upsertMut.isPending}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PromoRow({ row, onSave, onDelete, saving }: { row: Row; onSave: (p: any) => void; onDelete: () => void; saving: boolean }) {
  const [code, setCode] = useState(row.code);
  const [pct, setPct] = useState(String(row.discount_percent));
  const [createdBy, setCreatedBy] = useState(row.created_by ?? "");
  const [active, setActive] = useState(row.active);

  useEffect(() => {
    setCode(row.code);
    setPct(String(row.discount_percent));
    setCreatedBy(row.created_by ?? "");
    setActive(row.active);
  }, [row]);

  return (
    <div className="grid sm:grid-cols-[1.5fr_0.8fr_1.2fr_0.6fr_auto] gap-3 items-center rounded-lg border border-border bg-background/40 p-3">
      <input
        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9_\-]/g, ""))}
      />
      <input
        type="number"
        min={0}
        max={100}
        step="0.01"
        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        value={pct}
        onChange={(e) => setPct(e.target.value)}
      />
      <input
        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        value={createdBy}
        placeholder="Created by"
        onChange={(e) => setCreatedBy(e.target.value)}
      />
      <label className="text-xs inline-flex items-center gap-2">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const p = Number(pct);
            if (!code.trim()) return toast.error("Code required");
            if (!Number.isFinite(p) || p < 0 || p > 100) return toast.error("Discount 0-100");
            onSave({
              code: code.trim(),
              discount_percent: p,
              created_by: createdBy.trim() || null,
              active,
            });
          }}
          disabled={saving}
        >
          <Save size={14} /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 size={14} className="text-destructive" />
        </Button>
      </div>
    </div>
  );
}
