// Arquivo: src/app/page.tsx (VERSÃO DE TESTE "À PROVA DE ERROS")

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, PlusCircle, FileDown, LogOut, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddLancamentoDialog } from "@/components/app/AddLancamentoDialog";
import { PesoPorProdutoChart } from "@/components/app/PesoPorProdutoChart";
import { CarregamentosPorDiaChart } from "@/components/app/CarregamentosPorDiaChart";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

type Lancamento = {
  id: number; data: string; horaPostada: string; origem: string; destino: string;
  inicioDescarga: string; terminoDescarga: string; tempoDescarga: string;
  ticket: string; pesoReal: number; tarifa: number; nf: string; cavalo: string;
  motorista: string; valorFrete: number; obs: string; produto: string;
  caminhoNf?: string;
};

type FormData = { [key: string]: string | number; };

const ITENS_POR_PAGINA = 10;
// ATENÇÃO: Confirme que esta é a sua URL do RENDER
const API_URL = 'https://api-pesos-faturamento.onrender.com'; 

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState<Lancamento | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    } else {
      carregarLancamentos();
    }
  }, [router]);

  async function carregarLancamentos() {
    try {
      const response = await fetch(`${API_URL}/lancamentos`);
      if (!response.ok) throw new Error('Falha ao buscar dados da API');
      const data = await response.json();
      setLancamentos(data);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
      toast.error("Não foi possível carregar os dados. Verifique se o backend está rodando.");
    }
  }

  // **** AS FUNÇÕES ABAIXO ESTÃO CORRIGIDAS PARA PASSAR NO BUILD ****

  const handleSalvar = async (dadosDoFormulario: FormData, arquivo: File | null) => {
    const isEditing = !!lancamentoParaEditar;
    const idParaEditar = isEditing ? lancamentoParaEditar.id : null; 
    const url = isEditing ? `${API_URL}/lancamentos/${idParaEditar}` : `${API_URL}/lancamentos`;
    const method = isEditing ? 'PUT' : 'POST';
    
    const formData = new FormData();
    Object.keys(dadosDoFormulario).forEach(key => {
      if (!isEditing && key === 'id') return;
      formData.append(key, String(dadosDoFormulario[key] ?? '')); 
    });
    if (arquivo) {
      formData.append('arquivoNf', arquivo);
    }
    try {
      const response = await fetch(url, { method: method, body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); 
        throw new Error(errorData.error || `Erro ao ${isEditing ? 'atualizar' : 'salvar'} no backend`);
      }
      toast.success(`Lançamento ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`);
      setIsDialogOpen(false);
      carregarLancamentos();
    } catch (error: unknown) { 
      let message = `Não foi possível ${isEditing ? 'atualizar' : 'salvar'} o lançamento.`;
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };
  
  const handleDeletarLancamento = async (idParaDeletar: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const response = await fetch(`${API_URL}/lancamentos/${idParaDeletar}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao deletar no backend');
      setLancamentos(lancamentos.filter((lancamento) => lancamento.id !== idParaDeletar));
      toast.success("Lançamento excluído com sucesso!");
    } catch (error: unknown) { 
      let message = "Não foi possível excluir o lançamento.";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    }
  };

  const handleAbrirDialogParaCriar = () => {
    setLancamentoParaEditar(null);
    setIsDialogOpen(true);
  };
  
  const handleAbrirDialogParaEditar = (lancamento: Lancamento) => {
    setLancamentoParaEditar(lancamento); 
    setIsDialogOpen(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    toast.success("Você saiu com segurança.");
    router.push('/login');
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Pesagem (Modo de Teste)</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleAbrirDialogParaCriar}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lançamento</Button>
          <Button variant="outline" size="icon" onClick={handleLogout} title="Sair do sistema">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
      
      {/* GRÁFICOS E TABELA COMPLETA DESABILITADOS TEMPORARIAMENTE PARA TESTE.
        VAMOS APENAS "CUSPIR" OS DADOS NA TELA PARA PROVAR QUE ELES ESTÃO SENDO CARREGADOS.
      */}

      <Card>
        <CardHeader>
          <CardTitle>Teste de Carregamento de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Se você vê texto na caixa abaixo, significa que o frontend conseguiu
            buscar os dados no backend com sucesso. O problema anterior era
            apenas na formatação (ex: .toLocaleString()) desses dados.
          </p>
          <pre className="mt-4 p-4 bg-slate-900 rounded-md text-green-400 overflow-auto">
            {/* JSON.stringify é a forma mais segura de exibir dados. 
              Ele não quebra com 'null' ou 'undefined'.
            */}
            {JSON.stringify(lancamentos, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      <AddLancamentoDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSalvar} initialData={lancamentoParaEditar} />
    </main>
  );
}