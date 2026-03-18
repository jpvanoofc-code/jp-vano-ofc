import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        await signIn(email, password);
        toast.success('Login realizado!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-24 container mx-auto px-4 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm animate-fade-in">
        <h1 className="font-display font-bold text-2xl text-foreground text-center mb-8">
          {isRegister ? 'Criar Conta' : 'Entrar'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="font-body py-6"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="font-body py-6"
          />
          <Button type="submit" disabled={loading} className="w-full py-6 font-display font-bold tracking-wider">
            {loading ? 'AGUARDE...' : isRegister ? 'CRIAR CONTA' : 'ENTRAR'}
          </Button>
        </form>

        <p className="font-body text-sm text-muted-foreground text-center mt-6">
          {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-foreground underline">
            {isRegister ? 'Entrar' : 'Criar conta'}
          </button>
        </p>

      </div>
    </main>
  );
}
