-- =====================================================================
-- Prospecção de Shows — Prefeituras MG
-- 1º arquivo: estrutura do banco. Rode no Supabase: SQL Editor > New query
-- =====================================================================

-- Municípios (853 cidades de MG, carregadas pelo seed.sql)
create table if not exists public.municipios (
  id                    integer primary key,          -- código IBGE (7 dígitos)
  nome                  text not null,
  regiao_intermediaria  text not null,
  regiao_imediata       text not null,
  populacao             integer,
  latitude              double precision not null,
  longitude             double precision not null,
  ddd                   smallint,
  slug                  text,
  -- dados de prospecção (preenchidos no app)
  status                text not null default 'A contatar',
  aniversario           text,                          -- formato dd/mm
  festas                text,                          -- festas/eventos com show
  meses_eventos         text,
  setor_responsavel     text,
  proximo_followup      date,
  proximo_passo         text,
  cache_proposto        numeric(12,2),
  observacoes           text,
  updated_at            timestamptz not null default now(),
  constraint status_valido check (status in (
    'A contatar','Contato feito','Aguardando retorno','Proposta enviada',
    'Negociando','Fechado','Sem interesse','Retomar depois'))
);

-- Contatos de cada prefeitura (secretário, assessor, comissão da festa...)
create table if not exists public.contatos (
  id            uuid primary key default gen_random_uuid(),
  municipio_id  integer not null references public.municipios(id) on delete cascade,
  nome          text not null,
  cargo         text,
  telefone      text,
  whatsapp      text,
  email         text,
  principal     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists contatos_municipio_idx on public.contatos(municipio_id);

-- Histórico de interações (ligação, WhatsApp, e-mail, visita...)
create table if not exists public.interacoes (
  id            uuid primary key default gen_random_uuid(),
  municipio_id  integer not null references public.municipios(id) on delete cascade,
  data          timestamptz not null default now(),
  tipo          text not null,
  descricao     text,
  usuario_id    uuid default auth.uid(),
  usuario_email text default (auth.jwt() ->> 'email'),
  created_at    timestamptz not null default now()
);
create index if not exists interacoes_municipio_idx on public.interacoes(municipio_id);
create index if not exists interacoes_data_idx on public.interacoes(data);

-- Shows fechados / agendados
create table if not exists public.shows (
  id            uuid primary key default gen_random_uuid(),
  municipio_id  integer not null references public.municipios(id) on delete cascade,
  data          date not null,
  evento        text,
  cache         numeric(12,2),
  situacao      text not null default 'Confirmado'
                check (situacao in ('Confirmado','Realizado','Cancelado')),
  observacoes   text,
  created_at    timestamptz not null default now()
);
create index if not exists shows_data_idx on public.shows(data);
create index if not exists shows_municipio_idx on public.shows(municipio_id);

-- Configurações gerais (cidade-base, raios, modelos de mensagem)
create table if not exists public.config (
  chave  text primary key,
  valor  text not null
);

insert into public.config (chave, valor) values
  ('cidade_base', '3145208'),          -- Nova Serrana
  ('fator_estrada', '1.3'),
  ('raio_a', '150'),
  ('raio_b', '300'),
  ('msg_whatsapp', 'Olá {contato}, tudo bem? Sou da banda {banda} e gostaria de apresentar nossa proposta de show para a programação de {cidade}. Posso te enviar nosso material?'),
  ('msg_email_assunto', 'Proposta de show — {banda} em {cidade}'),
  ('msg_email_corpo', 'Olá {contato},

Sou da banda {banda} e gostaria de apresentar nossa proposta de show para os eventos de {cidade}.

Segue nosso material com release, vídeos e referências de shows anteriores. Temos toda a documentação para contratação por inexigibilidade (Lei 14.133/2021, art. 74, II).

Fico à disposição para conversarmos.

Atenciosamente,'),
  ('nome_banda', 'Nome da Banda')
on conflict (chave) do nothing;

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists municipios_updated_at on public.municipios;
create trigger municipios_updated_at before update on public.municipios
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Acesso: o app é de uso pessoal e NÃO tem login. Qualquer pessoa com o
-- link do app pode ler e editar os dados. Para exigir login no futuro,
-- troque "anon, authenticated" por "authenticated" abaixo.
-- ---------------------------------------------------------------------
alter table public.municipios enable row level security;
alter table public.contatos   enable row level security;
alter table public.interacoes enable row level security;
alter table public.shows      enable row level security;
alter table public.config     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['municipios','contatos','interacoes','shows','config'] loop
    execute format('drop policy if exists "logados_tudo" on public.%I', t);
    execute format('drop policy if exists "app_tudo" on public.%I', t);
    execute format('create policy "app_tudo" on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
