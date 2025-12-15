import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Zap,
  Wrench,
  FileDown,
  FileSpreadsheet,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RiskDialog from "@/components/RiskDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Risk {
  id: string;
  equipment_id: string;
  type: string;
  risk_level: string;
  description: string;
  recommendation: string;
  status: string;
  identified_at: string;
  resolved_at: string | null;
  created_at: string;
  equipment: {
    name: string;
    type: string;
  };
}

const RiskAnalysis = () => {
  const { toast } = useToast();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("risks")
      .select("*, equipment(name, type)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar riscos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRisks(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const { error } = await supabase.from("risks").delete().eq("id", deleteId);
    
    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Risco excluído com sucesso" });
      loadRisks();
    }
    setDeleteId(null);
  };

  const handleResolve = async (risk: Risk) => {
    const { error } = await supabase
      .from("risks")
      .update({
        status: "Resolvido",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", risk.id);

    if (error) {
      toast({
        title: "Erro ao resolver",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Risco marcado como resolvido" });
      loadRisks();
    }
  };

  const filteredRisks = risks.filter((risk) => {
    const matchesSearch =
      risk.description.toLowerCase().includes(search.toLowerCase()) ||
      risk.equipment.name.toLowerCase().includes(search.toLowerCase()) ||
      risk.recommendation.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === "all" || risk.risk_level === filterLevel;
    const matchesType = filterType === "all" || risk.type === filterType;
    const matchesStatus = filterStatus === "all" || risk.status === filterStatus;
    return matchesSearch && matchesLevel && matchesType && matchesStatus;
  });

  const activeRisks = risks.filter((r) => r.status !== "Resolvido");
  const stats = [
    {
      label: "Riscos Críticos",
      value: activeRisks.filter((r) => r.risk_level === "Crítico").length,
      color: "text-destructive",
    },
    {
      label: "Riscos Altos",
      value: activeRisks.filter((r) => r.risk_level === "Alto").length,
      color: "text-destructive/80",
    },
    {
      label: "Riscos Médios",
      value: activeRisks.filter((r) => r.risk_level === "Médio").length,
      color: "text-warning",
    },
    {
      label: "Riscos Baixos",
      value: activeRisks.filter((r) => r.risk_level === "Baixo").length,
      color: "text-success",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "Monitorando":
        return "bg-warning/20 text-warning border-warning/30";
      case "Resolvido":
        return "bg-success/20 text-success border-success/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Análise de Riscos", 14, 20);

    doc.setFontSize(11);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);
    doc.text(`Total de Riscos Ativos: ${activeRisks.length}`, 14, 38);

    const tableData = filteredRisks.map((risk) => [
      risk.equipment.name,
      risk.type,
      risk.risk_level,
      risk.status,
      new Date(risk.identified_at).toLocaleDateString("pt-BR"),
      risk.description,
      risk.recommendation,
    ]);

    autoTable(doc, {
      head: [
        ["Equipamento", "Tipo", "Nível", "Status", "Identificado", "Descrição", "Recomendação"],
      ],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
      columnStyles: {
        5: { cellWidth: 35 },
        6: { cellWidth: 35 },
      },
    });

    doc.save(`analise-riscos-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({
      title: "PDF exportado",
      description: "Relatório de análise de riscos exportado com sucesso",
    });
  };

  const exportToExcel = () => {
    const excelData = filteredRisks.map((risk) => ({
      Equipamento: risk.equipment.name,
      "Tipo Equipamento": risk.equipment.type,
      "Tipo Risco": risk.type,
      "Nível de Risco": risk.risk_level,
      Status: risk.status,
      "Identificado em": new Date(risk.identified_at).toLocaleDateString("pt-BR"),
      "Resolvido em": risk.resolved_at
        ? new Date(risk.resolved_at).toLocaleDateString("pt-BR")
        : "-",
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
          <Button
            onClick={() => {
              setEditingRisk(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Risco
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
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar riscos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Níveis</SelectItem>
            <SelectItem value="Crítico">Crítico</SelectItem>
            <SelectItem value="Alto">Alto</SelectItem>
            <SelectItem value="Médio">Médio</SelectItem>
            <SelectItem value="Baixo">Baixo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="Elétrico">Elétrico</SelectItem>
            <SelectItem value="Mecânico">Mecânico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Monitorando">Monitorando</SelectItem>
            <SelectItem value="Resolvido">Resolvido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando riscos...</div>
      ) : filteredRisks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum risco encontrado</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingRisk(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Primeiro Risco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRisks.map((risk) => (
            <Card
              key={risk.id}
              className="border-l-4"
              style={{
                borderLeftColor:
                  risk.status === "Resolvido"
                    ? "hsl(var(--success))"
                    : risk.risk_level === "Crítico" || risk.risk_level === "Alto"
                    ? "hsl(var(--destructive))"
                    : risk.risk_level === "Médio"
                    ? "hsl(var(--warning))"
                    : "hsl(var(--success))",
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {risk.type === "Elétrico" ? (
                      <Zap className="h-6 w-6 text-warning" />
                    ) : (
                      <Wrench className="h-6 w-6 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{risk.equipment.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {risk.equipment.type} • {risk.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(risk.status)} variant="outline">
                      {risk.status}
                    </Badge>
                    <Badge className={getRiskColor(risk.risk_level)}>{risk.risk_level}</Badge>
                  </div>
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
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Identificado em: {new Date(risk.identified_at).toLocaleDateString("pt-BR")}
                    {risk.resolved_at && (
                      <> • Resolvido em: {new Date(risk.resolved_at).toLocaleDateString("pt-BR")}</>
                    )}
                  </p>
                  <div className="flex gap-2">
                    {risk.status !== "Resolvido" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-success hover:text-success"
                        onClick={() => handleResolve(risk)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(risk)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(risk.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RiskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        risk={editingRisk}
        onSuccess={loadRisks}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Risco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este risco? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RiskAnalysis;
