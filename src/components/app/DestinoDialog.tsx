// Arquivo: src/components/app/DestinoDialog.tsx (NOVO)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = { id?: number; nome: string; };
type DestinoData = { id: number; nome: string | null; };

type DestinoDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: FormData) => void;
  initialData?: DestinoData | null;
};

export function DestinoDialog({ isOpen, onOpenChange, onSave, initialData }: DestinoDialogProps) {
  const getInitialState = () => ({ nome: "" });
  const [formData, setFormData] = useState<FormData>(getInitialState());
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({ id: initialData.id, nome: initialData.nome ?? "" });
      } else {
        setFormData(getInitialState());
      }
    }
  }, [initialData, isOpen, isEditing]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Destino" : "Adicionar Novo Destino"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere o nome do destino." : "Digite o nome do novo destino."}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Destino</Label>
            <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Porto de Santos..." />
          </div>
        </div>
        <DialogFooter><Button onClick={() => onSave(formData)}>Salvar Destino</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}