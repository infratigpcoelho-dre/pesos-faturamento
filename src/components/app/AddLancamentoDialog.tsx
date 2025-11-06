// Arquivo: src/components/app/AddLancamentoDialog.tsx (CORRIGIDO PARA VALORES NULOS E NOMES MINÚSCULOS)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = { [key: string]: string | number; };

// O tipo que vem do backend (com 'null' e nomes em minúsculo)
type InitialData = {
  id: number; data: string | null; horapostada: string | null; origem: string | null; destino: string | null;
  iniciodescarga: string | null; terminodescarga: string | null; tempodescarga: string | null;
  ticket: string | null; pesoreal: number | null; tarifa: number | null; nf: string | null; cavalo: string | null;
  motorista: string | null; valorfrete: number | null; obs: string | null; produto: string | null;
  caminhonf?: string | null;
} | null;


type LancamentoDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData, arquivo: File | null) => void; 
  initialData?: InitialData;
};

// Função para formatar a data para o input datetime-local
const formatarParaDateTimeLocal = (dataString: string | number | null | undefined) => {
  if (!dataString) return ""; // Retorna string vazia se for null/undefined
  try {
    const data = new Date(dataString);
    // Ajusta para o fuso horário local e formata
    const dataLocal = new Date(data.getTime() - (data.getTimezoneOffset() * 60000));
    return dataLocal.toISOString().slice(0, 16);
  } catch (e) {
    return ""; // Retorna vazio se a data for inválida
  }
}

// Função para formatar a data para o input date
const formatarParaDate = (dataString: string | number | null | undefined) => {
  if (!dataString) return ""; // Retorna string vazia se for null/undefined
  try {
    const data = new Date(dataString);
    return data.toISOString().split('T')[0];
  } catch (e) {
    return "";
  }
}

export function AddLancamentoDialog({ isOpen, onOpenChange, onSave, initialData }: LancamentoDialogProps) {
  const getInitialState = () => ({
    data: new Date().toISOString().split('T')[0], horapostada: new Date().toTimeString().split(' ')[0].substring(0, 5),
    origem: "", destino: "", iniciodescarga: "", terminodescarga: "", tempodescarga: "",
    ticket: "", pesoreal: "", tarifa: "", nf: "", cavalo: "", motorista: "", valorfrete: "", obs: "", produto: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const [arquivoNf, setArquivoNf] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // ****** AQUI ESTÁ A CORREÇÃO ******
        // Criamos um objeto 'dadosLimpados'
        const dadosLimpados: FormData = {} as FormData;
        
        // Copiamos todos os campos, trocando 'null' por '""'
        Object.keys(initialData).forEach(key => {
          const valor = initialData[key as keyof typeof initialData];
          dadosLimpados[key] = valor ?? ""; // ?? significa: "se for null ou undefined, use """
        });

        // Formatamos as datas especiais
        dadosLimpados.data = formatarParaDate(initialData.data);
        dadosLimpados.horapostada = initialData.horapostada ?? "";
        dadosLimpados.iniciodescarga = formatarParaDateTimeLocal(initialData.iniciodescarga);
        dadosLimpados.terminodescarga = formatarParaDateTimeLocal(initialData.terminodescarga);
        
        setFormData(dadosLimpados);
        // ****** FIM DA CORREÇÃO ******
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
  const currentFileName = initialData?.caminhonf;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Adicionar Novo Lançamento"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere as informações abaixo." : "Preencha todos os campos do carregamento."}</DialogDescription>
        </DialogHeader>

        {/* O JSX agora usa os nomes em MINÚSCULO (horapostada, pesoreal, etc.) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-4">
            <div><Label htmlFor="data">Data</Label><Input id="data" name="data" type="date" value={String(formData.data)} onChange={handleChange} /></div>
            <div><Label htmlFor="horapostada">Hora Postada</Label><Input id="horapostada" name="horapostada" type="time" value={String(formData.horapostada)} onChange={handleChange} /></div>
            <div><Label htmlFor="motorista">Motorista</Label><Input id="motorista" name="motorista" value={String(formData.motorista)} onChange={handleChange} /></div>
            <div><Label htmlFor="cavalo">Cavalo (Placa)</Label><Input id="cavalo" name="cavalo" value={String(formData.cavalo)} onChange={handleChange} /></div>
            <div><Label htmlFor="ticket">Ticket</Label><Input id="ticket" name="ticket" value={String(formData.ticket)} onChange={handleChange} /></div>
          </div>
          <div className="space-y-4">
            <div><Label htmlFor="produto">Produto</Label><Input id="produto" name="produto" value={String(formData.produto)} onChange={handleChange} placeholder="Soja, Milho..."/></div>
            <div><Label htmlFor="origem">Origem</Label><Input id="origem" name="origem" value={String(formData.origem)} onChange={handleChange} /></div>
            <div><Label htmlFor="destino">Destino</Label><Input id="destino" name="destino" value={String(formData.destino)} onChange={handleChange} /></div>
            <div><Label htmlFor="pesoreal">Peso Real (kg)</Label><Input id="pesoreal" name="pesoreal" type="number" value={String(formData.pesoreal)} onChange={handleChange} /></div>
            <div><Label htmlFor="nf">Nota Fiscal (Nº)</Label><Input id="nf" name="nf" value={String(formData.nf)} onChange={handleChange} /></div>
          </div>
          <div className="space-y-4">
            <div><Label htmlFor="iniciodescarga">Início Descarga</Label><Input id="iniciodescarga" name="iniciodescarga" type="datetime-local" value={String(formData.iniciodescarga)} onChange={handleChange} /></div>
            <div><Label htmlFor="terminodescarga">Término Descarga</Label><Input id="terminodescarga" name="terminodescarga" type="datetime-local" value={String(formData.terminodescarga)} onChange={handleChange} /></div>
            <div><Label htmlFor="tempodescarga">Tempo Descarga</Label><Input id="tempodescarga" name="tempodescarga" value={String(formData.tempodescarga)} onChange={handleChange} placeholder="ex: 1h 30m"/></div>
            <div><Label htmlFor="tarifa">Tarifa</Label><Input id="tarifa" name="tarifa" type="number" step="0.01" value={String(formData.tarifa)} onChange={handleChange} /></div>
            <div><Label htmlFor="valorfrete">Valor Frete</Label><Input id="valorfrete" name="valorfrete" type="number" step="0.01" value={String(formData.valorfrete)} onChange={handleChange} /></div>
            <div><Label htmlFor="obs">Observação</Label><Input id="obs" name="obs" value={String(formData.obs)} onChange={handleChange} /></div>
          </div>
        </div>
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