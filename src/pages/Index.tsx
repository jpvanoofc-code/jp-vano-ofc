import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { Zap, ShieldCheck, Truck, CreditCard, ChevronRight } from 'lucide-react';

const highlights = [
  { icon: Truck, text: 'Frete grátis', sub: 'Para todo o Brasil' },
  { icon: ShieldCheck, text: 'Compra segura', sub: 'Proteção ao comprador' },
  { icon: CreditCard, text: 'Parcele em até 12x', sub: 'Sem juros' },
  { icon: Zap, text: 'Ofertas relâmpago', sub: 'Só aqui' },
];

export default function Index() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (query) {
        q = q.ilike('name', `%${query}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="pt-[104px] md:pt-[120px] bg-background min-h-screen">
      {/* Highlights strip */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {highlights.map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3 px-3 py-2 rounded-sm bg-card/50">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-body text-xs md:text-sm font-medium text-foreground">{text}</p>
                  <p className="font-body text-[10px] md:text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="container mx-auto px-4 py-4 md:py-6">
        <div className="relative rounded-sm overflow-hidden bg-gradient-to-r from-secondary to-accent h-32 md:h-48 flex items-center px-6 md:px-12">
          <div className="relative z-10">
            <p className="font-body text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Coleção exclusiva</p>
            <h2 className="font-display font-extrabold text-2xl md:text-4xl text-foreground mt-1">
              JP VANO
            </h2>
            <p className="font-body text-sm md:text-base text-muted-foreground mt-1">
              Estilo que fala por você
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-accent/50 to-transparent" />
        </div>
      </section>

      {/* Search results header */}
      {query && (
        <div className="container mx-auto px-4 pb-2">
          <p className="font-body text-sm text-muted-foreground">
            Resultados para: <span className="text-foreground font-medium">"{query}"</span>
            {products && <span className="ml-2">({products.length} {products.length === 1 ? 'produto' : 'produtos'})</span>}
          </p>
        </div>
      )}

      {/* Products */}
      <section className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="font-display font-bold text-lg md:text-2xl text-foreground">
            {query ? 'Produtos encontrados' : 'Produtos em destaque'}
          </h2>
          <button className="flex items-center gap-1 text-xs md:text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
            Ver todos <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-card rounded-sm animate-pulse">
                <div className="aspect-square bg-muted/30" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted/30 rounded w-3/4" />
                  <div className="h-5 bg-muted/30 rounded w-1/2" />
                  <div className="h-3 bg-muted/30 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image_url={product.image_url}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 md:py-20 bg-card/50 rounded-sm">
            <p className="font-body text-muted-foreground text-base md:text-lg">
              {query ? 'Nenhum produto encontrado para essa busca.' : 'Nenhum produto disponível no momento.'}
            </p>
            <p className="font-body text-muted-foreground text-xs md:text-sm mt-2">
              {query ? 'Tente buscar por outros termos.' : 'Novidades em breve!'}
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/40 mt-8">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <h4 className="font-display font-bold text-sm text-foreground mb-3">Sobre</h4>
              <ul className="space-y-2">
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Quem somos</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Termos de uso</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-foreground mb-3">Ajuda</h4>
              <ul className="space-y-2">
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Central de ajuda</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Como comprar</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Devoluções</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-foreground mb-3">Venda</h4>
              <ul className="space-y-2">
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Venda com a gente</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Fornecedores</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-foreground mb-3">Redes Sociais</h4>
              <ul className="space-y-2">
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">TikTok</a></li>
                <li><a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="font-body text-muted-foreground text-xs">
              © {new Date().getFullYear()} JP Vano. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
