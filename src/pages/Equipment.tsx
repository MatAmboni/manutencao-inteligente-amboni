import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Edit2, Trash2, Calendar, MapPin, Building2, FileDown, FileSpreadsheet } from "lucide-react";
import EquipmentDialog from "@/components/EquipmentDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  type: "Elétrico" | "Mecânico";
  status: "Operacional" | "Manutenção" | "Inativo";
  location: string;
  lastMaintenance: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
}

const Equipment = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: Equipment[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as "Elétrico" | "Mecânico",
        status: item.status as "Operacional" | "Manutenção" | "Inativo",
        location: item.location,
        lastMaintenance: item.last_maintenance,
        manufacturer: item.manufacturer || undefined,
        model: item.model || undefined,
        serialNumber: item.serial_number || undefined,
        installDate: item.install_date || undefined,
      }));

      setEquipment(formattedData);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [locations] = useState<string[]>([
    "Setor A - Linha 1",
    "Setor B - Linha 2",
    "Setor C - Linha 3",
    "Sala de Controle",
    "Subestação",
  ]);

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === "Operacional").length,
    maintenance: equipment.filter(e => e.status === "Manutenção").length,
    inactive: equipment.filter(e => e.status === "Inativo").length,
    electrical: equipment.filter(e => e.type === "Elétrico").length,
    mechanical: equipment.filter(e => e.type === "Mecânico").length,
  };

  const handleAddEquipment = async (newEquipment: Omit<Equipment, "id">) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .insert({
          name: newEquipment.name,
          type: newEquipment.type,
          status: newEquipment.status,
          location: newEquipment.location,
          last_maintenance: newEquipment.lastMaintenance,
          manufacturer: newEquipment.manufacturer,
          model: newEquipment.model,
          serial_number: newEquipment.serialNumber,
          install_date: newEquipment.installDate,
        });

      if (error) throw error;

      toast({
        title: "Equipamento Cadastrado",
        description: `${newEquipment.name} foi adicionado com sucesso.`,
      });
      
      loadEquipment();
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o equipamento.",
        variant: "destructive",
      });
    }
  };

  const handleEditEquipment = async (updatedEquipment: Equipment) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          name: updatedEquipment.name,
          type: updatedEquipment.type,
          status: updatedEquipment.status,
          location: updatedEquipment.location,
          last_maintenance: updatedEquipment.lastMaintenance,
          manufacturer: updatedEquipment.manufacturer,
          model: updatedEquipment.model,
          serial_number: updatedEquipment.serialNumber,
          install_date: updatedEquipment.installDate,
        })
        .eq('id', updatedEquipment.id);

      if (error) throw error;

      toast({
        title: "Equipamento Atualizado",
        description: `${updatedEquipment.name} foi atualizado com sucesso.`,
      });
      
      loadEquipment();
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o equipamento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEquipment = async () => {
    if (equipmentToDelete) {
      try {
        const deletedEquipment = equipment.find(e => e.id === equipmentToDelete);
        
        const { error } = await supabase
          .from('equipment')
          .delete()
          .eq('id', equipmentToDelete);

        if (error) throw error;

        toast({
          title: "Equipamento Removido",
          description: `${deletedEquipment?.name} foi removido com sucesso.`,
          variant: "destructive",
        });
        
        setEquipmentToDelete(null);
        setDeleteDialogOpen(false);
        loadEquipment();
      } catch (error) {
        console.error('Erro ao remover equipamento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível remover o equipamento.",
          variant: "destructive",
        });
      }
    }
  };

  const openEditDialog = (item: Equipment) => {
    setEditingEquipment(item);
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setEquipmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório de Equipamentos", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);
    
    const tableData = filteredEquipment.map(eq => [
      eq.id,
      eq.name,
      eq.type,
      eq.status,
      eq.location,
      eq.manufacturer || "-",
      eq.model || "-",
      eq.serialNumber || "-",
      new Date(eq.lastMaintenance).toLocaleDateString("pt-BR"),
    ]);
    
    autoTable(doc, {
      head: [["ID", "Nome", "Tipo", "Status", "Localização", "Fabricante", "Modelo", "N° Série", "Última Manutenção"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 197, 94] },
    });
    
    doc.save(`equipamentos-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({
      title: "PDF exportado",
      description: "Relatório de equipamentos exportado com sucesso",
    });
  };

  const exportToExcel = () => {
    const excelData = filteredEquipment.map(eq => ({
      ID: eq.id,
      Nome: eq.name,
      Tipo: eq.type,
      Status: eq.status,
      Localização: eq.location,
      Fabricante: eq.manufacturer || "-",
      Modelo: eq.model || "-",
      "Número de Série": eq.serialNumber || "-",
      "Data de Instalação": eq.installDate ? new Date(eq.installDate).toLocaleDateString("pt-BR") : "-",
      "Última Manutenção": new Date(eq.lastMaintenance).toLocaleDateString("pt-BR"),
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipamentos");
    
    XLSX.writeFile(wb, `equipamentos-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({
      title: "Excel exportado",
      description: "Relatório de equipamentos exportado com sucesso",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operacional":
        return "bg-success text-success-foreground";
      case "Manutenção":
        return "bg-warning text-warning-foreground";
      case "Inativo":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os equipamentos da planta
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Equipamentos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.electrical} elétricos, {stats.mechanical} mecânicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.operational}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.operational / stats.total) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fora de operação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, ID, localização, fabricante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Elétrico">Elétrico</SelectItem>
                <SelectItem value="Mecânico">Mecânico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Última Manutenção</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum equipamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type === "Elétrico" ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
                            <span className="text-warning text-lg">⚡</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <span className="text-primary text-lg">🔧</span>
                          </span>
                        )}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {item.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.manufacturer || "-"}</TableCell>
                    <TableCell className="text-sm">{item.model || "-"}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(item.lastMaintenance).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        equipment={editingEquipment}
        locations={locations}
        onSave={editingEquipment ? handleEditEquipment : handleAddEquipment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEquipment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Equipment;
