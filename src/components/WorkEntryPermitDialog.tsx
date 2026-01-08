import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  confined_space_location: z.string().min(1, "Local é obrigatório"),
  confined_space_number: z.string().optional(),
  issue_datetime: z.string().min(1, "Data de emissão é obrigatória"),
  end_datetime: z.string().optional(),
  work_description: z.string().min(1, "Descrição do trabalho é obrigatória"),
  status: z.string().default("Ativo"),
  authorized_workers: z.string().optional(),
  guard: z.string().min(1, "Vigia é obrigatório"),
  rescue_team: z.string().min(1, "Equipe de resgate é obrigatória"),
  entry_supervisor: z.string().min(1, "Supervisor de entrada é obrigatório"),
  test_supervisor: z.string().optional(),
  isolation_completed: z.string().optional(),
  initial_test_time: z.string().optional(),
  initial_oxygen_percent: z.string().optional(),
  initial_flammable_percent: z.string().optional(),
  initial_toxic_ppm: z.string().optional(),
  initial_dust_mg: z.string().optional(),
  lockout_tagout: z.string().default("N/A"),
  purge_wash: z.string().default("N/A"),
  ventilation: z.string().default("N/A"),
  ventilation_equipment: z.string().optional(),
  ventilation_time: z.string().optional(),
  post_ventilation_test_time: z.string().optional(),
  post_oxygen_percent: z.string().optional(),
  post_oxygen_ok: z.string().default("N/A"),
  post_flammable_percent: z.string().optional(),
  post_flammable_ok: z.string().default("N/A"),
  post_toxic_ppm: z.string().optional(),
  post_dust_mg: z.string().optional(),
  general_lighting: z.string().default("N/A"),
  communication_procedure: z.string().default("N/A"),
  rescue_procedures: z.string().default("N/A"),
  vertical_movement: z.string().default("N/A"),
  training_current: z.string().default("N/A"),
  continuous_monitoring: z.string().default("N/A"),
  hot_work_permit: z.string().default("N/A"),
  flashlights: z.string().default("N/A"),
  protective_clothing: z.string().default("N/A"),
  fire_extinguishers: z.string().default("N/A"),
  helmets_boots_gloves: z.string().default("N/A"),
  respiratory_protection: z.string().default("N/A"),
  safety_belt_lifeline_workers: z.string().default("N/A"),
  safety_belt_lifeline_rescue: z.string().default("N/A"),
  ladder: z.string().default("N/A"),
  vertical_movement_equipment: z.string().default("N/A"),
  electronic_communication: z.string().default("N/A"),
  rescue_respiratory_equipment: z.string().default("N/A"),
  approved_electrical_equipment: z.string().default("N/A"),
  ambulance_contact: z.string().optional(),
  fire_department_contact: z.string().optional(),
  security_contact: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WorkEntryPermit {
  id: string;
  company_name: string;
  confined_space_location: string;
  confined_space_number: string | null;
  issue_datetime: string;
  end_datetime: string | null;
  work_description: string;
  status: string;
  entry_supervisor: string;
  guard: string;
  rescue_team: string;
  authorized_workers: string[];
  test_supervisor: string | null;
  isolation_completed: boolean | null;
  initial_test_time: string | null;
  initial_oxygen_percent: number | null;
  initial_flammable_percent: number | null;
  initial_toxic_ppm: number | null;
  initial_dust_mg: number | null;
  lockout_tagout: string | null;
  purge_wash: string | null;
  ventilation: string | null;
  ventilation_equipment: string | null;
  ventilation_time: string | null;
  post_ventilation_test_time: string | null;
  post_oxygen_percent: number | null;
  post_oxygen_ok: string | null;
  post_flammable_percent: number | null;
  post_flammable_ok: string | null;
  post_toxic_ppm: number | null;
  post_dust_mg: number | null;
  general_lighting: string | null;
  communication_procedure: string | null;
  rescue_procedures: string | null;
  vertical_movement: string | null;
  training_current: string | null;
  continuous_monitoring: string | null;
  hot_work_permit: string | null;
  equipment_checklist: Record<string, string> | null;
  ambulance_contact: string | null;
  fire_department_contact: string | null;
  security_contact: string | null;
  notes: string | null;
}

