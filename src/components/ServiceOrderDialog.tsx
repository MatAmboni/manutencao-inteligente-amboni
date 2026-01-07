import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  type: "Elétrico" | "Mecânico";
}

interface AdminUser {
  id: string;
  full_name: string;
}

interface ServiceOrder {
  id: string;
  equipmentId?: string;
  equipment: string;
  description: string;
  status: "Pendente" | "Em Andamento" | "Concluída";
  priority: "Baixa" | "Média" | "Alta";
  sector: "Elétrico" | "Mecânico";
  executionTeam: "Interna" | "Externa";
  requestDate: string;
  suggestedDeadline: string;
  requester: string;
  assignedTechnicians?: string[];
  createdAt: string;
}

interface ServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment[];
  adminUsers: AdminUser[];
  order?: ServiceOrder;
  onSave: (order: {
    equipment: string;
    description: string;
    priority: "Baixa" | "Média" | "Alta";
    sector: "Elétrico" | "Mecânico";
    executionTeam: "Interna" | "Externa";
    requestDate: string;
    suggestedDeadline: string;
    requester: string;
    assignedTechnicians: string[];
    status: "Pendente" | "Em Andamento" | "Concluída";
  }) => void;
}

const ServiceOrderDialog = ({ open, onOpenChange, equipment, adminUsers, order, onSave }: ServiceOrderDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    equipment: "",
    description: "",
    status: "Pendente" as "Pendente" | "Em Andamento" | "Concluída",
    priority: "Média" as "Baixa" | "Média" | "Alta",
    sector: "Elétrico" as "Elétrico" | "Mecânico",
    executionTeam: "Interna" as "Interna" | "Externa",
    requestDate: new Date().toISOString().split("T")[0],
    suggestedDeadline: "",
    requester: "",
  });

  useEffect(() => {
    if (order && open) {
      setFormData({
        equipment: order.equipment,
        description: order.description,
        status: order.status,
        priority: order.priority,
        sector: order.sector,
        executionTeam: order.executionTeam,
        requestDate: order.requestDate,
        suggestedDeadline: order.suggestedDeadline,
        requester: order.requester,
      });
    } else if (!open) {
      setFormData({
        equipment: "",
        description: "",
        status: "Pendente",
        priority: "Média",
        sector: "Elétrico",
        executionTeam: "Interna",
        requestDate: new Date().toISOString().split('T')[0],
        suggestedDeadline: "",
        requester: "",
      });
    }
  }, [order, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipment || !formData.priority || !formData.sector || !formData.executionTeam || !formData.requester || !formData.suggestedDeadline) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      equipment: formData.equipment,
      description: formData.description,
      priority: formData.priority,
      sector: formData.sector,
      executionTeam: formData.executionTeam,
      requestDate: formData.requestDate,
      suggestedDeadline: formData.suggestedDeadline,
      requester: formData.requester,
      assignedTechnicians: order?.assignedTechnicians || [],
      status: formData.status,
    });

    toast({
      title: order ? "Ordem Atualizada" : "Ordem de Serviço Criada",
      description: order ? "A ordem foi atualizada com sucesso." : "A ordem foi registrada com sucesso.",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
          <DialogDescription>
            {order ? "Edite os dados da ordem de manutenção" : "Preencha os dados para criar uma nova ordem de manutenção"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipamento *</Label>
            <Select
              value={formData.equipment}
              onValueChange={(value) => {
                const selectedEquipment = equipment.find(eq => eq.name === value);
                setFormData({ 
                  ...formData, 
                  equipment: value,
                  sector: (selectedEquipment?.type || "Elétrico") as "Elétrico" | "Mecânico"
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.name}>
                    {eq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Setor *</Label>
            <Select
              value={formData.sector}
              onValueChange={(value) =>
                setFormData({ ...formData, sector: value as "Elétrico" | "Mecânico" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Elétrico">Elétrico</SelectItem>
                <SelectItem value="Mecânico">Mecânico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="executionTeam">Equipe Executora *</Label>
            <Select
              value={formData.executionTeam}
              onValueChange={(value) =>
                setFormData({ ...formData, executionTeam: value as "Interna" | "Externa" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Interna">Interna</SelectItem>
                <SelectItem value="Externa">Externa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value as "Baixa" | "Média" | "Alta" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestDate">Data da Solicitação *</Label>
              <Input
                id="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={(e) =>
                  setFormData({ ...formData, requestDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestedDeadline">Prazo Sugerido *</Label>
              <Input
                id="suggestedDeadline"
                type="date"
                value={formData.suggestedDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, suggestedDeadline: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requester">Solicitante (Administrador) *</Label>
            <Select
              value={formData.requester}
              onValueChange={(value) =>
                setFormData({ ...formData, requester: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o solicitante" />
              </SelectTrigger>
              <SelectContent>
                {adminUsers.map((admin) => (
                  <SelectItem key={admin.id} value={admin.full_name}>
                    {admin.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva o problema ou trabalho a ser realizado"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{order ? "Salvar" : "Criar Ordem"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceOrderDialog;
