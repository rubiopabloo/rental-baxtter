// ============================================================
// Edge Function: enviar-notificacion
// Envia notificaciones push a los dispositivos suscritos
// de un pasajero especifico.
//
// Deployar con: supabase functions deploy enviar-notificacion
// O copiar este archivo en el dashboard de Supabase.
//
// Variables de entorno necesarias en Supabase:
//   - VAPID_PUBLIC_KEY
//   - VAPID_PRIVATE_KEY
//   - VAPID_MAILTO (ej: mailto:tu@email.com)
//   - SUPABASE_URL (ya existe por defecto)
//   - SUPABASE_SERVICE_ROLE_KEY (ya existe por defecto)
// ============================================================

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush          from 'npm:web-push';

const mailtoSecret = Deno.env.get('VAPID_MAILTO') || 'test@test.com';
const vapidSubject = mailtoSecret.startsWith('mailto:') ? mailtoSecret : `mailto:${mailtoSecret}`;

// Configurar VAPID una sola vez al iniciar la funcion
webpush.setVapidDetails(
  vapidSubject,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

serve(async (req: Request) => {
  // CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Verificar Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('No autorizado', { status: 401, headers: corsHeaders });
  }

  // Parse and validate body
  let body: { numero_pasajero?: unknown; titulo?: unknown; mensaje?: unknown; url?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response('Body invalido', { status: 400, headers: corsHeaders });
  }

  // Validar y sanitizar inputs
  const numero_pasajero = typeof body.numero_pasajero === 'number' && Number.isInteger(body.numero_pasajero)
    ? body.numero_pasajero
    : null;
  const titulo  = typeof body.titulo  === 'string' ? body.titulo.slice(0, 100).trim()  : 'Actualizacion';
  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.slice(0, 200).trim() : '';
  const url     = typeof body.url     === 'string' ? body.url.slice(0, 200)            : '/seguimiento.html';

  if (numero_pasajero === null) {
    return new Response('numero_pasajero invalido', { status: 400, headers: corsHeaders });
  }

  // Usar service_role para leer suscripciones (bypasea RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: suscripciones, error: dbError } = await supabase
    .from('suscripciones_push')
    .select('id, suscripcion')
    .eq('numero_pasajero', numero_pasajero);

  if (dbError) {
    return new Response('Error al consultar suscripciones', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!suscripciones || suscripciones.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, enviadas: 0, motivo: 'Sin suscripciones activas' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const payload = JSON.stringify({ title: titulo, body: mensaje, url });

  // Enviar a todos los dispositivos suscritos
  const suscripcionesAEliminar: string[] = [];

  const unicos = new Map(); 
  suscripciones.forEach(s => { 
    const sub = typeof s.suscripcion === 'string' ? JSON.parse(s.suscripcion) : s.suscripcion; 
    unicos.set(sub.endpoint, { id: s.id, suscripcion: sub }); 
  }); 
  
  const resultados = await Promise.allSettled(
    Array.from(unicos.values()).map(async ({ id, suscripcion }) => {
      try {
        console.log(`Intentando enviar push a sub ID: ${id}`);
        const sub = typeof suscripcion === 'string' ? JSON.parse(suscripcion) : suscripcion;
        console.log(`Endpoint: ${sub.endpoint}`);
        
        const sendResult = await webpush.sendNotification(sub, payload);
        console.log(`Exito enviando a ${id}. Status Code: ${sendResult.statusCode}`);
        return { id, ok: true };
      } catch (err: any) {
        console.error(`Error enviando push a ${id}:`, err);
        const statusCode = err?.statusCode;
        console.error(`Status code devuelto por el servicio push: ${statusCode}`);
        if (err?.body) {
            console.error(`Cuerpo del error del servicio push: ${err.body}`);
        }
        
        if (statusCode === 410 || statusCode === 404) {
          // Suscripcion expirada o invalida: marcar para eliminar
          console.log(`Suscripcion ${id} expirada (410/404), marcando para borrar.`);
          suscripcionesAEliminar.push(id);
        }
        return { id, ok: false, status: statusCode, error: err?.message };
      }
    })
  );

  // Limpiar suscripciones expiradas
  if (suscripcionesAEliminar.length > 0) {
    await supabase
      .from('suscripciones_push')
      .delete()
      .in('id', suscripcionesAEliminar);
  }

  const enviadas = resultados.filter(
    r => r.status === 'fulfilled' && (r.value as { ok: boolean }).ok
  ).length;

  return new Response(
    JSON.stringify({ ok: true, enviadas, total: suscripciones.length }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
