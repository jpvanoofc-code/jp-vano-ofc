import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Package, Search, Filter, Edit, Eye, EyeOff,
  ExternalLink, X, Save, ChevronDown
} from 'lucide-react';

type ProductStatus = 'draft' | 'active' | 'paused' | 'error';

export default function ImportedProducts() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', selling_price: '' });

  const { data: products, isLoading } = useQuery({
    queryKey: ['imported-products', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('imported_products')
        .select('*, suppliers!inner(platform, platform_username)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; selling_price?: number; status?: string }) => {
      const { error } = await supabase
        .from('imported_products')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      toast.success('Produto atualizado!');
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateMutation.mutate({ id, status: newStatus });
  };

  if (authLoading) return <main className="pt-24 container mx-auto px-4"><p className="text-muted-foreground font-body">Carregando...</p></main>;
  if (!user) return <Navigate to="/login" replace />;

  const filteredProducts = products?.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const statusBadge: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-muted text-muted-foreground border-border', label: 'Rascunho' },
    active: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Ativo' },
    paused: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Pausado' },
    error: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Erro' },
  };

  const platformNames: Record<string, string> = {
    mercadolivre: 'ML',
    shopee: 'Shopee',
  };

  return (
    <main className="pt-24 container mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Produtos Importados</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 font-body"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'draft', 'error'] as const).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="font-body text-xs"
            >
              {status === 'all' ? 'Todos' : statusBadge[status]?.label || status}
            </Button>
          ))}
        </div>
      </div>

      {/* Products list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-card rounded border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const isEditing = editingId === product.id;
            const badge = statusBadge[product.status] || statusBadge.draft;
            const supplierData = product.suppliers as any;

            return (
              <Card key={product.id} className={isEditing ? 'border-foreground/30' : ''}>
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editForm.title}
                        onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Título"
                        className="font-body"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Descrição"
                        className="font-body"
                        rows={3}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.selling_price}
                        onChange={e => setEditForm(f => ({ ...f, selling_price: e.target.value }))}
                        placeholder="Preço de venda"
                        className="font-body"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({
                            id: product.id,
                            title: editForm.title,
                            description: editForm.description,
                            selling_price: parseFloat(editForm.selling_price) || 0,
                          })}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-3 w-3 mr-1" /> Salvar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded bg-secondary overflow-hidden flex-shrink-0">
                        {product.image_urls && (product.image_urls as string[]).length > 0 ? (
                          <img
                            src={(product.image_urls as string[])[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-sm text-foreground truncate">
                            {product.title}
                          </h3>
                          <Badge variant="outline" className={badge.color + ' text-xs shrink-0'}>
                            {badge.label}
                          </Badge>
                          {supplierData && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {platformNames[supplierData.platform] || supplierData.platform}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 font-body text-xs text-muted-foreground">
                          <span>Original: R$ {Number(product.original_price).toFixed(2).replace('.', ',')}</span>
                          <span className="text-foreground font-semibold">
                            Venda: R$ {Number(product.selling_price).toFixed(2).replace('.', ',')}
                          </span>
                          <span>Estoque: {product.stock}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleStatus(product.id, product.status)}
                          title={product.status === 'active' ? 'Pausar' : 'Ativar'}
                        >
                          {product.status === 'active' ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(product.id);
                            setEditForm({
                              title: product.title,
                              description: product.description || '',
                              selling_price: product.selling_price.toString(),
                            });
                          }}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {product.external_url && (
                          <a href={product.external_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-display font-semibold text-foreground mb-1">Nenhum produto importado</p>
          <p className="font-body text-sm text-muted-foreground">
            Conecte um fornecedor para começar a importar produtos
          </p>
        </div>
      )}
    </main>
  );
}
