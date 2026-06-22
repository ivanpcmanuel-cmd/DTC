import React, { useState } from 'react';
import { auth, googleProvider, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { User } from '../types';
import { Card, Input, Button } from '../components/UI';
import { LogIn, UserPlus, Shield } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      case 'auth/user-not-found':
        return 'Nenhum utilizador encontrado com este e-mail.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está sendo utilizado por outra conta.';
      case 'auth/weak-password':
        return 'A senha selecionada é muito fraca. Escolha uma senha de pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'O formato do endereço de e-mail é inválido.';
      case 'auth/popup-closed-by-user':
        return 'O login com o Google foi fechado antes de ser concluído.';
      default:
        return err?.message || 'Ocorreu um erro ao processar a autenticação.';
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = result.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        onLogin(userSnap.data() as User);
      } else {
        // Fallback profile creation if auth exists but firestore profile is missing
        const isAdmin = email.toLowerCase().trim() === 'ivanpcmanuel@gmail.com';
        const role = isAdmin ? 'admin' : 'viewer';

        const fallbackUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          username: email.toLowerCase().trim(),
          passwordHash: '',
          role: role
        };

        await setDoc(userRef, fallbackUser);
        onLogin(fallbackUser);
      }
    } catch (error: any) {
      console.error("Sign In Error:", error);
      setErrorMsg(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !name) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas introduzidas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const firebaseUser = result.user;

      const userRef = doc(db, 'users', firebaseUser.uid);

      // Check if there is a pending pre-registration document for this email
      const q = query(collection(db, 'users'), where('username', '==', normalizedEmail));
      const qSnap = await getDocs(q);

      if (!qSnap.empty) {
        const preRegisteredDoc = qSnap.docs[0];
        const preRegisteredData = preRegisteredDoc.data() as User;

        const updatedUser: User = {
          ...preRegisteredData,
          id: firebaseUser.uid,
          name: name.trim() // update with user's inputted registration name
        };

        await setDoc(userRef, updatedUser);

        // Delete raw pre-registered temporary document if IDs differ
        if (preRegisteredDoc.id !== firebaseUser.uid) {
          await deleteDoc(doc(db, 'users', preRegisteredDoc.id));
        }

        onLogin(updatedUser);
      } else {
        // Default new user setup
        const isAdmin = normalizedEmail === 'ivanpcmanuel@gmail.com';
        const role = isAdmin ? 'admin' : 'viewer';

        const newUser: User = {
          id: firebaseUser.uid,
          name: name.trim(),
          username: normalizedEmail,
          passwordHash: '',
          role: role
        };

        await setDoc(userRef, newUser);
        onLogin(newUser);
      }
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      setErrorMsg(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const email = firebaseUser.email || '';
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        onLogin(userSnap.data() as User);
      } else {
        const q = query(collection(db, 'users'), where('username', '==', email.toLowerCase()));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const preRegisteredDoc = qSnap.docs[0];
          const preRegisteredData = preRegisteredDoc.data() as User;
          
          const updatedUser: User = { 
            ...preRegisteredData, 
            id: firebaseUser.uid,
            name: preRegisteredData.name || firebaseUser.displayName || 'Colaborador'
          };
          
          await setDoc(userRef, updatedUser);
          
          if (preRegisteredDoc.id !== firebaseUser.uid) {
            await deleteDoc(doc(db, 'users', preRegisteredDoc.id));
          }
          
          onLogin(updatedUser);
        } else {
          const isAdmin = email.toLowerCase() === 'ivanpcmanuel@gmail.com';
          const role = isAdmin ? 'admin' : 'viewer';
          
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Colaborador',
            username: email.toLowerCase(),
            passwordHash: '', 
            role: role
          };

          await setDoc(userRef, newUser);
          onLogin(newUser);
        }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setErrorMsg(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-dtc-blue tracking-tight">DTC Manager</h1>
          <p className="text-gray-500 mt-2 font-medium">Sistema Integrado de Gestão</p>
        </div>

        <Card title={isSignUp ? "Criar Conta Escolar" : "Entrar no Sistema"}>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md text-center font-medium">
              {errorMsg}
            </div>
          )}

          {!isSignUp ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Input
                label="E-mail Escolar / Pessoal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                required
              />
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira sua senha"
                required
              />
              
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 font-bold"
                  icon={LogIn}
                >
                  {loading ? 'A carregar...' : 'Entrar com Email e Senha'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <Input
                label="Nome Completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome e sobrenome"
                required
              />
              <Input
                label="E-mail Escolar"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@gmail.com"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caracteres"
                  required
                />
                <Input
                  label="Confirmar Senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 font-bold bg-dtc-blue"
                  icon={UserPlus}
                >
                  {loading ? 'Registrando...' : 'Registrar-se'}
                </Button>
              </div>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs text-gray-500 uppercase">
              <span className="bg-white px-3 font-medium">Ou conecte-se com</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dtc-blue disabled:opacity-50 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-.35-1.12-.86-1.39-1.48z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Conta Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignUp ? (
              <>
                Já possui uma conta?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMsg('');
                  }}
                  className="font-semibold text-dtc-blue hover:underline cursor-pointer focus:outline-none"
                >
                  Faça login aqui
                </button>
              </>
            ) : (
              <>
                Novo no DTC Manager?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                  }}
                  className="font-semibold text-dtc-blue hover:underline cursor-pointer focus:outline-none"
                >
                  Crie sua conta escolar
                </button>
              </>
            )}
          </p>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; 2024 Dosign Training Center
        </div>
      </div>
    </div>
  );
};
