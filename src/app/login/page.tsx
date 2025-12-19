"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Altere para a URL do seu backend (localhost ou Render)
const API_URL = 'http://localhost:3001';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    // Previne o comportamento padrão se for chamado por um formulário
    if (e) e.preventDefault();
    
    // Limpeza básica: remove espaços em branco acidentais no início/fim do usuário
    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação.');
      }

      // PERSISTÊNCIA: Salvando os dados de sessão e perfil
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role); 
      localStorage.setItem('userFullName', data.nome_completo || '');
      localStorage.setItem('userPlacaCavalo', data.placa_cavalo || '');

      toast.success(`Bem-vindo, ${data.nome_completo || cleanUsername}!`);
      
      // Redireciona para a Home/Dashboard
      router.push('/'); 

    } catch (error: unknown) {
      console.error("Erro capturado no login:", error);
      let message = "Erro ao conectar com o servidor.";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center space-y-1">
          <div className="mb-2">
            <Image 
              src="/LogoSF.png" 
              alt="Logo Grupo Coelho" 
              width={160} 
              height={160} 
              className="mx-auto object-contain"
              priority 
            />
          </div>
          <CardTitle className="text-xl font-bold">Diário de Bordo</CardTitle>
          <CardDescription>Acesse o sistema de controle de faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Usar uma tag <form> permite que o usuário aperte "Enter" para logar */}
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="seu.usuario" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Autenticando..." : "Entrar no Sistema"}
            </Button>
            
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Não consegue acessar?{" "}
              <a 
                href="https://wa.me/55 99734-9942" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline text-primary hover:opacity-80"
              >
                Fale com o suporte técnico
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}