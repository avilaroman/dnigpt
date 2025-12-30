import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, LookupResponse, SourceResult } from '@shared/types';
import * as cheerio from 'cheerio';
async function fetchDatuar(dni: string): Promise<SourceResult> {
    try {
        const formData = new URLSearchParams();
        formData.append('dni', dni);
        formData.append('criterio', dni);
        const response = await fetch('https://datuar.com/pedido.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://datuar.com/',
            },
            body: formData.toString(),
        });
        if (!response.ok) throw new Error('Failed to fetch from Datuar');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        $('.f_gotham_book.text-dark.small').each((_, el) => {
            const text = $(el).text().trim();
            if (text) items.push(text);
        });
        return {
            sourceName: 'Datuar Records',
            items,
            status: items.length > 0 ? 'success' : 'error',
            message: items.length > 0 ? undefined : 'No se encontraron datos en esta fuente.'
        };
    } catch (error) {
        return {
            sourceName: 'Datuar Records',
            items: [],
            status: 'error',
            message: 'Error de conexión con la fuente.'
        };
    }
}
async function fetchBuscadatos(dni: string): Promise<SourceResult> {
    try {
        // Buscadatos usually takes DNI as a path or query
        const url = `https://www.buscadatos.com.ar/buscar.php?dni=${dni}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch from Buscadatos');
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: string[] = [];
        // Targets common table/list structures in buscadatos
        $('table.table tr, .resultados-busqueda div').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text && text.length > 3 && !text.includes('Publicidad')) {
                items.push(text);
            }
        });
        return {
            sourceName: 'Buscadatos AR',
            items: items.slice(0, 10), // Limit results
            status: items.length > 0 ? 'success' : 'error',
            message: items.length > 0 ? undefined : 'No se encontraron registros adicionales.'
        };
    } catch (error) {
        return {
            sourceName: 'Buscadatos AR',
            items: [],
            status: 'error',
            message: 'Fuente temporalmente no disponible.'
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
                    error: 'Un número de DNI válido es requerido.'
                } satisfies ApiResponse, 400);
            }
            // Perform lookups concurrently
            const [datuarResult, buscaResult] = await Promise.all([
                fetchDatuar(dni),
                fetchBuscadatos(dni)
            ]);
            const sources = [datuarResult, buscaResult];
            const hasAnyData = sources.some(s => s.status === 'success');
            if (!hasAnyData) {
                return c.json({
                    success: false,
                    error: 'No se encontraron resultados en ninguna de nuestras fuentes públicas.'
                } satisfies ApiResponse, 404);
            }
            return c.json({
                success: true,
                data: { sources }
            } satisfies ApiResponse<LookupResponse>);
        } catch (error) {
            console.error('Worker Lookup Error:', error);
            return c.json({
                success: false,
                error: 'Error interno al procesar la solicitud multicanal.'
            } satisfies ApiResponse, 500);
        }
    });
}