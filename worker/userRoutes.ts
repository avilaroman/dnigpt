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
            signal: AbortSignal.timeout(8000), // Prevent hanging
        });
        if (!response.ok) throw new Error('Datuar source unavailable');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.f_gotham_book.text-dark.small').each((_, el) => {
            const text = cleanText($(el).text());
            // Filter out empty results or common placeholders
            if (text && text.length > 2 && !text.toLowerCase().includes('consultar')) {
                items.push(text);
            }
        });
        return {
            sourceName: 'Registros Nacionales (Datuar)',
            items: [...new Set(items)], // De-duplicate
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
        // Targets specific structured rows while ignoring ads and nav
        $('table.table tr, .resultados-busqueda div').each((_, el) => {
            const text = cleanText($(el).text());
            // Heuristic filtering for noise
            const isNoisy = text.includes('Publicidad') || 
                           text.includes('Google') || 
                           text.includes('Cookies') || 
                           text.length < 5 ||
                           text.startsWith('Buscar') ||
                           text.includes('Privacidad');
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.post('/api/lookup', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const dni = body.dni;
            if (!dni || typeof dni !== 'string' || !/^\d+$/.test(dni)) {
                return c.json({
                    success: false,
                    error: 'Por favor, ingrese un número de DNI válido (solo dígitos).'
                } satisfies ApiResponse, 400);
            }
            // Perform lookups concurrently with a hard timeout for the entire operation
            const [datuarResult, buscaResult] = await Promise.all([
                fetchDatuar(dni),
                fetchBuscadatos(dni)
            ]);
            const sources = [datuarResult, buscaResult];
            const hasAnyData = sources.some(s => s.status === 'success');
            if (!hasAnyData) {
                return c.json({
                    success: false,
                    error: 'Búsqueda finalizada: No se encontraron registros públicos para el documento proporcionado.'
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
                error: 'Error crítico en el motor de búsqueda. Por favor intente nuevamente.'
            } satisfies ApiResponse, 500);
        }
    });
}