import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2, Clock, AlertCircle, CheckCircle2, ListChecks, FileDown, FileSpreadsheet, Play, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ServiceOrderDialog from "@/components/ServiceOrderDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Equipment {
  id: string;
  name: string;
  type: "Elétrico" | "Mecânico";
  status: "Operacional" | "Manutenção" | "Inativo";
  location: string;
}

interface ServiceOrder {
  id: string;
  equipment: string;
  description: string;
  status: "Pendente" | "Em Andamento" | "Concluída";
  priority: "Baixa" | "Média" | "Alta";
  sector: "Elétrico" | "Mecânico";
  executionTeam: "Interna" | "Externa";
  requestDate: string;
  suggestedDeadline: string;
  requester: string;
  createdAt: string;
  completedAt?: string;
}

const ServiceOrders = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [orders, setOrders] = useState<ServiceOrder[]>([
    {
      id: "OS-001",
      equipment: "Compressor 01",
      description: "Manutenção preventiva do sistema de refrigeração",
      status: "Concluída",
      priority: "Alta",
      sector: "Mecânico",
      executionTeam: "Interna",
      requestDate: "2024-01-15",
      suggestedDeadline: "2024-01-20",
      requester: "João Silva",
      createdAt: "2024-01-15",
      completedAt: "2024-01-19",
    },
    {
      id: "OS-002",
      equipment: "Motor Elétrico 03",
      description: "Verificação de conexões e substituição de rolamentos",
      status: "Pendente",
      priority: "Média",
      sector: "Elétrico",
      executionTeam: "Externa",
      requestDate: "2024-01-14",
      suggestedDeadline: "2024-01-18",
      requester: "Maria Santos",
      createdAt: "2024-01-14",
    },
    {
      id: "OS-003",
      equipment: "Painel de Controle",
      description: "Atualização de firmware e teste de segurança",
      status: "Em Andamento",
      priority: "Alta",
      sector: "Elétrico",
      executionTeam: "Interna",
      requestDate: "2024-01-13",
      suggestedDeadline: "2024-01-17",
      requester: "Carlos Oliveira",
      createdAt: "2024-01-13",
    },
    {
      id: "OS-004",
      equipment: "Válvula de Pressão 5",
      description: "Calibração e teste de vazão",
      status: "Concluída",
      priority: "Média",
      sector: "Mecânico",
      executionTeam: "Interna",
      requestDate: "2024-01-10",
      suggestedDeadline: "2024-01-15",
      requester: "Ana Costa",
      createdAt: "2024-01-10",
      completedAt: "2024-01-14",
    },
    {
      id: "OS-005",
      equipment: "Bomba Hidráulica 2",
      description: "Troca de vedações",
      status: "Concluída",
      priority: "Baixa",
      sector: "Mecânico",
      executionTeam: "Externa",
      requestDate: "2024-01-08",
      suggestedDeadline: "2024-01-12",
      requester: "Pedro Almeida",
      createdAt: "2024-01-08",
      completedAt: "2024-01-11",
    },
    {
      id: "OS-006",
      equipment: "Transformador Principal",
      description: "Inspeção elétrica geral",
      status: "Concluída",
      priority: "Alta",
      sector: "Elétrico",
      executionTeam: "Interna",
      requestDate: "2024-01-05",
      suggestedDeadline: "2024-01-10",
      requester: "João Silva",
      createdAt: "2024-01-05",
      completedAt: "2024-01-09",
    },
  ]);

  const [equipment] = useState<Equipment[]>([
    {
      id: "EQ-001",
      name: "Compressor 01",
      type: "Mecânico",
      status: "Manutenção",
      location: "Setor A - Linha 1",
    },
    {
      id: "EQ-002",
      name: "Motor Elétrico 03",
      type: "Elétrico",
      status: "Operacional",
      location: "Setor B - Linha 2",
    },
    {
      id: "EQ-003",
      name: "Painel de Controle",
      type: "Elétrico",
      status: "Operacional",
      location: "Sala de Controle",
    },
    {
      id: "EQ-004",
      name: "Válvula de Pressão 5",
      type: "Mecânico",
      status: "Operacional",
      location: "Setor C - Linha 3",
    },
  ]);

  const [requesters] = useState<string[]>([
    "João Silva",
    "Maria Santos",
    "Carlos Oliveira",
    "Ana Costa",
    "Pedro Almeida",
  ]);

  const handleAddOrder = (newOrder: Omit<ServiceOrder, "id" | "createdAt">) => {
    const orderNumber = orders.length + 1;
    const order: ServiceOrder = {
      ...newOrder,
      id: `OS-${orderNumber.toString().padStart(3, "0")}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setOrders([order, ...orders]);
    toast({
      title: "Ordem criada!",
      description: `Ordem ${order.id} foi criada com sucesso.`,
    });
  };

  const handleEditOrder = (updatedOrder: ServiceOrder) => {
    setOrders(orders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
    toast({
      title: "Ordem atualizada!",
      description: `Ordem ${updatedOrder.id} foi atualizada com sucesso.`,
    });
  };

  const handleDeleteOrder = () => {
    if (orderToDelete) {
      setOrders(orders.filter(order => order.id !== orderToDelete));
      toast({
        title: "Ordem excluída!",
        description: "A ordem foi excluída com sucesso.",
      });
      setOrderToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleChangeStatus = (orderId: string, newStatus: "Pendente" | "Em Andamento" | "Concluída") => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status: newStatus };
        if (newStatus === "Concluída") {
          updatedOrder.completedAt = new Date().toISOString().split("T")[0];
        }
        return updatedOrder;
      }
      return order;
    }));
    
    const statusMessages = {
      "Pendente": "voltou para pendente",
      "Em Andamento": "iniciada",
      "Concluída": "concluída e movida para o histórico"
    };
    
    toast({
      title: "Status atualizado!",
      description: `Ordem ${orderId} foi ${statusMessages[newStatus]}.`,
    });
  };

  const handleOpenEditDialog = (order: ServiceOrder) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrder(undefined);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório de Ordens de Serviço", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);
    
    const tableData = filteredOrders.map(order => [
      order.id,
      order.equipment,
      order.sector,
      order.priority,
      order.status,
      order.executionTeam,
      order.requester,
      new Date(order.requestDate).toLocaleDateString("pt-BR"),
      order.suggestedDeadline ? new Date(order.suggestedDeadline).toLocaleDateString("pt-BR") : "-",
    ]);
    
    autoTable(doc, {
      head: [["ID", "Equipamento", "Setor", "Prioridade", "Status", "Equipe", "Solicitante", "Data Solicitação", "Prazo"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    doc.save(`ordens-servico-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({
      title: "PDF exportado",
      description: "Relatório de ordens de serviço exportado com sucesso",
    });
  };

  const exportToExcel = () => {
    const excelData = filteredOrders.map(order => ({
      ID: order.id,
      Equipamento: order.equipment,
      Setor: order.sector,
      Prioridade: order.priority,
      Status: order.status,
      "Equipe Executora": order.executionTeam,
      Solicitante: order.requester,
      "Data Solicitação": new Date(order.requestDate).toLocaleDateString("pt-BR"),
      "Prazo Sugerido": order.suggestedDeadline ? new Date(order.suggestedDeadline).toLocaleDateString("pt-BR") : "-",
      Descrição: order.description,
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ordens de Serviço");
    
    XLSX.writeFile(wb, `ordens-servico-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({
      title: "Excel exportado",
      description: "Relatório de ordens de serviço exportado com sucesso",
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesPriority = filterPriority === "all" || order.priority === filterPriority;
    // Exclui ordens concluídas da lista principal (a menos que o filtro de status seja "Concluída")
    const isNotCompleted = filterStatus === "Concluída" ? true : order.status !== "Concluída";
    return matchesSearch && matchesStatus && matchesPriority && isNotCompleted;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "Pendente").length,
    inProgress: orders.filter(o => o.status === "Em Andamento").length,
    completed: orders.filter(o => o.status === "Concluída").length,
  };

  const maintenanceHistory = orders
    .filter(o => o.status === "Concluída")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluída":
        return "bg-success text-success-foreground";
      case "Em Andamento":
        return "bg-primary text-primary-foreground";
      case "Pendente":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-destructive text-destructive-foreground";
      case "Média":
        return "bg-warning text-warning-foreground";
      case "Baixa":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as ordens de manutenção
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
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ordens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ordens */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Equipamento: {order.equipment}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge className={getPriorityColor(order.priority)}>
                    {order.priority}
                  </Badge>
                  {order.status === "Pendente" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus(order.id, "Em Andamento")}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  {(order.status === "Em Andamento" || order.status === "Pendente") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeStatus(order.id, "Concluída")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(order)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setOrderToDelete(order.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground mb-3">{order.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>Setor: {order.sector}</span>
                <span>•</span>
                <span>Equipe: {order.executionTeam}</span>
                <span>•</span>
                <span>Solicitante: {order.requester}</span>
                <span>•</span>
                <span>Prazo: {new Date(order.suggestedDeadline).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Histórico de Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ordens</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas ordens concluídas
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenanceHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma ordem concluída ainda
              </p>
            ) : (
              maintenanceHistory.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{order.id} - {order.equipment}</p>
                    <p className="text-xs text-muted-foreground">{order.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={getPriorityColor(order.priority)} variant="outline">
                      {order.priority}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ServiceOrderDialog 
        open={dialogOpen} 
        onOpenChange={handleCloseDialog}
        equipment={equipment}
        requesters={requesters}
        order={editingOrder}
        onSave={(orderData) => {
          if (editingOrder) {
            handleEditOrder({ ...orderData, id: editingOrder.id, createdAt: editingOrder.createdAt });
          } else {
            handleAddOrder(orderData);
          }
          handleCloseDialog();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceOrders;
