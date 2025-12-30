import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, ShieldCheck, Database, Info, 
  ChevronRight, BrainCircuit, Sparkles, CreditCard, 
  Download, Share2, Clock, CheckCircle2, Lock, FileText, X
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { lookupDni } from '@/lib/api';
import type { SourceResult } from '@shared/types';
import { cn } from '@/lib/utils';
const searchSchema = z.object({
  dni: z.string().min(7, "DNI muy corto").max(8, "DNI muy largo").regex(/^\d+$/, "Solo números"),
});
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};
export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SourceResult[] | null>(null);
  const [timeLeft, setTimeLeft] = useState(599); // 9:59
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(searchSchema)
  });
  const onSubmit = async (data: any) => {
    setLoading(true);
    setResults(null);
    try {
      const res = await lookupDni(data.dni);
      if (res.success && res.data) {
        setResults(res.data.sources);
        toast.success("Análisis completado con éxito");
      } else {
        toast.error(res.error || "No se encontraron datos públicos");
      }
    } catch {
      toast.error("Error de conexión con el motor");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background bg-dots selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <ThemeToggle />
        {/* Hero Section */}
        <header className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow -z-10" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">DNIGPT Core v2.8 PRO</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
              DNI<span className="text-indigo-600">GPT</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg font-medium leading-relaxed">
              La plataforma líder en inteligencia de datos abiertos para profesionales. Verificación instantánea con precisión militar.
            </p>
          </motion.div>
        </header>
        {/* Search Interface */}
        <section className="max-w-xl mx-auto mb-20">
          <Card className="glass overflow-hidden border-none shadow-glow-indigo">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500" />
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    {...register("dni")}
                    placeholder="Ingrese DNI (ej. 20455667)"
                    className="h-16 pl-12 text-2xl font-mono bg-white/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  {errors.dni && <p className="mt-2 text-xs font-bold text-red-500 px-1">{errors.dni.message as string}</p>}
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <BrainCircuit className="w-6 h-6 mr-2" />}
                  {loading ? "PROCESANDO..." : "INICIAR ANÁLISIS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
        {/* Results / Skeletons */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-8 w-48 rounded-lg" />
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
              ))}
            </motion.div>
          ) : results ? (
            <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" /> REPORTE DE INTELIGENCIA
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Generando PDF...")} className="rounded-full">
                    <Download className="w-4 h-4 mr-2" /> Exportar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Enlace copiado")} className="rounded-full">
                    <Share2 className="w-4 h-4 mr-2" /> Compartir
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {results.map((source, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card className="glass border-none h-full hover:shadow-glow-blue transition-all">
                      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4">
                        <div className="flex items-center gap-3">
                          {source.category === 'Fiscal' ? <Database className="w-5 h-5 text-blue-500" /> : <ShieldCheck className="w-5 h-5 text-indigo-500" />}
                          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {source.sourceName}
                          </CardTitle>
                        </div>
                        <Badge variant={source.status === 'success' ? 'default' : 'secondary'} className="text-[10px] font-bold">
                          {source.status === 'success' ? 'VIGENTE' : 'VACÍO'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {source.status === 'success' ? (
                          <Accordion type="single" collapsible className="w-full">
                            {source.items.map((item, i) => (
                              <AccordionItem key={i} value={`item-${i}`} className="border-slate-100 dark:border-slate-800">
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-indigo-600 transition-colors py-3">
                                  Registro #{i + 1}
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl">
                                  {item}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <div className="py-12 text-center">
                            <Info className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{source.message}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              {/* Premium Upsell */}
              <motion.div variants={itemVariants} className="pt-12 flex flex-col items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-20 px-12 rounded-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black text-xl shadow-2xl hover:scale-105 transition-all group">
                      <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                      GENERAR REPORTE PRO FULL
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none glass">
                    <Tabs defaultValue="pro" className="w-full">
                      <div className="bg-indigo-600 p-8 text-white">
                        <DialogTitle className="text-3xl font-black mb-2 flex items-center gap-2">
                          <Lock className="w-6 h-6" /> DNIGPT PREMIUM
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-lg font-medium">
                          Desbloquea el perfil financiero completo y antecedentes judiciales.
                        </DialogDescription>
                        <TabsList className="mt-6 bg-white/10 p-1 rounded-xl">
                          <TabsTrigger value="basic" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">BÁSICO</TabsTrigger>
                          <TabsTrigger value="pro" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">PROFESIONAL</TabsTrigger>
                        </TabsList>
                      </div>
                      <div className="p-8">
                        <TabsContent value="basic" className="mt-0 space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-3xl font-black">$450 <span className="text-sm font-medium opacity-60">ARS</span></span>
                            <Badge variant="outline" className="border-indigo-200 text-indigo-600">PAGO ÚNICO</Badge>
                          </div>
                          <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resumen BCRA Situación 1-2</li>
                            <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Domicilios Históricos</li>
                          </ul>
                        </TabsContent>
                        <TabsContent value="pro" className="mt-0 space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-4xl font-black text-indigo-600">$890 <span className="text-sm font-medium opacity-60">ARS</span></span>
                              <p className="text-[10px] text-red-500 font-black mt-1 uppercase">OFERTA FINALIZA EN {formatTime(timeLeft)}</p>
                            </div>
                            <Badge className="bg-indigo-600 text-white font-black animate-pulse">RECOMENDADO</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              'Score Crediticio Real', 'Juicios & Quiebras', 
                              'Empresas & Directorios', 'Análisis AI Veracidad',
                              'Certificado PDF Firmado', 'Soporte Prioritario'
                            ].map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> {f}
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <Button className="w-full h-14 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl" onClick={() => toast.error("Servidor de pagos saturado. Reintente en instantes.")}>
                          <CreditCard className="w-5 h-5 mr-2" /> ADQUIRIR ACCESO INSTANTÁNEO
                        </Button>
                        <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Pago procesado bajo encriptación RSA 4096-bit</p>
                      </div>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <footer className="mt-32 pb-12 border-t border-slate-200 dark:border-slate-800 pt-12 text-center">
          <div className="flex justify-center mb-8">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-[0.3em] text-[9px]">
              DNIGPT PRO CERTIFIED
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left max-w-4xl mx-auto">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400">Legal</h4>
              <p className="text-xs font-medium text-slate-500 hover:text-indigo-500 cursor-pointer">Ley 25.326</p>
              <p className="text-xs font-medium text-slate-500 hover:text-indigo-500 cursor-pointer">Privacidad</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400">Soporte</h4>
              <p className="text-xs font-medium text-slate-500 hover:text-indigo-500 cursor-pointer">Centro de Ayuda</p>
              <p className="text-xs font-medium text-slate-500 hover:text-indigo-500 cursor-pointer">API Docs</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            © {new Date().getFullYear()} DNIGPT Intelligence Systems. All rights reserved.
          </p>
        </footer>
        <Toaster richColors position="bottom-center" />
      </div>
    </div>
  );
}