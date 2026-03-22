import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, Link2, Activity, AlertTriangle, TrendingUp,
  Clock, CheckCircle, XCircle, ArrowRight, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SupplierDashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: suppliers } = useQuery({
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

  const { data: importedProducts } = useQuery({
    queryKey: ['imported-products-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imported_products')
        .select('id, status, selling_price, original_price');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['recent-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) return <main className="pt-24 container mx-auto px-4"><p className="text-muted-foreground font-body">Carregando...</p></main>;
  if (!user) return <Navigate to="/login" replace />;

  const connectedSuppliers = suppliers?.filter(s => s.status === 'connected') || [];
  const totalProducts = importedProducts?.length || 0;
  const activeProducts = importedProducts?.filter(p => p.status === 'active').length || 0;
  const errorCount = recentLogs?.filter(l => l.status === 'error').length || 0;

  const totalProfit = importedProducts?.reduce((acc, p) => {
    return acc + ((p.selling_price || 0) - (p.original_price || 0));
  }, 0) || 0;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    connected: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Conectado' },
    disconnected: { icon: <XCircle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground border-border', label: 'Desconectado' },
    error: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Erro' },
  };

  const platformNames: Record<string, string> = {
    mercadolivre: 'Mercado Livre',
    shopee: 'Shopee',
  };

  return (
    <main className="pt-24 container mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Painel de Fornecedores</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Gerencie suas integrações e produtos importados</p>
        </div>
        <div className="flex gap-3">
          <Link to="/fornecedores/integracoes">
            <Button variant="outline" className="font-display text-sm">
              <Link2 className="h-4 w-4 mr-2" /> Integrações
            </Button>
          </Link>
          <Link to="/fornecedores/produtos">
            <Button className="font-display text-sm">
              <Package className="h-4 w-4 mr-2" /> Produtos
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Fornecedores</p>
                <p className="font-display font-bold text-2xl text-foreground mt-1">{connectedSuppliers.length}</p>
              </div>
              <div className="h-10 w-10 rounded bg-accent flex items-center justify-center">
                <Link2 className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Produtos Importados</p>
                <p className="font-display font-bold text-2xl text-foreground mt-1">{totalProducts}</p>
                <p className="font-body text-xs text-muted-foreground">{activeProducts} ativos</p>
              </div>
              <div className="h-10 w-10 rounded bg-accent flex items-center justify-center">
                <Package className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Lucro Estimado</p>
                <p className="font-display font-bold text-2xl text-foreground mt-1">
                  R$ {totalProfit.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="h-10 w-10 rounded bg-accent flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Erros Recentes</p>
                <p className="font-display font-bold text-2xl text-foreground mt-1">{errorCount}</p>
              </div>
              <div className="h-10 w-10 rounded bg-accent flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Fornecedores Conectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suppliers && suppliers.length > 0 ? (
              <div className="space-y-3">
                {suppliers.map(supplier => {
                  const config = statusConfig[supplier.status] || statusConfig.disconnected;
                  return (
                    <div key={supplier.id} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center font-display font-bold text-sm">
                          {supplier.platform === 'mercadolivre' ? 'ML' : 'SP'}
                        </div>
                        <div>
                          <p className="font-display font-semibold text-sm text-foreground">
                            {platformNames[supplier.platform] || supplier.platform}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            {supplier.platform_username || 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={config.color}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">Nenhum fornecedor conectado</p>
                <Link to="/fornecedores/integracoes">
                  <Button variant="outline" size="sm" className="mt-3 font-display text-xs">
                    Conectar agora <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync logs */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" /> Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    ) : log.status === 'error' ? (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground">{log.details || log.action}</p>
                      <p className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">Nenhuma atividade registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
