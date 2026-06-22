import React, { useState } from 'react';
import { auth, googleProvider, db } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { User } from '../types';
import { Card } from '../components/UI';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const email = firebaseUser.email || '';
      
      // 1. Direct match by Firebase UID
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        onLogin(userSnap.data() as User);
      } else {
        // 2. Lookup by pre-registered email (lowercase matching)
        const q = query(collection(db, 'users'), where('username', '==', email.toLowerCase()));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const preRegisteredDoc = qSnap.docs[0];
          const preRegisteredData = preRegisteredDoc.data() as User;
          
          // Migrate schema to user UID
          const updatedUser: User = { 
            ...preRegisteredData, 
            id: firebaseUser.uid,
            name: preRegisteredData.name || firebaseUser.displayName || 'Colaborador'
          };
          
          await setDoc(userRef, updatedUser);
          
          // Remove old document if the ID was temporary
          if (preRegisteredDoc.id !== firebaseUser.uid) {
            await deleteDoc(doc(db, 'users', preRegisteredDoc.id));
          }
          
          onLogin(updatedUser);
        } else {
          // 3. Brand-new registration
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
      setErrorMsg(error?.message || 'Falha na autenticação com o Google.');
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

        <Card title="Entrar no Sistema">
          <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
            Utilize a sua conta escolar ou institucional do Google para autenticar-se com segurança no DTC Manager.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md text-center font-medium">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dtc-blue disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-.35-1.12-.86-1.39-1.48z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>{loading ? 'Autenticando...' : 'Entrar com o Google'}</span>
          </button>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; 2024 Dosign Training Center
        </div>
      </div>
    </div>
  );
};
