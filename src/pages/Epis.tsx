import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EPI_CATEGORIES = [
  { value: "cabeca", label: "Proteção da Cabeça" },
  { value: "olhos", label: "Proteção dos Olhos e Face" },
  { value: "auditiva", label: "Proteção Auditiva" },
  { value: "respiratoria", label: "Proteção Respiratória" },
  { value: "maos", label: "Proteção das Mãos" },
  { value: "pes", label: "Proteção dos Pés" },
  { value: "corpo", label: "Proteção do Corpo" },
  { value: "quedas", label: "Proteção Contra Quedas" },
  { value: "outros", label: "Outros" },
];

interface Epi {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  createdAt: string;
}

const Epis = () => {
  const { toast } = useToast();
  const [epis, setEpis] = useState<Epi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [epiToDelete, setEpiToDelete] = useState<string | null>(null);
  const [editingEpi, setEditingEpi] = useState<Epi | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", category: "" });

  useEffect(() => {
    loadEpis();
  }, []);

  const loadEpis = async () => {
    try {
      const { data, error } = await supabase
        .from('epis')
        .select('*')
        .order('name');

      if (error) throw error;

      const formattedEpis: Epi[] = (data || []).map(epi => ({
        id: epi.id,
        name: epi.name,
        description: epi.description,
        category: epi.category,
        createdAt: epi.created_at || '',
      }));

      setEpis(formattedEpis);
    } catch (error) {
      console.error('Erro ao carregar EPIs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os EPIs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (epi?: Epi) => {
    if (epi) {
      setEditingEpi(epi);
      setFormData({ name: epi.name, description: epi.description || "", category: epi.category || "" });
    } else {
      setEditingEpi(null);
      setFormData({ name: "", description: "", category: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEpi(null);
    setFormData({ name: "", description: "", category: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do EPI é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEpi) {
        const { error } = await supabase
          .from('epis')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category || null,
          })
          .eq('id', editingEpi.id);

        if (error) throw error;

        toast({
          title: "EPI atualizado!",
          description: "O EPI foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('epis')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category || null,
          });

        if (error) throw error;

        toast({
          title: "EPI cadastrado!",
          description: "O EPI foi cadastrado com sucesso.",
        });
      }

      handleCloseDialog();
      loadEpis();
    } catch (error) {
      console.error('Erro ao salvar EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o EPI.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!epiToDelete) return;

    try {
      const { error } = await supabase
        .from('epis')
        .delete()
        .eq('id', epiToDelete);

      if (error) throw error;

      toast({
        title: "EPI excluído!",
        description: "O EPI foi excluído com sucesso.",
      });

      setEpiToDelete(null);
      setDeleteDialogOpen(false);
      loadEpis();
    } catch (error) {
      console.error('Erro ao excluir EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o EPI. Verifique se não está em uso.",
        variant: "destructive",
      });
    }
  };

  const filteredEpis = epis.filter(epi => {
    const matchesSearch = epi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (epi.description && epi.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "all" || epi.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (categoryValue: string | null) => {
    if (!categoryValue) return null;
    return EPI_CATEGORIES.find(c => c.value === categoryValue)?.label || categoryValue;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipamentos de Proteção Individual</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os EPIs utilizados nas ordens de serviço
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo EPI
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de EPIs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{epis.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EPIs Cadastrados Este Mês</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {epis.filter(e => {
                const createdDate = new Date(e.createdAt);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {EPI_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de EPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Carregando...</p>
        ) : filteredEpis.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            {searchTerm ? "Nenhum EPI encontrado" : "Nenhum EPI cadastrado"}
          </p>
        ) : (
          filteredEpis.map((epi) => (
            <Card key={epi.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{epi.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(epi)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEpiToDelete(epi.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {epi.category && (
                  <Badge variant="secondary" className="mb-2">
                    {getCategoryLabel(epi.category)}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  {epi.description || "Sem descrição"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Cadastrado em: {new Date(epi.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEpi ? "Editar EPI" : "Novo EPI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Luvas de Proteção"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {EPI_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do equipamento de proteção..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingEpi ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este EPI? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Epis;
