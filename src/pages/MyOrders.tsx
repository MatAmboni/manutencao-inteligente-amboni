import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CompleteOrderDialog from "@/components/CompleteOrderDialog";
import StartOrderDialog from "@/components/StartOrderDialog";

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
  assignedTechnicians: string[];
}

const MyOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<string | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [orderToStart, setOrderToStart] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load orders assigned to this technician
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select('*, equipment(name)')
        .in('status', ['Pendente', 'Em Andamento'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Load technician assignments
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
      }));

      setOrders(formattedOrders);

      // Load technicians
      const { data: techniciansData } = await supabase
        .from('technicians')
        .select('id, name')
        .order('name');
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

  const handleStartOrder = (orderId: string) => {
    setOrderToStart(orderId);
    setStartDialogOpen(true);
  };

  const handleCompleteOrder = (orderId: string) => {
    setOrderToComplete(orderId);
    setCompleteDialogOpen(true);
  };

  const handleStartWithTechnicians = async (orderId: string, technicianIds: string[]) => {
    try {
      await supabase.from('service_orders').update({ status: 'Em Andamento' }).eq('id', orderId);
      
      await supabase.from('service_order_technicians').delete().eq('service_order_id', orderId);
      
      if (technicianIds.length > 0) {
        const techAssignments = technicianIds.map(techId => ({
          service_order_id: orderId,
          technician_id: techId,
        }));
        await supabase.from('service_order_technicians').insert(techAssignments);
      }
      
      toast({ title: "Ordem iniciada!", description: "Status atualizado com sucesso." });
      loadData();
    } catch (error) {
      console.error('Erro ao iniciar ordem:', error);
      toast({ title: "Erro", description: "Não foi possível iniciar a ordem.", variant: "destructive" });
    }
  };

  const handleCompleteWithEpis = async (orderId: string, epiIds: string[]) => {
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

  const getTechnicianNames = (techIds: string[]) => {
    return techIds.map(id => technicians.find(t => t.id === id)?.name || '').filter(Boolean).join(', ');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "bg-red-100 text-red-800 border-red-200";
      case "Média": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Baixa": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Em Andamento": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Concluída": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'Pendente');
  const inProgressOrders = orders.filter(o => o.status === 'Em Andamento');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Ordens de Serviço</h1>
        <p className="text-muted-foreground">Ordens de serviço atribuídas a você</p>
      </div>

      {/* Pending Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Pendentes ({pendingOrders.length})
        </h2>
        {pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma ordem pendente
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{order.equipment}</CardTitle>
                    <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{order.description || 'Sem descrição'}</p>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Setor:</span> {order.sector}</p>
                    <p><span className="font-medium">Solicitante:</span> {order.requester}</p>
                    <p><span className="font-medium">Prazo:</span> {new Date(order.suggestedDeadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  <Button 
                    className="w-full mt-2" 
                    onClick={() => handleStartOrder(order.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Ordem
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* In Progress Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-600" />
          Em Andamento ({inProgressOrders.length})
        </h2>
        {inProgressOrders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma ordem em andamento
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressOrders.map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{order.equipment}</CardTitle>
                    <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{order.description || 'Sem descrição'}</p>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Setor:</span> {order.sector}</p>
                    <p><span className="font-medium">Solicitante:</span> {order.requester}</p>
                    <p><span className="font-medium">Prazo:</span> {new Date(order.suggestedDeadline).toLocaleDateString('pt-BR')}</p>
                    {order.assignedTechnicians.length > 0 && (
                      <p><span className="font-medium">Técnicos:</span> {getTechnicianNames(order.assignedTechnicians)}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  <Button 
                    className="w-full mt-2" 
                    variant="default"
                    onClick={() => handleCompleteOrder(order.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Concluir Ordem
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <StartOrderDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        orderId={orderToStart || ''}
        technicians={technicians}
        onStart={(orderId, techIds) => {
          handleStartWithTechnicians(orderId, techIds);
          setStartDialogOpen(false);
          setOrderToStart(null);
        }}
      />

      <CompleteOrderDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        orderId={orderToComplete || ''}
        onComplete={(orderId, epiIds) => {
          handleCompleteWithEpis(orderId, epiIds);
          setCompleteDialogOpen(false);
          setOrderToComplete(null);
        }}
      />
    </div>
  );
};

export default MyOrders;
