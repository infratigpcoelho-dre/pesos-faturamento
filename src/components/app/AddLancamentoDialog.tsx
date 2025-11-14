// Arquivo: src/components/app/AddLancamentoDialog.tsx (CORREÇÃO FINAL DO 'void')

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
  initialData?: InitialData;
  userRole: string | null;
  userName: string | null;
  userPlaca: string | null;
};

const API_URL = 'https://api-pesos-faturamento.onrender.com';

// ****** AQUI ESTÁ A CORREÇÃO DO ERRO 'void' ******
// Função para formatar a data para o input datetime-local
const formatarParaDateTimeLocal = (dataString: string | number | null | undefined): string => {
  if (!dataString) return ""; // Sempre retorna uma string
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return ""; // Verifica se a data é inválida
    
    const dataLocal = new Date(data.getTime() - (data.getTimezoneOffset() * 60000));
    return dataLocal.toISOString().slice(0, 16);
  } catch (e) {
    return ""; // Sempre retorna uma string
  }
}

// Função para formatar a data para o input date
const formatarParaDate = (dataString: string | number | null | undefined): string => {
  if (!dataString) return ""; // Sempre retorna uma string
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return ""; // Verifica se a data é inválida
    return data.toISOString().split('T')[0];
  } catch (e) {
    return ""; // Sempre retorna uma string
  }
}
// ****** FIM DA CORREÇÃO ******

