// Arquivo: src/app/page.tsx (PASSANDO A PLACA PARA O FORMULÁRIO)

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, PlusCircle, FileDown, LogOut, Link as LinkIcon, Settings } from "lucide-react";
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
  id: number; data: string; horapostada: string; origem: string; destino: string;
  iniciodescarga: string; terminodescarga: string; tempodescarga: string;
  ticket: string; pesoreal: number; tarifa: number; nf: string; cavalo: string;
  motorista: string; valorfrete: number; obs: string; produto: string;
  caminhonf?: string;
};

type FormData = { [key: string]: string | number; };

const ITENS_POR_PAGINA = 10;
const API_URL = 'https://api-pesos-faturamento.onrender.com'; 

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState<Lancamento | null>(null);
  const [filtros, setFiltros] = useState({ motorista: '', origem: '', produto: '' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPlaca, setUserPlaca] = useState<string | null>(null); // MUDANÇA: Novo estado para placa

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole'); 
    const name = localStorage.getItem('userFullName');
    const placa = localStorage.getItem('userPlacaCavalo'); // MUDANÇA: Lê a placa
    
    if (!token) {
      router.push('/login');
    } else {
      setUserRole(role); 
      setUserName(name);
      setUserPlaca(placa); // MUDANÇA: Salva no estado
      carregarLancamentos();
    }
  }, [router]);

  async function carregarLancamentos() {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/lancamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão expirou. Faça login novamente.");
        handleLogout(false);
        return;
      }
      if (!response.ok) throw new Error('Falha');
      const data = await response.json();
      setLancamentos(data);
    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Não foi possível carregar os dados.");
    }
  }

  const handleSalvar = async (dadosDoFormulario: FormData, arquivo: File | null) => {
    const token = getToken();
    const isEditing = !!lancamentoParaEditar;
    const idParaEditar = isEditing ? lancamentoParaEditar.id : null; 
    const url = isEditing ? `${API_URL}/lancamentos/${idParaEditar}` : `${API_URL}/lancamentos`;
    const method = isEditing ? 'PUT' : 'POST';
    
    const formData = new FormData();
    Object.keys(dadosDoFormulario).forEach(key => {
      if (!isEditing && key === 'id') return;
      formData.append(key, String(dadosDoFormulario[key] ?? '')); 
    });
    if (arquivo) formData.append('arquivoNf', arquivo);

    try {
      const response = await fetch(url, { 
        method: method, 
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout(false);
        return;
      }
      if (!response.ok) throw new Error();
      toast.success(`Lançamento ${isEditing ? 'atualizado' : 'salvo'}!`);
      setIsDialogOpen(false);
      carregarLancamentos();
    } catch (error) { 
      toast.error("Erro ao salvar lançamento.");
    }
  };
  
  const handleDeletarLancamento = async (idParaDeletar: number) => {
    const token = getToken();
    if (!window.confirm("Excluir lançamento?")) return;
    try {
      const response = await fetch(`${API_URL}/lancamentos/${idParaDeletar}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error();
      setLancamentos(lancamentos.filter((l) => l.id !== idParaDeletar));
      toast.success("Excluído com sucesso!");
    } catch (error) { toast.error("Erro ao excluir."); }
  };

  const handleAbrirDialogParaCriar = () => { setLancamentoParaEditar(null); setIsDialogOpen(true); };
  const handleAbrirDialogParaEditar = (l: Lancamento) => { setLancamentoParaEditar(l); setIsDialogOpen(true); };
  
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaginaAtual(1);
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };
  
  const handleExportCSV = () => {
    if (lancamentosFiltrados.length === 0) { toast.warning("Sem dados."); return; }
    const csv = Papa.unparse(lancamentosFiltrados);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos.csv`;
    link.click();
  };

  const handleExportXLSX = () => {
    if (lancamentosFiltrados.length === 0) { toast.warning("Sem dados."); return; }
    const ws = XLSX.utils.json_to_sheet(lancamentosFiltrados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, `lancamentos.xlsx`);
  };
  
  const handleLogout = (mostrarToast = true) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole'); 
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userPlacaCavalo'); // MUDANÇA: Limpa a placa
    if (mostrarToast) toast.success("Saiu com segurança.");
    router.push('/login');
  };

  const formatarMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const formatarDataHora = (s: string | null) => {
    if (!s) return '-';
    try {
      if (s.includes('T')) return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return new Date(s).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    } catch { return s; }
  }

  const lancamentosFiltrados = useMemo(() => {
    if (!lancamentos) return [];
    return lancamentos.filter(l => {
      return (l.motorista || '').toLowerCase().includes(filtros.motorista.toLowerCase()) &&
             (l.origem || '').toLowerCase().includes(filtros.origem.toLowerCase()) &&
             (l.produto || '').toLowerCase().includes(filtros.produto.toLowerCase());
    });
  }, [lancamentos, filtros]);

  const totalPaginas = Math.ceil(lancamentosFiltrados.length / ITENS_POR_PAGINA);
  const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const lancamentosPaginados = lancamentosFiltrados.slice(indiceInicial, indiceInicial + ITENS_POR_PAGINA);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          {userRole === 'master' && (
            <Button asChild variant="secondary">
              <Link href="/admin"><Settings className="mr-2 h-4 w-4" /> Painel Master</Link>
            </Button>
          )}
          <Button onClick={handleAbrirDialogParaCriar}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
          <Button variant="outline" size="icon" onClick={() => handleLogout(true)}><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Peso Total</CardTitle></CardHeader><CardContent><PesoPorProdutoChart data={lancamentos} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Carregamentos/Dia</CardTitle></CardHeader><CardContent><CarregamentosPorDiaChart data={lancamentos} /></CardContent></Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label>Motorista</Label><Input name="motorista" placeholder="Nome..." onChange={handleFiltroChange} /></div>
            <div><Label>Origem</Label><Input name="origem" placeholder="Origem..." onChange={handleFiltroChange} /></div>
            <div><Label>Produto</Label><Input name="produto" placeholder="Produto..." onChange={handleFiltroChange} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lançamentos ({lancamentosFiltrados.length})</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" /> Exportar</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXLSX}>Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">Ações</TableHead>
                  <TableHead>NF (Anexo)</TableHead><TableHead>NF (Nº)</TableHead><TableHead>Data</TableHead><TableHead>Hora</TableHead>
                  <TableHead>Ticket</TableHead><TableHead>Motorista</TableHead><TableHead>Cavalo</TableHead><TableHead>Produto</TableHead>
                  <TableHead>Origem</TableHead><TableHead>Destino</TableHead><TableHead>Início</TableHead><TableHead>Término</TableHead>
                  <TableHead>Tempo</TableHead><TableHead className="text-right">Peso</TableHead><TableHead className="text-right">Tarifa</TableHead>
                  <TableHead className="text-right">Frete</TableHead><TableHead>Obs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosPaginados.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-center sticky left-0 bg-background z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAbrirDialogParaEditar(l)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletarLancamento(l.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{l.caminhonf ? <Button variant="outline" size="icon" asChild><a href={`${API_URL}/uploads/${l.caminhonf}`} target="_blank"><LinkIcon className="h-4 w-4"/></a></Button> : '-'}</TableCell>
                    <TableCell>{l.nf || '-'}</TableCell><TableCell>{l.data ? new Date(l.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</TableCell>
                    <TableCell>{l.horapostada || '-'}</TableCell><TableCell>{l.ticket || '-'}</TableCell><TableCell>{l.motorista || '-'}</TableCell>
                    <TableCell>{l.cavalo || '-'}</TableCell><TableCell>{l.produto || '-'}</TableCell><TableCell>{l.origem || '-'}</TableCell>
                    <TableCell>{l.destino || '-'}</TableCell><TableCell>{formatarDataHora(l.iniciodescarga)}</TableCell><TableCell>{formatarDataHora(l.terminodescarga)}</TableCell>
                    <TableCell>{l.tempodescarga || '-'}</TableCell><TableCell className="text-right">{(l.pesoreal || 0).toLocaleString('pt-BR')} kg</TableCell>
                    <TableCell className="text-right">{formatarMoeda(l.tarifa)}</TableCell><TableCell className="text-right font-bold">{formatarMoeda(l.valorfrete)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{l.obs || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <span className="text-sm text-muted-foreground">Página {paginaAtual} de {totalPaginas}</span>
            <Button variant="outline" size="sm" onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))} disabled={paginaAtual === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))} disabled={paginaAtual >= totalPaginas}>Próximo</Button>
          </div>
        </CardContent>
      </Card>
      
      <AddLancamentoDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSave={handleSalvar} 
        initialData={lancamentoParaEditar}
        userRole={userRole}
        userName={userName}
        userPlaca={userPlaca} // MUDANÇA: Passamos a placa
      />
    </main>
  );
}