import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WorkEntryPermitViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permit: any;
}

const equipmentLabels: Record<string, string> = {
  flashlights: "Lanternas",
  protective_clothing: "Roupa de Proteção",
  fire_extinguishers: "Extintores de Incêndio",
  helmets_boots_gloves: "Capacetes, Botas, Luvas",
  respiratory_protection: "Equipamentos de Proteção Respiratória",
  safety_belt_lifeline_workers: "Cinturão de Segurança - Trabalhadores",
  safety_belt_lifeline_rescue: "Cinturão de Segurança - Resgate",
  ladder: "Escada",
  vertical_movement_equipment: "Equipamentos de Movimentação Vertical",
  electronic_communication: "Equipamentos de Comunicação Eletrônica",
  rescue_respiratory_equipment: "Proteção Respiratória - Resgate",
  approved_electrical_equipment: "Equipamentos Elétricos Aprovados INMETRO",
};

const WorkEntryPermitViewDialog = ({
  open,
  onOpenChange,
  permit,
}: WorkEntryPermitViewDialogProps) => {
  if (!permit) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case "Encerrado":
        return <Badge variant="secondary">Encerrado</Badge>;
      case "Cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatNAValue = (value: string | null | undefined) => {
    if (!value || value === "N/A") return <span className="text-muted-foreground">N/A</span>;
    if (value === "Sim") return <Badge className="bg-green-500">Sim</Badge>;
    if (value === "Não") return <Badge variant="destructive">Não</Badge>;
    return value;
  };

  const formatBooleanValue = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">N/A</span>;
    if (value) return <Badge className="bg-green-500">Sim</Badge>;
    return <Badge variant="destructive">Não</Badge>;
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start py-1 border-b border-border/50">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || "-"}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Permissão de Entrada e Trabalho - PET
            {getStatusBadge(permit.status)}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
          <div className="space-y-6">
            <Section title="Identificação">
              <Field label="Nome da Empresa" value={permit.company_name} />
              <Field label="Local do Espaço Confinado" value={permit.confined_space_location} />
              <Field label="Espaço Confinado Nº" value={permit.confined_space_number} />
              <Field
                label="Data e Horário de Emissão"
                value={format(new Date(permit.issue_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              />
              {permit.end_datetime && (
                <Field
                  label="Data e Horário de Término"
                  value={format(new Date(permit.end_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                />
              )}
              <Field label="Trabalho a ser Realizado" value={permit.work_description} />
            </Section>

            <Separator />

            <Section title="Pessoal">
              <Field
                label="Trabalhadores Autorizados"
                value={permit.authorized_workers?.join(", ") || "-"}
              />
              <Field label="Vigia" value={permit.guard} />
              <Field label="Equipe de Resgate" value={permit.rescue_team} />
              <Field label="Supervisor de Entrada" value={permit.entry_supervisor} />
              <Field label="Supervisor de Testes" value={permit.test_supervisor} />
            </Section>

            <Separator />

            <Section title="Procedimentos Antes da Entrada">
              <Field label="1. Isolamento" value={formatBooleanValue(permit.isolation_completed)} />
              
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">2. Teste Inicial da Atmosfera</h4>
                <Field label="Horário" value={permit.initial_test_time} />
                <Field label="Oxigênio (% O2)" value={permit.initial_oxygen_percent} />
                <Field label="Inflamáveis (% LIE)" value={permit.initial_flammable_percent} />
                <Field label="Gases/Vapores Tóxicos (PPM)" value={permit.initial_toxic_ppm} />
                <Field label="Poeiras/Fumos/Névoas (Mg/m³)" value={permit.initial_dust_mg} />
              </div>

              <Field label="3. Bloqueios, Travamentos e Etiquetagens" value={formatNAValue(permit.lockout_tagout)} />
              <Field label="4. Purga e/ou Lavagem" value={formatNAValue(permit.purge_wash)} />
              <Field label="5. Ventilação/Exaustão" value={formatNAValue(permit.ventilation)} />
              {permit.ventilation_equipment && (
                <Field label="Tipo/Equipamento de Ventilação" value={permit.ventilation_equipment} />
              )}
              {permit.ventilation_time && (
                <Field label="Tempo de Ventilação" value={permit.ventilation_time} />
              )}

              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">6. Teste Após Ventilação</h4>
                <Field label="Horário" value={permit.post_ventilation_test_time} />
                <Field label="Oxigênio (% O2)" value={permit.post_oxygen_percent} />
                <Field label="Oxigênio OK (>19,5% <23%)" value={formatNAValue(permit.post_oxygen_ok)} />
                <Field label="Inflamáveis (% LIE)" value={permit.post_flammable_percent} />
                <Field label="Inflamáveis OK (<10%)" value={formatNAValue(permit.post_flammable_ok)} />
                <Field label="Gases/Vapores Tóxicos (PPM)" value={permit.post_toxic_ppm} />
                <Field label="Poeiras/Fumos/Névoas (Mg/m³)" value={permit.post_dust_mg} />
              </div>

              <Field label="7. Iluminação Geral" value={formatNAValue(permit.general_lighting)} />
              <Field label="8. Procedimento de Comunicação" value={formatNAValue(permit.communication_procedure)} />
              <Field label="9. Procedimentos de Resgate" value={formatNAValue(permit.rescue_procedures)} />
              <Field label="10. Proteção de Movimentação Vertical" value={formatNAValue(permit.vertical_movement)} />
              <Field label="11. Treinamento Atual" value={formatNAValue(permit.training_current)} />
              <Field label="12. Monitoramento Contínuo de Gases" value={formatNAValue(permit.continuous_monitoring)} />
              <Field label="Permissão de Trabalhos a Quente" value={formatNAValue(permit.hot_work_permit)} />
            </Section>

            <Separator />

            <Section title="13. Equipamentos">
              {permit.equipment_checklist &&
                Object.entries(permit.equipment_checklist).map(([key, value]) => (
                  <Field
                    key={key}
                    label={equipmentLabels[key] || key}
                    value={formatNAValue(value as string)}
                  />
                ))}
            </Section>

            <Separator />

            <Section title="Contatos de Emergência">
              <Field label="Ambulância" value={permit.ambulance_contact} />
              <Field label="Bombeiros" value={permit.fire_department_contact} />
              <Field label="Segurança" value={permit.security_contact} />
            </Section>

            {permit.notes && (
              <>
                <Separator />
                <Section title="Notas Adicionais">
                  <p className="text-sm">{permit.notes}</p>
                </Section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default WorkEntryPermitViewDialog;
