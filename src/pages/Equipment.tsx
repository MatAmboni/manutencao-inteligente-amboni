import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Zap } from "lucide-react";
import EquipmentDialog from "@/components/EquipmentDialog";

interface Equipment {
  id: string;
  name: string;
  type: "Elétrico" | "Mecânico";
  status: "Operacional" | "Manutenção" | "Inativo";
  location: string;
  lastMaintenance: string;
}

const Equipment = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [equipment] = useState<Equipment[]>([
    {
      id: "EQ-001",
      name: "Compressor 01",
      type: "Mecânico",
      status: "Manutenção",
      location: "Setor A - Linha 1",
      lastMaintenance: "2024-01-10",
    },
    {
      id: "EQ-002",
      name: "Motor Elétrico 03",
      type: "Elétrico",
      status: "Operacional",
      location: "Setor B - Linha 2",
      lastMaintenance: "2023-12-15",
    },
    {
      id: "EQ-003",
      name: "Painel de Controle",
      type: "Elétrico",
      status: "Operacional",
      location: "Sala de Controle",
      lastMaintenance: "2024-01-05",
    },
    {
      id: "EQ-004",
      name: "Válvula de Pressão 5",
      type: "Mecânico",
      status: "Operacional",
      location: "Setor C - Linha 3",
      lastMaintenance: "2024-01-08",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operacional":
        return "bg-success text-success-foreground";
      case "Manutenção":
        return "bg-warning text-warning-foreground";
      case "Inativo":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os equipamentos da planta
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Equipamento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {equipment.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {item.type === "Elétrico" ? (
                    <Zap className="h-5 w-5 text-warning" />
                  ) : (
                    <Wrench className="h-5 w-5 text-primary" />
                  )}
                  <CardTitle className="text-lg">{item.id}</CardTitle>
                </div>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tipo: {item.type}
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Local: {item.location}</p>
                <p>
                  Última manutenção:{" "}
                  {new Date(item.lastMaintenance).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Equipment;
