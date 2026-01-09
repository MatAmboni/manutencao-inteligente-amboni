import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const formatNAValueText = (value: string | null | undefined): string => {
    if (!value || value === "N/A") return "N/A";
    return value;
  };

  const formatBooleanValue = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">N/A</span>;
    if (value) return <Badge className="bg-green-500">Sim</Badge>;
    return <Badge variant="destructive">Não</Badge>;
  };

  const formatBooleanText = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return value ? "Sim" : "Não";
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PERMISSÃO DE ENTRADA E TRABALHO - PET", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // Status
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Status: ${permit.status}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Section 1: Identification
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICAÇÃO", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ["Nome da Empresa", permit.company_name || "-"],
        ["Local do Espaço Confinado", permit.confined_space_location || "-"],
        ["Espaço Confinado Nº", permit.confined_space_number || "-"],
        ["Data e Horário de Emissão", format(new Date(permit.issue_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })],
        ["Data e Horário de Término", permit.end_datetime ? format(new Date(permit.end_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"],
        ["Trabalho a ser Realizado", permit.work_description || "-"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Section 2: Personnel
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. PESSOAL", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ["Trabalhadores Autorizados", permit.authorized_workers?.join(", ") || "-"],
        ["Vigia", permit.guard || "-"],
        ["Equipe de Resgate", permit.rescue_team || "-"],
        ["Supervisor de Entrada", permit.entry_supervisor || "-"],
        ["Supervisor de Testes", permit.test_supervisor || "-"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Section 3: Procedures Before Entry
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. PROCEDIMENTOS ANTES DA ENTRADA", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ["1. Isolamento", formatBooleanText(permit.isolation_completed)],
        ["2. Teste Inicial - Horário", permit.initial_test_time || "-"],
        ["   Oxigênio (% O2)", permit.initial_oxygen_percent?.toString() || "-"],
        ["   Inflamáveis (% LIE)", permit.initial_flammable_percent?.toString() || "-"],
        ["   Gases/Vapores Tóxicos (PPM)", permit.initial_toxic_ppm?.toString() || "-"],
        ["   Poeiras/Fumos/Névoas (Mg/m³)", permit.initial_dust_mg?.toString() || "-"],
        ["3. Bloqueios, Travamentos e Etiquetagens", formatNAValueText(permit.lockout_tagout)],
        ["4. Purga e/ou Lavagem", formatNAValueText(permit.purge_wash)],
        ["5. Ventilação/Exaustão", formatNAValueText(permit.ventilation)],
        ["   Tipo/Equipamento", permit.ventilation_equipment || "-"],
        ["   Tempo de Ventilação", permit.ventilation_time || "-"],
        ["6. Teste Após Ventilação - Horário", permit.post_ventilation_test_time || "-"],
        ["   Oxigênio (% O2)", permit.post_oxygen_percent?.toString() || "-"],
        ["   Oxigênio OK (>19,5% <23%)", formatNAValueText(permit.post_oxygen_ok)],
        ["   Inflamáveis (% LIE)", permit.post_flammable_percent?.toString() || "-"],
        ["   Inflamáveis OK (<10%)", formatNAValueText(permit.post_flammable_ok)],
        ["   Gases/Vapores Tóxicos (PPM)", permit.post_toxic_ppm?.toString() || "-"],
        ["   Poeiras/Fumos/Névoas (Mg/m³)", permit.post_dust_mg?.toString() || "-"],
        ["7. Iluminação Geral", formatNAValueText(permit.general_lighting)],
        ["8. Procedimento de Comunicação", formatNAValueText(permit.communication_procedure)],
        ["9. Procedimentos de Resgate", formatNAValueText(permit.rescue_procedures)],
        ["10. Proteção de Movimentação Vertical", formatNAValueText(permit.vertical_movement)],
        ["11. Treinamento Atual", formatNAValueText(permit.training_current)],
        ["12. Monitoramento Contínuo de Gases", formatNAValueText(permit.continuous_monitoring)],
        ["Permissão de Trabalhos a Quente", formatNAValueText(permit.hot_work_permit)],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Section 4: Equipment
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("4. EQUIPAMENTOS", 14, yPos);
    yPos += 5;

    const equipmentData: string[][] = [];
    if (permit.equipment_checklist) {
      Object.entries(permit.equipment_checklist).forEach(([key, value]) => {
        equipmentData.push([equipmentLabels[key] || key, formatNAValueText(value as string)]);
      });
    }

    if (equipmentData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [],
        body: equipmentData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
      });

      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Section 5: Emergency Contacts
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("5. CONTATOS DE EMERGÊNCIA", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ["Ambulância", permit.ambulance_contact || "-"],
        ["Bombeiros", permit.fire_department_contact || "-"],
        ["Segurança", permit.security_contact || "-"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });

    // Notes
    if (permit.notes) {
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("6. NOTAS ADICIONAIS", 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: [[permit.notes]],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
      });
    }

    // Footer with date
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = `PET_${permit.confined_space_number || permit.id}_${format(new Date(permit.issue_datetime), "yyyyMMdd")}.pdf`;
    doc.save(fileName);
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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Permissão de Entrada e Trabalho - PET
              {getStatusBadge(permit.status)}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
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
