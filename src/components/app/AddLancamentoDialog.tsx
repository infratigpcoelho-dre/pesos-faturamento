// Arquivo: src/components/app/AddLancamentoDialog.tsx (COM DROPDOWNS DINÂMICOS)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Importamos o toast para erros de carregamento

type FormData = { [key: string]: string | number; };
type InitialData = {
  id: number; data: string | null; horapostada: string | null; origem: string | null; destino: string | null;
  iniciodescarga: string | null; terminodescarga: string | null; tempodescarga: string | null;
  ticket: string | null; pesoreal: number | null; tarifa: number | null; nf: string | null; cavalo: string | null;
  motorista: string | null; valorfrete: number | null; obs: string | null; produto: string | null;
  caminhonf?: string | null;
} | null;

// Tipo para os itens das listas
type Opcao = { id: number; nome: string; };

type LancamentoDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData, arquivo: File | null) => void; 
  initialData?: InitialData;
  userRole: string | null;
  userName: string | null;
};

// ATENÇÃO: Confirme que esta é a sua URL do RENDER
const API_URL = 'https://api-pesos-faturamento.onrender.com';

// Funções de formatação
const formatarParaDateTimeLocal = (dataString: string | number | null | undefined) => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    const dataLocal = new Date(data.getTime() - (data.getTimezoneOffset() * 60000));
    return dataLocal.toISOString().slice(0, 16);
  } catch (e) { return ""; }
}

const formatarParaDate = (dataString: string | number | null | undefined) => {
  if (!dataString) return "";
  try {
    const data = new Date(dataString);
    return data.toISOString().split('T')[0];
  } catch (e) { return ""; }
}

export function AddLancamentoDialog({ isOpen, onOpenChange, onSave, initialData, userRole, userName }: LancamentoDialogProps) {
  
  const getInitialState = () => ({
    data: new Date().toISOString().split('T')[0], horapostada: new Date().toTimeString().split(' ')[0].substring(0, 5),
    origem: "", destino: "", iniciodescarga: "", terminodescarga: "", tempodescarga: "",
    ticket: "", pesoreal: "", tarifa: "", nf: "", cavalo: "", 
    motorista: userRole === 'master' ? "" : (userName || ""), 
    valorfrete: "", obs: "", produto: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const [arquivoNf, setArquivoNf] = useState<File | null>(null);

  // Novos estados para as listas
  const [listaProdutos, setListaProdutos] = useState<Opcao[]>([]);
  const [listaOrigens, setListaOrigens] = useState<Opcao[]>([]);
  const [listaDestinos, setListaDestinos] = useState<Opcao[]>([]);

  // Função para carregar as listas
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('authToken');
      
      const fetchDados = async (endpoint: string, setEstado: (dados: Opcao[]) => void) => {
        try {
          const res = await fetch(`${API_URL}/api/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setEstado(data);
          }
        } catch (error) {
          console.error(`Erro ao carregar ${endpoint}`);
        }
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
        dadosCorrigidos.data = formatarParaDate(initialData.data);
        dadosCorrigidos.horapostada = initialData.horapostada ?? "";
        dadosCorrigidos.iniciodescarga = formatarParaDateTimeLocal(initialData.iniciodescarga);
        dadosCorrigidos.terminodescarga = formatarParaDateTimeLocal(initialData.terminodescarga);
        
        if (userRole !== 'master') {
          dadosCorrigidos.motorista = userName || "";
        }

        setFormData(dadosCorrigidos);
      } else {
        setFormData(getInitialState());
      }
      setArquivoNf(null); 
    }
  }, [initialData, isOpen, userName, userRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Estilo padrão para inputs e selects ficarem iguais
  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Adicionar Novo Lançamento"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere as informações abaixo." : "Preencha todos os campos do carregamento."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          
          {/* COLUNA 1 */}
          <div className="space-y-4">
            <div><Label htmlFor="data">Data</Label><Input id="data" name="data" type="date" value={String(formData.data)} onChange={handleChange} /></div>
            <div><Label htmlFor="horapostada">Hora Postada</Label><Input id="horapostada" name="horapostada" type="time" value={String(formData.horapostada)} onChange={handleChange} /></div>
            <div>
              <Label htmlFor="motorista">Motorista</Label>
              <Input id="motorista" name="motorista" value={String(formData.motorista)} onChange={handleChange} disabled={userRole !== 'master'} readOnly={userRole !== 'master'}/>
            </div>
            <div><Label htmlFor="cavalo">Cavalo (Placa)</Label><Input id="cavalo" name="cavalo" value={String(formData.cavalo)} onChange={handleChange} /></div>
            <div><Label htmlFor="ticket">Ticket</Label><Input id="ticket" name="ticket" value={String(formData.ticket)} onChange={handleChange} /></div>
          </div>

          {/* COLUNA 2 (COM OS NOVOS SELECTS) */}
          <div className="space-y-4">
            
            {/* PRODUTO: Agora é um Select */}
            <div>
              <Label htmlFor="produto">Produto</Label>
              <select 
                id="produto" 
                name="produto" 
                value={String(formData.produto)} 
                onChange={handleChange} 
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {listaProdutos.map((item) => (
                  <option key={item.id} value={item.nome}>{item.nome}</option>
                ))}
              </select>
            </div>

            {/* ORIGEM: Agora é um Select */}
            <div>
              <Label htmlFor="origem">Origem</Label>
              <select 
                id="origem" 
                name="origem" 
                value={String(formData.origem)} 
                onChange={handleChange} 
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {listaOrigens.map((item) => (
                  <option key={item.id} value={item.nome}>{item.nome}</option>
                ))}
              </select>
            </div>

            {/* DESTINO: Agora é um Select */}
            <div>
              <Label htmlFor="destino">Destino</Label>
              <select 
                id="destino" 
                name="destino" 
                value={String(formData.destino)} 
                onChange={handleChange} 
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {listaDestinos.map((item) => (
                  <option key={item.id} value={item.nome}>{item.nome}</option>
                ))}
              </select>
            </div>

            <div><Label htmlFor="pesoreal">Peso Real (kg)</Label><Input id="pesoreal" name="pesoreal" type="number" value={String(formData.pesoreal)} onChange={handleChange} /></div>
            <div><Label htmlFor="nf">Nota Fiscal (Nº)</Label><Input id="nf" name="nf" value={String(formData.nf)} onChange={handleChange} /></div>
          </div>

          {/* COLUNA 3 */}
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