interface WorkEntryPermitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permit: WorkEntryPermit | null;
}

const NAOptions = ["N/A", "Sim", "Não"];

const WorkEntryPermitDialog = ({
  open,
  onOpenChange,
  permit,
}: WorkEntryPermitDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      confined_space_location: "",
      confined_space_number: "",
      issue_datetime: new Date().toISOString().slice(0, 16),
      end_datetime: "",
      work_description: "",
      status: "Ativo",
      authorized_workers: "",
      guard: "",
      rescue_team: "",
      entry_supervisor: "",
      test_supervisor: "",
      isolation_completed: "N/A",
      lockout_tagout: "N/A",
      purge_wash: "N/A",
      ventilation: "N/A",
      general_lighting: "N/A",
      communication_procedure: "N/A",
      rescue_procedures: "N/A",
      vertical_movement: "N/A",
      training_current: "N/A",
      continuous_monitoring: "N/A",
      hot_work_permit: "N/A",
      post_oxygen_ok: "N/A",
      post_flammable_ok: "N/A",
      flashlights: "N/A",
      protective_clothing: "N/A",
      fire_extinguishers: "N/A",
      helmets_boots_gloves: "N/A",
      respiratory_protection: "N/A",
      safety_belt_lifeline_workers: "N/A",
      safety_belt_lifeline_rescue: "N/A",
      ladder: "N/A",
      vertical_movement_equipment: "N/A",
      electronic_communication: "N/A",
      rescue_respiratory_equipment: "N/A",
      approved_electrical_equipment: "N/A",
    },
  });

  useEffect(() => {
    if (permit) {
      const equipmentChecklist = permit.equipment_checklist || {};
      form.reset({
        company_name: permit.company_name,
        confined_space_location: permit.confined_space_location,
        confined_space_number: permit.confined_space_number || "",
        issue_datetime: permit.issue_datetime.slice(0, 16),
        end_datetime: permit.end_datetime?.slice(0, 16) || "",
        work_description: permit.work_description,
        status: permit.status,
        authorized_workers: permit.authorized_workers?.join(", ") || "",
        guard: permit.guard,
        rescue_team: permit.rescue_team,
        entry_supervisor: permit.entry_supervisor,
        test_supervisor: permit.test_supervisor || "",
        isolation_completed: permit.isolation_completed === true ? "Sim" : permit.isolation_completed === false ? "Não" : "N/A",
        initial_test_time: permit.initial_test_time || "",
        initial_oxygen_percent: permit.initial_oxygen_percent?.toString() || "",
        initial_flammable_percent: permit.initial_flammable_percent?.toString() || "",
        initial_toxic_ppm: permit.initial_toxic_ppm?.toString() || "",
        initial_dust_mg: permit.initial_dust_mg?.toString() || "",
        lockout_tagout: permit.lockout_tagout || "N/A",
        purge_wash: permit.purge_wash || "N/A",
        ventilation: permit.ventilation || "N/A",
        ventilation_equipment: permit.ventilation_equipment || "",
        ventilation_time: permit.ventilation_time || "",
        post_ventilation_test_time: permit.post_ventilation_test_time || "",
        post_oxygen_percent: permit.post_oxygen_percent?.toString() || "",
        post_oxygen_ok: permit.post_oxygen_ok || "N/A",
        post_flammable_percent: permit.post_flammable_percent?.toString() || "",
        post_flammable_ok: permit.post_flammable_ok || "N/A",
        post_toxic_ppm: permit.post_toxic_ppm?.toString() || "",
        post_dust_mg: permit.post_dust_mg?.toString() || "",
        general_lighting: permit.general_lighting || "N/A",
        communication_procedure: permit.communication_procedure || "N/A",
        rescue_procedures: permit.rescue_procedures || "N/A",
        vertical_movement: permit.vertical_movement || "N/A",
        training_current: permit.training_current || "N/A",
        continuous_monitoring: permit.continuous_monitoring || "N/A",
        hot_work_permit: permit.hot_work_permit || "N/A",
        flashlights: equipmentChecklist.flashlights || "N/A",
        protective_clothing: equipmentChecklist.protective_clothing || "N/A",
        fire_extinguishers: equipmentChecklist.fire_extinguishers || "N/A",
        helmets_boots_gloves: equipmentChecklist.helmets_boots_gloves || "N/A",
        respiratory_protection: equipmentChecklist.respiratory_protection || "N/A",
        safety_belt_lifeline_workers: equipmentChecklist.safety_belt_lifeline_workers || "N/A",
        safety_belt_lifeline_rescue: equipmentChecklist.safety_belt_lifeline_rescue || "N/A",
        ladder: equipmentChecklist.ladder || "N/A",
        vertical_movement_equipment: equipmentChecklist.vertical_movement_equipment || "N/A",
        electronic_communication: equipmentChecklist.electronic_communication || "N/A",
        rescue_respiratory_equipment: equipmentChecklist.rescue_respiratory_equipment || "N/A",
        approved_electrical_equipment: equipmentChecklist.approved_electrical_equipment || "N/A",
        ambulance_contact: permit.ambulance_contact || "",
        fire_department_contact: permit.fire_department_contact || "",
        security_contact: permit.security_contact || "",
        notes: permit.notes || "",
      });
    } else {
      form.reset({
        company_name: "",
        confined_space_location: "",
        confined_space_number: "",
        issue_datetime: new Date().toISOString().slice(0, 16),
        end_datetime: "",
        work_description: "",
        status: "Ativo",
        authorized_workers: "",
        guard: "",
        rescue_team: "",
        entry_supervisor: "",
        test_supervisor: "",
        isolation_completed: "N/A",
        lockout_tagout: "N/A",
        purge_wash: "N/A",
        ventilation: "N/A",
        general_lighting: "N/A",
        communication_procedure: "N/A",
        rescue_procedures: "N/A",
        vertical_movement: "N/A",
        training_current: "N/A",
        continuous_monitoring: "N/A",
        hot_work_permit: "N/A",
        post_oxygen_ok: "N/A",
        post_flammable_ok: "N/A",
        flashlights: "N/A",
        protective_clothing: "N/A",
        fire_extinguishers: "N/A",
        helmets_boots_gloves: "N/A",
        respiratory_protection: "N/A",
        safety_belt_lifeline_workers: "N/A",
        safety_belt_lifeline_rescue: "N/A",
        ladder: "N/A",
        vertical_movement_equipment: "N/A",
        electronic_communication: "N/A",
        rescue_respiratory_equipment: "N/A",
        approved_electrical_equipment: "N/A",
      });
    }
  }, [permit, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const workers = data.authorized_workers
        ? data.authorized_workers.split(",").map((w) => w.trim()).filter(Boolean)
        : [];

      const equipmentChecklist = {
        flashlights: data.flashlights,
        protective_clothing: data.protective_clothing,
        fire_extinguishers: data.fire_extinguishers,
        helmets_boots_gloves: data.helmets_boots_gloves,
        respiratory_protection: data.respiratory_protection,
        safety_belt_lifeline_workers: data.safety_belt_lifeline_workers,
        safety_belt_lifeline_rescue: data.safety_belt_lifeline_rescue,
        ladder: data.ladder,
        vertical_movement_equipment: data.vertical_movement_equipment,
        electronic_communication: data.electronic_communication,
        rescue_respiratory_equipment: data.rescue_respiratory_equipment,
        approved_electrical_equipment: data.approved_electrical_equipment,
      };

      const payload = {
        company_name: data.company_name,
        confined_space_location: data.confined_space_location,
        confined_space_number: data.confined_space_number || null,
        issue_datetime: data.issue_datetime,
        end_datetime: data.end_datetime || null,
        work_description: data.work_description,
        status: data.status,
        authorized_workers: workers,
        guard: data.guard,
        rescue_team: data.rescue_team,
        entry_supervisor: data.entry_supervisor,
        test_supervisor: data.test_supervisor || null,
        isolation_completed: data.isolation_completed === "Sim" ? true : data.isolation_completed === "Não" ? false : null,
        initial_test_time: data.initial_test_time || null,
        initial_oxygen_percent: data.initial_oxygen_percent ? parseFloat(data.initial_oxygen_percent) : null,
        initial_flammable_percent: data.initial_flammable_percent ? parseFloat(data.initial_flammable_percent) : null,
        initial_toxic_ppm: data.initial_toxic_ppm ? parseFloat(data.initial_toxic_ppm) : null,
        initial_dust_mg: data.initial_dust_mg ? parseFloat(data.initial_dust_mg) : null,
        lockout_tagout: data.lockout_tagout,
        purge_wash: data.purge_wash,
        ventilation: data.ventilation,
        ventilation_equipment: data.ventilation_equipment || null,
        ventilation_time: data.ventilation_time || null,
        post_ventilation_test_time: data.post_ventilation_test_time || null,
        post_oxygen_percent: data.post_oxygen_percent ? parseFloat(data.post_oxygen_percent) : null,
        post_oxygen_ok: data.post_oxygen_ok,
        post_flammable_percent: data.post_flammable_percent ? parseFloat(data.post_flammable_percent) : null,
        post_flammable_ok: data.post_flammable_ok,
        post_toxic_ppm: data.post_toxic_ppm ? parseFloat(data.post_toxic_ppm) : null,
        post_dust_mg: data.post_dust_mg ? parseFloat(data.post_dust_mg) : null,
        general_lighting: data.general_lighting,
        communication_procedure: data.communication_procedure,
        rescue_procedures: data.rescue_procedures,
        vertical_movement: data.vertical_movement,
        training_current: data.training_current,
        continuous_monitoring: data.continuous_monitoring,
        hot_work_permit: data.hot_work_permit,
        equipment_checklist: equipmentChecklist,
        ambulance_contact: data.ambulance_contact || null,
        fire_department_contact: data.fire_department_contact || null,
        security_contact: data.security_contact || null,
        notes: data.notes || null,
      };

      if (permit) {
        const { error } = await supabase
          .from("work_entry_permits")
          .update(payload)
          .eq("id", permit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("work_entry_permits").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-entry-permits"] });
      toast.success(
        permit ? "Permissão atualizada com sucesso!" : "Permissão criada com sucesso!"
      );
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar permissão: " + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const SelectNAField = ({ name, label }: { name: keyof FormData; label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {NAOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {permit ? "Editar Permissão de Entrada" : "Nova Permissão de Entrada"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="identification" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="identification">Identificação</TabsTrigger>
                  <TabsTrigger value="personnel">Pessoal</TabsTrigger>
                  <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
                  <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
                  <TabsTrigger value="emergency">Emergência</TabsTrigger>
                </TabsList>

                <TabsContent value="identification" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="confined_space_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local do Espaço Confinado *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confined_space_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Espaço Confinado Nº</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issue_datetime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Horário de Emissão *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_datetime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Horário de Término</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="work_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trabalho a ser Realizado *</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Encerrado">Encerrado</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="personnel" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="authorized_workers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trabalhadores Autorizados (separados por vírgula)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} placeholder="Nome 1, Nome 2, Nome 3" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vigia *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rescue_team"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipe de Resgate *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entry_supervisor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor de Entrada *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="test_supervisor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor de Testes</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="procedures" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Procedimentos Antes da Entrada</h3>
                    <SelectNAField name="isolation_completed" label="1. Isolamento" />
                    
                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="font-medium">2. Teste Inicial da Atmosfera</h4>
                      <FormField
                        control={form.control}
                        name="initial_test_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="initial_oxygen_percent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Oxigênio (% O2)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="initial_flammable_percent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inflamáveis (% LIE)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="initial_toxic_ppm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gases/Vapores Tóxicos (PPM)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="initial_dust_mg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poeiras/Fumos/Névoas (Mg/m³)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <SelectNAField name="lockout_tagout" label="3. Bloqueios, Travamentos e Etiquetagens" />
                    <SelectNAField name="purge_wash" label="4. Purga e/ou Lavagem" />
                    <SelectNAField name="ventilation" label="5. Ventilação/Exaustão" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ventilation_equipment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo/Equipamento de Ventilação</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ventilation_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tempo de Ventilação</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="font-medium">6. Teste Após Ventilação e Isolamento</h4>
                      <FormField
                        control={form.control}
                        name="post_ventilation_test_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="post_oxygen_percent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Oxigênio (% O2) - deve ser &gt;19,5% &lt;23%</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SelectNAField name="post_oxygen_ok" label="Oxigênio OK?" />
                        <FormField
                          control={form.control}
                          name="post_flammable_percent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inflamáveis (% LIE) - deve ser &lt;10%</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SelectNAField name="post_flammable_ok" label="Inflamáveis OK?" />
                        <FormField
                          control={form.control}
                          name="post_toxic_ppm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gases/Vapores Tóxicos (PPM)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="post_dust_mg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poeiras/Fumos/Névoas (Mg/m³)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <SelectNAField name="general_lighting" label="7. Iluminação Geral" />
                    <SelectNAField name="communication_procedure" label="8. Procedimento de Comunicação" />
                    <SelectNAField name="rescue_procedures" label="9. Procedimentos de Resgate" />
                    <SelectNAField name="vertical_movement" label="10. Procedimentos e Proteção de Movimentação Vertical" />
                    <SelectNAField name="training_current" label="11. Treinamento de Todos os Trabalhadores Atual?" />
                    <SelectNAField name="continuous_monitoring" label="12. Monitoramento Contínuo de Gases" />
                    <SelectNAField name="hot_work_permit" label="Permissão de Trabalhos a Quente" />
                  </div>
                </TabsContent>

                <TabsContent value="equipment" className="space-y-4 mt-4">
                  <h3 className="font-semibold">13. Equipamentos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <SelectNAField name="flashlights" label="Lanternas" />
                    <SelectNAField name="protective_clothing" label="Roupa de Proteção" />
                    <SelectNAField name="fire_extinguishers" label="Extintores de Incêndio" />
                    <SelectNAField name="helmets_boots_gloves" label="Capacetes, Botas, Luvas" />
                    <SelectNAField name="respiratory_protection" label="Equipamentos de Proteção Respiratória" />
                    <SelectNAField name="safety_belt_lifeline_workers" label="Cinturão de Segurança - Trabalhadores" />
                    <SelectNAField name="safety_belt_lifeline_rescue" label="Cinturão de Segurança - Resgate" />
                    <SelectNAField name="ladder" label="Escada" />
                    <SelectNAField name="vertical_movement_equipment" label="Equipamentos de Movimentação Vertical" />
                    <SelectNAField name="electronic_communication" label="Equipamentos de Comunicação Eletrônica" />
                    <SelectNAField name="rescue_respiratory_equipment" label="Proteção Respiratória - Resgate" />
                    <SelectNAField name="approved_electrical_equipment" label="Equipamentos Elétricos Aprovados INMETRO" />
                  </div>
                </TabsContent>

                <TabsContent value="emergency" className="space-y-4 mt-4">
                  <h3 className="font-semibold">Contatos de Emergência</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="ambulance_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ambulância</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telefone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fire_department_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bombeiros</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telefone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="security_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segurança</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telefone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Adicionais</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {permit ? "Salvar Alterações" : "Criar Permissão"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default WorkEntryPermitDialog;
