// Arquivo: src/app/admin/motoristas/page.tsx (CORRIGIDO ERRO DE HYDRATION/WHITESPACE)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, PlusCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MotoristaDialog } from "@/components/app/MotoristaDialog"; 

// O tipo para os dados do motorista (usuário)
type Motorista = {
  id: number;
  username: string;
  nome_completo: string | null;
  cpf: string | null;
  cnh: string | null;
  placa_cavalo: string | null;
  placas_carretas: string | null;
  role: string;
};

type FormData = { [key: string]: string | number | undefined; };

const API_URL = 'https://api-pesos-faturamento.onrender.com';

export default function GerenciarMotoristasPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [motoristaParaEditar, setMotoristaParaEditar] = useState<Motorista | null>(null);
  const router = useRouter();

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  async function carregarMotoristas() {
    try {
      const token = getToken();
      // Rota correta (utilizadores)
      const response = await fetch(`${API_URL}/api/utilizadores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão expirou ou acesso negado.");
        router.push('/');
        return;
      }
      if (!response.ok) throw new Error('Falha ao buscar utilizadores');
      
      const data = await response.json();
      setMotoristas(data);
    } catch (error: unknown) { 
      console.error("Erro ao carregar motoristas:", error);
      let message = "Não foi possível carregar os utilizadores. Verifique o console para detalhes.";
      toast.error(message);
    }
  }

  useEffect(() => {
    carregarMotoristas();
  }, []);

  const handleSalvarMotorista = async (dadosDoFormulario: FormData) => {
    const token = getToken();
    const isEditing = !!motoristaParaEditar;
    
    const url = isEditing
      ? `${API_URL}/api/utilizadores/${motoristaParaEditar.id}`
      : `${API_URL}/api/utilizadores`;
    
    const method = isEditing ? 'PUT' : 'POST';

    if (isEditing && (!dadosDoFormulario.password || dadosDoFormulario.password === '')) {
      delete dadosDoFormulario.password;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dadosDoFormulario),
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: "Erro de rede ou servidor." }));
         throw new Error(errorData.error || 'Falha ao salvar utilizador');
      }
      
      toast.success(`Utilizador ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`);
      setIsDialogOpen(false);
      carregarMotoristas();

    } catch (error: unknown) {
      let message = `Não foi possível ${isEditing ? 'atualizar' : 'salvar'} o utilizador.`;
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleDeletarMotorista = async (idParaDeletar: number) => {
    const token = getToken();
    if (!window.confirm("Tem certeza que deseja excluir este utilizador? Esta ação é permanente.")) return;
    try {
      const response = await fetch(`${API_URL}/api/utilizadores/${idParaDeletar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar utilizador');
      setMotoristas(motoristas.filter((m) => m.id !== idParaDeletar));
      toast.success("Utilizador excluído com sucesso!");
    } catch (error: unknown) {
      let message = "Não foi possível excluir o utilizador.";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleAbrirDialogParaCriar = () => {
    setMotoristaParaEditar(null);
    setIsDialogOpen(true);
  };
  
  const handleAbrirDialogParaEditar = (motorista: Motorista) => {
    setMotoristaParaEditar(motorista);
    setIsDialogOpen(true);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Utilizadores</h1>
        </div>
        <Button onClick={handleAbrirDialogParaCriar}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Utilizador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilizadores Cadastrados ({motoristas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Login (Usuário)</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>Placa Cavalo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ****** CORREÇÃO DO ERRO DE WHITESPACE/HYDRATION AQUI ****** */}
                {motoristas.map((motorista) => (
                  <TableRow key={motorista.id}>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAbrirDialogParaEditar(motorista)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletarMotorista(motorista.id)} className="text-red-600 focus:bg-red-100 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="font-medium">{motorista.nome_completo || '-'}</TableCell>
                    <TableCell>{motorista.username || '-'}</TableCell>
                    <TableCell>{motorista.role || '-'}</TableCell>
                    <TableCell>{motorista.cpf || '-'}</TableCell>
                    <TableCell>{motorista.cnh || '-'}</TableCell>
                    <TableCell>{motorista.placa_cavalo || '-'}</TableCell>
                  </TableRow>
                ))}
                {/* ****** FIM DA CORREÇÃO ****** */}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <MotoristaDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSalvarMotorista}
        initialData={motoristaParaEditar}
      />
    </main>
  );
}