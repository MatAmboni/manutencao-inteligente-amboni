import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Users, Trash2, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const createUserSchema = z.object({
  username: z.string().min(2, 'Usuário deve ter no mínimo 2 caracteres').regex(/^[a-zA-Z0-9._]+$/, 'Apenas letras, números, pontos e underscores'),
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'employee']),
});

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  created_at: string;
  role: 'admin' | 'employee';
}

const UserManagement = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' },
      });
      if (error) throw error;
      return data.users as User[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          username: userData.username,
          fullName: userData.fullName,
          password: userData.password,
          role: userData.role,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Usuário criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDialogOpen(false);
      setFormData({ username: '', fullName: '', password: '', role: 'employee' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSeedAdmins = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-admins');
      if (error) throw error;
      
      toast({
        title: 'Admins iniciais criados!',
        description: `Resultados: ${data.results.map((r: { username: string; status: string }) => `${r.username}: ${r.status}`).join(', ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast({
        title: 'Erro ao criar admins',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = createUserSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    createUserMutation.mutate(formData);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">
              Cadastre novos usuários administradores ou funcionários
            </p>
          </div>
          <div className="flex gap-2">
            {(!users || users.length === 0) && (
              <Button variant="outline" onClick={handleSeedAdmins} disabled={isSeeding}>
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Criar Admins Iniciais
                  </>
                )}
              </Button>
            )}
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Cadastrados
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username || user.email.split('@')[0]}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrador' : 'Funcionário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário cadastrado ainda.</p>
                <p className="text-sm">Clique em "Criar Admins Iniciais" para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar um novo usuário
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  placeholder="joao.silva"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  placeholder="João Silva"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'employee') => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="employee">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Usuário'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
