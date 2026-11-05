import { describe, it, expect } from 'vitest';
import { PORTAL_PATH, safeNext, usernameToEmail } from '../../src/lib/auth.js';

describe('usuario a correo de acceso', () => {
  it('convierte el nombre de usuario al correo interno', () => {
    expect(usernameToEmail('ana.diaz')).toBe('ana.diaz@aiduoficial.com');
    expect(usernameToEmail('  Yilber.Cupitra ')).toBe('yilber.cupitra@aiduoficial.com');
    expect(usernameToEmail('paulina.hoyos')).toBe('paulina.hoyos@aiduoficial.com');
  });
  it('acepta un correo completo y rechaza usuarios inválidos', () => {
    expect(usernameToEmail('alguien@aiduoficial.com')).toBe('alguien@aiduoficial.com');
    expect(usernameToEmail('')).toBeNull();
    expect(usernameToEmail('a b')).toBeNull();
    expect(usernameToEmail('<script>')).toBeNull();
  });
});

describe('redirección después del login', () => {
  it('solo permite rutas internas', () => {
    expect(safeNext('/planes-comerciales/')).toBe('/planes-comerciales/');
    expect(safeNext('https://sitio-malicioso.com')).toBe(PORTAL_PATH);
    expect(safeNext('//sitio-malicioso.com')).toBe(PORTAL_PATH);
    expect(safeNext(null)).toBe(PORTAL_PATH);
  });
});
