import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Wrench } from "lucide-react";

interface Risk {
  id: string;
  equipment: string;
  type: "Elétrico" | "Mecânico";
  riskLevel: "Baixo" | "Médio" | "Alto" | "Crítico";
  description: string;
  recommendation: string;
  identifiedAt: string;
}

const RiskAnalysis = () => {
  const risks: Risk[] = [
    {
      id: "R-001",
      equipment: "Transformador A2",
      type: "Elétrico",
      riskLevel: "Alto",
      description: "Superaquecimento detectado durante operação em carga máxima",
      recommendation: "Inspeção imediata do sistema de refrigeração e análise de óleo isolante",
      identifiedAt: "2024-01-15",
    },
    {
      id: "R-002",
      equipment: "Válvula de Pressão 5",
      type: "Mecânico",
      riskLevel: "Médio",
      description: "Desgaste acima do normal nos componentes de vedação",
      recommendation: "Programar substituição preventiva de vedações na próxima parada",
      identifiedAt: "2024-01-14",
    },
    {
      id: "R-003",
      equipment: "Disjuntor Principal",
      type: "Elétrico",
      riskLevel: "Crítico",
      description: "Falhas intermitentes no mecanismo de disparo automático",
      recommendation: "Substituição urgente do conjunto de disparo e teste completo do sistema",
      identifiedAt: "2024-01-13",
    },
    {
      id: "R-004",
      equipment: "Bomba Centrífuga 7",
      type: "Mecânico",
      riskLevel: "Baixo",
      description: "Vibração leve detectada em análise preditiva",
      recommendation: "Monitoramento contínuo e balanceamento preventivo",
      identifiedAt: "2024-01-12",
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Crítico":
        return "bg-destructive text-destructive-foreground";
      case "Alto":
        return "bg-destructive/80 text-destructive-foreground";
      case "Médio":
        return "bg-warning text-warning-foreground";
      case "Baixo":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    { label: "Riscos Críticos", value: risks.filter(r => r.riskLevel === "Crítico").length, color: "text-destructive" },
    { label: "Riscos Altos", value: risks.filter(r => r.riskLevel === "Alto").length, color: "text-destructive/80" },
    { label: "Riscos Médios", value: risks.filter(r => r.riskLevel === "Médio").length, color: "text-warning" },
    { label: "Riscos Baixos", value: risks.filter(r => r.riskLevel === "Baixo").length, color: "text-success" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Riscos</h1>
        <p className="text-muted-foreground mt-1">
          Monitoramento de riscos elétricos e mecânicos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {risks.map((risk) => (
          <Card key={risk.id} className="border-l-4" style={{
            borderLeftColor: risk.riskLevel === "Crítico" || risk.riskLevel === "Alto" 
              ? "hsl(var(--destructive))" 
              : risk.riskLevel === "Médio" 
              ? "hsl(var(--warning))" 
              : "hsl(var(--success))"
          }}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {risk.type === "Elétrico" ? (
                    <Zap className="h-6 w-6 text-warning" />
                  ) : (
                    <Wrench className="h-6 w-6 text-primary" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{risk.id}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {risk.equipment} • {risk.type}
                    </p>
                  </div>
                </div>
                <Badge className={getRiskColor(risk.riskLevel)}>
                  {risk.riskLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Descrição:</h4>
                <p className="text-sm text-muted-foreground">{risk.description}</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Recomendação:</h4>
                <p className="text-sm text-muted-foreground">{risk.recommendation}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Identificado em: {new Date(risk.identifiedAt).toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RiskAnalysis;
