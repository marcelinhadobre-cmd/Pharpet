-- ============================================================
-- PharPep — Complemento: user_profiles, pedidos, RPC e admin
-- (products/user_roles/vendas já criados pelas migrations anteriores)
-- ============================================================

-- ── user_profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL DEFAULT '',
  telefone   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own profile"   ON public.user_profiles;
DROP POLICY IF EXISTS "admins read all profiles" ON public.user_profiles;

CREATE POLICY "users read own profile" ON public.user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "admins read all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── pedidos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  produto_nome      TEXT NOT NULL,
  produto_preco     NUMERIC(10,2) NOT NULL DEFAULT 0,
  cliente_nome      TEXT NOT NULL,
  cliente_cpf       TEXT NOT NULL,
  cliente_telefone  TEXT NOT NULL,
  endereco_rua      TEXT NOT NULL,
  endereco_numero   TEXT NOT NULL,
  endereco_bairro   TEXT NOT NULL,
  endereco_cidade   TEXT NOT NULL,
  endereco_estado   TEXT NOT NULL DEFAULT 'SP',
  endereco_cep      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'aguardando',
  mensagem_whatsapp TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users insert own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "users read own pedidos"   ON public.pedidos;
DROP POLICY IF EXISTS "admins all pedidos"        ON public.pedidos;

CREATE POLICY "users insert own pedidos" ON public.pedidos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users read own pedidos" ON public.pedidos
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admins all pedidos" ON public.pedidos
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_pedidos_created ON public.pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_user    ON public.pedidos(user_id);

-- ── Função RPC para criar usuários PharPep ───────────────────
CREATE OR REPLACE FUNCTION public.create_pharpep_user(
  p_nome     text,
  p_telefone text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email   text;
  v_user_id uuid;
  v_hash    text;
BEGIN
  v_email := regexp_replace(p_telefone, '[^0-9]', '', 'g') || '@pharpep.dev';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'numero_ja_cadastrado';
  END IF;

  v_user_id := gen_random_uuid();
  v_hash    := crypt(p_password, gen_salt('bf', 10));

  SET session_replication_role = replica;

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000',
    v_email, v_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', p_nome, 'telefone', p_telefone),
    false, 'authenticated', 'authenticated'
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_email, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', now(), now()
  );

  SET session_replication_role = DEFAULT;

  INSERT INTO public.user_profiles (id, nome, telefone)
  VALUES (v_user_id, p_nome, p_telefone);

  RETURN jsonb_build_object('user_id', v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pharpep_user(text, text, text) TO anon, authenticated;

-- ── Criar admin (18991913165 / 1@2s3D) ───────────────────────
DO $$
DECLARE
  v_result  jsonb;
  v_user_id uuid;
BEGIN
  -- só cria se ainda não existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '18991913165@pharpep.dev') THEN
    v_result  := public.create_pharpep_user('adminvic', '18991913165', '1@2s3D');
    v_user_id := (v_result->>'user_id')::uuid;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
  END IF;
END $$;
