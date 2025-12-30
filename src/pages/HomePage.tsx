import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ShieldCheck, Database, Info,
  BrainCircuit, Sparkles, CreditCard,
  Download, Share2, Lock, CheckCircle2, FileText,
  Fingerprint, ArrowRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast, Toaster } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { lookupDni } from '@/lib/api';
import type { SourceResult } from '@shared/types';
import { cn } from '@/lib/utils';
const searchSchema = z.object({
  dni: z.string().min(7, "DNI muy corto").max(8, "DNI muy largo").regex(/^\d+$/, "Solo números"),
});
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
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
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(searchSchema)
  });
  const onSubmit = async (data: any) => {
    setLoading(true);
    setResults(null);
    try {
      const res = await lookupDni(data.dni);
      if (res.success && res.data) {
        setResults(res.data.sources);
        toast.success("Análisis completado");
      } else {
        toast.error(res.error || "No se hallaron registros");
      }
    } catch {
      toast.error("Error en el motor de búsqueda");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background bg-dots selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <ThemeToggle />
        <header className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow -z-10" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 mb-6">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Intelligence Engine v2.8 PRO</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
              DNI<span className="text-indigo-600">GPT</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg font-medium">
              Buscador forense de fuentes públicas. Acceso a datos biográficos y fiscales en tiempo real.
            </p>
          </motion.div>
        </header>
        <section className="max-w-xl mx-auto mb-20">
          <Card className="glass overflow-hidden border-none shadow-glow-indigo">
            <div className="h-1 bg-indigo-600" />
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("dni")}
                    placeholder="Número de DNI"
                    className="h-16 pl-12 text-2xl font-mono bg-white/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                  />
                  {errors.dni && <p className="mt-2 text-xs font-bold text-red-500 px-1">{errors.dni.message as string}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl transition-all"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <BrainCircuit className="w-6 h-6 mr-2" />}
                  {loading ? "ESCANEANDO..." : "BUSCAR AHORA"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="max-w-3xl mx-auto space-y-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </motion.div>
          ) : results ? (
            <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto space-y-12">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" /> FEED DE INTELIGENCIA
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Exportación Premium")} className="text-xs font-bold h-8">
                    <Download className="w-3.5 h-3.5 mr-2" /> PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Enlace copiado")} className="text-xs font-bold h-8">
                    <Share2 className="w-3.5 h-3.5 mr-2" /> LINK
                  </Button>
                </div>
              </div>
              {results.map((source, idx) => (
                <div key={idx} className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    {source.category === 'Fiscal' ? <Database className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-indigo-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {source.sourceName}
                    </span>
                    <Badge variant="outline" className="text-[9px] h-4 font-bold border-indigo-100 dark:border-indigo-900">
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
                            <div className="mt-1 text-slate-300 dark:text-slate-700 font-mono text-xs font-bold">0{i+1}</div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed selection:bg-indigo-200">
                              {item}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic px-2">
                        {source.message || 'No hay registros disponibles para este nodo.'}
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
                      <div className="bg-indigo-600 p-8 text-white">
                        <DialogTitle className="text-3xl font-black mb-2 flex items-center gap-2">
                          <Lock className="w-6 h-6" /> PREMIUM ACCESS
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-lg font-medium">
                          Desbloquea historial financiero, juicios y score crediticio.
                        </DialogDescription>
                        <div className="mt-6 flex bg-white/10 p-1 rounded-xl w-fit">
                          <TabsList className="bg-transparent">
                            <TabsTrigger value="basic" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">BÁSICO</TabsTrigger>
                            <TabsTrigger value="pro" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">PROFESIONAL</TabsTrigger>
                          </TabsList>
                        </div>
                      </div>
                      <div className="p-8">
                        <TabsContent value="basic" className="mt-0 space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-3xl font-black">$450 <span className="text-sm font-medium opacity-60">ARS</span></span>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-600">PAGO ÚNICO</Badge>
                          </div>
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resumen BCRA Situación</li>
                            <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Domicilios Históricos</li>
                          </ul>
                        </TabsContent>
                        <TabsContent value="pro" className="mt-0 space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-4xl font-black text-indigo-600">$890 <span className="text-sm font-medium opacity-60">ARS</span></span>
                              <p className="text-[10px] text-red-500 font-black mt-1 uppercase">OFERTA LIMITADA {formatTime(timeLeft)}</p>
                            </div>
                            <Badge className="bg-indigo-600 text-white font-black animate-pulse">RECOMENDADO</Badge>
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
                        <Button className="w-full h-14 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl" onClick={() => toast.error("Servidor de pagos saturado.")}>
                          <CreditCard className="w-5 h-5 mr-2" /> COMPRAR AHORA
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
            DNIGPT Intelligence Systems
          </p>
          <div className="flex justify-center gap-6 opacity-40">
            <span className="text-[9px] font-bold uppercase">Ley 25.326</span>
            <span className="text-[9px] font-bold uppercase">Encrypted</span>
            <span className="text-[9px] font-bold uppercase">Open Data</span>
          </div>
        </footer>
        <Toaster richColors position="bottom-center" />
      </div>
    </div>
  );
}