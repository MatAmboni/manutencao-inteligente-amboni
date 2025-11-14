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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Equipment {
  id: string;
  name: string;
  type: "Elétrico" | "Mecânico";
}

interface ServiceOrder {
  id: string;
  equipment: string;
  description: string;
  status: "Pendente" | "Em Andamento" | "Concluída";
  priority: "Baixa" | "Média" | "Alta";
  sector: "Elétrico" | "Mecânico";
  executionTeam: "Interna" | "Externa";
  requestDate: string;
  suggestedDeadline: string;
  requester: string;
  createdAt: string;
}

interface ServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment[];
  requesters: string[];
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
    status: "Pendente" | "Em Andamento" | "Concluída";
  }) => void;
}

const ServiceOrderDialog = ({ open, onOpenChange, equipment, requesters, order, onSave }: ServiceOrderDialogProps) => {
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
  const [requesterOpen, setRequesterOpen] = useState(false);
  const [availableRequesters, setAvailableRequesters] = useState<string[]>(requesters);
  const [newRequester, setNewRequester] = useState("");

  useEffect(() => {
    setAvailableRequesters(requesters);
  }, [requesters]);

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
      status: formData.status,
    });

    toast({
      title: "Ordem de Serviço Criada",
      description: "A ordem foi registrada com sucesso.",
    });
    
    onOpenChange(false);
    setFormData({
      equipment: "",
      description: "",
      status: "Pendente",
      priority: "Média",
      sector: "Elétrico",
      executionTeam: "Interna",
      requestDate: new Date().toISOString().split("T")[0],
      suggestedDeadline: "",
      requester: "",
    });
  };

  const handleRequesterSelect = (requester: string) => {
    if (requester === "add-new" && newRequester.trim()) {
      if (!availableRequesters.includes(newRequester.trim())) {
        setAvailableRequesters([...availableRequesters, newRequester.trim()]);
      }
      setFormData({ ...formData, requester: newRequester.trim() });
      setNewRequester("");
    } else {
      setFormData({ ...formData, requester });
    }
    setRequesterOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova ordem de manutenção
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
            <Label htmlFor="requester">Solicitante *</Label>
            <Popover open={requesterOpen} onOpenChange={setRequesterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={requesterOpen}
                  className="w-full justify-between"
                >
                  {formData.requester || "Selecione o solicitante"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar ou adicionar solicitante..." 
                    value={newRequester}
                    onValueChange={setNewRequester}
                  />
                  <CommandEmpty>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleRequesterSelect("add-new")}
                      >
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        Adicionar "{newRequester}"
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {availableRequesters.map((requester) => (
                      <CommandItem
                        key={requester}
                        value={requester}
                        onSelect={() => handleRequesterSelect(requester)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.requester === requester ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {requester}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Button type="submit">Criar Ordem</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceOrderDialog;
