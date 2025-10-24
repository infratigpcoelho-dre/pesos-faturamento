// Arquivo: src/app/login/page.tsx (VERSÃO FINAL COM TIPAGEM CORRETA)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch('https://api-pesagem-patrick.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido no login.');
      }

      toast.success('Login bem-sucedido!');
      localStorage.setItem('authToken', data.token);
      router.push('/');

    } catch (error) { // CORREÇÃO AQUI
      console.error("Falha no login:", error);
      let message = "Falha no login. Verifique suas credenciais.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image
            src="/LogoSF.png" // Assumindo que seu logo está correto
            alt="Logo da Empresa"
            width={200}
            height={200}
            className="mb-4 mx-auto"
          />
          <CardTitle className="text-2xl"> Grupo Coelho Transportes Diário de Bordo</CardTitle>
          <CardDescription>
            Entre com seu usuário e senha para acessar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Usuário</Label>
            <Input id="username" type="text" placeholder="seu.usuario" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Entrar
          </Button>
          <div className="mt-4 text-center text-sm">
            Não consegue acessar?{" "}
            <a
              href="https://wa.me/55996908384"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Fale com o suporte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}