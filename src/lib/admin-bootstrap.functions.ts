import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_PHONE = "18991913165";
const ADMIN_EMAIL = `${ADMIN_PHONE}@pharpep.dev`;
const ADMIN_PASSWORD = "1@2s3D";
const ADMIN_NOME = "adminvic";

export const ensureAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw new Error(listErr.message);
  let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

  if (!user) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (createErr) throw new Error(createErr.message);
    user = created.user!;
  }

  // Ensure admin role
  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!existingRole) {
    await supabaseAdmin.from("user_roles").insert({ user_id: user.id, role: "admin" });
  }

  // Ensure user_profile exists
  const { data: existingProfile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabaseAdmin.from("user_profiles").insert({
      id: user.id,
      nome: ADMIN_NOME,
      telefone: ADMIN_PHONE,
    });
  }

  return { ok: true };
});
