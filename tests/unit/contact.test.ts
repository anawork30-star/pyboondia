import { describe, it, expect, vi } from 'vitest';
import { normalize, submitContact, validateContact } from '../../src/lib/contact.js';
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from '../../src/data/services.js';
import { BUDGET_VALUES, SERVICE_VALUES } from '../../src/lib/contact.js';

const valid = {
  name: '  Laura   Gómez ',
  email: ' Laura@Ejemplo.com ',
  company: '',
  service: 'web',
  budget: '',
  message: 'Necesito una landing page para lanzar un nuevo servicio.',
  consent: true,
  website: '',
};

describe('validateContact', () => {
  it('acepta un formulario válido', () => {
    expect(validateContact(valid)).toEqual({});
  });
  it('exige campos obligatorios y consentimiento', () => {
    const errors = validateContact({ ...valid, name: ' ', email: 'no-es-correo', service: '', message: 'corto', consent: false });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'message', 'name', 'service']);
  });
  it('rechaza valores fuera de las listas permitidas', () => {
    expect(validateContact({ ...valid, service: 'otro' }).service).toBeTruthy();
    expect(validateContact({ ...valid, budget: '1-peso' }).budget).toBeTruthy();
  });
});

describe('normalize', () => {
  it('limpia espacios, pasa el correo a minúsculas y convierte opcionales vacíos en null', () => {
    expect(normalize(valid)).toMatchObject({ name: 'Laura Gómez', email: 'laura@ejemplo.com', company: null, budget: null });
  });
});

describe('opciones del formulario', () => {
  it('coinciden con los valores que acepta la base de datos', () => {
    expect(SERVICE_OPTIONS.map((o) => o.value)).toEqual(SERVICE_VALUES);
    expect(BUDGET_OPTIONS.map((o) => o.value)).toEqual(BUDGET_VALUES);
  });
});

describe('submitContact', () => {
  it('falla con mensaje claro si Supabase no está configurado', async () => {
    await expect(submitContact(null, valid)).rejects.toThrow(/no está conectado/);
  });
  it('envía por RPC y devuelve el id', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'uuid-1', error: null });
    await expect(submitContact({ rpc }, valid)).resolves.toEqual({ ok: true, id: 'uuid-1' });
    expect(rpc).toHaveBeenCalledWith('submit_contact_request', expect.objectContaining({ p_email: 'laura@ejemplo.com', p_consent: true }));
  });
  it('no reporta éxito si la base de datos devuelve error', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RATE_LIMITED' } });
    await expect(submitContact({ rpc }, valid)).rejects.toThrow(/varias solicitudes/);
  });
  it('descarta en silencio los envíos de bots (honeypot)', async () => {
    const rpc = vi.fn();
    await expect(submitContact({ rpc }, { ...valid, website: 'spam.example' })).resolves.toEqual({ ok: true });
    expect(rpc).not.toHaveBeenCalled();
  });
});
