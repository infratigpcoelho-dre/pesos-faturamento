"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type FormData = { [key: string]: string | number; };
type InitialData = {
  id: number; data: string | null; horapostada: string | null; origem: string | null; destino: string | null;
  iniciodescarga: string | null; terminodescarga: string | null; tempodescarga: string | null;
  ticket: string | null; pesoreal: number | null; tarifa: number | null; nf: string | null; cavalo: string | null;
  motorista: string | null; valorfrete: number | null; obs: string | null; produto: string | null;
  caminhonf?: string | null;
} | null;

type Opcao = { id: number; nome: string; };

type LancamentoDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData, arquivo: File | null) => void; 
  userRole: string | null;
  userName: string | null;
  userPlaca: string | null;
};

// URL de conexão ajustada para o ambiente
const API_URL = 'http://localhost:3001';

const formatarParaDateTimeLocal = (dataString: string | number | null | undefined): string => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return "";
    const dataLocal = new Date(data.getTime() - (data.getTimezoneOffset() * 60000));
    return dataLocal.toISOString().slice(0, 16);
  } catch (e) { return ""; }
}

const formatarParaDate = (dataString: string | number | null | undefined): string => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return "";
    return data.toISOString().split('T')[0];
  } catch (e) { return ""; }
}

export function AddLancamentoDialog({ isOpen, onOpenChange, onSave, initialData, userRole, userName, userPlaca }: LancamentoDialogProps) {
  
  const getInitialState = () => ({
    data: new Date().toISOString().split('T')[0], 
    horapostada: new Date().toTimeString().split(' ')[0].substring(0, 5),
    origem: "", destino: "", iniciodescarga: "", terminodescarga: "", tempodescarga: "",
    ticket: "", pesoreal: "", tarifa: "", nf: "", 
    cavalo: (userRole === 'motorista' && userPlaca) ? userPlaca : "", 
    motorista: (userRole === 'motorista' && userName) ? userName : "", 
    valorfrete: "", obs: "", produto: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const [arquivoNf, setArquivoNf] = useState<File | null>(null);
  const [listaProdutos, setListaProdutos] = useState<Opcao[]>([]);
  const [listaOrigens, setListaOrigens] = useState<Opcao[]>([]);
  const [listaDestinos, setListaDestinos] = useState<Opcao[]>([]);

  // Carrega opções do banco
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('authToken');
      const fetchDados = async (endpoint: string, setEstado: (dados: Opcao[]) => void) => {
        try {
          const res = await fetch(`${API_URL}/api/${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) { 
            const data = await res.json(); 
            setEstado(data); 
          }
        } catch (error) { console.error(`Erro ${endpoint}:`, error); }
      };
      fetchDados('produtos', setListaProdutos);
      fetchDados('origens', setListaOrigens);
      fetchDados('destinos', setListaDestinos);
    }
  }, [isOpen]);

  // Sincroniza dados iniciais ou automáticos do usuário logado
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const dadosCorrigidos: FormData = {} as FormData;
        Object.keys(initialData).forEach(key => {
          dadosCorrigidos[key] = initialData[key as keyof typeof initialData] ?? ""; 
        });
        dadosCorrigidos.data = formatarParaDate(initialData.data);
        dadosCorrigidos.horapostada = initialData.horapostada ?? "";
        dadosCorrigidos.iniciodescarga = formatarParaDateTimeLocal(initialData.iniciodescarga);
        dadosCorrigidos.terminodescarga = formatarParaDateTimeLocal(initialData.terminodescarga);
        
        // Proteção: Motorista não pode editar nome/placa nem de registros antigos
        if (userRole === 'motorista') {
          dadosCorrigidos.motorista = userName || "";
          if (userPlaca) dadosCorrigidos.cavalo = userPlaca;
        }
        setFormData(dadosCorrigidos);
      } else {
        setFormData(getInitialState());
      }
      setArquivoNf(null); 
    }
  }, [initialData, isOpen, userName, userRole, userPlaca]);

  // Cálculo de Tempo de Descarga Automático
  useEffect(() => {
    const inicio = String(formData.iniciodescarga);
    const fim = String(formData.terminodescarga);
    if (inicio && fim) {
      const tempo = calcularTempoDescarga(inicio, fim);
      if (tempo !== formData.tempodescarga) {
        setFormData(prev => ({ ...prev, tempodescarga: tempo }));
      }
    }
  }, [formData.iniciodescarga, formData.terminodescarga]);

  // Cálculo Automático de Frete
  useEffect(() => {
    const peso = parseFloat(String(formData.pesoreal)) || 0;
    const tarifa = parseFloat(String(formData.tarifa)) || 0;
    const total = (peso * tarifa).toFixed(2);
    if (total !== String(formData.valorfrete)) {
        setFormData(prev => ({ ...prev, valorfrete: total }));
    }
  }, [formData.pesoreal, formData.tarifa]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setArquivoNf(e.target.files[0]);
    else setArquivoNf(null);
  };

  const handleSubmit = () => { onSave(formData, arquivoNf); };

  const isEditing = !!initialData;
  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Adicionar Novo Lançamento"}</DialogTitle>
          <DialogDescription>Preencha os campos abaixo. O valor do frete e tempo de descarga são automáticos.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-4">
            <div><Label>Data</Label><Input name="data" type="date" value={String(formData.data)} onChange={handleChange} /></div>
            <div><Label>Hora Postada</Label><Input name="horapostada" type="time" value={String(formData.horapostada)} onChange={handleChange} /></div>
            <div>
              <Label>Motorista</Label>
              <Input 
                name="motorista" 
                value={String(formData.motorista)} 
                onChange={handleChange} 
                disabled={userRole === 'motorista'} 
                readOnly={userRole === 'motorista'} 
                className={userRole === 'motorista' ? "bg-muted" : ""}
              />
            </div>
            <div>
              <Label>Cavalo (Placa)</Label>
              <Input 
                name="cavalo" 
                value={String(formData.cavalo)} 
                onChange={handleChange} 
                disabled={userRole === 'motorista'} 
                readOnly={userRole === 'motorista'} 
                className={userRole === 'motorista' ? "bg-muted" : ""}
              />
            </div>
            <div><Label>Ticket</Label><Input name="ticket" value={String(formData.ticket)} onChange={handleChange} /></div>
          </div>

          <div className="space-y-4">
            <div><Label>Produto</Label><select name="produto" value={String(formData.produto)} onChange={handleChange} className={inputClass}><option value="">Selecione...</option>{listaProdutos.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}</select></div>
            <div><Label>Origem</Label><select name="origem" value={String(formData.origem)} onChange={handleChange} className={inputClass}><option value="">Selecione...</option>{listaOrigens.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}</select></div>
            <div><Label>Destino</Label><select name="destino" value={String(formData.destino)} onChange={handleChange} className={inputClass}><option value="">Selecione...</option>{listaDestinos.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}</select></div>
            <div><Label>Peso Real (Ton)</Label><Input name="pesoreal" type="number" step="0.001" value={String(formData.pesoreal)} onChange={handleChange} /></div>
            <div><Label>Nota Fiscal (Nº)</Label><Input name="nf" value={String(formData.nf)} onChange={handleChange} /></div>
          </div>

          <div className="space-y-4">
            <div><Label>Início Descarga</Label><Input name="iniciodescarga" type="datetime-local" value={String(formData.iniciodescarga)} onChange={handleChange} /></div>
            <div><Label>Término Descarga</Label><Input name="terminodescarga" type="datetime-local" value={String(formData.terminodescarga)} onChange={handleChange} /></div>
            <div><Label>Tempo Descarga</Label><Input name="tempodescarga" value={String(formData.tempodescarga)} readOnly className="bg-muted" /></div>
            <div><Label>Tarifa</Label><Input name="tarifa" type="number" step="0.01" value={String(formData.tarifa)} onChange={handleChange} /></div>
            <div><Label>Valor Frete (Automático)</Label><Input name="valorfrete" type="number" step="0.01" value={String(formData.valorfrete)} readOnly className="bg-muted" /></div>
            <div><Label>Observação</Label><Input name="obs" value={String(formData.obs)} onChange={handleChange} /></div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Anexar Nota Fiscal (PDF/Imagem)</Label>
          <Input name="arquivoNf" type="file" onChange={handleFileChange} />
        </div>
        <DialogFooter><Button type="submit" onClick={handleSubmit}>Salvar Registro</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function calcularTempoDescarga(inicio: string, fim: string): string {
  if (!inicio || !fim) return "";
  try {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    if (dataFim <= dataInicio) return "0h 0m"; 
    let diffMs = dataFim.getTime() - dataInicio.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= diffHoras * (1000 * 60 * 60);
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    return `${diffHoras}h ${diffMinutos}m`;
  } catch (e) { return ""; }
}