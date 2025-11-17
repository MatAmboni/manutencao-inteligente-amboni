import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Wrench, AlertTriangle, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

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

const Dashboard = () => {
  // Dados das ordens de serviço
  const orders: ServiceOrder[] = [
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
      executionTeam: "Interna",
      requestDate: "2024-01-08",
      suggestedDeadline: "2024-01-12",
      requester: "Pedro Lima",
      createdAt: "2024-01-08",
      completedAt: "2024-01-11",
    },
    {
      id: "OS-006",
      equipment: "Transformador A2",
      description: "Inspeção elétrica completa",
      status: "Em Andamento",
      priority: "Alta",
      sector: "Elétrico",
      executionTeam: "Externa",
      requestDate: "2024-01-16",
      suggestedDeadline: "2024-01-21",
      requester: "Mariana Souza",
      createdAt: "2024-01-16",
    },
  ];

  const stats = [
    {
      title: "Ordens Abertas",
      value: orders.filter(o => o.status !== "Concluída").length.toString(),
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
      value: orders.filter(o => o.status === "Concluída").length.toString(),
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  // Cálculo do tempo médio de conclusão
  const completedOrders = orders.filter(o => o.status === "Concluída" && o.completedAt);
  const averageCompletionTime = completedOrders.length > 0
    ? completedOrders.reduce((acc, order) => {
        const start = new Date(order.createdAt).getTime();
        const end = new Date(order.completedAt!).getTime();
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / completedOrders.length
    : 0;

  // Dados para gráfico de prioridade
  const priorityData = [
    { name: "Alta", value: orders.filter(o => o.priority === "Alta").length, fill: "hsl(var(--destructive))" },
    { name: "Média", value: orders.filter(o => o.priority === "Média").length, fill: "hsl(var(--warning))" },
    { name: "Baixa", value: orders.filter(o => o.priority === "Baixa").length, fill: "hsl(var(--success))" },
  ];

  // Dados para gráfico de status
  const statusData = [
    { name: "Pendente", value: orders.filter(o => o.status === "Pendente").length, fill: "hsl(var(--warning))" },
    { name: "Em Andamento", value: orders.filter(o => o.status === "Em Andamento").length, fill: "hsl(var(--primary))" },
    { name: "Concluída", value: orders.filter(o => o.status === "Concluída").length, fill: "hsl(var(--success))" },
  ];

  // Dados para gráfico de tempo
  const timelineData = (() => {
    const data: { [key: string]: { date: string; pendente: number; andamento: number; concluida: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!data[date]) {
        data[date] = { date, pendente: 0, andamento: 0, concluida: 0 };
      }
      
      if (order.status === "Pendente") data[date].pendente++;
      else if (order.status === "Em Andamento") data[date].andamento++;
      else if (order.status === "Concluída") data[date].concluida++;
    });

    return Object.values(data).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      return monthA === monthB ? dayA - dayB : monthA - monthB;
    });
  })();

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

      {/* Relatórios e Gráficos */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Relatórios e Gráficos</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          {/* Tempo Médio de Conclusão */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {averageCompletionTime.toFixed(1)} dias
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Baseado em {completedOrders.length} ordens concluídas
              </p>
            </CardContent>
          </Card>

          {/* Gráfico de Prioridades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ordens por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Linha do Tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pendente" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    name="Pendente"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="andamento" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Em Andamento"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="concluida" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Concluída"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ordens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.equipment}</p>
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
