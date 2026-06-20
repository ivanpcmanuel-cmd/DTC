import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Button, Input, Card } from '../components/UI';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.tsx onAuthStateChanged listener will handle loading sync and state progression
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou palavra-passe incorretos.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Formato de e-mail inválido.");
      } else {
        setError("Ocorreu um erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A palavra-passe deve conter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Seed local storage with initial admin user profile representation matching this UID 
      // Before Firestore syncs, this will be bootstrapped up into the tenant's users/{uid}/users subcollection
      const adminUserProfile: User = {
        id: firebaseUser.uid,
        name: fullName,
        username: email.split('@')[0],
        passwordHash: '', // Secured by Firebase Auth
        role: 'admin'
      };

      // Set initial lists to avoid blank screen or to seed correctly
      localStorage.setItem('dtc_users', JSON.stringify([adminUserProfile]));
      localStorage.setItem('dtc_current_user', JSON.stringify(adminUserProfile));

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este endereço de e-mail já está registado.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Formato de e-mail inválido.");
      } else {
        setError("Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        {/* App Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">DTC Manager</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Sistema Integrado de Gestão de Formação</p>
        </div>

        {isRegisterMode ? (
          <Card title="Registar Nova Conta Cloud">
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Crie uma conta para o seu centro e tenha acesso seguro a partir de qualquer dispositivo.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              <Input 
                label="Nome do Administrador" 
                placeholder="Ex. Ivan Manuel" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required 
              />
              
              <Input 
                label="Endereço de E-mail" 
                placeholder="Ex. ivan@exemplo.com" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />

              <Input 
                label="Palavra-passe" 
                placeholder="Mínimo 6 caracteres" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />

              <Input 
                label="Confirmar Palavra-passe" 
                placeholder="Introduza novamente" 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "A criar conta..." : "Criar Conta DTC"}
              </Button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <button 
                  type="button" 
                  onClick={() => { setIsRegisterMode(false); setError(null); }} 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Já tem conta? Entrar na Cloud
                </button>
              </div>
            </form>
          </Card>
        ) : (
          <Card title="Entrar na DTC Cloud">
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Introduza os seus dados de e-mail para sincronizar as informações deste dispositivo.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              <Input 
                label="Endereço de E-mail" 
                placeholder="Ex. ivan@exemplo.com" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />

              <Input 
                label="Palavra-passe" 
                placeholder="Introduza a sua palavra-passe" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "A entrar..." : "Sincronizar e Entrar"}
              </Button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <button 
                  type="button" 
                  onClick={() => { setIsRegisterMode(true); setError(null); }} 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Não tem conta? Criar conta cloud
                </button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-8 text-center text-xs text-slate-400 font-semibold tracking-wide">
          &copy; 2026 Dosign Training Center • Cloud Realtime
        </div>
      </div>
    </div>
  );
};
