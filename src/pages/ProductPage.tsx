import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <main className="pt-24 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-card rounded animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-card rounded w-2/3 animate-pulse" />
            <div className="h-6 bg-card rounded w-1/3 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pt-24 container mx-auto px-4 text-center">
        <p className="text-muted-foreground font-body">Produto não encontrado.</p>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Selecione um tamanho');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Selecione uma cor');
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });
    toast.success('Adicionado ao carrinho!');
  };

  return (
    <main className="pt-24 container mx-auto px-4 pb-16">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-body text-sm">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid md:grid-cols-2 gap-12 animate-fade-in">
        <div className="aspect-square bg-card rounded overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body">
              Sem imagem
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="font-display font-bold text-3xl text-foreground">{product.name}</h1>
          <p className="font-display font-semibold text-2xl text-foreground mt-4">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>

          {product.description && (
            <p className="font-body text-muted-foreground mt-6 leading-relaxed">{product.description}</p>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="font-body text-sm text-muted-foreground mb-2">Tamanho</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded text-sm font-body transition-colors ${
                      selectedSize === size
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <p className="font-body text-sm text-muted-foreground mb-2">Cor</p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded text-sm font-body transition-colors ${
                      selectedColor === color
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {product.buy_link && (
              <a
                href={product.buy_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full py-6 font-display font-bold tracking-wider text-base">
                  COMPRAR AGORA
                </Button>
              </a>
            )}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              variant={product.buy_link ? 'outline' : 'default'}
              className="w-full py-6 font-display font-bold tracking-wider text-base"
            >
              {product.stock <= 0 ? 'ESGOTADO' : 'ADICIONAR AO CARRINHO'}
            </Button>
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <p className="font-body text-sm text-muted-foreground mt-3">
              Apenas {product.stock} unidades restantes
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
