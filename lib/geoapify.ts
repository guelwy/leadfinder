export type GeoapifyPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
  mapsUrl: string;
  lat: number | null;
  lon: number | null;
};

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    categories?: string[];
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    lat?: number;
    lon?: number;
    website?: string;
    phone?: string;
    contact?: { phone?: string; website?: string };
    datasource?: { raw?: Record<string, unknown> };
  };
};

const CATEGORY_RULES: Array<{ terms: string[]; categories: string[] }> = [
  { terms: ['salão', 'salao', 'cabeleireiro', 'barbearia', 'beleza', 'manicure', 'unha', 'estética', 'estetica'], categories: ['service.beauty.hairdresser', 'service.beauty'] },
  { terms: ['restaurante', 'lanchonete', 'pizzaria', 'hamburgueria'], categories: ['catering.restaurant', 'catering.fast_food'] },
  { terms: ['café', 'cafe', 'cafeteria', 'padaria', 'confeitaria'], categories: ['catering.cafe', 'commercial.food_and_drink.bakery'] },
  { terms: ['academia', 'fitness', 'musculação', 'musculacao'], categories: ['sport', 'leisure.fitness_centre'] },
  { terms: ['clínica', 'clinica', 'médico', 'medico', 'consultório', 'consultorio'], categories: ['healthcare.clinic_or_praxis', 'healthcare'] },
  { terms: ['dentista', 'odontologia'], categories: ['healthcare.dentist'] },
  { terms: ['farmácia', 'farmacia', 'drogaria'], categories: ['healthcare.pharmacy'] },
  { terms: ['pet shop', 'petshop', 'veterinária', 'veterinaria'], categories: ['commercial.pet', 'healthcare'] },
  { terms: ['oficina', 'mecânica', 'mecanica', 'auto center', 'automotivo'], categories: ['service.vehicle.repair', 'service.vehicle'] },
  { terms: ['imobiliária', 'imobiliaria', 'corretora de imóveis'], categories: ['service.estate_agent'] },
  { terms: ['loja', 'comércio', 'comercio', 'mercado'], categories: ['commercial', 'shop'] },
];

export function categoriesForQuery(query: string): string[] {
  const normalized = query.toLocaleLowerCase('pt-BR');
  const match = CATEGORY_RULES.find((rule) => rule.terms.some((term) => normalized.includes(term)));
  return match?.categories ?? ['commercial', 'service', 'office'];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function normalizePhone(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return value;
}

export async function searchGeoapifyPlaces(input: {
  apiKey: string;
  query: string;
  location: string;
  limit: number;
}): Promise<GeoapifyPlace[]> {
  const geocodeParams = new URLSearchParams({
    text: input.location,
    format: 'json',
    limit: '1',
    filter: 'countrycode:br',
  });
  const geocodeResponse = await fetch(`https://api.geoapify.com/v1/geocode/search?${geocodeParams}`, {
    headers: { 'x-api-key': input.apiKey },
    cache: 'no-store',
  });
  if (!geocodeResponse.ok) {
    throw new Error(`Geoapify Geocoding retornou HTTP ${geocodeResponse.status}.`);
  }

  const geocodePayload = await geocodeResponse.json();
  const coordinates = geocodePayload.results?.[0];
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lon !== 'number') {
    throw new Error('Não foi possível localizar essa região. Tente informar cidade e estado.');
  }

  const placesParams = new URLSearchParams({
    categories: categoriesForQuery(input.query).join(','),
    filter: `circle:${coordinates.lon},${coordinates.lat},10000`,
    limit: String(input.limit),
    lang: 'pt',
  });
  const placesResponse = await fetch(`https://api.geoapify.com/v2/places?${placesParams}`, {
    headers: { 'x-api-key': input.apiKey },
    cache: 'no-store',
  });
  if (!placesResponse.ok) {
    throw new Error(`Geoapify Places retornou HTTP ${placesResponse.status}.`);
  }

  const payload = await placesResponse.json();
  const features: GeoapifyFeature[] = Array.isArray(payload.features) ? payload.features : [];
  const unique = new Map<string, GeoapifyPlace>();

  for (const feature of features) {
    const p = feature.properties;
    if (!p) continue;
    const raw = p.datasource?.raw ?? {};
    const name = firstString(p.name, raw.name);
    if (!name) continue;
    const id = firstString(p.place_id) ?? `${name}-${p.lat ?? ''}-${p.lon ?? ''}`;
    const phone = normalizePhone(firstString(p.contact?.phone, p.phone, raw.phone));
    const website = firstString(p.contact?.website, p.website, raw.website);
    const category = p.categories?.slice(0, 2).join(', ') || 'Negócio local';
    const address = firstString(p.formatted, [p.address_line1, p.address_line2].filter(Boolean).join(', ')) || 'Endereço não informado';
    const mapsUrl = typeof p.lat === 'number' && typeof p.lon === 'number'
      ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`
      : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${name} ${address}`);

    unique.set(id, { id, name, category, address, phone, website, mapsUrl, lat: p.lat ?? null, lon: p.lon ?? null });
  }

  return [...unique.values()];
}
