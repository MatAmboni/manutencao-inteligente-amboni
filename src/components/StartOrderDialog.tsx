import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle2 } from "lucide-react";

interface EPI {
  id: string;
  name: string;
  description: string | null;
}

interface CompleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onComplete: (orderId: string, epiIds: string[]) => void;
}

const CompleteOrderDialog = ({ open, onOpenChange, orderId, onComplete }: CompleteOrderDialogProps) => {
  const { toast } = useToast();
  const [epis, setEpis] = useState<EPI[]>([]);
  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEpiName, setNewEpiName] = useState("");
  const [showNewEpiInput, setShowNewEpiInput] = useState(false);

  useEffect(() => {
    if (open) {
      loadEpis();
      setSelectedEpis([]);
    }
  }, [open]);

  const loadEpis = async () => {
    try {
      const { data, error } = await supabase
        .from('epis')
        .select('*')
        .order('name');

      if (error) throw error;
      setEpis(data || []);
    } catch (error) {
      console.error('Erro ao carregar EPIs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de EPIs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEpi = async () => {
    if (!newEpiName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('epis')
        .insert({ name: newEpiName.trim() })
        .select()
        .single();

      if (error) throw error;

      setEpis([...epis, data]);
      setNewEpiName("");
      setShowNewEpiInput(false);
      toast({
        title: "EPI cadastrado!",
        description: `${newEpiName} foi adicionado à lista.`,
      });
    } catch (error) {
      console.error('Erro ao cadastrar EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o EPI.",
        variant: "destructive",
      });
    }
  };

  const handleToggleEpi = (epiId: string) => {
    setSelectedEpis(prev => 
      prev.includes(epiId) 
        ? prev.filter(id => id !== epiId)
        : [...prev, epiId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(orderId, selectedEpis);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Concluir Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Selecione os EPIs que foram utilizados durante esta ordem de serviço
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>EPIs Utilizados</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando EPIs...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {epis.map((epi) => (
                  <div
                    key={epi.id}
                    className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      id={epi.id}
                      checked={selectedEpis.includes(epi.id)}
                      onCheckedChange={() => handleToggleEpi(epi.id)}
                    />
                    <label
                      htmlFor={epi.id}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {epi.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showNewEpiInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo EPI"
                value={newEpiName}
                onChange={(e) => setNewEpiName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEpi();
                  }
                }}
              />
              <Button type="button" onClick={handleAddEpi}>
                Adicionar
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewEpiInput(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowNewEpiInput(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Novo EPI
            </Button>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Concluir Ordem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteOrderDialog;