export function AddLancamentoDialog({ isOpen, onOpenChange, onSave, initialData, userRole, userName, userPlaca }: LancamentoDialogProps) {
  
  const getInitialState = () => ({
    data: new Date().toISOString().split('T')[0], horapostada: new Date().toTimeString().split(' ')[0].substring(0, 5),
    origem: "", destino: "", iniciodescarga: "", terminodescarga: "", tempodescarga: "",
    ticket: "", pesoreal: "", tarifa: "", nf: "", 
    cavalo: userRole !== 'master' && userPlaca ? userPlaca : "", 
    motorista: userRole === 'master' ? "" : (userName || ""), 
    valorfrete: "", obs: "", produto: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const [arquivoNf, setArquivoNf] = useState<File | null>(null);
  const [listaProdutos, setListaProdutos] = useState<Opcao[]>([]);
  const [listaOrigens, setListaOrigens] = useState<Opcao[]>([]);
  const [listaDestinos, setListaDestinos] = useState<Opcao[]>([]);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('authToken');
      const fetchDados = async (endpoint: string, setEstado: (dados: Opcao[]) => void) => {
        try {
          const res = await fetch(`${API_URL}/api/${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) { const data = await res.json(); setEstado(data); }
        } catch (error) { console.error(`Erro ${endpoint}`); }
      };
      fetchDados('produtos', setListaProdutos);
      fetchDados('origens', setListaOrigens);
      fetchDados('destinos', setListaDestinos);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const dadosCorrigidos: FormData = {} as FormData;
        Object.keys(initialData).forEach(key => {
          const valor = initialData[key as keyof typeof initialData];
          dadosCorrigidos[key] = valor ?? ""; 
        });
        
        // Agora essas funções SEMPRE retornarão uma string
        dadosCorrigidos.data = formatarParaDate(initialData.data);
        dadosCorrigidos.horapostada = initialData.horapostada ?? "";
        dadosCorrigidos.iniciodescarga = formatarParaDateTimeLocal(initialData.iniciodescarga);
        dadosCorrigidos.terminodescarga = formatarParaDateTimeLocal(initialData.terminodescarga);
        
        if (userRole !== 'master') {
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

  useEffect(() => {
    const inicio = String(formData.iniciodescarga);
    const fim = String(formData.terminodescarga);

    if (inicio && fim) {
      const tempo = calcularTempoDescarga(inicio, fim);
      if (tempo !== formData.tempodescarga) {
        setFormData(prevState => ({
          ...prevState,
          tempodescarga: tempo
        }));
      }
    }
  }, [formData.iniciodescarga, formData.terminodescarga]);


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
  const currentFileName = initialData?.caminhonf;
  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Adicionar Novo Lançamento"}</DialogTitle>
          <DialogDescription>Preencha os campos abaixo.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div><Label>Data</Label><Input name="data" type="date" value={String(formData.data)} onChange={handleChange} /></div>
            <div><Label>Hora Postada</Label><Input name="horapostada" type="time" value={String(formData.horapostada)} onChange={handleChange} /></div>
            <div>
              <Label>Motorista</Label>
              <Input name="motorista" value={String(formData.motorista)} onChange={handleChange} disabled={userRole !== 'master'} readOnly={userRole !== 'master'} />
            </div>
            <div>
              <Label>Cavalo (Placa)</Label>
              <Input 
                name="cavalo" 
                value={String(formData.cavalo)} 
                onChange={handleChange} 
                disabled={userRole !== 'master' && !!userPlaca} 
                readOnly={userRole !== 'master' && !!userPlaca}
              />
            </div>
            <div><Label>Ticket</Label><Input name="ticket" value={String(formData.ticket)} onChange={handleChange} /></div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div><Label>Produto</Label><select name="produto" value={String(formData.produto)} onChange={handleChange} className={inputClass}><option value="">Selecione...</option>{listaProdutos.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}</select></div>
            <div><Label>Origem</Label><select name="origem" value={String(formData.origem)} onChange={handleChange} className={inputClass}><option value="">Selecione...</option>{listaOrigens.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}</select></div>
            <div><Label>Destino</Label><select name="destino" value={String(formData.destino)} onChange={handleChange} className={inputClass}><option value="">Selecione...</option>{listaDestinos.map(i => <option key={i.id} value={i.nome}>{i.nome}</option>)}</select></div>
            <div><Label>Peso Real (kg)</Label><Input name="pesoreal" type="number" value={String(formData.pesoreal)} onChange={handleChange} /></div>
            <div><Label>Nota Fiscal (Nº)</Label><Input name="nf" value={String(formData.nf)} onChange={handleChange} /></div>
          </div>

          {/* Coluna 3 */}
          <div className="space-y-4">
            <div><Label>Início Descarga</Label><Input name="iniciodescarga" type="datetime-local" value={String(formData.iniciodescarga)} onChange={handleChange} /></div>
            <div><Label>Término Descarga</Label><Input name="terminodescarga" type="datetime-local" value={String(formData.terminodescarga)} onChange={handleChange} /></div>
            <div>
              <Label htmlFor="tempodescarga">Tempo Descarga</Label>
              <Input 
                id="tempodescarga" 
                name="tempodescarga" 
                value={String(formData.tempodescarga)} 
                onChange={handleChange} 
                placeholder="Cálculo automático..."
                readOnly
                className="disabled:opacity-100"
              />
            </div>
            <div><Label>Tarifa</Label><Input name="tarifa" type="number" step="0.01" value={String(formData.tarifa)} onChange={handleChange} /></div>
            <div><Label>Valor Frete</Label><Input name="valorfrete" type="number" step="0.01" value={String(formData.valorfrete)} onChange={handleChange} /></div>
            <div><Label>Observação</Label><Input name="obs" value={String(formData.obs)} onChange={handleChange} /></div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Anexar Nota Fiscal (PDF/Imagem)</Label>
          {isEditing && currentFileName && (<p className="text-sm text-muted-foreground">Atual: {currentFileName}</p>)}
          <Input name="arquivoNf" type="file" onChange={handleFileChange} />
        </div>
        <DialogFooter><Button type="submit" onClick={handleSubmit}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// (Não esqueça da função 'calcularTempoDescarga' que já tínhamos)
function calcularTempoDescarga(inicio: string, fim: string): string {
  if (!inicio || !fim) return "";
  try {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    if (dataFim <= dataInicio) return ""; 
    let diffMs = dataFim.getTime() - dataInicio.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= diffHoras * (1000 * 60 * 60);
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    return `${diffHoras}h ${diffMinutos}m`;
  } catch (e) {
    return "";
  }
}