import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/pharpep-logo.png";
import { LogIn, LogOut, User } from "lucide-react";

export function SiteHeader() {
  const { session, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="glass sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="PharPep"
            width={36}
            height={36}
            className="drop-shadow-[0_0_12px_oklch(0.78_0.18_200/0.6)]"
          />
          <span className="font-display text-xl font-bold tracking-tight">
            Phar<span className="text-gradient">Pep</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link
            to="/"
            className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
          >
            Início
          </Link>
          <Link
            to="/catalogo"
            className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Catálogo
          </Link>
          <Link
            to="/protocolo"
            className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Protocolo
          </Link>

          {/* Auth button */}
          {!loading && (
            session ? (
              <div className="flex items-center gap-2 ml-1">
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-input/30 px-3 py-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[100px] truncate text-xs font-medium">
                    {profile?.nome ?? "Minha conta"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sair"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-input/30 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
