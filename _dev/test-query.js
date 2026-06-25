const fetch = require('node-fetch');

const SUPABASE_URL = 'https://gayfmyemgzbzqxqlfanw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheWZteWVtZ3pienF4cWxmYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDcxMDgsImV4cCI6MjA5NzY4MzEwOH0.LPfjLnEuNQ4iUoOZHf374WgOMmawGkinD-Q0m-nMDn8';

async function testQuery() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?select=id,fecha,estado,motivo,observaciones,lider_id,pasajeros(nombre,colegio,hotel,habitacion,lider_coordinador,fecha_entrega_ropa),items(foto_url_1,foto_url_2,tipo_prenda)&semana_archivada=eq.false`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
}

testQuery();
