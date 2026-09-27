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

## Banco de dados

O banco já está criado no Supabase, no projeto **shows-mg** (região São Paulo), com as tabelas e as 853 cidades.
Os arquivos `supabase/schema.sql` e `supabase/seed.sql` servem para recriar o banco em outro projeto, se precisar.
A URL e a chave pública do projeto já estão em `src/supabase.ts`, então não é preciso configurar variáveis de ambiente.

**Sem login:** o app é de uso pessoal e não pede senha. Quem tiver o link consegue ver e editar os dados, então não compartilhe o endereço.
Para passar a exigir login no futuro, troque `anon, authenticated` por `authenticated` nas regras do `schema.sql` e reative a tela de login.

## Publicar na Vercel

1. Na Vercel: **Add New → Project** e importe o repositório `shows-mg` do GitHub.
2. Framework: **Vite** (detectado automaticamente). Não precisa de variáveis de ambiente.
3. Clique em **Deploy**. No celular, abra o link e use **Adicionar à tela inicial**.

Cada `git push` para a branch `main` publica uma nova versão automaticamente.

## Rodar no computador (opcional)

```bash
npm install
npm run dev
```

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
- **Backup**: o plano grátis do Supabase não guarda backups. De vez em quando, use os botões Exportar (cidades, shows e interações).

## Estrutura

```
supabase/schema.sql   tabelas, regras de acesso e configurações padrão
supabase/seed.sql     853 municípios de MG
src/pages/            telas (Início, Cidades, Cidade, Shows, Relatórios, Ajustes)
src/lib/              acesso aos dados e funções de apoio (distância, prioridade, CSV)
```
