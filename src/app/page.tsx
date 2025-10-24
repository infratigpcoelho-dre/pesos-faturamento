// Arquivo: src/app/page.tsx (TIPAGEM 100% CORRETA)

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

// Definimos o tipo para os dados do formulário
type FormData = { [key: string]: string | number; };

const ITENS_POR_PAGINA = 10;
// ATENÇÃO: SUBSTITUA PELA SUA URL DO RENDER
const API_URL = 'https://api-pesagem-patrick.onrender.com'; 

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState<Lancamento | null>(null);
  const [filtros, setFiltros] = useState({ motorista: '', origem: '', produto: '' });
  const [paginaAtual, setPaginaAtual] = useState(1);
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

  // CORREÇÃO AQUI: Definimos os tipos corretos
  const handleSalvar = async (dadosDoFormulario: FormData, arquivo: File | null) => {
    const isEditing = !!lancamentoParaEditar;
    const url = isEditing ? `${API_URL}/lancamentos/${(lancamentoParaEditar as Lancamento).id}` : `${API_URL}/lancamentos`;
    const method = isEditing ? 'PUT' : 'POST';
    
    const formData = new FormData();
    Object.keys(dadosDoFormulario).forEach(key => {
      formData.append(key, String(dadosDoFormulario[key]));
    });
    if (arquivo) {
      formData.append('arquivoNf', arquivo);
    }

    try {
      const response = await fetch(url, {
        method: method,
        body: formData, 
      });

      if (!response.ok) throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} no backend`);
      
      toast.success(`Lançamento ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`);
      setIsDialogOpen(false);
      carregarLancamentos();

    } catch (error: unknown) { // CORREÇÃO AQUI
      console.error(`Falha ao ${isEditing ? 'editar' : 'criar'} lançamento:`, error);
      let message = `Não foi possível ${isEditing ? 'atualizar' : 'salvar'} o lançamento.`;
      if (error instanceof Error) {
        message = error.message;
      }
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
    } catch (error: unknown) { // CORREÇÃO AQUI
      console.error("Erro ao deletar lançamento:", error);
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
    setLancamentoParaEditar(lancamento); // O tipo Lancamento é compatível com o FormData
    setIsDialogOpen(true);
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaginaAtual(1);
    const { name, value } = e.target;
    setFiltros(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleExportCSV = () => {
    if (lancamentosFiltrados.length === 0) { toast.warning("Não há dados para exportar."); return; }
    const csv = Papa.unparse(lancamentosFiltrados);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lancamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Os dados foram exportados com sucesso!");
  };

  const handleExportXLSX = () => {
    if (lancamentosFiltrados.length === 0) { toast.warning("Não há dados para exportar."); return; }
    const worksheet = XLSX.utils.json_to_sheet(lancamentosFiltrados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos");
    XLSX.writeFile(workbook, `lancamentos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Os dados foram exportados para Excel com sucesso!");
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    toast.success("Você saiu com segurança.");
    router.push('/login');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const lancamentosFiltrados = useMemo(() => {
    if (!lancamentos) return [];
    return lancamentos.filter(lancamento => {
      const motoristaMatch = (lancamento.motorista || '').toLowerCase().includes(filtros.motorista.toLowerCase());
      const origemMatch = (lancamento.origem || '').toLowerCase().includes(filtros.origem.toLowerCase());
      const produtoMatch = (lancamento.produto || '').toLowerCase().includes(filtros.produto.toLowerCase());
      return motoristaMatch && origemMatch && produtoMatch;
    });
  }, [lancamentos, filtros]);

  const totalPaginas = Math.ceil(lancamentosFiltrados.length / ITENS_POR_PAGINA);
  const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
  const lancamentosPaginados = lancamentosFiltrados.slice(indiceInicial, indiceFinal);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Pesagem</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleAbrirDialogParaCriar}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lançamento</Button>
          <Button variant="outline" size="icon" onClick={handleLogout} title="Sair do sistema">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Peso Total por Produto</CardTitle></CardHeader><CardContent><PesoPorProdutoChart data={lancamentos} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Carregamentos por Dia</CardTitle></CardHeader><CardContent><CarregamentosPorDiaChart data={lancamentos} /></CardContent></Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label htmlFor="filtro-motorista">Filtrar por Motorista</Label><Input id="filtro-motorista" name="motorista" placeholder="Digite o nome..." value={filtros.motorista} onChange={handleFiltroChange} /></div>
            <div><Label htmlFor="filtro-origem">Filtrar por Origem</Label><Input id="filtro-origem" name="origem" placeholder="Digite a origem..." value={filtros.origem} onChange={handleFiltroChange} /></div>
            <div><Label htmlFor="filtro-produto">Filtrar por Produto</Label><Input id="filtro-produto" name="produto" placeholder="Digite o produto..." value={filtros.produto} onChange={handleFiltroChange} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lançamentos ({lancamentosFiltrados.length})</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" />Exportar Dados</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>Exportar para CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXLSX}>Exportar para Excel (.xlsx)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                  <TableHead className="w-[100px]">NF</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Peso Real</TableHead>
                  <TableHead className="text-right">Valor Frete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosPaginados.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAbrirDialogParaEditar(lancamento)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletarLancamento(lancamento.id)} className="text-red-600 focus:bg-red-100 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {lancamento.caminhoNf ? (
                        <Button variant="outline" size="icon" asChild>
                          <a href={`${API_URL}/uploads/${lancamento.caminhoNf}`} target="_blank" rel="noopener noreferrer" title={`Ver anexo ${lancamento.caminhoNf}`}>
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(lancamento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                    
                    <TableCell className="font-medium">
                      <Link href={`/lancamentos/${lancamento.id}`} className="hover:underline hover:text-primary">
                        {lancamento.ticket}
                      </Link>
                    </TableCell>

                    <TableCell>{lancamento.motorista}</TableCell>
                    <TableCell>{lancamento.produto}</TableCell>
                    <TableCell>{lancamento.origem}</TableCell>
                    <TableCell>{lancamento.destino}</TableCell>
                    <TableCell className="text-right">{lancamento.pesoReal.toLocaleString('pt-BR')} kg</TableCell>
                    <TableCell className="text-right font-semibold">{formatarMoeda(lancamento.valorFrete)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <span className="text-sm text-muted-foreground">Página {paginaAtual} de {totalPaginas}</span>
            <Button variant="outline" size="sm" onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual >= totalPaginas}>Próximo</Button>
          </div>
        </CardContent>
      </Card>
      
      <AddLancamentoDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSalvar} initialData={lancamentoParaEditar} />
    </main>
  );
}