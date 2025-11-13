// Arquivo: src/app/login/page.tsx (CORRETO)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// GARANTA QUE ESTA URL ESTÁ CORRETA
const API_URL = 'https://api-pesos-faturamento.onrender.com'; 

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido no login.');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role); 
      localStorage.setItem('userFullName', data.nome_completo);

      toast.success('Login bem-sucedido!');
      router.push('/');

    } catch (error: unknown) {
      console.error("Falha no login:", error);
      let message = "Falha no login. Verifique suas credenciais ou se o servidor está online.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    }
  };
  
  // ... (resto do código JSX igual)
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image src="/LogoSF.png" alt="Logo" width={200} height={200} className="mb-4 mx-auto" />
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Entre com seu usuário e senha.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Usuário</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleLogin} className="w-full">Entrar</Button>
        </CardContent>
      </Card>
    </div>
  );
}