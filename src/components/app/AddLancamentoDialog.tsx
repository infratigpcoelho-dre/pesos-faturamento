// Arquivo: src/components/app/AddLancamentoDialog.tsx (TIPAGEM 100% CORRETA)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = { [key: string]: string | number; };

// Definimos um tipo para os dados iniciais, que podem ter o caminhoNf
type InitialData = (FormData & { caminhoNf?: string }) | null;

type LancamentoDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData, arquivo: File | null) => void; 
  initialData?: InitialData; // Usamos o tipo InitialData
};

export function AddLancamentoDialog({ isOpen, onOpenChange, onSave, initialData }: LancamentoDialogProps) {
  const getInitialState = () => ({
    data: new Date().toISOString().split('T')[0], horaPostada: new Date().toTimeString().split(' ')[0].substring(0, 5),
    origem: "", destino: "", inicioDescarga: "", terminoDescarga: "", tempoDescarga: "",
    ticket: "", pesoReal: "", tarifa: "", nf: "", cavalo: "", motorista: "", valorFrete: "", obs: "", produto: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const [arquivoNf, setArquivoNf] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(getInitialState());
      }
      setArquivoNf(null); 
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivoNf(e.target.files[0]);
    } else {
      setArquivoNf(null);
    }
  };

  const handleSubmit = () => {
    onSave(formData, arquivoNf);
  };

  const isEditing = !!initialData;
  // CORREÇÃO AQUI: Acessamos de forma segura sem 'as any'
  const currentFileName = initialData?.caminhoNf; 

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Adicionar Novo Lançamento"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere as informações abaixo." : "Preencha todos os campos do carregamento."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {/* Colunas 1, 2 e 3 (sem mudanças no JSX) */}
          <div className="space-y-4">
            <div><Label htmlFor="data">Data</Label><Input id="data" name="data" type="date" value={String(formData.data)} onChange={handleChange} /></div>
            <div><Label htmlFor="horaPostada">Hora Postada</Label><Input id="horaPostada" name="horaPostada" type="time" value={String(formData.horaPostada)} onChange={handleChange} /></div>
            <div><Label htmlFor="motorista">Motorista</Label><Input id="motorista" name="motorista" value={String(formData.motorista)} onChange={handleChange} /></div>
            <div><Label htmlFor="cavalo">Cavalo (Placa)</Label><Input id="cavalo" name="cavalo" value={String(formData.cavalo)} onChange={handleChange} /></div>
            <div><Label htmlFor="ticket">Ticket</Label><Input id="ticket" name="ticket" value={String(formData.ticket)} onChange={handleChange} /></div>
          </div>
          <div className="space-y-4">
            <div><Label htmlFor="produto">Produto</Label><Input id="produto" name="produto" value={String(formData.produto)} onChange={handleChange} placeholder="Soja, Milho..."/></div>
            <div><Label htmlFor="origem">Origem</Label><Input id="origem" name="origem" value={String(formData.origem)} onChange={handleChange} /></div>
            <div><Label htmlFor="destino">Destino</Label><Input id="destino" name="destino" value={String(formData.destino)} onChange={handleChange} /></div>
            <div><Label htmlFor="pesoReal">Peso Real (kg)</Label><Input id="pesoReal" name="pesoReal" type="number" value={String(formData.pesoReal)} onChange={handleChange} /></div>
            <div><Label htmlFor="nf">Nota Fiscal (Nº)</Label><Input id="nf" name="nf" value={String(formData.nf)} onChange={handleChange} /></div>
          </div>
          <div className="space-y-4">
            <div><Label htmlFor="inicioDescarga">Início Descarga</Label><Input id="inicioDescarga" name="inicioDescarga" type="datetime-local" value={String(formData.inicioDescarga)} onChange={handleChange} /></div>
            <div><Label htmlFor="terminoDescarga">Término Descarga</Label><Input id="terminoDescarga" name="terminoDescarga" type="datetime-local" value={String(formData.terminoDescarga)} onChange={handleChange} /></div>
            <div><Label htmlFor="tempoDescarga">Tempo Descarga</Label><Input id="tempoDescarga" name="tempoDescarga" value={String(formData.tempoDescarga)} onChange={handleChange} placeholder="ex: 1h 30m"/></div>
            <div><Label htmlFor="tarifa">Tarifa</Label><Input id="tarifa" name="tarifa" type="number" step="0.01" value={String(formData.tarifa)} onChange={handleChange} /></div>
            <div><Label htmlFor="valorFrete">Valor Frete</Label><Input id="valorFrete" name="valorFrete" type="number" step="0.01" value={String(formData.valorFrete)} onChange={handleChange} /></div>
            <div><Label htmlFor="obs">Observação</Label><Input id="obs" name="obs" value={String(formData.obs)} onChange={handleChange} /></div>
          </div>
        </div>

        {/* Novo campo de Upload */}
        <div className="space-y-2">
          <Label htmlFor="arquivoNf">Anexar Nota Fiscal (PDF/Imagem)</Label>
          {isEditing && currentFileName && (<p className="text-sm text-muted-foreground">Arquivo atual: {currentFileName} (deixe em branco para não alterar)</p>)}
          <Input id="arquivoNf" name="arquivoNf" type="file" onChange={handleFileChange} />
          {arquivoNf && (<p className="text-sm text-green-600">Novo arquivo selecionado: {arquivoNf.name}</p>)}
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}