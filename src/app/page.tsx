"use client";

import { useState, useEffect, useMemo, useCallback } from "react"; 
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

// FIX 1: URL INTELIGENTE (Funciona no PC e na Vercel)
const API_URL = typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? 'http://localhost:3001' 
    : '/api';

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState<Lancamento | null>(null);
  const [filtros, setFiltros] = useState({ motorista: '', origem: '', produto: '' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPlaca, setUserPlaca] = useState<string | null>(null);
  const router = useRouter();

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem('authToken') : null);

  const handleLogout = useCallback((mostrarToast = true) => {
    localStorage.clear();
    if (mostrarToast) toast.success("Você saiu com segurança.");
    router.push('/login');
  }, [router]);

  const carregarLancamentos = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/lancamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao carregar');
      const data = await response.json();
      setLancamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setUserRole(localStorage.getItem('userRole'));
    setUserName(localStorage.getItem('userFullName'));
    setUserPlaca(localStorage.getItem('userPlacaCavalo'));
    carregarLancamentos(token);
  }, [router, carregarLancamentos]);

  // FIX 2: FUNÇÃO DE MOEDA (Para exibir R$)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaginaAtual(1);
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleExportCSV = () => {
    if (lancamentosFiltrados.length === 0) return toast.warning("Sem dados.");
    const csv = Papa.unparse(lancamentosFiltrados);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportXLSX = () => {
    if (lancamentosFiltrados.length === 0) return toast.warning("Sem dados.");
    const ws = XLSX.utils.json_to_sheet(lancamentosFiltrados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, `lancamentos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSalvar = async (dados: FormData, arquivo: File | null) => {
    if (userRole === 'auditor') return toast.error("Auditores não podem salvar.");
    const token = getToken();
    const isEditing = !!lancamentoParaEditar;
    const formData = new FormData();
    Object.keys(dados).forEach(key => formData.append(key, String(dados[key] ?? '')));
    if (arquivo) formData.append('arquivoNf', arquivo);

    try {
      const res = await fetch(`${API_URL}/lancamentos${isEditing ? `/${lancamentoParaEditar.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error();
      toast.success("Sucesso!");
      setIsDialogOpen(false);
      carregarLancamentos(token!);
    } catch (e) { toast.error("Erro ao salvar."); }
  };

  const handleDeletarLancamento = async (id: number) => {
    if (userRole === 'auditor') return toast.error("Acesso negado.");
    if (!window.confirm("Excluir?")) return;
    try {
      const res = await fetch(`${API_URL}/lancamentos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) {
        setLancamentos(prev => prev.filter(l => l.id !== id));
        toast.success("Excluído.");
      }
    } catch (e) { toast.error("Erro ao excluir."); }
  };

  const lancamentosFiltrados = useMemo(() => {
    if (!Array.isArray(lancamentos)) return [];
    return lancamentos.filter(l => 
      (l.motorista || '').toLowerCase().includes(filtros.motorista.toLowerCase()) &&
      (l.origem || '').toLowerCase().includes(filtros.origem.toLowerCase()) &&
      (l.produto || '').toLowerCase().includes(filtros.produto.toLowerCase())
    );
  }, [lancamentos, filtros]);

  const totalPaginas = Math.ceil(lancamentosFiltrados.length / ITENS_POR_PAGINA);
  const lancamentosPaginados = lancamentosFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Pesagem</h1>
        <div className="flex items-center gap-2">
          {userRole === 'master' && (
            <Button asChild variant="secondary"><Link href="/admin"><Settings className="mr-2 h-4 w-4" /> Painel Master</Link></Button>
          )}
          {userRole !== 'auditor' && (
            <Button onClick={() => { setLancamentoParaEditar(null); setIsDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento</Button>
          )}
          <Button variant="outline" size="icon" onClick={() => handleLogout()}><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Peso Total por Produto</CardTitle></CardHeader><CardContent><PesoPorProdutoChart data={lancamentos} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Carregamentos por Dia</CardTitle></CardHeader><CardContent><CarregamentosPorDiaChart data={lancamentos} /></CardContent></Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Motorista</Label><Input name="motorista" value={filtros.motorista} onChange={handleFiltroChange} /></div>
          <div><Label>Origem</Label><Input name="origem" value={filtros.origem} onChange={handleFiltroChange} /></div>
          <div><Label>Produto</Label><Input name="produto" value={filtros.produto} onChange={handleFiltroChange} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lançamentos ({lancamentosFiltrados.length})</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" /> Exportar</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
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
                  <TableHead>Ações</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-right">Peso (t)</TableHead>
                  <TableHead className="text-right">Frete Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosPaginados.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={userRole === 'auditor'}>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => { setLancamentoParaEditar(l); setIsDialogOpen(true); }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeletarLancamento(l.id)}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {l.caminhonf && (
                        <Button variant="outline" size="icon" asChild className="mr-2 h-7 w-7">
                          <a href={`${API_URL}/uploads/${l.caminhonf}`} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {l.nf}
                    </TableCell>
                    <TableCell>{l.data ? new Date(l.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</TableCell>
                    <TableCell>{l.motorista}</TableCell>
                    <TableCell className="text-right">{l.pesoreal?.toLocaleString('pt-BR')} t</TableCell>
                    <TableCell className="text-right font-semibold">{formatarMoeda(l.valorfrete)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 mt-4">
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
        userPlaca={userPlaca}
      />
    </main>
  );
}