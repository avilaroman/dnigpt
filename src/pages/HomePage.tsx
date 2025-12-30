import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Loader2, Database, ShieldCheck, Info, FileText, 
  CheckCircle2, Sparkles, CreditCard, FileCheck, X, 
  AlertCircle, ChevronRight, Activity
} from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { lookupDni } from '@/lib/api';
import type { SourceResult } from '@shared/types';
import { cn } from '@/lib/utils';
const searchSchema = z.object({
  dni: z.string()
    .min(6, "Mínimo 6 dígitos")
    .max(10, "Máximo 10 dígitos")
    .regex(/^\d+$/, "Solo números permitidos"),
});
type SearchValues = z.infer<typeof searchSchema>;
const getSourceIcon = (name: string) => {
  if (name.includes('Fiscal')) return <FileCheck className="w-5 h-5 text-indigo-500" />;
  if (name.includes('Nacionales')) return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
  return <Database className="w-5 h-5 text-amber-500" />;
};
export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceResult[] | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { dni: '' },
  });
  const dniValue = watch('dni');
  const { ref, ...rest } = register('dni');
  const onSubmit = async (values: SearchValues) => {
    setLoading(true);
    setSources(null);
    try {
      const response = await lookupDni(values.dni);
      if (response.success && response.data) {
        setSources(response.data.sources);
        toast.success('Búsqueda completada exitosamente');
      } else {
        toast.error(response.error || 'No se hallaron registros');
      }
    } catch (err) {
      toast.error('Error de red o servidor no disponible');
    } finally {
      setLoading(false);
    }
  };
  const clearSearch = () => {
    reset();
    setSources(null);
    inputRef.current?.focus();
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 min-h-screen flex flex-col items-center relative">
        <div className="fixed inset-0 bg-gradient-mesh opacity-5 pointer-events-none -z-10" />
        <ThemeToggle />
        <div className="w-full flex flex-col items-center justify-center space-y-12">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-blue-600 shadow-glow animate-float">
                <Activity className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-slate-900 dark:text-white">
              Argent<span className="text-blue-600">Search</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
              Motor de inteligencia para el rastreo de registros públicos argentinos. 
              Seguro, anónimo y profesional.
            </p>
          </motion.div>
          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="border-none shadow-soft glass dark:glass-dark relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Búsqueda de DNI">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        {...rest}
                        ref={(e) => {
                          ref(e);
                          inputRef.current = e;
                        }}
                        autoFocus
                        placeholder="Número de DNI..."
                        className="pl-11 pr-10 h-14 text-xl font-mono bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:ring-blue-500 transition-all rounded-xl"
                        aria-invalid={errors.dni ? "true" : "false"}
                      />
                      {dniValue && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                    {errors.dni && (
                      <p className="text-sm text-destructive font-semibold px-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.dni.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all shadow-primary hover:shadow-glow-lg active:scale-95"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Rastreando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        <span>Consultar Registros</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
          {/* Results Area */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="skeleton"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="w-full grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-[350px] w-full rounded-xl" />
                  </div>
                ))}
              </motion.div>
            ) : sources ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {sources.map((source, sIdx) => (
                    <Card key={sIdx} className="border-none shadow-soft glass dark:glass-dark overflow-hidden flex flex-col h-full min-h-[400px] hover:shadow-glow transition-shadow duration-300">
                      <CardHeader className="bg-slate-100/30 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {getSourceIcon(source.sourceName)}
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest truncate text-slate-600 dark:text-slate-300">
                              {source.sourceName}
                            </CardTitle>
                          </div>
                          <Badge 
                            variant={source.status === 'success' ? 'secondary' : 'outline'} 
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 border-none",
                              source.status === 'success' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {source.status === 'success' ? 'DISPONIBLE' : 'SIN DATOS'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-0 overflow-y-auto custom-scrollbar">
                        {source.status === 'success' ? (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {source.items.map((item, iIdx) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: iIdx * 0.05 }}
                                key={iIdx} 
                                className="px-5 py-4 flex items-start gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-default"
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-blue-400 mt-1 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed break-words w-full">
                                  {item}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center flex flex-col items-center justify-center h-full space-y-4">
                            <div className={cn(
                              "p-4 rounded-full",
                              source.message?.includes('Timeout') ? "bg-amber-100 dark:bg-amber-900/20" : "bg-slate-100 dark:bg-slate-800"
                            )}>
                              {source.message?.includes('Timeout') ? 
                                <Activity className="w-8 h-8 text-amber-500" /> : 
                                <Info className="w-8 h-8 text-slate-400" />
                              }
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold px-6">
                              {source.message}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Premium CTA */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center pt-10"
                >
                  <Dialog open={showPremium} onOpenChange={setShowPremium}>
                    <DialogTrigger asChild>
                      <Button className="h-16 px-14 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white font-black text-lg shadow-glow-lg hover:scale-105 transition-all group border-none">
                        <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                        SOLICITAR INFORME PREMIUM
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border-none glass dark:glass-dark shadow-2xl p-0 overflow-hidden">
                      <div className="bg-indigo-600 p-8 text-white text-center">
                        <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Análisis Completo</DialogTitle>
                        <DialogDescription className="text-indigo-100 mt-2">
                          Consolide toda la información financiera y social en un único PDF profesional.
                        </DialogDescription>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="space-y-4">
                          {[
                            'Historial Crediticio BCRA (Situación 1-5)',
                            'Cheques rechazados & Juicios',
                            'Nexo con Sociedades Comerciales',
                            'Vínculos de Telemarketing & Contacto',
                            'Validez legal para procesos judiciales'
                          ].map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                              <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Inversión por reporte</span>
                            <div className="text-4xl font-black text-slate-900 dark:text-white">$750 <span className="text-sm font-medium text-slate-500">ARS</span></div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">ENTREGA INMEDIATA</Badge>
                        </div>
                        <DialogFooter className="flex-col sm:flex-col gap-3">
                          <Button 
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl"
                            onClick={() => toast.info('Pasarela de pagos en mantenimiento')}
                          >
                            <CreditCard className="w-5 h-5 mr-3" /> Pagar ahora
                          </Button>
                          <p className="text-[10px] text-center text-slate-400 font-medium">
                            Encriptación SSL de 256 bits • Transacción segura
                          </p>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Compilado bajo Ley de Protección de Datos Personales 25.326
                  </p>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {/* Footer */}
        <footer className="w-full mt-auto pt-20 pb-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-4" />
            <p className="text-sm text-slate-400 font-bold tracking-tight">
              © {new Date().getFullYear()} ARGENTSEARCH PRO • VERSIÓN 2.5.0
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
              <span className="hover:text-blue-500 cursor-pointer transition-colors">Términos</span>
              <span className="hover:text-blue-500 cursor-pointer transition-colors">Privacidad</span>
              <span className="hover:text-blue-500 cursor-pointer transition-colors">API</span>
              <span className="hover:text-blue-500 cursor-pointer transition-colors">Soporte</span>
            </div>
          </div>
        </footer>
        <Toaster richColors position="bottom-center" />
      </div>
    </div>
  );
}