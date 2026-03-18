import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <main className="pt-24 container mx-auto px-4 text-center py-20">
        <p className="font-body text-muted-foreground text-lg">Seu carrinho está vazio.</p>
        <Link to="/" className="inline-block mt-4">
          <Button variant="outline" className="font-body">Continuar comprando</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-24 container mx-auto px-4 pb-16">
      <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-body text-sm">
        <ArrowLeft className="h-4 w-4" /> Continuar comprando
      </Link>

      <h1 className="font-display font-bold text-2xl mb-8 text-foreground">Carrinho</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 bg-card p-4 rounded border border-border">
              <div className="w-20 h-20 bg-secondary rounded overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-body">
                    Sem img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm text-foreground">{item.name}</h3>
                {(item.size || item.color) && (
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    {item.size && `Tam: ${item.size}`}{item.size && item.color && ' | '}{item.color && `Cor: ${item.color}`}
                  </p>
                )}
                <p className="font-body text-sm text-foreground mt-1">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)} className="text-muted-foreground hover:text-foreground">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-body text-sm text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)} className="text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => removeItem(item.id, item.size, item.color)} className="ml-auto text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card p-6 rounded border border-border h-fit">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Resumo</h2>
          <div className="flex justify-between font-body text-sm text-muted-foreground mb-2">
            <span>Subtotal</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between font-body text-sm text-muted-foreground mb-4">
            <span>Frete</span>
            <span>A calcular</span>
          </div>
          <div className="border-t border-border pt-4 flex justify-between font-display font-bold text-foreground">
            <span>Total</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
          <Link to="/checkout">
            <Button className="w-full mt-6 py-6 font-display font-bold tracking-wider">
              FINALIZAR COMPRA
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
