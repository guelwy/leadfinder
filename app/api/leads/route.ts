import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { demoLeads } from '@/lib/demo';
export const dynamic = 'force-dynamic';
export async function GET() {
 const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(url && key){try{const db=createClient(url,key,{auth:{persistSession:false}});const {data,error}=await db.from('leads').select('*').order('lead_score',{ascending:false}).limit(100);if(error)throw error;return NextResponse.json({mode:'live',leads:(data??[]).map((x:any)=>({id:x.id,name:x.name,category:x.category??'Negócio local',address:x.address??'Endereço não informado',phone:x.phone,website:x.website,rating:Number(x.rating??0),reviewCount:x.review_count??0,mapsUrl:x.maps_url??'#',score:x.lead_score??0,reasons:x.score_reasons??[],outreach:x.outreach_message??'',status:x.status??'new',isDemo:false}))});}catch(e){console.error('Supabase read failed',e);return NextResponse.json({mode:'demo',warning:'Banco indisponível ou schema ainda não aplicado.',leads:demoLeads});}}
 return NextResponse.json({mode:'demo',leads:demoLeads});
}
