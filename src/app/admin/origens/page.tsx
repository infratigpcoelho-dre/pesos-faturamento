// Arquivo: src/app/admin/origens/page.tsx (NOVO)

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
import { OrigemDialog } from "@/components/app/OrigemDialog"; 

type Origem = {
  id: number;
  nome: string | null;
};

type FormData = { [key: string]: string | number | undefined; };

const API_URL = 'https://api-pesos-faturamento.onrender.com'; 

export default function GerenciarOrigensPage() {
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [origemParaEditar, setOrigemParaEditar] = useState<Origem | null>(null);
  const router = useRouter();

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  async function carregarOrigens() {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/origens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão expirou ou acesso negado.");
        router.push('/');
        return;
      }
      if (!response.ok) throw new Error('Falha ao buscar origens');
      
      const data = await response.json();
      setOrigens(data);
    } catch (error: unknown) { 
      console.error("Erro ao carregar origens:", error);
      toast.error("Não foi possível carregar as origens.");
    }
  }

  useEffect(() => {
    carregarOrigens();
  }, []);

  const handleSalvarOrigem = async (dadosDoFormulario: FormData) => {
    const token = getToken();
    const isEditing = !!origemParaEditar;
    
    const url = isEditing
      ? `${API_URL}/api/origens/${origemParaEditar.id}`
      : `${API_URL}/api/origens`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dadosDoFormulario),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Falha ao salvar origem');
      }
      
      toast.success(`Origem ${isEditing ? 'atualizada' : 'salva'} com sucesso!`);
      setIsDialogOpen(false);
      carregarOrigens();

    } catch (error: unknown) {
      let message = `Não foi possível salvar a origem.`;
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleDeletarOrigem = async (idParaDeletar: number) => {
    const token = getToken();
    if (!window.confirm("Tem certeza que deseja excluir esta origem?")) return;
    try {
      const response = await fetch(`${API_URL}/api/origens/${idParaDeletar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar origem');
      setOrigens(origens.filter((o) => o.id !== idParaDeletar));
      toast.success("Origem excluída com sucesso!");
    } catch (error: unknown) {
      toast.error("Não foi possível excluir a origem.");
    }
  };

  const handleAbrirDialogParaCriar = () => {
    setOrigemParaEditar(null);
    setIsDialogOpen(true);
  };
  
  const handleAbrirDialogParaEditar = (origem: Origem) => {
    setOrigemParaEditar(origem);
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
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Origens</h1>
        </div>
        <Button onClick={handleAbrirDialogParaCriar}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Origem
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Origens Cadastradas ({origens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                  <TableHead>Nome da Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {origens.map((origem) => (
                  <TableRow key={origem.id}>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAbrirDialogParaEditar(origem)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletarOrigem(origem.id)} className="text-red-600 focus:bg-red-100 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="font-medium">{origem.nome || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <OrigemDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSalvarOrigem}
        initialData={origemParaEditar}
      />
    </main>
  );
}