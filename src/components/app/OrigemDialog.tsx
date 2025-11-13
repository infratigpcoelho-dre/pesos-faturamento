// Arquivo: src/components/app/OrigemDialog.tsx (NOVO)

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

type FormData = {
  id?: number;
  nome: string;
};

type OrigemData = {
  id: number;
  nome: string | null;
};

type OrigemDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData) => void;
  initialData?: OrigemData | null;
};

export function OrigemDialog({ isOpen, onOpenChange, onSave, initialData }: OrigemDialogProps) {
  
  const getInitialState = () => ({
    nome: "",
  });

  const [formData, setFormData] = useState<FormData>(getInitialState());
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
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
          <DialogTitle>{isEditing ? "Editar Origem" : "Adicionar Nova Origem"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere o nome da origem." : "Digite o nome da nova origem (Usina, Fazenda, etc)."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Origem</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Usina Enersugar..." />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Origem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}