# Shows MG — Prospecção de shows com prefeituras

App interno para organizar a venda de shows da banda para as 853 prefeituras de Minas Gerais.

**O que ele faz**
- Lista das 853 cidades com região, população (estimativa 2025), porte, distância aproximada da cidade-base e prioridade A/B/C
- Filtros por prioridade, status, região e porte, e busca por nome
- Ficha de cada cidade: contatos, botões de WhatsApp/e-mail com mensagem pronta, histórico de contatos, aniversário, festas e cachê
- Início com retornos atrasados/de hoje/da semana, próximos shows, aniversários chegando e sugestões de quem contatar
- Agenda de shows fechados
- Relatórios: funil, resultado por região, shows por mês e atividade semanal
- Exportação para CSV (abre no Excel)

Feito com Vite + React + TypeScript e Supabase (banco + login).

---

## 1. Criar o banco no Supabase

1. Entre em [supabase.com](https://supabase.com) e crie um projeto novo (região **South America (São Paulo)**).
2. No menu da esquerda, abra **SQL Editor → New query**.
3. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
4. Abra outra query, cole `supabase/seed.sql` (as 853 cidades) e clique em **Run**.

Os dois arquivos podem ser rodados de novo sem apagar o que você já cadastrou.

## 2. Criar os usuários (acesso interno)

1. **Authentication → Sign In / Providers → Email**: desligue **Allow new users to sign up**. Assim ninguém de fora cria conta.
2. **Authentication → Users → Add user → Create new user**: informe e-mail e senha e marque **Auto Confirm User**.
   Crie um usuário para cada pessoa da banda que for usar.

## 3. Rodar no computador

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
cd prospeccao-shows
cp .env.example .env
```

Abra o `.env` e preencha com os dados de **Project Settings → API** do Supabase:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   (a chave "anon public")
```

Depois:

```bash
npm install
npm run dev
```

Abra http://localhost:5173 e entre com o usuário criado no passo 2.

## 4. Publicar para usar no celular (opcional)

O jeito mais simples é a **Vercel** ou a **Netlify** (grátis para esse uso):

1. Suba a pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, escolha o repositório. Framework: **Vite**.
3. Em **Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy. No celular, abra o link e use **Adicionar à tela inicial**.

Os arquivos `vercel.json` e `public/_redirects` já estão prontos para as rotas funcionarem nas duas plataformas.

## Primeiros ajustes no app

Em **Ajustes**:
- Confira a cidade-base (Nova Serrana) e os raios das prioridades A e B.
- Coloque o **nome da banda** e revise os modelos de WhatsApp e e-mail. Use `{cidade}`, `{contato}` e `{banda}`, que são trocados automaticamente.

## Como usar no dia a dia

1. **Cidades** → filtre Prioridade A → abra uma cidade.
2. **Buscar contatos** abre a pesquisa da prefeitura e da Secretaria de Cultura. Cadastre o contato.
3. Ligou ou mandou mensagem? Use **Registrar contato**, escreva o que aconteceu e marque o próximo retorno (+2, +7, +15, +30 dias).
4. O **Início** mostra todo dia quem precisa de retorno.
5. Fechou? **+ Show fechado** na ficha da cidade. O status vira "Fechado" e o show entra na agenda e nos relatórios.

## Observações

- **Distância**: estimativa (linha reta × 1,3). Confira a rota real antes de orçar o frete.
- **População**: estimativas IBGE/TCU 2025. **Regiões**: divisão regional do IBGE de 2017.
- **Aniversários e festas** começam em branco. Preencha conforme levantar; o botão "Histórico IBGE" mostra a data de emancipação.
- **Segurança**: todo usuário logado vê e edita tudo (é para uso interno). A chave anon pode ficar no front-end; o acesso é protegido por login e pelas regras (RLS) criadas no `schema.sql`.

## Estrutura

```
supabase/schema.sql   tabelas, regras de acesso e configurações padrão
supabase/seed.sql     853 municípios de MG
src/pages/            telas (Início, Cidades, Cidade, Shows, Relatórios, Ajustes, Login)
src/lib/              acesso aos dados e funções de apoio (distância, prioridade, CSV)
```
