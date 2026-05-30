import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { registerUser } from "@/lib/register-user.functions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatBRL, WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Copy, MessageCircle, Check, Lock, Phone, User, FileText, MapPin,
} from "lucide-react";
import { formatPhone } from "@/lib/phone";

interface Product {
  id: string;
  name: string;
  price: number;
}

export function OrderModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
}) {
  const { session, profile } = useAuth();
  const isLoggedIn = !!session;

  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whatsappMsg, setWhatsappMsg] = useState("");

  // Form fields
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("SP");

  function buildMsg(clienteNome: string, clienteTel: string) {
    const data = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    return [
      `🛒 *PEDIDO — PharPep*`,
      ``,
      `📦 *Produto:* ${product.name}`,
      `💰 *Valor:* ${formatBRL(Number(product.price))}`,
      ``,
      `👤 *Nome:* ${clienteNome}`,
      `📄 *CPF:* ${cpf}`,
      `📱 *Telefone:* ${clienteTel}`,
      ``,
      `📍 *Endereço de Entrega:*`,
      `${rua}, ${numero}`,
      `${bairro}`,
      `${cidade} — ${estado.toUpperCase()}`,
      `CEP: ${cep}`,
      ``,
      `📅 *Data:* ${data}`,
      ``,
      `━━━━━━━━━━━━━━━━`,
      `_PharPep Peptídeos Premium_`,
    ].join("\n");
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let userId: string;
      let clienteNome: string;
      let clienteTel: string;

      if (isLoggedIn) {
        userId = session.user.id;
        clienteNome = profile?.nome || nome;
        clienteTel = profile?.telefone || telefone;
      } else {
        // Validate password
        if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");

        // Register
        await registerUser({ nome, telefone, password: senha });

        // Login
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
          email: `${telefone.replace(/\D/g, "")}@pharpep.local`,
          password: senha,
        });
        if (loginErr || !loginData.user) {
          throw new Error("Conta criada! Entre pelo menu caso necessário.");
        }
        userId = loginData.user.id;
        clienteNome = nome;
        clienteTel = telefone;
      }

      const msg = buildMsg(clienteNome, clienteTel);

      const { error: pedidoErr } = await supabase.from("pedidos").insert({
        user_id: userId,
        produto_nome: product.name,
        produto_preco: Number(product.price),
        cliente_nome: clienteNome,
        cliente_cpf: cpf,
        cliente_telefone: clienteTel,
        endereco_rua: rua,
        endereco_numero: numero,
        endereco_bairro: bairro,
        endereco_cidade: cidade,
        endereco_estado: estado.toUpperCase(),
        endereco_cep: cep,
        mensagem_whatsapp: msg,
      });

      if (pedidoErr) throw new Error(pedidoErr.message);

      setWhatsappMsg(msg);
      setStep("success");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMsg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleClose = () => {
    setStep("form");
    setWhatsappMsg("");
    setCopied(false);
    setNome("");
    setTelefone("");
    setSenha("");
    setCpf("");
    setCep("");
    setRua("");
    setNumero("");
    setBairro("");
    setCidade("");
    setEstado("SP");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto gap-0 p-0">
        {step === "form" ? (
          <div className="p-6">
            {/* Product info */}
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs text-muted-foreground">Produto selecionado</p>
              <p className="font-display text-lg font-bold">{product.name}</p>
              <p className="text-base font-bold text-gradient">{formatBRL(Number(product.price))}</p>
            </div>

            {isLoggedIn && profile && (
              <div className="mb-5 rounded-xl border border-border bg-input/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">Fazendo pedido como</p>
                <p className="font-semibold">{profile.nome}</p>
                <p className="text-xs text-muted-foreground">{profile.telefone}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              {/* New user fields */}
              {!isLoggedIn && (
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Criar sua conta
                  </p>
                  <Field label="Nome completo">
                    <Ico icon={<User />}>
                      <input
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="João da Silva"
                        className={iCls}
                      />
                    </Ico>
                  </Field>
                  <Field label="WhatsApp / Telefone">
                    <Ico icon={<Phone />}>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        placeholder="(18) 99999-9999"
                        className={iCls}
                      />
                    </Ico>
                  </Field>
                  <Field label="Criar senha (mín. 6 caracteres)">
                    <Ico icon={<Lock />}>
                      <input
                        type="password"
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••"
                        className={iCls}
                      />
                    </Ico>
                  </Field>
                </section>
              )}

              {/* CPF */}
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dados do Pedido
                </p>
                <Field label="CPF">
                  <Ico icon={<FileText />}>
                    <input
                      required
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className={iCls}
                    />
                  </Ico>
                </Field>
              </section>

              {/* Address */}
              <section className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Endereço de Entrega
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="CEP">
                      <input required value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className={iCls} />
                    </Field>
                  </div>
                  <Field label="Número">
                    <input required value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" className={iCls} />
                  </Field>
                </div>
                <Field label="Rua / Avenida">
                  <input required value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua das Flores" className={iCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bairro">
                    <input required value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" className={iCls} />
                  </Field>
                  <Field label="Cidade">
                    <input required value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="São Paulo" className={iCls} />
                  </Field>
                </div>
                <div className="w-24">
                  <Field label="UF">
                    <input
                      required
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      style={{ textTransform: "uppercase" }}
                      className={iCls}
                    />
                  </Field>
                </div>
              </section>

              <button
                type="submit"
                disabled={submitting}
                className="btn-hero flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-60"
              >
                {submitting
                  ? "Processando..."
                  : isLoggedIn
                  ? "Confirmar Pedido"
                  : "Criar conta e confirmar pedido"}
              </button>

              {!isLoggedIn && (
                <p className="text-center text-xs text-muted-foreground">
                  Já tem conta?{" "}
                  <a href="/login" className="text-primary underline-offset-2 hover:underline">
                    Entrar
                  </a>
                </p>
              )}
            </form>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {/* Success header */}
            <div className="space-y-1 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15">
                <Check className="h-7 w-7 text-green-400" />
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">Pedido registrado!</h2>
              <p className="text-sm text-muted-foreground">
                Copie a mensagem abaixo e envie pelo WhatsApp
              </p>
            </div>

            {/* Message preview */}
            <div className="rounded-2xl border border-border bg-input/20 p-4">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/90">
                {whatsappMsg}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-input/30 py-3 text-sm font-medium transition hover:bg-white/5"
              >
                {copied ? (
                  <><Check className="h-4 w-4 text-green-400" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copiar</>
                )}
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`,
                    "_blank"
                  )
                }
                className="btn-hero flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full rounded-xl py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const iCls =
  "w-full rounded-xl border border-border bg-input/40 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Ico({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="[&>input]:pl-10">{children}</div>
    </div>
  );
}
