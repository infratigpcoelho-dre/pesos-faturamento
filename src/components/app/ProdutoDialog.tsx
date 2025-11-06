// Arquivo: src/components/app/ProdutoDialog.tsx (NOVO ARQUIVO)

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
  nome: string;
};

// O tipo que vem do backend
type ProdutoData = {
  id: number;
  nome: string | null;
};

type ProdutoDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData) => void;
  initialData?: ProdutoData | null;
};

export function ProdutoDialog({ isOpen, onOpenChange, onSave, initialData }: ProdutoDialogProps) {
  
  const getInitialState = () => ({
    nome: "",
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        // "Limpa" os dados, trocando null por ""
        const dadosLimpados: FormData = {
          id: initialData.id,
          nome: initialData.nome ?? "",
        };
        setFormData(dadosLimpados);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere o nome do produto." : "Digite o nome do novo produto."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Soja, Milho, Calcário..." />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Produto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}