// api/subscribe.js — Vercel Serverless Function
// Integración con MailerLite API v2
// Variables de entorno requeridas:
//   MAILERLITE_API_KEY — tu API key de MailerLite
//   MAILERLITE_GROUP_ID — ID del grupo/segmento donde se agregan los suscriptores

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email } = req.body;

  // Validación básica
  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  const GROUP_ID = process.env.MAILERLITE_GROUP_ID;

  if (!API_KEY) {
    console.error('MAILERLITE_API_KEY no configurada');
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  try {
    // MailerLite API v2 — agregar suscriptor
    const body = {
      email,
      name,
      fields: {
        name,
      },
      resubscribe: true,
    };

    // Si hay GROUP_ID, suscribir directamente al grupo
    const endpoint = GROUP_ID
      ? `https://api.mailerlite.com/api/v2/groups/${GROUP_ID}/subscribers`
      : 'https://api.mailerlite.com/api/v2/subscribers';

    const mlRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': API_KEY,
      },
      body: JSON.stringify(body),
    });

    const mlData = await mlRes.json();

    if (!mlRes.ok) {
      console.error('MailerLite error:', mlData);
      return res.status(mlRes.status).json({ error: 'Error al registrar. Intentá de nuevo.' });
    }

    return res.status(200).json({ success: true, message: 'Suscriptor registrado correctamente.' });

  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
