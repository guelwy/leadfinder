# LeadFinder

Aplicação de prospecção de negócios locais para identificar oportunidades de criação de sites institucionais one-page.

## Stack
- Next.js 15 + TypeScript
- Geoapify Geocoding API + Places API
- Supabase PostgreSQL
- Vercel

## Desenvolvimento
```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `GEOAPIFY_API_KEY` para buscas reais. A chave é utilizada exclusivamente no servidor, no Route Handler, e enviada à Geoapify pelo cabeçalho `x-api-key`. A busca primeiro geocodifica a região informada e depois consulta estabelecimentos em um raio de 10 km. O MVP mapeia segmentos comuns para categorias da Geoapify; segmentos não reconhecidos usam categorias comerciais, serviços e escritórios.

Para persistência, configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` e aplique `supabase/schema.sql`. A chave `SUPABASE_SERVICE_ROLE_KEY` também deve permanecer somente no servidor.

Sem `GEOAPIFY_API_KEY`, a aplicação usa empresas fictícias de demonstração, claramente identificadas.

## Dados e limitações
- A Geoapify/OpenStreetMap não fornece notas e contagens de avaliações de forma consistente; por isso esses campos não são usados como filtros nem como critérios de pontuação.
- Telefone e site são opcionais e dependem dos dados disponíveis para cada estabelecimento.
- A pontuação é heurística e considera principalmente a presença de site e telefone; não representa previsão de conversão.
- Os resultados dependem da cobertura do OpenStreetMap na região pesquisada.

## Variáveis de ambiente
- `GEOAPIFY_API_KEY`: chave da Geoapify Places API.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço do Supabase, somente no servidor.
- `AUTO_SEND=false`: mensagens não são enviadas automaticamente.

## Segurança
- `AUTO_SEND=false`; não envia mensagens nem contata empresas.
- Nunca exponha `GEOAPIFY_API_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- Nunca versione `.env.local` ou chaves reais no GitHub.
