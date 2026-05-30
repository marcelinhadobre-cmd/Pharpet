-- ============================================================
-- PharPep — Setup completo do banco de dados
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── user_roles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  primary_image_url TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (active = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins write products" ON public.products
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── product_images ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read product images" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write product images" ON public.product_images
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── analytics_events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read events" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── user_profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL DEFAULT '',
  telefone   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile" ON public.user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "admins read all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── vendas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  cliente_nome     TEXT NOT NULL,
  cliente_cpf      TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  endereco_rua     TEXT NOT NULL,
  endereco_numero  TEXT NOT NULL,
  endereco_bairro  TEXT NOT NULL,
  endereco_cidade  TEXT NOT NULL,
  endereco_estado  TEXT NOT NULL DEFAULT 'SP',
  endereco_cep     TEXT NOT NULL,
  produto          TEXT NOT NULL,
  valor            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pendente',
  observacoes      TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage vendas" ON public.vendas
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── pedidos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  produto_nome     TEXT NOT NULL,
  produto_preco    NUMERIC(10,2) NOT NULL DEFAULT 0,
  cliente_nome     TEXT NOT NULL,
  cliente_cpf      TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  endereco_rua     TEXT NOT NULL,
  endereco_numero  TEXT NOT NULL,
  endereco_bairro  TEXT NOT NULL,
  endereco_cidade  TEXT NOT NULL,
  endereco_estado  TEXT NOT NULL DEFAULT 'SP',
  endereco_cep     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'aguardando',
  mensagem_whatsapp TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users read own pedidos"   ON public.pedidos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins all pedidos" ON public.pedidos
  FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ── Triggers ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_created  ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type     ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_vendas_created  ON public.vendas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON public.pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_user    ON public.pedidos(user_id);

-- ── Storage bucket para imagens de produtos ──────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images','product-images',true)
ON CONFLICT DO NOTHING;

CREATE POLICY "public read product imgs" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

CREATE POLICY "admins upload product imgs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins update product imgs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins delete product imgs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

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

-- ── Criar usuário admin ───────────────────────────────────────
DO $$
DECLARE
  v_result  jsonb;
  v_user_id uuid;
BEGIN
  v_result  := public.create_pharpep_user('adminvic', '18991913165', '1@2s3D');
  v_user_id := (v_result->>'user_id')::uuid;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
END $$;
