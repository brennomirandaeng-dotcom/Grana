# Como hospedar o Finanças (Vercel + Supabase)

O código já está pronto pra produção. Faltam só as etapas que só você pode fazer
(login/criação de recursos nas plataformas).

## 1. Pegar a connection string do Supabase

Você já tem o projeto "Finanças" criado no Supabase. No dashboard dele:

1. Botão **Connect** (topo) → aba **ORMs** → selecione **Prisma**
2. Copie os dois valores que aparecem em `.env.local`:
   - `DATABASE_URL` (pooler, porta 6543)
   - `DIRECT_URL` (conexão direta, porta 5432)
3. Troque `[YOUR-PASSWORD]` pela senha do banco (Database → Settings → reset se não lembrar)

## 2. Configurar localmente e criar as tabelas

Cole as duas URLs no `.env` do projeto, depois:

```bash
cd financas-app
npx prisma migrate dev --name init
```

Isso cria todas as tabelas no Supabase. A partir daqui `npm run dev` funciona normalmente
contra o banco real.

## 3. Subir o código pro GitHub

```bash
git add -A
git commit -m "Preparar para produção"
```

Crie um repositório vazio no GitHub (github.com/new) e siga as instruções dele para
`git remote add origin ...` + `git push -u origin main`.

## 4. Deploy na Vercel

1. https://vercel.com → login com GitHub → **Add New** → **Project**
2. Selecione o repositório `financas-app`
3. A Vercel detecta Next.js automaticamente — não precisa mexer em build command
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → a mesma do passo 1 (pooler)
   - `DIRECT_URL` → a mesma do passo 1 (direta)
   - `AUTH_SECRET` → gere uma **nova** com `openssl rand -base64 32` (não reuse a de dev)
5. **Deploy**

A build já roda `prisma generate && next build` sozinha (configurado no `package.json`).
Em 1-2 minutos o app estará no ar em `https://financas-app-xxxx.vercel.app` (dá pra
trocar por um domínio próprio depois, em Project Settings → Domains).

## Depois do primeiro deploy

- Todo `git push` na branch principal gera um deploy novo automaticamente
- Dados de demonstração são criados sozinhos pra cada novo usuário que se cadastra
- Se quiser trocar o `AUTH_SECRET` depois, isso invalida sessões ativas (todo mundo precisa logar de novo)
