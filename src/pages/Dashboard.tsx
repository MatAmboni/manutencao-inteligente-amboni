import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Ordens Abertas",
      value: "12",
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      title: "Equipamentos Ativos",
      value: "45",
      icon: Wrench,
      color: "text-success",
    },
    {
      title: "Riscos Identificados",
      value: "8",
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Concluídas (Mês)",
      value: "28",
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do sistema de manutenção
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ordens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: "OS-001", equip: "Compressor 01", status: "Em Andamento" },
                { id: "OS-002", equip: "Motor Elétrico 03", status: "Pendente" },
                { id: "OS-003", equip: "Painel de Controle", status: "Em Andamento" },
              ].map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.equip}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { equip: "Transformador A2", risk: "Alto", type: "Elétrico" },
                { equip: "Válvula de Pressão 5", risk: "Médio", type: "Mecânico" },
                { equip: "Disjuntor Principal", risk: "Alto", type: "Elétrico" },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{alert.equip}</p>
                    <p className="text-sm text-muted-foreground">{alert.type}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      alert.risk === "Alto"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-warning text-warning-foreground"
                    }`}
                  >
                    {alert.risk}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
