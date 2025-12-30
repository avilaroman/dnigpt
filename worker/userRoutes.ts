import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, LookupResponse, SourceResult } from '@shared/types';
import * as cheerio from 'cheerio';
/**
 * Normalizes text by removing redundant whitespace and non-printable characters.
 * Uses a safe inverted range to avoid ESLint 'no-control-regex' errors.
 */
function cleanText(text: string): string {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Removes non-printable ASCII but keeps common extended Latin
        .replace(/\s+/g, ' ')
        .replace(/[\n\r\t]/g, ' ')
        .replace(/\.{3,}$/, '') // Remove trailing ellipsis
        .trim();
}
function isGarbage(text: string): boolean {
    const lower = text.toLowerCase();
    const noise = [
        'publicidad', 'anuncios', 'google', 'cookies', 'aceptar', 'consultar',
        'derechos reservados', 'política de privacidad', 'términos y condiciones',
        'cargando', 'buscadatos', 'datuar', 'cuit online', 'buscar...', 'ingrese'
    ];
    return noise.some(noiseItem => lower.includes(noiseItem)) || text.length < 3;
}
async function fetchDatuar(dni: string): Promise<SourceResult> {
    const sourceName = 'Registro Nacional de Personas';
    try {
        const formData = new URLSearchParams();
        formData.append('dni', dni);
        formData.append('criterio', dni);
        const response = await fetch('https://datuar.com/pedido.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                'Referer': 'https://datuar.com/',
            },
            body: formData.toString(),
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('Source error');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.f_gotham_book.text-dark.small').each((_, el) => {
            const text = cleanText($(el).text());
            if (text && !isGarbage(text)) items.push(text);
        });
        const uniqueItems = [...new Set(items)];
        return {
            sourceName,
            category: 'Personal',
            items: uniqueItems,
            status: uniqueItems.length > 0 ? 'success' : 'error',
            message: uniqueItems.length > 0 ? undefined : 'No se hallaron registros biográficos.'
        };
    } catch {
        return { sourceName, items: [], status: 'error', message: 'Falla en nodo nacional.' };
    }
}
async function fetchCuitOnline(dni: string): Promise<SourceResult> {
    const sourceName = 'Administración Federal (AFIP)';
    try {
        const url = `https://www.cuitonline.com/search.php?q=${dni}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000),
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.persona, .denominacion, .cuit, .info-row').each((_, el) => {
            const text = cleanText($(el).text());
            if (text && !isGarbage(text)) items.push(text);
        });
        const uniqueItems = [...new Set(items)];
        return {
            sourceName,
            category: 'Fiscal',
            items: uniqueItems,
            status: uniqueItems.length > 0 ? 'success' : 'error',
            message: uniqueItems.length > 0 ? undefined : 'Sin vinculación fiscal detectada.'
        };
    } catch {
        return { sourceName, items: [], status: 'error', message: 'Falla en nodo fiscal.' };
    }
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.post('/api/lookup', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const dni = body.dni;
            if (!dni || !/^\d+$/.test(dni)) {
                return c.json({ success: false, error: 'DNI inválido para DNIGPT Core.' }, 400);
            }
            const results = await Promise.all([fetchDatuar(dni), fetchCuitOnline(dni)]);
            const hasData = results.some(r => r.status === 'success');
            if (!hasData) {
                return c.json({ success: false, error: 'Búsqueda finalizada sin registros públicos.' }, 404);
            }
            return c.json({
                success: true,
                data: {
                    sources: results,
                    searchId: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    engineVersion: '2.8.5-pro'
                }
            } satisfies ApiResponse<LookupResponse>);
        } catch (error) {
            return c.json({ success: false, error: 'DNIGPT: Error crítico en motor de búsqueda.' }, 500);
        }
    });
}