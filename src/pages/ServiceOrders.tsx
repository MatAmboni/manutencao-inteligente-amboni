import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import ServiceOrderDialog from "@/components/ServiceOrderDialog";

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
}

const ServiceOrders = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orders, setOrders] = useState<ServiceOrder[]>([
    {
      id: "OS-001",
      equipment: "Compressor 01",
      description: "Manutenção preventiva do sistema de refrigeração",
      status: "Em Andamento",
      priority: "Alta",
      sector: "Mecânico",
      executionTeam: "Interna",
      requestDate: "2024-01-15",
      suggestedDeadline: "2024-01-20",
      requester: "João Silva",
      createdAt: "2024-01-15",
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
  };

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
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem
        </Button>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
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

      <ServiceOrderDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        equipment={equipment}
        requesters={requesters}
        onSave={handleAddOrder}
      />
    </div>
  );
};

export default ServiceOrders;
