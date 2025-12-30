import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ShieldCheck, Database, Info,
  BrainCircuit, Sparkles, CreditCard,
  Download, Share2, Lock, CheckCircle2, FileText,
  Fingerprint, Trash2, ArrowRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast, Toaster } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { lookupDni } from '@/lib/api';
import type { SourceResult } from '@shared/types';
import { cn } from '@/lib/utils';
const searchSchema = z.object({
  dni: z.string()
    .min(7, "El DNI debe tener al menos 7 dígitos")
    .max(8, "El DNI no puede exceder 8 dígitos")
    .regex(/^\d+$/, "Ingrese solo caracteres numéricos"),
});
type SearchFormValues = z.infer<typeof searchSchema>;
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};
export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SourceResult[] | null>(null);
  const [timeLeft, setTimeLeft] = useState(599);
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema)
  });
  const onSubmit = async (data: SearchFormValues) => {
    setLoading(true);
    setResults(null);
    try {
      const res = await lookupDni(data.dni);
      if (res.success && res.data) {
        setResults(res.data.sources);
        toast.success("Análisis de fuentes públicas completado.");
      } else {
        toast.error(res.error || "No se hallaron registros en las bases consultadas.");
      }
    } catch (err) {
      toast.error("Error crítico en el motor de búsqueda. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  const handleClear = () => {
    setResults(null);
    reset();
  };
  return (
    <div className="min-h-screen bg-background bg-dots relative overflow-x-hidden selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <ThemeToggle className="fixed top-6 right-6" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <header className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow -z-10" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 mb-6">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Intelligence Engine v2.9 ULTIMATE</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
              DNI<span className="text-indigo-600">GPT</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg font-medium">
              Motor de búsqueda forense multi-fuente. Acceso instantáneo a registros biográficos, fiscales y padrones.
            </p>
          </motion.div>
        </header>
        <section className="max-w-xl mx-auto mb-20 relative z-10">
          <Card className="glass overflow-hidden border-none shadow-glow-indigo">
            <div className="h-1 bg-indigo-600" />
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("dni")}
                    placeholder="Ingrese Número de DNI"
                    className="h-16 pl-12 text-2xl font-mono bg-white/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 transition-all focus:ring-indigo-500/20"
                  />
                  {errors.dni && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-bold text-red-500 px-1 uppercase tracking-tight">
                      {errors.dni.message}
                    </motion.p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl transition-all shadow-lg active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <BrainCircuit className="w-6 h-6 mr-2" />}
                    {loading ? "ESCANEANDO FUENTES..." : "BUSCAR AHORA"}
                  </Button>
                  {results && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="w-16 h-16 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <Trash2 className="w-6 h-6 text-slate-400" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando nodos...</span>
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </motion.div>
          ) : results ? (
            <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto space-y-12">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" /> FEED DE INTELIGENCIA PÚBLICA
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Exportación Premium disponible en planes PRO")} className="text-xs font-bold h-8 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                    <Download className="w-3.5 h-3.5 mr-2" /> EXPORTAR
                  </Button>
                </div>
              </div>
              {results.map((source, idx) => (
                <div key={idx} className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    {source.category === 'Fiscal' ? <Database className="w-4 h-4 text-blue-500" /> : 
                     source.category === 'Otros' ? <ArrowRight className="w-4 h-4 text-emerald-500" /> :
                     <FileText className="w-4 h-4 text-indigo-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {source.sourceName}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] h-4 font-bold uppercase",
                      source.status === 'success' ? "border-indigo-100 dark:border-indigo-900 text-indigo-600" : "border-red-100 text-red-400"
                    )}>
                      {source.status === 'success' ? 'DATA FOUND' : 'NO DATA'}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {source.status === 'success' ? (
                      source.items.map((item, i) => (
                        <motion.div
                          key={i}
                          variants={itemVariants}
                          className="group relative bg-white/50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm feed-row"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-start gap-4">
                            <div className="mt-1 text-indigo-600/30 dark:text-indigo-400/20 font-mono text-xs font-black">
                              {source.category?.charAt(0) || 'D'}{i+1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed selection:bg-indigo-200/50">
                                {item}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic px-6 py-2 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                        {source.message || 'Sin registros detectados para este nodo.'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <motion.div variants={itemVariants} className="pt-12 text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl hover:scale-105 transition-all group">
                      <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12" />
                      REPORTE PROFESIONAL COMPLETO
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none glass">
                    <Tabs defaultValue="pro" className="w-full">
                      <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <BrainCircuit className="w-32 h-32 rotate-12" />
                        </div>
                        <DialogTitle className="text-3xl font-black mb-2 flex items-center gap-2">
                          <Lock className="w-6 h-6" /> PREMIUM ACCESS
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-lg font-medium">
                          Desbloquea historial financiero, juicios y score crediticio.
                        </DialogDescription>
                        <div className="mt-6 flex bg-white/10 p-1 rounded-xl w-fit">
                          <TabsList className="bg-transparent border-none">
                            <TabsTrigger value="basic" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">BÁSICO</TabsTrigger>
                            <TabsTrigger value="pro" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">PROFESIONAL</TabsTrigger>
                          </TabsList>
                        </div>
                      </div>
                      <div className="p-8">
                        <TabsContent value="basic" className="mt-0 space-y-6 outline-none">
                          <div className="flex justify-between items-center">
                            <span className="text-3xl font-black">$450 <span className="text-sm font-medium opacity-60 uppercase">ARS</span></span>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-600 font-black">PAGO ÚNICO</Badge>
                          </div>
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resumen BCRA Situación</li>
                            <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Domicilios Históricos</li>
                            <li className="flex items-center gap-3 text-sm font-bold opacity-40 line-through"><CheckCircle2 className="w-4 h-4" /> Score Crediticio</li>
                          </ul>
                        </TabsContent>
                        <TabsContent value="pro" className="mt-0 space-y-6 outline-none">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-4xl font-black text-indigo-600">$890 <span className="text-sm font-medium opacity-60 uppercase">ARS</span></span>
                              <p className="text-[10px] text-red-500 font-black mt-1 uppercase tracking-wider animate-pulse">OFERTA EXPIRA EN {formatTime(timeLeft)}</p>
                            </div>
                            <Badge className="bg-indigo-600 text-white font-black">RECOMENDADO</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              'Score Crediticio', 'Juicios & Quiebras',
                              'Empresas & Directorios', 'Análisis AI Veracidad',
                              'Certificado PDF', 'Soporte 24/7'
                            ].map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> {f}
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <Button 
                          className="w-full h-14 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl shadow-lg" 
                          onClick={() => toast.error("El servidor de pagos está experimentando alta demanda. Intente en unos minutos.")}
                        >
                          <CreditCard className="w-5 h-5 mr-2" /> ADQUIRIR ACCESO
                        </Button>
                      </div>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <footer className="mt-32 pb-12 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-4">
            DNIGPT Intel Systems & Compliance
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-40">
            <span className="text-[9px] font-bold uppercase hover:text-indigo-500 transition-colors cursor-help">Ley 25.326 Protección Datos</span>
            <span className="text-[9px] font-bold uppercase hover:text-indigo-500 transition-colors cursor-help">AES-256 Encrypted</span>
            <span className="text-[9px] font-bold uppercase hover:text-indigo-500 transition-colors cursor-help">Open Data Protocol</span>
          </div>
        </footer>
        <Toaster richColors position="bottom-center" />
      </div>
    </div>
  );
}