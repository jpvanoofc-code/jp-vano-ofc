import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { Settings, LogOut, LogIn } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Index() {
  const { user, isAdmin, signOut } = useAuth();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 border-b border-border">
        <img src={logo} alt="JP Vano" className="w-32 h-32 object-contain mb-6 animate-fade-in" />
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight text-foreground text-center animate-fade-in">
          JP VANO
        </h1>
        <p className="font-body text-muted-foreground mt-4 text-center max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Camisetas exclusivas com design autoral. Estilo que fala por você.
        </p>
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-primary-foreground font-display font-semibold text-sm tracking-wider rounded hover:bg-primary/90 transition-colors animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <Settings className="h-4 w-4" />
            PAINEL ADMIN
          </Link>
        )}
        {user ? (
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 border border-border text-muted-foreground font-body text-sm rounded hover:text-foreground hover:border-foreground transition-colors animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 border border-border text-muted-foreground font-body text-sm rounded hover:text-foreground hover:border-foreground transition-colors animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </Link>
        )
      </section>

      {/* Products */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="font-display font-bold text-2xl mb-10 text-foreground">Coleção</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-card rounded animate-pulse" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground text-lg">
              Nenhum produto disponível no momento.
            </p>
            <p className="font-body text-muted-foreground text-sm mt-2">
              Novidades em breve!
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-muted-foreground text-sm">
            © {new Date().getFullYear()} JP Vano. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
