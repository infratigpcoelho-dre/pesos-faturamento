
// Arquivo: src/app/admin/produtos/page.tsx (NOVA PÁGINA)

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
import { ProdutoDialog } from "@/components/app/ProdutoDialog"; // Importamos o novo formulário

type Produto = {
  id: number;
  nome: string | null;
};

type FormData = { [key: string]: string | number | undefined; };

const API_URL = 'https://api-pesos-faturamento.onrender.com'; 

export default function GerenciarProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);
  const router = useRouter();

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // Busca os produtos do backend
  async function carregarProdutos() {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/produtos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão expirou ou acesso negado.");
        router.push('/');
        return;
      }
      if (!response.ok) throw new Error('Falha ao buscar produtos');
      
      const data = await response.json();
      setProdutos(data);
    } catch (error: unknown) { 
      console.error("Erro ao carregar produtos:", error);
      let message = "Não foi possível carregar os produtos.";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Lida com Salvar (Criar ou Editar)
  const handleSalvarProduto = async (dadosDoFormulario: FormData) => {
    const token = getToken();
    const isEditing = !!produtoParaEditar;
    
    const url = isEditing
      ? `${API_URL}/api/produtos/${produtoParaEditar.id}`
      : `${API_URL}/api/produtos`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dadosDoFormulario),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Falha ao salvar produto');
      }
      
      toast.success(`Produto ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`);
      setIsDialogOpen(false);
      carregarProdutos(); // Recarrega a lista

    } catch (error: unknown) {
      let message = `Não foi possível ${isEditing ? 'atualizar' : 'salvar'} o produto.`;
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  // Lida com Deletar
  const handleDeletarProduto = async (idParaDeletar: number) => {
    const token = getToken();
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const response = await fetch(`${API_URL}/api/produtos/${idParaDeletar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar produto');
      setProdutos(produtos.filter((p) => p.id !== idParaDeletar));
      toast.success("Produto excluído com sucesso!");
    } catch (error: unknown) {
      let message = "Não foi possível excluir o produto.";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleAbrirDialogParaCriar = () => {
    setProdutoParaEditar(null);
    setIsDialogOpen(true);
  };
  
  const handleAbrirDialogParaEditar = (produto: Produto) => {
    setProdutoParaEditar(produto);
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
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Produtos</h1>
        </div>
        <Button onClick={handleAbrirDialogParaCriar}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados ({produtos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                  <TableHead>Nome do Produto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAbrirDialogParaEditar(produto)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletarProduto(produto.id)} className="text-red-600 focus:bg-red-100 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="font-medium">{produto.nome || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <ProdutoDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSalvarProduto}
        initialData={produtoParaEditar}
      />
    </main>
  );
}