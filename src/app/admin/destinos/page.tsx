// Arquivo: src/app/admin/destinos/page.tsx (NOVO)

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
import { DestinoDialog } from "@/components/app/DestinoDialog"; 

type Destino = { id: number; nome: string | null; };
type FormData = { [key: string]: string | number | undefined; };
const API_URL = 'https://api-pesos-faturamento.onrender.com'; 

export default function GerenciarDestinosPage() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [destinoParaEditar, setDestinoParaEditar] = useState<Destino | null>(null);
  const router = useRouter();
  const getToken = () => typeof window !== "undefined" ? localStorage.getItem('authToken') : null;

  async function carregarDestinos() {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/destinos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) { toast.error("Sessão expirou."); router.push('/'); return; }
      if (!response.ok) throw new Error('Falha');
      setDestinos(await response.json());
    } catch (error) { toast.error("Erro ao carregar destinos."); }
  }
  useEffect(() => { carregarDestinos(); }, []);

  const handleSalvar = async (dados: FormData) => {
    const token = getToken();
    const isEditing = !!destinoParaEditar;
    const url = isEditing ? `${API_URL}/api/destinos/${destinoParaEditar.id}` : `${API_URL}/api/destinos`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(dados) });
      if (!response.ok) throw new Error();
      toast.success(`Destino ${isEditing ? 'atualizado' : 'salvo'}!`);
      setIsDialogOpen(false);
      carregarDestinos();
    } catch (e) { toast.error("Erro ao salvar."); }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Excluir este destino?")) return;
    try {
      const response = await fetch(`${API_URL}/api/destinos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!response.ok) throw new Error();
      setDestinos(destinos.filter((d) => d.id !== id));
      toast.success("Excluído!");
    } catch (e) { toast.error("Erro ao excluir."); }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Destinos</h1>
        </div>
        <Button onClick={() => { setDestinoParaEditar(null); setIsDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
      </div>
      <Card><CardHeader><CardTitle>Destinos ({destinos.length})</CardTitle></CardHeader><CardContent>
          <div className="relative w-full overflow-auto">
            <Table><TableHeader><TableRow><TableHead>Ações</TableHead><TableHead>Nome</TableHead></TableRow></TableHeader>
              <TableBody>{destinos.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setDestinoParaEditar(d); setIsDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletar(d.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent></DropdownMenu></TableCell>
                    <TableCell>{d.nome || '-'}</TableCell>
                  </TableRow>))}
              </TableBody></Table></div></CardContent></Card>
      <DestinoDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSalvar} initialData={destinoParaEditar} />
    </main>
  );
}