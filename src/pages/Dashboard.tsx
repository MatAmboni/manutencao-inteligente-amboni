import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Wrench, AlertTriangle, CheckCircle2, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ServiceOrder {
  id: string;
  equipment_id: string;
  description: string | null;
  status: string;
  priority: string;
  sector: string;
  execution_team: string;
  request_date: string;
  suggested_deadline: string;
  requester: string;
  created_at: string | null;
  completed_at: string | null;
  equipment?: { name: string };
}

interface Risk {
  id: string;
  equipment_id: string;
  description: string;
  risk_level: string;
  type: string;
  status: string;
  equipment?: { name: string };
}

interface Equipment {
  id: string;
  name: string;
  status: string;
}

const Dashboard = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [ordersRes, risksRes, equipmentRes] = await Promise.all([
        supabase
          .from('service_orders')
          .select('*, equipment:equipment_id(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('risks')
          .select('*, equipment:equipment_id(name)')
          .eq('status', 'Ativo')
          .order('created_at', { ascending: false }),
        supabase
          .from('equipment')
          .select('*')
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (risksRes.data) setRisks(risksRes.data);
      if (equipmentRes.data) setEquipment(equipmentRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const openOrders = orders.filter(o => o.status !== "Concluída").length;
  const activeEquipment = equipment.filter(e => e.status === "Ativo").length;
  const activeRisks = risks.length;
  const completedThisMonth = orders.filter(o => {
    if (o.status !== "Concluída" || !o.completed_at) return false;
    const completedDate = new Date(o.completed_at);
    return completedDate >= monthStart && completedDate <= monthEnd;
  }).length;

  const stats = [
    {
      title: "Ordens Abertas",
      value: openOrders.toString(),
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      title: "Equipamentos Ativos",
      value: activeEquipment.toString(),
      icon: Wrench,
      color: "text-success",
    },
    {
      title: "Riscos Ativos",
      value: activeRisks.toString(),
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Concluídas (Mês)",
      value: completedThisMonth.toString(),
      icon: CheckCircle2,
      color: "text-success",
    },
  ];

  // Calculate average completion time
  const completedOrders = orders.filter(o => o.status === "Concluída" && o.completed_at && o.created_at);
  const averageCompletionTime = completedOrders.length > 0
    ? completedOrders.reduce((acc, order) => {
        const start = new Date(order.created_at!).getTime();
        const end = new Date(order.completed_at!).getTime();
        const days = Math.max(1, differenceInDays(end, start));
        return acc + days;
      }, 0) / completedOrders.length
    : 0;

  // Priority distribution data
  const priorityData = [
    { name: "Alta", value: orders.filter(o => o.priority === "Alta").length, fill: "hsl(var(--destructive))" },
    { name: "Média", value: orders.filter(o => o.priority === "Média").length, fill: "hsl(var(--warning))" },
    { name: "Baixa", value: orders.filter(o => o.priority === "Baixa").length, fill: "hsl(var(--success))" },
  ].filter(d => d.value > 0);

  // Status distribution data
  const statusData = [
    { name: "Pendente", value: orders.filter(o => o.status === "Pendente").length, fill: "hsl(var(--warning))" },
    { name: "Em Andamento", value: orders.filter(o => o.status === "Em Andamento").length, fill: "hsl(var(--primary))" },
    { name: "Concluída", value: orders.filter(o => o.status === "Concluída").length, fill: "hsl(var(--success))" },
  ].filter(d => d.value > 0);

  // Timeline data - group by date
  const timelineData = (() => {
    const data: { [key: string]: { date: string; pendente: number; andamento: number; concluida: number; sortDate: Date } } = {};
    
    orders.forEach(order => {
      if (!order.created_at) return;
      const orderDate = new Date(order.created_at);
      const dateKey = format(orderDate, 'dd/MM', { locale: ptBR });
      
      if (!data[dateKey]) {
        data[dateKey] = { date: dateKey, pendente: 0, andamento: 0, concluida: 0, sortDate: orderDate };
      }
      
      if (order.status === "Pendente") data[dateKey].pendente++;
      else if (order.status === "Em Andamento") data[dateKey].andamento++;
      else if (order.status === "Concluída") data[dateKey].concluida++;
    });

    return Object.values(data)
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .slice(-10) // Last 10 dates
      .map(({ sortDate, ...rest }) => rest);
  })();

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Critical/High risks
  const criticalRisks = risks
    .filter(r => r.risk_level === "Crítico" || r.risk_level === "Alto")
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente": return "bg-warning text-warning-foreground";
      case "Em Andamento": return "bg-primary text-primary-foreground";
      case "Concluída": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Crítico": return "bg-destructive text-destructive-foreground";
      case "Alto": return "bg-destructive text-destructive-foreground";
      case "Médio": return "bg-warning text-warning-foreground";
      case "Baixo": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {priorityData.length > 0 ? (
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
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ordens por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
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
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Linha do Tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
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
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
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
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {order.equipment?.name || 'Equipamento não encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {order.description || 'Sem descrição'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma ordem de serviço encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalRisks.length > 0 ? (
                criticalRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {risk.equipment?.name || 'Equipamento não encontrado'}
                      </p>
                      <p className="text-sm text-muted-foreground">{risk.type}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskColor(risk.risk_level)}`}>
                      {risk.risk_level}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum risco crítico ou alto ativo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
