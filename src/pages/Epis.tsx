import { useState, useEffect, useRef } from "react";
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
import { Plus, Search, Edit2, Trash2, Shield, FileText, Upload, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  imageUrl: string | null;
  createdAt: string;
  usageCount: number;
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
  const [formData, setFormData] = useState({ name: "", description: "", category: "", imageUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEpis();
  }, []);

  const loadEpis = async () => {
    try {
      // Fetch EPIs
      const { data: episData, error: episError } = await supabase
        .from('epis')
        .select('*')
        .order('name');

      if (episError) throw episError;

      // Fetch usage counts for completed orders
      const { data: usageData, error: usageError } = await supabase
        .from('service_order_epis')
        .select(`
          epi_id,
          service_orders!inner(status)
        `)
        .eq('service_orders.status', 'Concluída');

      if (usageError) throw usageError;

      // Count usage per EPI
      const usageCounts: Record<string, number> = {};
      (usageData || []).forEach(item => {
        usageCounts[item.epi_id] = (usageCounts[item.epi_id] || 0) + 1;
      });

      const formattedEpis: Epi[] = (episData || []).map(epi => ({
        id: epi.id,
        name: epi.name,
        description: epi.description,
        category: epi.category,
        imageUrl: epi.image_url,
        createdAt: epi.created_at || '',
        usageCount: usageCounts[epi.id] || 0,
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
      setFormData({ 
        name: epi.name, 
        description: epi.description || "", 
        category: epi.category || "",
        imageUrl: epi.imageUrl || ""
      });
      setImagePreview(epi.imageUrl);
    } else {
      setEditingEpi(null);
      setFormData({ name: "", description: "", category: "", imageUrl: "" });
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEpi(null);
    setFormData({ name: "", description: "", category: "", imageUrl: "" });
    setImagePreview(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('epi-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('epi-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      setImagePreview(publicUrl);

      toast({
        title: "Sucesso",
        description: "Imagem carregada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: "" }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            image_url: formData.imageUrl || null,
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
            image_url: formData.imageUrl || null,
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

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Relatório de EPIs", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
    doc.text(`Total de EPIs: ${epis.length}`, 14, 36);
    
    // Table data
    const tableData = filteredEpis.map(epi => [
      epi.name,
      getCategoryLabel(epi.category) || "Sem categoria",
      epi.description || "-",
      epi.usageCount.toString(),
      new Date(epi.createdAt).toLocaleDateString('pt-BR')
    ]);

    autoTable(doc, {
      startY: 44,
      head: [["Nome", "Categoria", "Descrição", "Usos em OS", "Cadastrado em"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        2: { cellWidth: 50 }
      }
    });

    doc.save(`relatorio-epis-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF gerado!",
      description: "O relatório foi baixado com sucesso.",
    });
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

  const totalUsage = epis.reduce((sum, epi) => sum + epi.usageCount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipamentos de Proteção Individual</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os EPIs utilizados nas ordens de serviço
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePDF}>
            <FileText className="mr-2 h-4 w-4" />
            Relatório PDF
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo EPI
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Total de Usos em OS</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
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
                  <div className="flex items-center gap-3">
                    {epi.imageUrl ? (
                      <img 
                        src={epi.imageUrl} 
                        alt={epi.name}
                        className="h-12 w-12 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                    )}
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
                <div className="flex flex-wrap gap-2 mb-2">
                  {epi.category && (
                    <Badge variant="secondary">
                      {getCategoryLabel(epi.category)}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {epi.usageCount} uso{epi.usageCount !== 1 ? 's' : ''} em OS
                  </Badge>
                </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEpi ? "Editar EPI" : "Novo EPI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Imagem</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {!imagePreview && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Enviando..." : "Selecionar imagem"}
                  </Button>
                )}
              </div>
            </div>

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
