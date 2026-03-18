import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    paymentMethod: 'pix',
  });

  if (items.length === 0) {
    navigate('/carrinho');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Faça login para finalizar a compra');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        items: items.map(i => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
        total,
        payment_method: form.paymentMethod,
        shipping_address: {
          address: form.address,
          city: form.city,
          state: form.state,
          cep: form.cep,
        },
      });

      if (error) throw error;

      clearCart();
      toast.success('Pedido realizado com sucesso!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <main className="pt-24 container mx-auto px-4 pb-16 max-w-2xl">
      <h1 className="font-display font-bold text-2xl mb-8 text-foreground">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card p-6 rounded border border-border space-y-4">
          <h2 className="font-display font-semibold text-foreground">Dados pessoais</h2>
          <Input placeholder="Nome completo" value={form.name} onChange={e => update('name', e.target.value)} required className="font-body" />
          <Input placeholder="E-mail" type="email" value={form.email} onChange={e => update('email', e.target.value)} required className="font-body" />
          <Input placeholder="Telefone" value={form.phone} onChange={e => update('phone', e.target.value)} className="font-body" />
        </div>

        <div className="bg-card p-6 rounded border border-border space-y-4">
          <h2 className="font-display font-semibold text-foreground">Endereço de entrega</h2>
          <Input placeholder="Endereço" value={form.address} onChange={e => update('address', e.target.value)} required className="font-body" />
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Cidade" value={form.city} onChange={e => update('city', e.target.value)} required className="font-body" />
            <Input placeholder="Estado" value={form.state} onChange={e => update('state', e.target.value)} required className="font-body" />
          </div>
          <Input placeholder="CEP" value={form.cep} onChange={e => update('cep', e.target.value)} required className="font-body" />
        </div>

        <div className="bg-card p-6 rounded border border-border space-y-4">
          <h2 className="font-display font-semibold text-foreground">Forma de pagamento</h2>
          <div className="space-y-2">
            {[
              { value: 'pix', label: 'Pix' },
              { value: 'cartao', label: 'Cartão de Crédito' },
              { value: 'boleto', label: 'Boleto Bancário' },
            ].map(method => (
              <label key={method.value} className="flex items-center gap-3 p-3 border border-border rounded cursor-pointer hover:border-foreground transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value={method.value}
                  checked={form.paymentMethod === method.value}
                  onChange={e => update('paymentMethod', e.target.value)}
                  className="accent-foreground"
                />
                <span className="font-body text-sm text-foreground">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">Resumo do pedido</h2>
          {items.map(item => (
            <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between font-body text-sm text-muted-foreground mb-2">
              <span>{item.name} x{item.quantity}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div className="border-t border-border mt-4 pt-4 flex justify-between font-display font-bold text-foreground">
            <span>Total</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full py-6 font-display font-bold tracking-wider">
          {loading ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}
        </Button>
      </form>
    </main>
  );
}
