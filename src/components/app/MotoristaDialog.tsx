"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Definição do tipo para os dados do formulário (Remove o erro de 'any')
interface MotoristaFormData {
  username: string;
  password?: string;
  nome_completo: string;
  role: string;
  cpf: string;
  cnh: string;
  placa_cavalo: string;
  placas_carretas: string;
}

type MotoristaDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MotoristaFormData) => void;
  initialData?: MotoristaFormData | null;
};

export function MotoristaDialog({ isOpen, onOpenChange, onSave, initialData }: MotoristaDialogProps) {
  const [formData, setFormData] = useState<MotoristaFormData>({
    username: "",
    password: "",
    nome_completo: "",
    role: "motorista",
    cpf: "",
    cnh: "",
    placa_cavalo: "",
    placas_carretas: "",
  });

  // Limpa ou preenche o formulário quando o Dialog abre
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          username: initialData.username || "",
          password: "", 
          nome_completo: initialData.nome_completo || "",
          role: initialData.role || "motorista",
          cpf: initialData.cpf || "",
          cnh: initialData.cnh || "",
          placa_cavalo: initialData.placa_cavalo || "",
          placas_carretas: initialData.placas_carretas || "",
        });
      } else {
        setFormData({
          username: "",
          password: "",
          nome_completo: "",
          role: "motorista",
          cpf: "",
          cnh: "",
          placa_cavalo: "",
          placas_carretas: "",
        });
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="nome_completo">Nome Completo</Label>
            <Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Classe de Usuário (Permissões)</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motorista">🚗 Motorista (Lança e vê os seus)</SelectItem>
                <SelectItem value="auditor">👁️ Auditor (Vê tudo, não altera nada)</SelectItem>
                <SelectItem value="master">🛡️ Master (Acesso Total)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Login (Usuário)</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{initialData ? "Nova Senha (opcional)" : "Senha"}</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!initialData} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} />
          </div>

          {formData.role === 'motorista' && (
            <div className="border-t pt-4 mt-2 grid gap-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dados do Condutor/Veículo</p>
              <div className="grid gap-2">
                <Label htmlFor="cnh">CNH</Label>
                <Input id="cnh" name="cnh" value={formData.cnh} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="placa_cavalo">Placa Cavalo</Label>
                  <Input id="placa_cavalo" name="placa_cavalo" value={formData.placa_cavalo} onChange={handleChange} placeholder="ABC-1234" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="placas_carretas">Placas Carretas</Label>
                  <Input id="placas_carretas" name="placas_carretas" value={formData.placas_carretas} onChange={handleChange} placeholder="Placa 1, Placa 2" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar Usuário</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}