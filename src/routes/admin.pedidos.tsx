import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@/lib/whatsapp";
import { MessageCircle, Trash2, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/admin/pedidos")({
  component: PedidosAdmin,
});

interface PedidoRow {
  id: string;
  created_at: string;
  produto_nome: string;
  produto_preco: number;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep: string;
  status: string;
  mensagem_whatsapp: string;
}

const STATUS_OPTS = ["aguardando", "confirmado", "enviado", "entregue", "cancelado"];

const STATUS_CLS: Record<string, string> = {
  aguardando: "bg-yellow-500/15 text-yellow-400",
  confirmado: "bg-blue-500/15 text-blue-400",
  enviado: "bg-purple-500/15 text-purple-400",
  entregue: "bg-green-500/15 text-green-400",
  cancelado: "bg-red-500/15 text-red-400",
};

function PedidosAdmin() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PedidoRow[];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este pedido?")) return;
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pedido excluído");
    qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
  };

  const sendWhatsApp = (p: PedidoRow) => {
    const num = p.cliente_telefone.replace(/\D/g, "");
    const full = num.startsWith("55") ? num : `55${num}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(p.mensagem_whatsapp)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos realizados pelo catálogo · não inclui nas finanças
          </p>
        </div>
        <div className="card-premium rounded-2xl px-5 py-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-2xl font-bold">{pedidos.length}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : pedidos.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          Nenhum pedido realizado ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {pedidos.map((p) => (
            <div key={p.id} className="card-premium overflow-hidden rounded-2xl">
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.cliente_nome}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLS[p.status] ?? "bg-white/10 text-foreground"}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {p.produto_nome} · <span className="font-medium text-gradient">{formatBRL(Number(p.produto_preco))}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {/* Status selector */}
                  <div className="relative">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                      className="appearance-none rounded-lg border border-border bg-input/40 py-1.5 pl-3 pr-7 text-xs outline-none focus:border-primary"
                    >
                      {STATUS_OPTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  </div>

                  <button
                    onClick={() => sendWhatsApp(p)}
                    title="Abrir WhatsApp do cliente"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-green-500/10 hover:text-green-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    title="Ver detalhes"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === p.id ? "rotate-180" : ""}`} />
                  </button>

                  <button
                    onClick={() => onDelete(p.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === p.id && (
                <div className="border-t border-white/5 p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</p>
                    <p><span className="text-muted-foreground">Nome:</span> {p.cliente_nome}</p>
                    <p><span className="text-muted-foreground">CPF:</span> <span className="font-mono">{p.cliente_cpf}</span></p>
                    <p><span className="text-muted-foreground">Tel:</span> {p.cliente_telefone}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Endereço</p>
                    <p>{p.endereco_rua}, {p.endereco_numero}</p>
                    <p>{p.endereco_bairro}</p>
                    <p>{p.endereco_cidade} — {p.endereco_estado}</p>
                    <p className="font-mono">CEP: {p.endereco_cep}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Mensagem WhatsApp</p>
                    <pre className="whitespace-pre-wrap rounded-xl border border-border bg-input/20 p-3 font-sans text-xs leading-relaxed text-foreground/80">
                      {p.mensagem_whatsapp}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
