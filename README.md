# LeadFinder

Aplicação de prospecção de negócios locais para identificar oportunidades de criação de sites institucionais one-page.

## Stack
- Next.js 15 + TypeScript
- Google Places API (New)
- Supabase PostgreSQL
- Vercel

## Desenvolvimento
```bash
npm install
cp .env.example .env.local
npm run dev
```

Sem credenciais, a aplicação usa empresas fictícias de demonstração, claramente identificadas. Para buscas reais, configure `GOOGLE_MAPS_API_KEY`. Para persistência, configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` e aplique `supabase/schema.sql`.

## Segurança
- `AUTO_SEND=false`; não envia mensagens nem contata empresas.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- A pontuação é heurística, não previsão de conversão.
