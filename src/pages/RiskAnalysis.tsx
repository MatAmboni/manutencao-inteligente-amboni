import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, Wrench, FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const { toast } = useToast();
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório de Análise de Riscos", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);
    
    const tableData = risks.map(risk => [
      risk.id,
      risk.equipment,
      risk.type,
      risk.riskLevel,
      new Date(risk.identifiedAt).toLocaleDateString("pt-BR"),
      risk.description,
      risk.recommendation,
    ]);
    
    autoTable(doc, {
      head: [["ID", "Equipamento", "Tipo", "Nível", "Identificado em", "Descrição", "Recomendação"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
      columnStyles: {
        5: { cellWidth: 40 },
        6: { cellWidth: 40 },
      },
    });
    
    doc.save(`analise-riscos-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({
      title: "PDF exportado",
      description: "Relatório de análise de riscos exportado com sucesso",
    });
  };

  const exportToExcel = () => {
    const excelData = risks.map(risk => ({
      ID: risk.id,
      Equipamento: risk.equipment,
      Tipo: risk.type,
      "Nível de Risco": risk.riskLevel,
      "Identificado em": new Date(risk.identifiedAt).toLocaleDateString("pt-BR"),
      Descrição: risk.description,
      Recomendação: risk.recommendation,
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Análise de Riscos");
    
    XLSX.writeFile(wb, `analise-riscos-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({
      title: "Excel exportado",
      description: "Relatório de análise de riscos exportado com sucesso",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análise de Riscos</h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento de riscos elétricos e mecânicos
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
        </div>
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
