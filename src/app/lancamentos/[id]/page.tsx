// Arquivo: src/app/lancamentos/[id]/page.tsx (FINAL COM AUTENTICAÇÃO)

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Link as LinkIcon, Calendar, Clock, Truck, Box, MapPin, CheckSquare, FileText, DollarSign, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

type Lancamento = {
  id: number; data: string; horapostada: string; origem: string; destino: string;
  iniciodescarga: string; terminodescarga: string; tempodescarga: string;
  ticket: string; pesoreal: number; tarifa: number; nf: string; cavalo: string;
  motorista: string; valorfrete: number; obs: string; produto: string;
  caminhonf?: string;
};

const API_URL = 'https://api-pesos-faturamento.onrender.com';

function DetalheItem({ icon: Icon, label, value, isCurrency = false }: { icon: React.ElementType, label: string, value: string | number | null, isCurrency?: boolean }) {
  let displayValue = value ?? '-';
  if (isCurrency) {
    displayValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }
  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div className="flex flex-col">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <p className="text-md font-medium">{String(displayValue)}</p>
      </div>
    </div>
  );
}

export default function LancamentoDetalhePage() {
  const [lancamento, setLancamento] = useState<Lancamento | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!id || !token) {
      router.push('/login');
      return;
    }

    async function carregarDetalhes() {
      try {
        // ****** CORREÇÃO AQUI: Adicionamos o 'headers' com o token ******
        const response = await fetch(`${API_URL}/lancamentos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        // ****** FIM DA CORREÇÃO ******

        if (response.status === 401 || response.status === 403) {
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push('/login');
          return;
        }
        if (!response.ok) throw new Error('Lançamento não encontrado');
        const data = await response.json();
        setLancamento(data);
      } catch (error: unknown) {
        let message = "Erro ao carregar detalhes do lançamento.";
        if (error instanceof Error) message = error.message;
        toast.error(message);
        router.push('/');
      }
    }
    carregarDetalhes();
  }, [id, router]);

  const formatarDataHora = (dataString: string | null) => {
    if (!dataString) return '-';
    try {
      if (dataString.includes('T')) {
         return new Date(dataString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return new Date(dataString).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    } catch (e: unknown) {
      return dataString; 
    }
  }

  if (!lancamento) {
    return <div className="flex h-screen items-center justify-center">Carregando detalhes...</div>;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Detalhes do Lançamento: Ticket {lancamento.ticket || '-'}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DetalheItem icon={Truck} label="Motorista" value={lancamento.motorista} />
          <DetalheItem icon={CheckSquare} label="Cavalo (Placa)" value={lancamento.cavalo} />
          <DetalheItem icon={Box} label="Produto" value={lancamento.produto} />
          <DetalheItem icon={MapPin} label="Origem" value={lancamento.origem} />
          <DetalheItem icon={MapPin} label="Destino" value={lancamento.destino} />
          <DetalheItem icon={CheckSquare} label="Ticket" value={lancamento.ticket} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Datas e Horários</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DetalheItem icon={Calendar} label="Data" value={lancamento.data ? new Date(lancamento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'} />
          <DetalheItem icon={Clock} label="Hora Postada" value={lancamento.horapostada} />
          <DetalheItem icon={Clock} label="Início Descarga" value={formatarDataHora(lancamento.iniciodescarga)} />
          <DetalheItem icon={Clock} label="Término Descarga" value={formatarDataHora(lancamento.terminodescarga)} />
          <DetalheItem icon={Clock} label="Tempo Descarga" value={lancamento.tempodescarga} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Financeiro e Documentos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DetalheItem icon={FileText} label="Nº da Nota Fiscal" value={lancamento.nf} />
          <DetalheItem icon={DollarSign} label="Peso Real" value={`${(lancamento.pesoreal || 0).toLocaleString('pt-BR')} kg`} />
          <DetalheItem icon={DollarSign} label="Tarifa" value={lancamento.tarifa} isCurrency={true} />
          <DetalheItem icon={DollarSign} label="Valor Frete" value={lancamento.valorfrete} isCurrency={true} />
          <DetalheItem icon={MessageSquare} label="Observação" value={lancamento.obs} />
          <div>
            <Label className="text-sm text-muted-foreground">Anexo NF</Label>
            {lancamento.caminhonf ? (
              <Button variant="outline" size="sm" asChild className="mt-2">
                <a href={`${API_URL}/uploads/${lancamento.caminhonf}`} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" /> Ver Anexo
                </a>
              </Button>
            ) : (
              <p className="text-md font-medium">-</p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}