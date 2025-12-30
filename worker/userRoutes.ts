import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, LookupResponse, SourceResult } from '@shared/types';
import * as cheerio from 'cheerio';
/**
 * Normalizes text by removing redundant whitespace, newlines, and non-printable characters.
 */
function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\n\r\t]/g, ' ')
        .trim();
}
async function fetchDatuar(dni: string): Promise<SourceResult> {
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
        if (!response.ok) throw new Error('Datuar source unavailable');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.f_gotham_book.text-dark.small').each((_, el) => {
            const text = cleanText($(el).text());
            if (text && text.length > 2 && !text.toLowerCase().includes('consultar')) {
                items.push(text);
            }
        });
        return {
            sourceName: 'Registros Nacionales (Datuar)',
            items: [...new Set(items)],
            status: items.length > 0 ? 'success' : 'error',
            message: items.length > 0 ? undefined : 'No se localizaron registros para este DNI en la base nacional.'
        };
    } catch (error) {
        console.error('[Datuar Error]:', error);
        return {
            sourceName: 'Registros Nacionales (Datuar)',
            items: [],
            status: 'error',
            message: 'Error temporal en la conexión con la base nacional.'
        };
    }
}
async function fetchBuscadatos(dni: string): Promise<SourceResult> {
    try {
        const url = `https://www.buscadatos.com.ar/buscar.php?dni=${dni}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('Buscadatos source unavailable');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('table.table tr, .resultados-busqueda div').each((_, el) => {
            const text = cleanText($(el).text());
            const isNoisy = text.includes('Publicidad') || text.includes('Google') || text.includes('Cookies') || text.length < 5;
            if (text && !isNoisy) {
                items.push(text);
            }
        });
        return {
            sourceName: 'Informes Alternativos (Buscadatos)',
            items: [...new Set(items)].slice(0, 12),
            status: items.length > 0 ? 'success' : 'error',
            message: items.length > 0 ? undefined : 'No se hallaron coincidencias en registros alternativos.'
        };
    } catch (error) {
        console.error('[Buscadatos Error]:', error);
        return {
            sourceName: 'Informes Alternativos (Buscadatos)',
            items: [],
            status: 'error',
            message: 'La fuente externa no respondió a tiempo.'
        };
    }
}
async function fetchCuitOnline(dni: string): Promise<SourceResult> {
    try {
        const url = `https://www.cuitonline.com/search.php?q=${dni}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('CuitOnline source unavailable');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.result, .persona, .denominacion, .cuit').each((_, el) => {
            const text = cleanText($(el).text());
            if (text && text.length > 5 && !text.includes('Cookies')) {
                items.push(text);
            }
        });
        // Fallback for structured tables often found on CUIT Online
        if (items.length === 0) {
            $('table tr').each((_, el) => {
                const text = cleanText($(el).text());
                if (text && text.length > 5) items.push(text);
            });
        }
        return {
            sourceName: 'Identificación Fiscal (CUIT Online)',
            items: [...new Set(items)].slice(0, 10),
            status: items.length > 0 ? 'success' : 'error',
            message: items.length > 0 ? undefined : 'No se encontraron registros fiscales vinculados.'
        };
    } catch (error) {
        console.error('[CuitOnline Error]:', error);
        return {
            sourceName: 'Identificación Fiscal (CUIT Online)',
            items: [],
            status: 'error',
            message: 'Error en la conexión con la base fiscal.'
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
                    error: 'Por favor, ingrese un número de DNI válido.'
                } satisfies ApiResponse, 400);
            }
            const [datuarResult, buscaResult, cuitResult] = await Promise.all([
                fetchDatuar(dni),
                fetchBuscadatos(dni),
                fetchCuitOnline(dni)
            ]);
            const sources = [datuarResult, cuitResult, buscaResult];
            const hasAnyData = sources.some(s => s.status === 'success');
            if (!hasAnyData) {
                return c.json({
                    success: false,
                    error: 'Búsqueda finalizada sin resultados públicos encontrados.'
                } satisfies ApiResponse, 404);
            }
            return c.json({
                success: true,
                data: { sources }
            } satisfies ApiResponse<LookupResponse>);
        } catch (error) {
            console.error('[Global Lookup Error]:', error);
            return c.json({
                success: false,
                error: 'Error crítico en el motor de búsqueda.'
            } satisfies ApiResponse, 500);
        }
    });
}