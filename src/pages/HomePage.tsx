import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Database, ShieldCheck, Info, FileText, CheckCircle2, Sparkles, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast, Toaster } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { lookupDni } from '@/lib/api';
import type { SourceResult } from '@shared/types';
const searchSchema = z.object({
  dni: z.string().min(6, "El DNI debe tener al menos 6 dígitos").max(10, "DNI demasiado largo").regex(/^\d+$/, "Solo se permiten números"),
});
type SearchValues = z.infer<typeof searchSchema>;
export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceResult[] | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { dni: '' },
  });
  const { ref, ...rest } = register('dni');
  const onSubmit = async (values: SearchValues) => {
    setLoading(true);
    setSources(null);
    try {
      const response = await lookupDni(values.dni);
      if (response.success && response.data) {
        setSources(response.data.sources);
        toast.success('Búsqueda multicanal completada');
      } else {
        toast.error(response.error || 'No se pudieron obtener datos');
      }
    } catch (err) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 min-h-screen flex flex-col items-center relative">
        <div className="fixed inset-0 bg-gradient-mesh opacity-10 pointer-events-none -z-10" />
        <ThemeToggle />
        <div className="w-full flex flex-col items-center justify-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-blue-600 shadow-glow animate-float">
                <Database className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Argent<span className="text-blue-600">Search</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-lg">
              Plataforma avanzada de consulta de registros públicos. <br className="hidden md:block" />
              Integración de múltiples fuentes en tiempo real.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="border-none shadow-soft glass dark:glass-dark">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...rest}
                        ref={(e) => {
                          ref(e);
                          inputRef.current = e;
                        }}
                        autoFocus
                        placeholder="Ingrese DNI..."
                        className="pl-10 h-12 text-lg font-mono bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-blue-500"
                      />
                    </div>
                    {errors.dni && (
                      <p className="text-sm text-destructive font-medium px-1">
                        {errors.dni.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-primary hover:shadow-glow overflow-hidden"
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Buscando...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" /> 
                          <span>Buscar en Fuentes</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
          <AnimatePresence mode="wait">
            {sources && (
              <motion.div
                key="results-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {sources.map((source, sIdx) => (
                    <Card key={sIdx} className="border-none shadow-soft glass dark:glass-dark overflow-hidden flex flex-col h-full min-h-[300px]">
                      <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className={`w-5 h-5 ${source.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">{source.sourceName}</CardTitle>
                          </div>
                          <Badge variant={source.status === 'success' ? 'secondary' : 'outline'} className="text-[10px]">
                            {source.status === 'success' ? 'ACTIVO' : 'SIN DATOS'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-0 overflow-y-auto max-h-[400px]">
                        {source.status === 'success' ? (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {source.items.map((item, iIdx) => (
                              <div key={iIdx} className="px-4 py-3 flex items-start gap-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 break-words leading-relaxed">{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center space-y-3">
                            <Info className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="text-sm text-slate-500 font-medium">{source.message}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center pt-8"
                >
                  <Dialog open={showPremium} onOpenChange={setShowPremium}>
                    <DialogTrigger asChild>
                      <Button className="h-14 px-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-glow-lg hover:scale-105 transition-all group">
                        <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                        DESBLOQUEAR INFORME PREMIUM
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border-none glass dark:glass-dark shadow-2xl">
                      <DialogHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Reporte de Persona Completo</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                          Acceso total a la información consolidada y verificada de fuentes privadas y gubernamentales.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                          <ul className="space-y-4">
                            {[
                              'Historial Crediticio & Deudas (BCRA)',
                              'Perfiles de Redes Sociales vinculados',
                              'Propiedades & Vehículos registrados',
                              'Vínculos Familiares detectados',
                              'Información de contacto actualizada'
                            ].map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center justify-between px-2">
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Inversión Única</span>
                            <span className="text-3xl font-black text-blue-600">$500 <span className="text-sm font-normal text-slate-500">ARS</span></span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none px-3 py-1">
                            LISTO EN 30s
                          </Badge>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg" onClick={() => toast.info('Pasarela de pago no disponible en esta demo')}>
                          <CreditCard className="w-5 h-5 mr-2" /> Pagar & Descargar PDF
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <p className="mt-4 text-xs text-slate-400 font-medium">Información protegida bajo leyes de acceso a datos públicos (Ley 25.326).</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <footer className="w-full mt-auto py-8 text-center border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
              © {new Date().getFullYear()} ArgentSearch Professional • Inteligencia de Datos
            </p>
            <div className="flex gap-4 text-2xs text-slate-400 uppercase tracking-widest font-bold">
              <span className="cursor-pointer hover:text-blue-500 transition-colors">Privacidad</span>
              <span className="text-slate-200 dark:text-slate-800">•</span>
              <span className="cursor-pointer hover:text-blue-500 transition-colors">Términos</span>
              <span className="text-slate-200 dark:text-slate-800">•</span>
              <span className="cursor-pointer hover:text-blue-500 transition-colors">API Access</span>
            </div>
          </div>
        </footer>
        <Toaster richColors position="bottom-center" />
      </div>
    </div>
  );
}