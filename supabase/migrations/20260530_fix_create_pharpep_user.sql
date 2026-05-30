-- Fix create_pharpep_user: identity_data must include email_verified and phone_verified
-- for GoTrue v2 compatibility (missing these fields caused 500 on login)
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
    is_super_admin, role, aud, is_anonymous
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000',
    v_email, v_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', p_nome, 'telefone', p_telefone),
    false, 'authenticated', 'authenticated', false
  );

  -- GoTrue v2 requires email_verified and phone_verified in identity_data
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_email, v_user_id,
    jsonb_build_object(
      'sub',            v_user_id::text,
      'email',          v_email,
      'email_verified', false,
      'phone_verified', false
    ),
    'email', now(), now()
  );

  SET session_replication_role = DEFAULT;

  INSERT INTO public.user_profiles (id, nome, telefone)
  VALUES (v_user_id, p_nome, p_telefone);

  RETURN jsonb_build_object('user_id', v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pharpep_user(text, text, text) TO anon, authenticated;
