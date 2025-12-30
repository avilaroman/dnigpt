import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, LookupResponse } from '@shared/types';
import * as cheerio from 'cheerio';
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
            // Datuar expects form-urlencoded: dni and criterio (both usually the same)
            const formData = new URLSearchParams();
            formData.append('dni', dni);
            formData.append('criterio', dni);
            const externalResponse = await fetch('https://datuar.com/pedido.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://datuar.com/',
                },
                body: formData.toString(),
            });
            if (!externalResponse.ok) {
                return c.json({ 
                    success: false, 
                    error: 'Error al conectar con el servicio externo.' 
                } satisfies ApiResponse, 502);
            }
            const html = await externalResponse.text();
            const $ = cheerio.load(html);
            // The specific target class based on project requirements
            const results: string[] = [];
            $('.f_gotham_book.text-dark.small').each((_, el) => {
                const text = $(el).text().trim();
                if (text) {
                    results.push(text);
                }
            });
            if (results.length === 0) {
                return c.json({ 
                    success: false, 
                    error: 'No se encontraron resultados para el DNI ingresado.' 
                } satisfies ApiResponse, 404);
            }
            return c.json({ 
                success: true, 
                data: { results } 
            } satisfies ApiResponse<LookupResponse>);
        } catch (error) {
            console.error('Worker Lookup Error:', error);
            return c.json({ 
                success: false, 
                error: 'Error interno al procesar la solicitud.' 
            } satisfies ApiResponse, 500);
        }
    });
}