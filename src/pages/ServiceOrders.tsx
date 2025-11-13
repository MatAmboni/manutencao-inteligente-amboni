import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import ServiceOrderDialog from "@/components/ServiceOrderDialog";

interface ServiceOrder {
  id: string;
  equipment: string;
  description: string;
  status: "Pendente" | "Em Andamento" | "Concluída";
  priority: "Baixa" | "Média" | "Alta";
  sector: "Elétrico" | "Mecânico";
  createdAt: string;
}

const ServiceOrders = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orders] = useState<ServiceOrder[]>([
    {
      id: "OS-001",
      equipment: "Compressor 01",
      description: "Manutenção preventiva do sistema de refrigeração",
      status: "Em Andamento",
      priority: "Alta",
      sector: "Mecânico",
      createdAt: "2024-01-15",
    },
    {
      id: "OS-002",
      equipment: "Motor Elétrico 03",
      description: "Verificação de conexões e substituição de rolamentos",
      status: "Pendente",
      priority: "Média",
      sector: "Elétrico",
      createdAt: "2024-01-14",
    },
    {
      id: "OS-003",
      equipment: "Painel de Controle",
      description: "Atualização de firmware e teste de segurança",
      status: "Em Andamento",
      priority: "Alta",
      sector: "Elétrico",
      createdAt: "2024-01-13",
    },
  ]);

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
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Setor: {order.sector}</span>
                <span>•</span>
                <span>Criado em: {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ServiceOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default ServiceOrders;
