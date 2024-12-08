import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '@/store/authStore';
import { passwordSchema } from '@/lib/auth';
import Button from '../ui/Button';

const authSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
});

type AuthForm = z.infer<typeof authSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register: registerUser, loginWithGoogle } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthForm) => {
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        await registerUser(data.email, data.password);
      }
      onClose();
    } catch (error) {
      setError('root', {
        message: 'Une erreur est survenue',
      });
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    try {
      if (response.credential) {
        await loginWithGoogle(response.credential);
        onClose();
      }
    } catch (error) {
      console.error('Google login failed:', error);
      setError('root', {
        message: 'La connexion avec Google a échoué',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            {!isLogin && (
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• Au moins 8 caractères</li>
                <li>• Au moins une majuscule</li>
                <li>• Au moins une minuscule</li>
                <li>• Au moins un chiffre</li>
                <li>• Au moins un caractère spécial</li>
              </ul>
            )}
          </div>

          <Button type="submit" className="w-full">
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </Button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col space-y-3">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.log('Login Failed');
                  setError('root', {
                    message: 'La connexion avec Google a échoué',
                  });
                }}
                useOneTap
                theme="outline"
                size="large"
                width="300"
                locale="fr"
              />
            </div>
            
            <button
              type="button"
              disabled
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Connexion avec Apple (bientôt disponible)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-500"
          >
            {isLogin
              ? "Pas encore de compte ? S'inscrire"
              : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {errors.root && (
          <p className="mt-4 text-sm text-red-600 text-center">
            {errors.root.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;