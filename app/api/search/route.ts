import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { demoLeads } from '@/lib/demo';
import { searchGeoapifyPlaces } from '@/lib/geoapify';

export const dynamic = 'force-dynamic';

function scoreLead(website: string | null, phone: string | null) {
  let score = 40;
  const reasons: string[] = [];
  if (!website) {
    score += 40;
    reasons.push('Sem site informado');
  } else {
    reasons.push('Site informado');
  }
  if (!phone) {
    score += 20;
    reasons.push('Telefone não disponível na base');
  } else {
    reasons.push('Telefone disponível');
  }
  return { score: Math.min(100, score), reasons };
}

function outreach(name: string, category: string) {
  return `Olá! Encontrei ${name} e pensei que um site profissional poderia apresentar melhor seus serviços, informações e formas de contato. Posso compartilhar uma ideia de página para o negócio?`.slice(0, 350);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = String(body.query ?? '').trim();
    const location = String(body.location ?? 'São Paulo, SP').trim();
    const limit = Math.min(30, Math.max(1, Number(body.limit ?? 30)));

    if (!query) {
      return NextResponse.json({ error: 'Informe um segmento para pesquisar.' }, { status: 400 });
    }
    if (!location) {
      return NextResponse.json({ error: 'Informe uma região para pesquisar.' }, { status: 400 });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      const filtered = demoLeads
        .filter((lead) => lead.category.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))
          || query.toLocaleLowerCase('pt-BR').includes('negócio')
          || query.toLocaleLowerCase('pt-BR').includes('empresa'))
        .slice(0, limit);
      return NextResponse.json({
        mode: 'demo',
        warning: 'GEOAPIFY_API_KEY não configurada. Exibindo dados fictícios para demonstração.',
        leads: filtered.length ? filtered : demoLeads.slice(0, Math.min(limit, 5)),
      });
    }

    const places = await searchGeoapifyPlaces({ apiKey, query, location, limit });
    const leads = places.map((place) => {
      const { score, reasons } = scoreLead(place.website, place.phone);
      return {
        id: place.id,
        name: place.name,
        category: place.category,
        address: place.address,
        phone: place.phone,
        website: place.website,
        rating: 0,
        reviewCount: 0,
        mapsUrl: place.mapsUrl,
        score,
        reasons,
        outreach: outreach(place.name, place.category),
        status: 'new',
        isDemo: false,
      };
    }).sort((a, b) => b.score - a.score);

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key && leads.length) {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const rows = leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        category: lead.category,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        rating: null,
        review_count: 0,
        maps_url: lead.mapsUrl,
        lead_score: lead.score,
        score_reasons: lead.reasons,
        outreach_message: lead.outreach,
        status: 'new',
        source: 'geoapify',
        is_demo: false,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await db.from('leads').upsert(rows, { onConflict: 'id' });
      if (error) console.error('Supabase upsert failed', error.message);
    }

    return NextResponse.json({ mode: 'live', leads, provider: 'geoapify' });
  } catch (error) {
    console.error('Geoapify search failed', error);
    const message = error instanceof Error ? error.message : 'Não foi possível concluir a busca.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
