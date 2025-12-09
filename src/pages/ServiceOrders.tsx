import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2, Clock, AlertCircle, CheckCircle2, ListChecks, FileDown, FileSpreadsheet, Check, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ServiceOrderDialog from "@/components/ServiceOrderDialog";
import CompleteOrderDialog from "@/components/CompleteOrderDialog";
import StartOrderDialog from "@/components/StartOrderDialog";
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

interface Technician {
  id: string;
  name: string;
}

interface ServiceOrder {
  id: string;
  equipmentId: string;
  equipment: string;
  description: string;
  status: "Pendente" | "Em Andamento" | "Concluída";
  priority: "Baixa" | "Média" | "Alta";
  sector: "Elétrico" | "Mecânico";
  executionTeam: "Interna" | "Externa";
  requestDate: string;
  suggestedDeadline: string;
  requester: string;
  assignedTechnicians: string[];
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
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requesters, setRequesters] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeOrderDialogOpen, setCompleteOrderDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<string | null>(null);
  const [startOrderDialogOpen, setStartOrderDialogOpen] = useState(false);
  const [orderToStart, setOrderToStart] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, type, status, location');

      if (equipmentError) throw equipmentError;

      const formattedEquipment: Equipment[] = (equipmentData || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as "Elétrico" | "Mecânico",
        status: item.status as "Operacional" | "Manutenção" | "Inativo",
        location: item.location,
      }));

      setEquipment(formattedEquipment);

      // Load service orders with technicians
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select('*, equipment(name)')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Load technician assignments for each order
      const { data: assignmentsData } = await supabase
        .from('service_order_technicians')
        .select('service_order_id, technician_id');

      const techniciansByOrder = (assignmentsData || []).reduce((acc, assignment) => {
        if (!acc[assignment.service_order_id]) {
          acc[assignment.service_order_id] = [];
        }
        acc[assignment.service_order_id].push(assignment.technician_id);
        return acc;
      }, {} as Record<string, string[]>);

      const formattedOrders: ServiceOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        equipmentId: order.equipment_id,
        equipment: order.equipment?.name || '',
        description: order.description || '',
        status: order.status as "Pendente" | "Em Andamento" | "Concluída",
        priority: order.priority as "Baixa" | "Média" | "Alta",
        sector: order.sector as "Elétrico" | "Mecânico",
        executionTeam: order.execution_team as "Interna" | "Externa",
        requestDate: order.request_date,
        suggestedDeadline: order.suggested_deadline,
        requester: order.requester,
        assignedTechnicians: techniciansByOrder[order.id] || [],
        createdAt: order.created_at,
        completedAt: order.completed_at || undefined,
      }));

      setOrders(formattedOrders);

      // Load requesters
      const { data: requestersData, error: requestersError } = await supabase
        .from('requesters')
        .select('name')
        .order('name');

      if (requestersError) throw requestersError;

      setRequesters(requestersData?.map(r => r.name) || []);

      // Load technicians
      const { data: techniciansData, error: techniciansError } = await supabase
        .from('technicians')
        .select('id, name')
        .order('name');

      if (techniciansError) throw techniciansError;

      setTechnicians(techniciansData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (newOrder: Omit<ServiceOrder, "id" | "createdAt">) => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          equipment_id: newOrder.equipmentId,
          description: newOrder.description,
          status: newOrder.status,
          priority: newOrder.priority,
          sector: newOrder.sector,
          execution_team: newOrder.executionTeam,
          request_date: newOrder.requestDate,
          suggested_deadline: newOrder.suggestedDeadline,
          requester: newOrder.requester,
        })
        .select()
        .single();

      if (error) throw error;

      // Add technician assignments
      if (newOrder.assignedTechnicians.length > 0 && data) {
        const technicianAssignments = newOrder.assignedTechnicians.map(techId => ({
          service_order_id: data.id,
          technician_id: techId,
        }));
        await supabase.from('service_order_technicians').insert(technicianAssignments);
      }

      toast({
        title: "Ordem criada!",
        description: `Ordem foi criada com sucesso.`,
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a ordem.",
        variant: "destructive",
      });
    }
  };

  const handleEditOrder = async (updatedOrder: ServiceOrder) => {
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          equipment_id: updatedOrder.equipmentId,
          description: updatedOrder.description,
          status: updatedOrder.status,
          priority: updatedOrder.priority,
          sector: updatedOrder.sector,
          execution_team: updatedOrder.executionTeam,
          request_date: updatedOrder.requestDate,
          suggested_deadline: updatedOrder.suggestedDeadline,
          requester: updatedOrder.requester,
        })
        .eq('id', updatedOrder.id);

      if (error) throw error;

      // Update technician assignments
      await supabase.from('service_order_technicians').delete().eq('service_order_id', updatedOrder.id);
      
      if (updatedOrder.assignedTechnicians.length > 0) {
        const technicianAssignments = updatedOrder.assignedTechnicians.map(techId => ({
          service_order_id: updatedOrder.id,
          technician_id: techId,
        }));
        await supabase.from('service_order_technicians').insert(technicianAssignments);
      }

      toast({
        title: "Ordem atualizada!",
        description: `Ordem foi atualizada com sucesso.`,
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ordem.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async () => {
    if (orderToDelete) {
      try {
        const { error } = await supabase
          .from('service_orders')
          .delete()
          .eq('id', orderToDelete);

        if (error) throw error;

        toast({
          title: "Ordem excluída!",
          description: "A ordem foi excluída com sucesso.",
        });
        
        setOrderToDelete(null);
        setDeleteDialogOpen(false);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir ordem:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a ordem.",
          variant: "destructive",
        });
      }
    }
  };

  const handleChangeStatus = async (orderId: string, newStatus: "Pendente" | "Em Andamento" | "Concluída") => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === "Concluída") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages = {
        "Pendente": "voltou para pendente",
        "Em Andamento": "iniciada",
        "Concluída": "concluída e movida para o histórico"
      };
      
      toast({
        title: "Status atualizado!",
        description: `Ordem foi ${statusMessages[newStatus]}.`,
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOrderWithEpis = async (orderId: string, epiIds: string[]) => {
    try {
      await supabase.from('service_orders').update({ 
        status: 'Concluída',
        completed_at: new Date().toISOString()
      }).eq('id', orderId);
      
      if (epiIds.length > 0) {
        const epiAssignments = epiIds.map(epiId => ({
          service_order_id: orderId,
          epi_id: epiId,
        }));
        await supabase.from('service_order_epis').insert(epiAssignments);
      }
      
      toast({ title: "Ordem concluída!", description: "EPIs registrados com sucesso." });
      loadData();
    } catch (error) {
      console.error('Erro ao concluir ordem:', error);
      toast({ title: "Erro", description: "Não foi possível concluir a ordem.", variant: "destructive" });
    }
  };

  const handleStartOrderWithTechnicians = async (orderId: string, technicianIds: string[]) => {
    try {
      await supabase.from('service_orders').update({ status: 'Em Andamento' }).eq('id', orderId);
      
      // Remove existing technician assignments and add new ones
      await supabase.from('service_order_technicians').delete().eq('service_order_id', orderId);
      
      if (technicianIds.length > 0) {
        const techAssignments = technicianIds.map(techId => ({
          service_order_id: orderId,
          technician_id: techId,
        }));
        await supabase.from('service_order_technicians').insert(techAssignments);
      }
      
      toast({ title: "Ordem iniciada!", description: "Técnicos atribuídos com sucesso." });
      loadData();
    } catch (error) {
      console.error('Erro ao iniciar ordem:', error);
      toast({ title: "Erro", description: "Não foi possível iniciar a ordem.", variant: "destructive" });
    }
  };

  const handleOpenEditDialog = (order: ServiceOrder) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrder(undefined);
  };

  const handleSaveOrder = (orderData: {
    equipment: string;
    description: string;
    priority: "Baixa" | "Média" | "Alta";
    sector: "Elétrico" | "Mecânico";
    executionTeam: "Interna" | "Externa";
    requestDate: string;
    suggestedDeadline: string;
    requester: string;
    assignedTechnicians: string[];
    status: "Pendente" | "Em Andamento" | "Concluída";
  }) => {
    const equipmentItem = equipment.find(eq => eq.name === orderData.equipment);
    
    if (!equipmentItem) {
      toast({
        title: "Erro",
        description: "Equipamento não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (editingOrder) {
      handleEditOrder({
        ...editingOrder,
        equipmentId: equipmentItem.id,
        equipment: orderData.equipment,
        description: orderData.description,
        priority: orderData.priority,
        sector: orderData.sector,
        executionTeam: orderData.executionTeam,
        requestDate: orderData.requestDate,
        suggestedDeadline: orderData.suggestedDeadline,
        requester: orderData.requester,
        assignedTechnicians: orderData.assignedTechnicians,
        status: orderData.status,
      });
    } else {
      handleAddOrder({
        equipmentId: equipmentItem.id,
        equipment: orderData.equipment,
        description: orderData.description,
        priority: orderData.priority,
        sector: orderData.sector,
        executionTeam: orderData.executionTeam,
        requestDate: orderData.requestDate,
        suggestedDeadline: orderData.suggestedDeadline,
        requester: orderData.requester,
        assignedTechnicians: orderData.assignedTechnicians,
        status: orderData.status,
      });
    }
    handleCloseDialog();
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
                      onClick={() => {
                        setOrderToStart(order.id);
                        setStartOrderDialogOpen(true);
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  {order.status === "Em Andamento" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOrderToComplete(order.id);
                        setCompleteOrderDialogOpen(true);
                      }}
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
                {order.assignedTechnicians.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Responsáveis: {technicians.filter(t => order.assignedTechnicians.includes(t.id)).map(t => t.name).join(', ')}</span>
                  </>
                )}
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
        onSave={handleSaveOrder}
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

      <CompleteOrderDialog
        open={completeOrderDialogOpen}
        onOpenChange={setCompleteOrderDialogOpen}
        orderId={orderToComplete || ''}
        onComplete={handleCompleteOrderWithEpis}
      />

      <StartOrderDialog
        open={startOrderDialogOpen}
        onOpenChange={setStartOrderDialogOpen}
        orderId={orderToStart || ''}
        technicians={technicians}
        onStart={handleStartOrderWithTechnicians}
      />
    </div>
  );
};

export default ServiceOrders;
