import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Database, ShieldCheck, Info, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast, Toaster } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { lookupDni } from '@/lib/api';
const searchSchema = z.object({
  dni: z.string().min(6, "El DNI debe tener al menos 6 dígitos").max(10, "DNI demasiado largo").regex(/^\d+$/, "Solo se permiten números"),
});
type SearchValues = z.infer<typeof searchSchema>;
export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { dni: '' },
  });
  const onSubmit = async (values: SearchValues) => {
    setLoading(true);
    setResults(null);
    try {
      const response = await lookupDni(values.dni);
      if (response.success && response.data) {
        setResults(response.data.results);
        toast.success('Búsqueda completada');
      } else {
        toast.error(response.error || 'No se pudieron obtener datos');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-[#0f172a] text-foreground transition-colors duration-300 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />
      <ThemeToggle />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-12">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-blue-600 shadow-glow animate-float">
                <Database className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Argent<span className="text-blue-600">Search</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-lg">
              Consulta rápida y minimalista de registros públicos de DNI.
            </p>
          </motion.div>
          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-md"
          >
            <Card className="border-none shadow-soft glass dark:glass-dark">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...register('dni')}
                        placeholder="Número de DNI (ej. 31765650)"
                        className="pl-10 h-12 text-lg font-mono bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
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
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-primary hover:shadow-glow"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Buscar Ahora'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
          {/* Results Section */}
          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg"
              >
                <Card className="border-none shadow-soft glass dark:glass-dark overflow-hidden">
                  <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800 py-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-lg">Resultados Encontrados</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {results.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="px-6 py-4 flex items-start gap-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                        >
                          <div className="mt-1">
                            {idx === 0 ? (
                              <User className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Info className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-200 dark:border-slate-800 relative z-10">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} ArgentSearch • Herramienta de consulta pública
        </p>
      </footer>
      <Toaster richColors position="bottom-center" />
    </div>
  );
}