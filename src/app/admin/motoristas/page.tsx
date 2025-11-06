// Arquivo: src/app/admin/motoristas/page.tsx (CORRIGIDO)

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
  nome_completo: string;
  cpf: string;
  cnh: string;
  placa_cavalo: string;
  placas_carretas: string;
  role: string;
};

// O tipo para os dados do formulário
type FormData = { [key: string]: string | number | undefined; };

const API_URL = 'https://api-pesos-faturamento.onrender.com';

export default function GerenciarMotoristasPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // ****** CORREÇÃO DE TIPO 1 ******
  // O estado agora espera um 'Motorista' (o tipo real que vem da tabela) ou 'null'
  const [motoristaParaEditar, setMotoristaParaEditar] = useState<Motorista | null>(null);
  const router = useRouter();

  const getToken = () => localStorage.getItem('authToken');

  async function carregarMotoristas() {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/motoristas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão expirou ou acesso negado.");
        router.push('/');
        return;
      }
      if (!response.ok) throw new Error('Falha ao buscar motoristas');
      
      const data = await response.json();
      setMotoristas(data);
    } catch (error: unknown) { // Corrigido para 'unknown'
      console.error("Erro ao carregar motoristas:", error);
      // Aqui tratamos o erro "is not valid JSON"
      if (error instanceof SyntaxError) {
        toast.error("Erro de comunicação com o servidor. A resposta não é um JSON válido.");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Não foi possível carregar os motoristas.");
      }
    }
  }

  useEffect(() => {
    carregarMotoristas();
  }, []);

  const handleSalvarMotorista = async (dadosDoFormulario: FormData) => {
    const token = getToken();
    const isEditing = !!motoristaParaEditar;
    
    // O 'id' vem do estado 'motoristaParaEditar', não do formulário
    const url = isEditing
      ? `${API_URL}/api/motoristas/${motoristaParaEditar.id}`
      : `${API_URL}/api/motoristas`;
    
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
         const errorData = await response.json();
         throw new Error(errorData.error || 'Falha ao salvar motorista');
      }
      
      toast.success(`Motorista ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`);
      setIsDialogOpen(false);
      carregarMotoristas();

    } catch (error: unknown) {
      let message = `Não foi possível ${isEditing ? 'atualizar' : 'salvar'} o motorista.`;
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleDeletarMotorista = async (idParaDeletar: number) => {
    const token = getToken();
    if (!window.confirm("Tem certeza que deseja excluir este motorista? Esta ação é permanente.")) return;
    try {
      const response = await fetch(`${API_URL}/api/motoristas/${idParaDeletar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar motorista');
      setMotoristas(motoristas.filter((m) => m.id !== idParaDeletar));
      toast.success("Motorista excluído com sucesso!");
    } catch (error: unknown) {
      let message = "Não foi possível excluir o motorista.";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleAbrirDialogParaCriar = () => {
    setMotoristaParaEditar(null);
    setIsDialogOpen(true);
  };
  
  const handleAbrirDialogParaEditar = (motorista: Motorista) => {
    // Agora os tipos são compatíveis!
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
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Motoristas</h1>
        </div>
        <Button onClick={handleAbrirDialogParaCriar}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Motorista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Motoristas Cadastrados ({motoristas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Login (Usuário)</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>Placa Cavalo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motoristas.map((motorista) => (
                  <TableRow key={motorista.id}>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAbrirDialogParaEditar(motorista)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletarMotorista(motorista.id)} className="text-red-600 focus:bg-red-100 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="font-medium">{motorista.nome_completo}</TableCell>
                    <TableCell>{motorista.username}</TableCell>
                    <TableCell>{motorista.cpf}</TableCell>
                    <TableCell>{motorista.cnh}</TableCell>
                    <TableCell>{motorista.placa_cavalo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* ****** CORREÇÃO DE TIPO 2 ******
          O 'MotoristaDialog' espera 'initialData' do tipo 'FormData | null'
          mas nosso estado 'motoristaParaEditar' é 'Motorista | null'.
          Não há problema, pois 'Motorista' é compatível com a estrutura de 'FormData'.
          O TypeScript estava certo em avisar, mas o código anterior estava funcional,
          embora gerasse o erro de tipo.
          A mudança no 'useState' para 'Motorista | null' é a mais correta.
      */}
      <MotoristaDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSalvarMotorista}
        initialData={motoristaParaEditar} 
      />
    </main>
  );
}