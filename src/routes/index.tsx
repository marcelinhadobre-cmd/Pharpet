import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { COMMUNITY_LINK } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import hero from "@/assets/hero-molecules.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PharPep — Comunidade & Catálogo Premium de Peptídeos" },
      { name: "description", content: "Entre na comunidade PharPep e descubra o catálogo premium de peptídeos." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    trackEvent("page_view", undefined, { path: "/" });
  }, []);

  const goCommunity = () => {
    trackEvent("community_click");
    window.open(COMMUNITY_LINK, "_blank");
  };

  return (
    <div className="min-h-screen bg-mesh">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Peptídeos premium · qualidade verificada
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-6xl md:text-7xl">
              Entre na <span className="text-gradient">comunidade</span>
              <br />PharPep
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Acesse conteúdos exclusivos, novidades em primeira mão e o catálogo completo de peptídeos com atendimento direto.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={goCommunity} className="btn-hero inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold sm:w-auto">
                Entrar na comunidade
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                to="/catalogo"
                className="glass inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold transition-all hover:border-primary/40 hover:bg-white/10 sm:w-auto"
              >
                Ver catálogo de peptídeos
              </Link>
            </div>
          </div>

          {/* Community CTA card */}
          <div className="mx-auto mt-16 max-w-3xl animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="card-premium relative overflow-hidden rounded-3xl p-8 sm:p-10">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative">
                <p className="font-display text-2xl font-bold sm:text-3xl">ENTRE NA COMUNIDADE</p>
                <p className="mt-2 text-sm text-muted-foreground">Grupo exclusivo no WhatsApp · acesso imediato</p>
                <button onClick={goCommunity} className="btn-hero mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold uppercase tracking-wider">
                  Clique aqui
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, t: "Qualidade", d: "Produtos selecionados" },
              { icon: Zap, t: "Atendimento", d: "Direto pelo WhatsApp" },
              { icon: Sparkles, t: "Comunidade", d: "Grupo exclusivo ativo" },
            ].map((f, i) => (
              <div key={i} className="glass rounded-2xl p-5 text-center animate-fade-up" style={{ animationDelay: `${300 + i * 80}ms` }}>
                <f.icon className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-sm font-semibold">{f.t}</p>
                <p className="text-xs text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PharPep · Catálogo Premium
      </footer>
    </div>
  );
}
