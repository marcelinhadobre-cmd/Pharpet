import { supabase } from "@/integrations/supabase/client";

interface RegisterInput {
  nome: string;
  telefone: string;
  password: string;
}

// Uses a SECURITY DEFINER RPC function in Supabase — no service role key needed client-side.
export async function registerUser(input: RegisterInput): Promise<void> {
  const { error } = await supabase.rpc("create_pharpep_user", {
    p_nome: input.nome,
    p_telefone: input.telefone,
    p_password: input.password,
  });

  if (error) {
    if (error.message.includes("numero_ja_cadastrado")) {
      throw new Error("Número de telefone já cadastrado");
    }
    throw new Error(error.message);
  }
}
