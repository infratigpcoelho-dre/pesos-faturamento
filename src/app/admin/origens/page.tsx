"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Origem {
  id: number;
  nome: string;
}

const API_URL = typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? 'http://localhost:3001' 
    : '/api';

export default function GerenciarOrigens() {
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [novaOrigem, setNovaOrigem] = useState("");

  const carregarOrigens = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/origens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrigens(data);
      }
    } catch (err) {
      console.error("Erro ao carregar origens:", err);
    }
  }, []);

  useEffect(() => {
    carregarOrigens();
  }, [carregarOrigens]);

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaOrigem.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/origens`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ nome: novaOrigem })
      });

      if (res.ok) {
        toast.success("Origem adicionada!");
        setNovaOrigem("");
        carregarOrigens();
      }
    } catch (err) {
      toast.error("Erro ao adicionar.");
      console.error(err);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm("Excluir esta origem?")) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/origens/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Excluída.");
        carregarOrigens();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Origens</h1>
      <Card>
        <CardHeader><CardTitle>Nova Origem</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdicionar} className="flex gap-4 items-end">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="nome">Nome da Origem</Label>
              <Input id="nome" value={novaOrigem} onChange={(e) => setNovaOrigem(e.target.value)} placeholder="Ex: Porto de Santos" />
            </div>
            <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {origens.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.nome}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleExcluir(o.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}