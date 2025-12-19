"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Destino {
  id: number;
  nome: string;
}

const API_URL = typeof window !== "undefined" && window.location.hostname === "localhost" 
    ? 'http://localhost:3001' 
    : '/api';

export default function GerenciarDestinos() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [novoDestino, setNovoDestino] = useState("");

  const carregarDestinos = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/destinos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDestinos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar destinos:", err);
    }
  }, []);

  useEffect(() => {
    carregarDestinos();
  }, [carregarDestinos]);

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoDestino.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/destinos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ nome: novoDestino })
      });

      if (res.ok) {
        toast.success("Destino adicionado!");
        setNovoDestino("");
        carregarDestinos();
      }
    } catch (err) {
      toast.error("Erro ao salvar.");
      console.error(err);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm("Deseja excluir este destino?")) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/destinos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Excluído com sucesso.");
        carregarDestinos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Destinos</h1>
      <Card>
        <CardHeader><CardTitle>Novo Destino</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdicionar} className="flex gap-4 items-end">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="nome">Nome do Destino</Label>
              <Input id="nome" value={novoDestino} onChange={(e) => setNovoDestino(e.target.value)} placeholder="Ex: Usina X" />
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
              {destinos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleExcluir(d.id)}>
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