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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play } from "lucide-react";

interface Technician {
  id: string;
  name: string;
}

interface StartOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  technicians: Technician[];
  onStart: (orderId: string, technicianIds: string[]) => void;
}

const StartOrderDialog = ({ open, onOpenChange, orderId, technicians, onStart }: StartOrderDialogProps) => {
  const { toast } = useToast();
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedTechnicians([]);
    }
  }, [open]);

  const handleToggleTechnician = (techId: string) => {
    setSelectedTechnicians(prev => 
      prev.includes(techId) 
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTechnicians.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um técnico responsável.",
        variant: "destructive",
      });
      return;
    }
    
    onStart(orderId, selectedTechnicians);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Iniciar Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Selecione os técnicos responsáveis por esta ordem de serviço
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Técnicos Responsáveis *</Label>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    id={tech.id}
                    checked={selectedTechnicians.includes(tech.id)}
                    onCheckedChange={() => handleToggleTechnician(tech.id)}
                  />
                  <label
                    htmlFor={tech.id}
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                  >
                    {tech.name}
                  </label>
                </div>
              ))}
            </div>
            {technicians.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum técnico cadastrado.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Iniciar Ordem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StartOrderDialog;
