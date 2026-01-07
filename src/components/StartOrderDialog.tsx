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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, AlertTriangle } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  user_id?: string;
}

interface StartOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  technicians: Technician[];
  onStart: (orderId: string, technicianIds: string[]) => void;
}

const SAFETY_TERMS = `Para tarefas que envolvem trabalho em altura em espaço externo foi observado as condições climáticas como ausência de chuva, granizo, neve, velocidade do vento confirmado que está abaixo de 30km/h para realizar a atividade com segurança?

Todos envolvidos na tarefa estão cientes dos riscos de trabalho em altura e providenciaram os EPIS e EPCS necessários para realizar a atividade com segurança, aplicando técnicas de prevenção utilizando escadas amarradas, linha de vida, cinto paraquedista com talabarte duplo em Y clipado no trava quedas preso a linha de vida ou guarda corpos ou escadas, estando o tempo todo clipado em um ponto de ancoragem por um ou mais talabartes de segurança?

Todos envolvidos na tarefa estão cientes de possíveis riscos envolvendo eletricidade e providenciaram os EPIS e EPCS necessários para realizar a atividade com segurança, aplicando técnicas de prevenção utilizando a desenergização dos equipamentos em manutenção fazendo a desenergização, impedimento de energização, bloqueio, seccionamento, aterramento temporário, multiteste com aparelho voltímetro, amperímetro, detector de tensão e detector de corrente, e se detectar fazer os passos anteriores até desenergizar por completo o equipamento em manutenção?

Todos envolvidos na tarefa possuem capacitação, habilitação e foram orientados a fazer as atividades com segurança?

Todos envolvidos na tarefa possuem aptidão para a atividade conforme exames e atestado médico em dia?

Atividades envolvendo serviços a quente e/ou soldas, foi observado e providenciaram os EPIS e EPCS necessários para realizar a atividade com segurança, aplicando técnicas de prevenção utilizando os EPIS para altas temperaturas, mascaras, óculos, luvas, aventais, assim como EPC como exaustão e ventilação, sinalização, como também foi observado e retirado do local todo e qualquer material inflamável ou explosivo?

Todos envolvidos na tarefa analisaram as condições e os riscos de cada etapa da tarefa e estão cientes de possíveis riscos e providenciaram o uso dos EPIS (calçados de proteção, aventais, protetor facial, luvas, creme de proteção para as mãos, respirador, cinto paraquedista com talabarte duplo em Y clipado a trava quedas fixado em linhas de vida, óculos de proteção incolor, óculos de proteção escuros com filtros UVA/UVB, creme de proteção solar com filtros UVA/UVB fator 30 FPS ou superior, mascara de solda, capacete com jugular, e demais EPIS relacionados aos riscos inerentes da atividade) e farão as atividades utilizando os EPIS para neutralizar os possíveis riscos da atividade?`;

const StartOrderDialog = ({ open, onOpenChange, orderId, technicians, onStart }: StartOrderDialogProps) => {
  const { toast } = useToast();
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTechnicians([]);
      setTermsAccepted(false);
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

    if (!termsAccepted) {
      toast({
        title: "Atenção",
        description: "Você deve aceitar os termos de segurança para iniciar a ordem.",
        variant: "destructive",
      });
      return;
    }
    
    onStart(orderId, selectedTechnicians);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Iniciar Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Selecione os técnicos responsáveis e aceite os termos de segurança
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Técnicos Responsáveis *</Label>
            <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-y-auto p-1">
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <Label className="text-base font-semibold">Termos de Segurança</Label>
            </div>
            <div className="border rounded-lg bg-muted/30">
              <ScrollArea className="h-[200px] p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {SAFETY_TERMS}
                </p>
              </ScrollArea>
            </div>
            <div className="flex items-start space-x-3 p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                Declaro que li e estou ciente de todos os termos de segurança acima e confirmo que todas as condições foram verificadas e atendidas.
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!termsAccepted || selectedTechnicians.length === 0}>
              Iniciar Ordem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StartOrderDialog;
