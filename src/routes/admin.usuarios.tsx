import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosAdmin,
});

interface UserProfileRow {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
}

function UsuariosAdmin() {
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserProfileRow[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Contas cadastradas na plataforma</p>
        </div>
        <div className="card-premium flex items-center gap-2 rounded-2xl px-5 py-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-display text-2xl font-bold">{usuarios.length}</span>
          <span className="text-xs text-muted-foreground">cadastros</span>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : usuarios.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          Nenhum usuário cadastrado.
        </div>
      ) : (
        <div className="card-premium overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  {["#", "Nome", "Telefone", "Data de Cadastro"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{u.nome}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {u.telefone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(u.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
