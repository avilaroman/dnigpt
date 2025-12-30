import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, LookupResponse, SourceResult } from '@shared/types';
import * as cheerio from 'cheerio';
/**
 * Normalizes text by removing redundant whitespace, newlines, and non-printable characters.
 * Handles common scraping artifacts like double spaces, tabs, and &nbsp;
 */
function cleanText(text: string): string {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ') // non-breaking space
        // Using string constructor to avoid linting errors with control characters in literal regex
        .replace(new RegExp('[\\x00-\\x1F\\x7F-\\x9F]', 'g'), "") 
        .replace(/\s+/g, ' ')
        .replace(/[\n\r\t]/g, ' ')
        .trim();
}
/**
 * Filters out common noisy strings found in Argentine public records scrapers.
 */
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
    const sourceName = 'Registros Nacionales (Datuar)';
    try {
        const formData = new URLSearchParams();
        formData.append('dni', dni);
        formData.append('criterio', dni);
        const response = await fetch('https://datuar.com/pedido.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://datuar.com/',
            },
            body: formData.toString(),
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('Source status error');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.f_gotham_book.text-dark.small').each((_, el) => {
            const raw = $(el).text();
            const text = cleanText(raw);
            if (text && !isGarbage(text)) {
                items.push(text);
            }
        });
        const uniqueItems = [...new Set(items)].sort((a, b) => b.length - a.length);
        return {
            sourceName,
            items: uniqueItems,
            status: uniqueItems.length > 0 ? 'success' : 'error',
            message: uniqueItems.length > 0 ? undefined : 'No se localizaron registros para este DNI en la base nacional.'
        };
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'TimeoutError';
        return {
            sourceName,
            items: [],
            status: 'error',
            message: isTimeout ? 'La base nacional no respondió a tiempo (Timeout).' : 'Error de conexión con la base nacional.'
        };
    }
}
async function fetchBuscadatos(dni: string): Promise<SourceResult> {
    const sourceName = 'Informes Alternativos (Buscadatos)';
    try {
        const url = `https://www.buscadatos.com.ar/buscar.php?dni=${dni}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('Source status error');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('table.table tr, .resultados-busqueda, .resultado').each((_, el) => {
            $(el).find('td, div, span').each((__, inner) => {
                const text = cleanText($(inner).text());
                if (text && !isGarbage(text)) {
                    items.push(text);
                }
            });
        });
        const uniqueItems = [...new Set(items)].sort((a, b) => b.length - a.length).slice(0, 15);
        return {
            sourceName,
            items: uniqueItems,
            status: uniqueItems.length > 0 ? 'success' : 'error',
            message: uniqueItems.length > 0 ? undefined : 'No se hallaron coincidencias en registros alternativos.'
        };
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'TimeoutError';
        return {
            sourceName,
            items: [],
            status: 'error',
            message: isTimeout ? 'Fuente alternativa excedió tiempo de espera.' : 'Error temporal en registros alternativos.'
        };
    }
}
async function fetchCuitOnline(dni: string): Promise<SourceResult> {
    const sourceName = 'Identificación Fiscal (CUIT Online)';
    try {
        const url = `https://www.cuitonline.com/search.php?q=${dni}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('Source status error');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.persona, .denominacion, .cuit, .info-row').each((_, el) => {
            const text = cleanText($(el).text());
            if (text && !isGarbage(text)) {
                items.push(text);
            }
        });
        if (items.length < 3) {
            $('table.table-striped tr').each((_, el) => {
                const $tds = $(el).find('td');
                if ($tds.length >= 2) {
                    const key = cleanText($($tds[0]).text());
                    const val = cleanText($($tds[1]).text());
                    if (val && !isGarbage(val) && !isGarbage(key)) {
                        items.push(`${key}: ${val}`);
                    }
                }
            });
        }
        const uniqueItems = [...new Set(items)].sort((a, b) => b.length - a.length).slice(0, 12);
        return {
            sourceName,
            items: uniqueItems,
            status: uniqueItems.length > 0 ? 'success' : 'error',
            message: uniqueItems.length > 0 ? undefined : 'No se encontraron registros fiscales vinculados.'
        };
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'TimeoutError';
        return {
            sourceName,
            items: [],
            status: 'error',
            message: isTimeout ? 'Base fiscal fuera de línea (Timeout).' : 'Error en la conexión con la base fiscal.'
        };
    }
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.post('/api/lookup', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const dni = body.dni;
            if (!dni || typeof dni !== 'string' || !/^\d+$/.test(dni)) {
                return c.json({
                    success: false,
                    error: 'Por favor, ingrese un número de DNI válido para DNIGPT.'
                } satisfies ApiResponse, 400);
            }
            const results = await Promise.all([
                fetchDatuar(dni),
                fetchCuitOnline(dni),
                fetchBuscadatos(dni)
            ]);
            const hasAnyData = results.some(r => r.status === 'success');
            if (!hasAnyData) {
                return c.json({
                    success: false,
                    error: 'DNIGPT finalizó la búsqueda sin resultados públicos para este documento.'
                } satisfies ApiResponse, 404);
            }
            return c.json({
                success: true,
                data: { sources: results }
            } satisfies ApiResponse<LookupResponse>);
        } catch (error) {
            console.error('[Lookup Error]:', error);
            return c.json({
                success: false,
                error: 'DNIGPT: Error crítico en el motor de búsqueda simultánea.'
            } satisfies ApiResponse, 500);
        }
    });
}