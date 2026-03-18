import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { Trash2, Edit, Plus, Package, ShoppingCart } from 'lucide-react';

type Tab = 'products' | 'orders';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const canAccessAdmin = !!user && (isAdmin || user.email === 'jpvanoofc@gmail.com');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('products');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    sizes: '',
    colors: '',
    stock: '',
    buy_link: '',
    image: null as File | null,
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: canAccessAdmin,
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: canAccessAdmin && tab === 'orders',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let image_url: string | null = null;

      if (form.image) {
        const ext = form.image.name.split('.').pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, form.image);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }

      const productData = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()) : [],
        colors: form.colors ? form.colors.split(',').map(s => s.trim()) : [],
        stock: parseInt(form.stock) || 0,
        buy_link: form.buy_link || null,
        ...(image_url ? { image_url } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(editingId ? 'Produto atualizado!' : 'Produto adicionado!');
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', sizes: '', colors: '', stock: '', buy_link: '', image: null });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (product: any) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      sizes: product.sizes?.join(', ') || '',
      colors: product.colors?.join(', ') || '',
      stock: product.stock.toString(),
      buy_link: product.buy_link || '',
      image: null,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  if (authLoading) return <main className="pt-24 container mx-auto px-4"><p className="text-muted-foreground font-body">Carregando...</p></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessAdmin) return <Navigate to="/" replace />;

  return (
    <main className="pt-24 container mx-auto px-4 pb-16">
      <h1 className="font-display font-bold text-2xl text-foreground mb-8">Painel Administrativo</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-2 pb-3 px-1 font-body text-sm transition-colors border-b-2 ${
            tab === 'products' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Package className="h-4 w-4" /> Produtos
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 pb-3 px-1 font-body text-sm transition-colors border-b-2 ${
            tab === 'orders' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
          }`}
        >
          <ShoppingCart className="h-4 w-4" /> Pedidos
        </button>
      </div>

      {tab === 'products' && (
        <>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="mb-6 font-display font-semibold tracking-wide">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
            </Button>
          )}

          {showForm && (
            <div className="bg-card p-6 rounded border border-border mb-8 animate-fade-in">
              <h2 className="font-display font-semibold text-foreground mb-4">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <div className="space-y-4">
                <Input placeholder="Nome do produto" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-body" />
                <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="font-body" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Preço (ex: 89.90)" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="font-body" />
                  <Input placeholder="Estoque" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="font-body" />
                </div>
                <Input placeholder="Tamanhos (ex: P, M, G, GG)" value={form.sizes} onChange={e => setForm(f => ({ ...f, sizes: e.target.value }))} className="font-body" />
                <Input placeholder="Cores (ex: Preto, Branco)" value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} className="font-body" />
                <Input placeholder="Link de compra (ex: https://...)" type="url" value={form.buy_link} onChange={e => setForm(f => ({ ...f, buy_link: e.target.value }))} className="font-body" />
                <div>
                  <label className="font-body text-sm text-muted-foreground block mb-2">Imagem do produto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setForm(f => ({ ...f, image: e.target.files?.[0] || null }))}
                    className="font-body text-sm text-muted-foreground"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.price} className="font-display font-semibold tracking-wide">
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="font-body">Cancelar</Button>
                </div>
              </div>
            </div>
          )}

          {/* Product list */}
          <div className="space-y-3">
            {products?.map(product => (
              <div key={product.id} className="flex items-center gap-4 bg-card p-4 rounded border border-border">
                <div className="w-16 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-body">
                      Sem img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm text-foreground">{product.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    R$ {product.price.toFixed(2).replace('.', ',')} • Estoque: {product.stock} • {product.active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(product)} className="text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(product.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {products?.length === 0 && (
              <p className="text-muted-foreground font-body text-center py-8">Nenhum produto cadastrado.</p>
            )}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders?.map(order => (
            <div key={order.id} className="bg-card p-4 rounded border border-border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display font-semibold text-sm text-foreground">{order.customer_name}</h3>
                  <p className="font-body text-xs text-muted-foreground">{order.customer_email}</p>
                </div>
                <span className="font-body text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                  {order.status}
                </span>
              </div>
              <p className="font-body text-sm text-foreground">
                R$ {order.total.toFixed(2).replace('.', ',')} • {order.payment_method || 'N/A'}
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                {new Date(order.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
          {orders?.length === 0 && (
            <p className="text-muted-foreground font-body text-center py-8">Nenhum pedido realizado.</p>
          )}
        </div>
      )}
    </main>
  );
}
