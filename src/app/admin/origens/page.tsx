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

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem('authToken') : null;

  async function carregarOrigens() {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/origens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        toast.error("Sessão expirou.");
        router.push('/');
        return;
      }
      if (!response.ok) throw new Error('Falha');
      setOrigens(await response.json());
    } catch (error) { toast.error("Erro ao carregar origens."); }
  }

  useEffect(() => { carregarOrigens(); }, []);

  const handleSalvar = async (dados: FormData) => {
    const token = getToken();
    const isEditing = !!origemParaEditar;
    const url = isEditing ? `${API_URL}/api/origens/${origemParaEditar.id}` : `${API_URL}/api/origens`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dados),
      });
      if (!response.ok) throw new Error();
      toast.success(`Origem ${isEditing ? 'atualizada' : 'salva'}!`);
      setIsDialogOpen(false);
      carregarOrigens();
    } catch (e) { toast.error("Erro ao salvar."); }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Excluir esta origem?")) return;
    try {
      const response = await fetch(`${API_URL}/api/origens/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!response.ok) throw new Error();
      setOrigens(origens.filter((o) => o.id !== id));
      toast.success("Excluída!");
    } catch (e) { toast.error("Erro ao excluir."); }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Voltar</span></Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Origens</h1>
        </div>
        <Button onClick={() => { setOrigemParaEditar(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Origem
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Origens ({origens.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Ações</TableHead><TableHead>Nome</TableHead></TableRow></TableHeader>
              <TableBody>
                {origens.map((origem) => (
                  <TableRow key={origem.id}>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setOrigemParaEditar(origem); setIsDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletar(origem.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{origem.nome || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <OrigemDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSalvar} initialData={origemParaEditar} />
    </main>
  );
}