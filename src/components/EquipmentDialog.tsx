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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Equipment {
  id?: string;
  name: string;
  type: "Elétrico" | "Mecânico";
  status: "Operacional" | "Manutenção" | "Inativo";
  location: string;
  lastMaintenance: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
}

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | null;
  locations: string[];
  onSave: (equipment: Equipment | Omit<Equipment, "id">) => void;
}

const EquipmentDialog = ({ 
  open, 
  onOpenChange, 
  equipment, 
  locations,
  onSave 
}: EquipmentDialogProps) => {
  const [formData, setFormData] = useState<Omit<Equipment, "id">>({
    name: "",
    type: "Elétrico",
    location: "",
    status: "Operacional",
    lastMaintenance: new Date().toISOString().split("T")[0],
    manufacturer: "",
    model: "",
    serialNumber: "",
    installDate: "",
  });

  const [availableLocations, setAvailableLocations] = useState<string[]>(locations);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        type: equipment.type,
        location: equipment.location,
        status: equipment.status,
        lastMaintenance: equipment.lastMaintenance,
        manufacturer: equipment.manufacturer || "",
        model: equipment.model || "",
        serialNumber: equipment.serialNumber || "",
        installDate: equipment.installDate || "",
      });
    } else {
      setFormData({
        name: "",
        type: "Elétrico",
        location: "",
        status: "Operacional",
        lastMaintenance: new Date().toISOString().split("T")[0],
        manufacturer: "",
        model: "",
        serialNumber: "",
        installDate: "",
      });
    }
  }, [equipment, open]);

  useEffect(() => {
    setAvailableLocations(locations);
  }, [locations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (equipment?.id) {
      onSave({ ...formData, id: equipment.id });
    } else {
      onSave(formData);
    }
    
    onOpenChange(false);
  };

  const handleLocationSelect = (value: string) => {
    if (value === "__new__" && locationSearch.trim()) {
      const newLocation = locationSearch.trim();
      if (!availableLocations.includes(newLocation)) {
        setAvailableLocations([...availableLocations, newLocation]);
      }
      setFormData({ ...formData, location: newLocation });
      setLocationSearch("");
    } else {
      setFormData({ ...formData, location: value });
    }
    setLocationOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {equipment ? "Editar Equipamento" : "Novo Equipamento"}
          </DialogTitle>
          <DialogDescription>
            {equipment 
              ? "Atualize as informações do equipamento" 
              : "Cadastre um novo equipamento no sistema"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome do Equipamento *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Motor Elétrico 04"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "Elétrico" | "Mecânico") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elétrico">Elétrico</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Operacional" | "Manutenção" | "Inativo") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Localização *</Label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={locationOpen}
                    className="w-full justify-between"
                  >
                    {formData.location || "Selecione ou adicione uma localização..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar ou criar localização..." 
                      value={locationSearch}
                      onValueChange={setLocationSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            Nenhuma localização encontrada.
                          </p>
                          {locationSearch.trim() && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleLocationSelect("__new__")}
                            >
                              Criar "{locationSearch}"
                            </Button>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {availableLocations.map((location) => (
                          <CommandItem
                            key={location}
                            value={location}
                            onSelect={() => handleLocationSelect(location)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.location === location ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {location}
                          </CommandItem>
                        ))}
                        {locationSearch.trim() && !availableLocations.includes(locationSearch.trim()) && (
                          <CommandItem
                            value="__new__"
                            onSelect={() => handleLocationSelect("__new__")}
                            className="text-primary"
                          >
                            <span className="mr-2">+</span>
                            Criar "{locationSearch}"
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="Ex: WEG, Siemens, ABB"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="Ex: W22, GA 75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
                placeholder="Ex: SN-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installDate">Data de Instalação</Label>
              <Input
                id="installDate"
                type="date"
                value={formData.installDate}
                onChange={(e) =>
                  setFormData({ ...formData, installDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="lastMaintenance">Última Manutenção *</Label>
              <Input
                id="lastMaintenance"
                type="date"
                required
                value={formData.lastMaintenance}
                onChange={(e) =>
                  setFormData({ ...formData, lastMaintenance: e.target.value })
                }
              />
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
            <Button type="submit">
              {equipment ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDialog;
