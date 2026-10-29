import { describe, it, expect } from 'vitest';
import { localReply } from '../../src/lib/chatLocal.js';
import { buildKnowledge } from '../../src/data/knowledge.js';
import { KNOWLEDGE } from '../../supabase/functions/chat/knowledge.js';

describe('respaldo local del asistente', () => {
  it('responde por servicio', () => {
    expect(localReply('¿Qué es el contenido UGC?')).toMatch(/creadores/i);
    expect(localReply('¿cómo usan los datos?')).toMatch(/Validamos los datos|validamos/i);
    expect(localReply('quiero un chatbot para whatsapp')).toMatch(/Chatbots e inteligencia artificial/);
  });
  it('aclara que el branding es con aliados y no inventa precios', () => {
    expect(localReply('¿hacen logos?')).toMatch(/aliados/);
    expect(localReply('¿cuánto cuesta una página web?')).toMatch(/No manejamos precios fijos/);
  });
  it('genera ideas creativas con el tema del usuario', () => {
    const reply = localReply('dame ideas para mi panadería');
    expect(reply).toMatch(/panadería/);
    expect(reply.split('\n- ').length).toBeGreaterThanOrEqual(4);
  });
});

describe('base de conocimiento', () => {
  const k = buildKnowledge({ name: 'AIDU', tagline: 't', siteUrl: 'https://x.co' });
  it('incluye estrategia, UGC, branding como adicional y el aviso de conceptos', () => {
    expect(k).toMatch(/Estrategia digital basada en datos/);
    expect(k).toMatch(/creadores UGC/);
    expect(k).toMatch(/aliados especializados/);
    expect(k).toMatch(/CONCEPTOS DEMOSTRATIVOS/);
  });
  it('no inventa canales de contacto si no están configurados', () => {
    expect(k).not.toMatch(/Correo:|WhatsApp:/);
  });
  it('la copia de la Edge Function está generada y al día con el sitio', () => {
    expect(KNOWLEDGE).toMatch(/Conexión con creadores UGC/);
  });
});
