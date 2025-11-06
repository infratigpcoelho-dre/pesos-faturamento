// Arquivo: src/components/app/MotoristaDialog.tsx (CORREÇÃO FINAL DE TIPO)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define os tipos de dados do formulário
type FormData = {
  id?: number;
  nome_completo: string;
  cpf: string;
  cnh: string;
  placa_cavalo: string;
  placas_carretas: string;
  username: string;
  password?: string;
};

// O tipo que vem do backend (pode ter nulos)
type MotoristaData = {
  id: number;
  username: string;
  nome_completo: string | null;
  cpf: string | null;
  cnh: string | null;
  placa_cavalo: string | null;
  placas_carretas: string | null;
  role: string;
};


type MotoristaDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData) => void;
  initialData?: MotoristaData | null; // Agora espera o tipo que vem da API
};

export function MotoristaDialog({ isOpen, onOpenChange, onSave, initialData }: MotoristaDialogProps) {
  
  const getInitialState = () => ({
    nome_completo: "", cpf: "", cnh: "", placa_cavalo: "",
    placas_carretas: "", username: "", password: ""
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        
        // ****** AQUI ESTÁ A CORREÇÃO ******
        // Criamos o objeto 'dadosLimpados' campo por campo,
        // usando o 'operador de coalescência nula' (??) para
        // trocar qualquer 'null' ou 'undefined' por uma string vazia "".
        const dadosLimpados: FormData = {
          id: initialData.id,
          username: initialData.username ?? "",
          nome_completo: initialData.nome_completo ?? "",
          cpf: initialData.cpf ?? "",
          cnh: initialData.cnh ?? "",
          placa_cavalo: initialData.placa_cavalo ?? "",
          placas_carretas: initialData.placas_carretas ?? "",
          password: "" // Sempre começa com a senha vazia
        };
        // ****** FIM DA CORREÇÃO ******
        
        setFormData(dadosLimpados); // Salva os dados limpos no estado

      } else {
        setFormData(getInitialState());
      }
    }
  }, [initialData, isOpen, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Motorista" : "Adicionar Novo Motorista"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere as informações abaixo." : "Preencha os dados do novo motorista/usuário."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div><Label htmlFor="nome_completo">Nome Completo</Label><Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} /></div>
            <div><Label htmlFor="cpf">CPF</Label><Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} /></div>
            <div><Label htmlFor="cnh">CNH</Label><Input id="cnh" name="cnh" value={formData.cnh} onChange={handleChange} /></div>
          </div>
          {/* Coluna 2 */}
          <div className="space-y-4">
            <div><Label htmlFor="placa_cavalo">Placa Cavalo</Label><Input id="placa_cavalo" name="placa_cavalo" value={formData.placa_cavalo} onChange={handleChange} /></div>
            <div><Label htmlFor="placas_carretas">Placas Carretas</Label><Input id="placas_carretas" name="placas_carretas" value={formData.placas_carretas} onChange={handleChange} /></div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <div><Label htmlFor="username">Login (Usuário)</Label><Input id="username" name="username" value={formData.username} onChange={handleChange} /></div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? "Deixe em branco para não alterar" : ""} />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Motorista</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}