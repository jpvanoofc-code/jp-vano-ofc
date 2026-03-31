import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Link2, CheckCircle, XCircle, AlertTriangle, Settings,
  Percent, DollarSign, RefreshCw, Trash2, ExternalLink, ShoppingCart
} from 'lucide-react';

export default function SupplierIntegration() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [editingMargin, setEditingMargin] = useState<string | null>(null);
  const [marginForm, setMarginForm] = useState({ type: 'percentage', value: '30' });

  // API key forms
  const [wooForm, setWooForm] = useState({ storeUrl: '', consumerKey: '', consumerSecret: '' });
  const [showWooForm, setShowWooForm] = useState(false);
  const [nuvemForm, setNuvemForm] = useState({ storeUrl: '', accessToken: '' });
  const [showNuvemForm, setShowNuvemForm] = useState(false);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: async ({ platform, metadata }: { platform: string; metadata?: Record<string, string> }) => {
      const insertData: any = {
        user_id: user!.id,
        platform,
        status: 'connected',
        platform_username: metadata?.storeUrl || user!.email?.split('@')[0] || 'user',
      };

      if (metadata) {
        // Store WooCommerce credentials in access_token field as JSON
        insertData.access_token = JSON.stringify(metadata);
      }

      const { error } = await supabase.from('suppliers').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor conectado com sucesso!');
      setConnectingPlatform(null);
      setShowWooForm(false);
      setShowNuvemForm(false);
      setWooForm({ storeUrl: '', consumerKey: '', consumerSecret: '' });
      setNuvemForm({ storeUrl: '', accessToken: '' });
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('Você já conectou esta plataforma.');
      } else {
        toast.error(err.message);
      }
      setConnectingPlatform(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor desconectado.');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMarginMutation = useMutation({
    mutationFn: async ({ id, type, value }: { id: string; type: string; value: number }) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ profit_margin_type: type, profit_margin_value: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Margem atualizada!');
      setEditingMargin(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const syncMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');
      const { data, error } = await supabase.functions.invoke('sync-nuvemshop', {
        body: { supplier_id: supplierId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      toast.success(`Sincronização concluída! ${data.imported} importados, ${data.updated} atualizados.`);
    },
    onError: (err: any) => toast.error(`Erro na sincronização: ${err.message}`),
  });

  if (authLoading) return <main className="pt-24 container mx-auto px-4"><p className="text-muted-foreground font-body">Carregando...</p></main>;
  if (!user) return <Navigate to="/login" replace />;

  const platforms = [
    {
      id: 'mercadolivre',
      name: 'Mercado Livre',
      description: 'Conecte sua conta do Mercado Livre para importar produtos automaticamente.',
      icon: 'ML',
      color: 'bg-yellow-500/10 border-yellow-500/20',
      iconColor: 'text-yellow-400',
      docsUrl: 'https://developers.mercadolivre.com.br',
      type: 'oauth',
    },
    {
      id: 'shopee',
      name: 'Shopee',
      description: 'Conecte sua conta da Shopee para importar produtos e sincronizar estoque.',
      icon: 'SP',
      color: 'bg-orange-500/10 border-orange-500/20',
      iconColor: 'text-orange-400',
      docsUrl: 'https://open.shopee.com',
      type: 'oauth',
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'Conecte sua loja WooCommerce via chaves de API.',
      icon: 'WC',
      color: 'bg-purple-500/10 border-purple-500/20',
      iconColor: 'text-purple-400',
      docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
      type: 'api_key',
    },
    {
      id: 'nuvemshop',
      name: 'Nuvem Shop',
      description: 'Conecte sua loja Nuvem Shop via token de acesso da API.',
      icon: 'NS',
      color: 'bg-blue-500/10 border-blue-500/20',
      iconColor: 'text-blue-400',
      docsUrl: 'https://tiendanube.github.io/api-documentation/intro',
      type: 'nuvemshop',
    },
  ];

  const getSupplierForPlatform = (platformId: string) =>
    suppliers?.find(s => s.platform === platformId);

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    connected: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Conectado' },
    disconnected: { icon: <XCircle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground border-border', label: 'Desconectado' },
    error: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Erro' },
  };

  const handleWooConnect = () => {
    let url = wooForm.storeUrl.trim();
    if (!url || !wooForm.consumerKey.trim() || !wooForm.consumerSecret.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (!url.startsWith('http')) url = 'https://' + url;
    url = url.replace(/\/+$/, '');
    setConnectingPlatform('woocommerce');
    connectMutation.mutate({
      platform: 'woocommerce',
      metadata: {
        storeUrl: url,
        consumerKey: wooForm.consumerKey.trim(),
        consumerSecret: wooForm.consumerSecret.trim(),
      },
    });
  };

  const handleNuvemConnect = () => {
    let url = nuvemForm.storeUrl.trim();
    if (!url || !nuvemForm.accessToken.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (!url.startsWith('http')) url = 'https://' + url;
    url = url.replace(/\/+$/, '');
    setConnectingPlatform('nuvemshop');
    connectMutation.mutate({
      platform: 'nuvemshop',
      metadata: {
        storeUrl: url,
        accessToken: nuvemForm.accessToken.trim(),
      },
    });
  };

  return (
    <main className="pt-24 container mx-auto px-4 pb-16 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-foreground">Integrações</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Conecte seus fornecedores para importar produtos automaticamente
        </p>
      </div>

      <div className="space-y-6">
        {platforms.map(platform => {
          const supplier = getSupplierForPlatform(platform.id);
          const isConnected = supplier?.status === 'connected';
          const config = supplier ? (statusConfig[supplier.status] || statusConfig.disconnected) : null;

          return (
            <Card key={platform.id} className={isConnected ? 'border-green-500/20' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg ${platform.color} border flex items-center justify-center font-display font-bold ${platform.iconColor}`}>
                      {platform.icon}
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">{platform.name}</CardTitle>
                      <CardDescription className="font-body text-sm">{platform.description}</CardDescription>
                    </div>
                  </div>
                  {config && (
                    <Badge variant="outline" className={config.color}>
                      {config.icon}
                      <span className="ml-1">{config.label}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isConnected && supplier ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded bg-background border border-border">
                      <div>
                        <p className="font-body text-sm text-foreground">
                          Conectado como <span className="font-semibold">{supplier.platform_username}</span>
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          Última sincronização: {supplier.last_sync_at
                            ? new Date(supplier.last_sync_at).toLocaleString('pt-BR')
                            : 'Nunca'}
                        </p>
                      </div>
                      <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>

                    {/* Profit margin settings */}
                    <div className="p-3 rounded bg-background border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-body text-sm text-foreground flex items-center gap-2">
                          <Settings className="h-4 w-4" /> Margem de Lucro
                        </p>
                        {editingMargin !== supplier.id && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingMargin(supplier.id);
                            setMarginForm({
                              type: supplier.profit_margin_type,
                              value: supplier.profit_margin_value.toString(),
                            });
                          }}>
                            Editar
                          </Button>
                        )}
                      </div>

                      {editingMargin === supplier.id ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              variant={marginForm.type === 'percentage' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setMarginForm(f => ({ ...f, type: 'percentage' }))}
                            >
                              <Percent className="h-3 w-3 mr-1" /> Percentual
                            </Button>
                            <Button
                              variant={marginForm.type === 'fixed' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setMarginForm(f => ({ ...f, type: 'fixed' }))}
                            >
                              <DollarSign className="h-3 w-3 mr-1" /> Valor Fixo
                            </Button>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={marginForm.value}
                            onChange={e => setMarginForm(f => ({ ...f, value: e.target.value }))}
                            placeholder={marginForm.type === 'percentage' ? 'Ex: 30' : 'Ex: 15.00'}
                            className="font-body"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateMarginMutation.mutate({
                                id: supplier.id,
                                type: marginForm.type,
                                value: parseFloat(marginForm.value) || 0,
                              })}
                              disabled={updateMarginMutation.isPending}
                            >
                              Salvar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingMargin(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="font-body text-sm text-muted-foreground">
                          {supplier.profit_margin_type === 'percentage'
                            ? `${supplier.profit_margin_value}%`
                            : `R$ ${Number(supplier.profit_margin_value).toFixed(2).replace('.', ',')}`
                          } sobre o preço original
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-body text-xs"
                        disabled={syncMutation.isPending}
                        onClick={() => syncMutation.mutate(supplier.id)}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> 
                        {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Agora'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-body text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Deseja desconectar este fornecedor?')) {
                            disconnectMutation.mutate(supplier.id);
                          }
                        }}
                        disabled={disconnectMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Desconectar
                      </Button>
                    </div>
                  </div>
                ) : platform.type === 'api_key' ? (
                  <div className="space-y-4">
                    {!showWooForm ? (
                      <Button onClick={() => setShowWooForm(true)} className="font-display text-sm">
                        <Link2 className="h-4 w-4 mr-2" /> Conectar {platform.name}
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 rounded border border-border bg-background">
                        <p className="font-body text-sm text-foreground font-medium">Dados da loja WooCommerce</p>
                        <p className="font-body text-xs text-muted-foreground">
                          WordPress → WooCommerce → Configurações → Avançado → REST API → Adicionar chave.
                        </p>
                        <Input placeholder="URL da loja (ex: minhaloja.com.br)" value={wooForm.storeUrl} onChange={e => setWooForm(f => ({ ...f, storeUrl: e.target.value }))} className="font-body" />
                        <Input placeholder="Consumer Key (ck_...)" value={wooForm.consumerKey} onChange={e => setWooForm(f => ({ ...f, consumerKey: e.target.value }))} className="font-body" />
                        <Input placeholder="Consumer Secret (cs_...)" type="password" value={wooForm.consumerSecret} onChange={e => setWooForm(f => ({ ...f, consumerSecret: e.target.value }))} className="font-body" />
                        <div className="flex gap-2">
                          <Button onClick={handleWooConnect} disabled={connectMutation.isPending} className="font-display text-sm">
                            {connectMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Conectando...</> : <><ShoppingCart className="h-4 w-4 mr-2" /> Conectar Loja</>}
                          </Button>
                          <Button variant="outline" onClick={() => { setShowWooForm(false); setWooForm({ storeUrl: '', consumerKey: '', consumerSecret: '' }); }}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : platform.type === 'nuvemshop' ? (
                  <div className="space-y-4">
                    {!showNuvemForm ? (
                      <Button onClick={() => setShowNuvemForm(true)} className="font-display text-sm">
                        <Link2 className="h-4 w-4 mr-2" /> Conectar {platform.name}
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 rounded border border-border bg-background">
                        <p className="font-body text-sm text-foreground font-medium">Dados da loja Nuvem Shop</p>
                        <p className="font-body text-xs text-muted-foreground">
                          Acesse o painel da Nuvem Shop → Aplicativos → Criar aplicativo ou use um token de acesso existente.
                        </p>
                        <Input placeholder="URL da loja (ex: minhaloja.lojavirtualnuvem.com.br)" value={nuvemForm.storeUrl} onChange={e => setNuvemForm(f => ({ ...f, storeUrl: e.target.value }))} className="font-body" />
                        <Input placeholder="Token de Acesso (access_token)" type="password" value={nuvemForm.accessToken} onChange={e => setNuvemForm(f => ({ ...f, accessToken: e.target.value }))} className="font-body" />
                        <div className="flex gap-2">
                          <Button onClick={handleNuvemConnect} disabled={connectMutation.isPending} className="font-display text-sm">
                            {connectMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Conectando...</> : <><ShoppingCart className="h-4 w-4 mr-2" /> Conectar Loja</>}
                          </Button>
                          <Button variant="outline" onClick={() => { setShowNuvemForm(false); setNuvemForm({ storeUrl: '', accessToken: '' }); }}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => { setConnectingPlatform(platform.id); connectMutation.mutate({ platform: platform.id }); }}
                    disabled={connectMutation.isPending && connectingPlatform === platform.id}
                    className="font-display text-sm"
                  >
                    {connectMutation.isPending && connectingPlatform === platform.id ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Conectando...</>
                    ) : (
                      <><Link2 className="h-4 w-4 mr-2" /> Conectar {platform.name}</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
