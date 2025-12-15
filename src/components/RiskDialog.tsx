import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  type: string;
}

interface Risk {
  id: string;
  equipment_id: string;
  type: string;
  risk_level: string;
  description: string;
  recommendation: string;
  status: string;
  identified_at: string;
}

interface RiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: Risk | null;
  onSuccess: () => void;
}

const RiskDialog = ({ open, onOpenChange, risk, onSuccess }: RiskDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState({
    equipment_id: "",
    type: "Elétrico",
    risk_level: "Médio",
    description: "",
    recommendation: "",
    status: "Ativo",
    identified_at: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    if (risk) {
      setFormData({
        equipment_id: risk.equipment_id,
        type: risk.type,
        risk_level: risk.risk_level,
        description: risk.description,
        recommendation: risk.recommendation,
        status: risk.status,
        identified_at: risk.identified_at,
      });
    } else {
      setFormData({
        equipment_id: "",
        type: "Elétrico",
        risk_level: "Médio",
        description: "",
        recommendation: "",
        status: "Ativo",
        identified_at: new Date().toISOString().split("T")[0],
      });
    }
  }, [risk, open]);

  const loadEquipment = async () => {
    const { data } = await supabase
      .from("equipment")
      .select("id, name, type")
      .order("name");
    if (data) setEquipment(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipment_id || !formData.description || !formData.recommendation) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (risk) {
        const { error } = await supabase
          .from("risks")
          .update(formData)
          .eq("id", risk.id);
        
        if (error) throw error;
        toast({ title: "Risco atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from("risks")
          .insert(formData);
        
        if (error) throw error;
        toast({ title: "Risco registrado com sucesso" });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {risk ? "Editar Risco" : "Registrar Novo Risco"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Equipamento *</Label>
            <Select
              value={formData.equipment_id}
              onValueChange={(value) => setFormData({ ...formData, equipment_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name} ({eq.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Risco</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elétrico">Elétrico</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Risco</Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value) => setFormData({ ...formData, risk_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Crítico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Monitorando">Monitorando</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Identificação</Label>
              <Input
                type="date"
                value={formData.identified_at}
                onChange={(e) => setFormData({ ...formData, identified_at: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição do Risco *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o risco identificado..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Recomendação *</Label>
            <Textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              placeholder="Qual a ação recomendada..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : risk ? "Salvar Alterações" : "Registrar Risco"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RiskDialog;
