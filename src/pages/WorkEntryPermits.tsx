import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WorkEntryPermitDialog from "@/components/WorkEntryPermitDialog";
import WorkEntryPermitViewDialog from "@/components/WorkEntryPermitViewDialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorkEntryPermit = any;

const WorkEntryPermits = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<WorkEntryPermit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permitToDelete, setPermitToDelete] = useState<WorkEntryPermit | null>(null);

  const queryClient = useQueryClient();

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["work-entry-permits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_entry_permits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkEntryPermit[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("work_entry_permits")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-entry-permits"] });
      toast.success("Permissão excluída com sucesso!");
      setDeleteDialogOpen(false);
      setPermitToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir permissão: " + error.message);
    },
  });

  const filteredPermits = permits.filter(
    (permit) =>
      permit.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.confined_space_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.work_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.entry_supervisor.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleEdit = (permit: WorkEntryPermit) => {
    setSelectedPermit(permit);
    setIsDialogOpen(true);
  };

  const handleView = (permit: WorkEntryPermit) => {
    setSelectedPermit(permit);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (permit: WorkEntryPermit) => {
    setPermitToDelete(permit);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedPermit(null);
  };

  const handleViewDialogClose = () => {
    setIsViewDialogOpen(false);
    setSelectedPermit(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Permissões de Entrada e Trabalho
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as PETs para espaços confinados
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Permissão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Permissões
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar permissões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPermits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Nenhuma permissão encontrada com os critérios de busca."
                : "Nenhuma permissão cadastrada ainda."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead>Trabalho</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermits.map((permit) => (
                    <TableRow key={permit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{permit.confined_space_location}</p>
                          {permit.confined_space_number && (
                            <p className="text-sm text-muted-foreground">
                              Nº {permit.confined_space_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[200px] truncate">{permit.work_description}</p>
                      </TableCell>
                      <TableCell>{permit.entry_supervisor}</TableCell>
                      <TableCell>
                        {format(new Date(permit.issue_datetime), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(permit.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(permit)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(permit)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(permit)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkEntryPermitDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        permit={selectedPermit}
      />

      <WorkEntryPermitViewDialog
        open={isViewDialogOpen}
        onOpenChange={handleViewDialogClose}
        permit={selectedPermit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta permissão de entrada? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => permitToDelete && deleteMutation.mutate(permitToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkEntryPermits;
