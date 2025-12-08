import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, X } from "lucide-react";

interface MultiTechnicianSelectProps {
  technicians: { id: string; name: string }[];
  selectedTechnicians: string[];
  onSelectionChange: (technicianIds: string[]) => void;
}

const MultiTechnicianSelect = ({
  technicians,
  selectedTechnicians,
  onSelectionChange,
}: MultiTechnicianSelectProps) => {
  const [open, setOpen] = useState(false);

  const handleToggle = (technicianId: string) => {
    const newSelection = selectedTechnicians.includes(technicianId)
      ? selectedTechnicians.filter((id) => id !== technicianId)
      : [...selectedTechnicians, technicianId];
    onSelectionChange(newSelection);
  };

  const handleRemove = (technicianId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedTechnicians.filter((id) => id !== technicianId));
  };

  const selectedTechnicianNames = technicians
    .filter((t) => selectedTechnicians.includes(t.id))
    .map((t) => t.name);

  return (
    <div className="space-y-2">
      <Label>Técnicos Responsáveis</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[40px] h-auto"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedTechnicianNames.length === 0 ? (
                <span className="text-muted-foreground">Selecione os técnicos</span>
              ) : (
                selectedTechnicianNames.map((name) => {
                  const tech = technicians.find((t) => t.name === name);
                  return tech ? (
                    <Badge
                      key={tech.id}
                      variant="secondary"
                      className="mr-1"
                    >
                      {name}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={(e) => handleRemove(tech.id, e)}
                      />
                    </Badge>
                  ) : null;
                })
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2" align="start">
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {technicians.map((technician) => (
              <div
                key={technician.id}
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => handleToggle(technician.id)}
              >
                <Checkbox
                  id={technician.id}
                  checked={selectedTechnicians.includes(technician.id)}
                  onCheckedChange={() => handleToggle(technician.id)}
                />
                <label
                  htmlFor={technician.id}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {technician.name}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultiTechnicianSelect;
