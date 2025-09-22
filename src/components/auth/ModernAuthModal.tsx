'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, Github, Mail, Lock, User } from 'lucide-react';
import ModernLoginForm from './ModernLoginForm';
import { ModernRegisterForm } from './ModernRegisterForm';

interface ModernAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModernAuthModal({ isOpen, onClose, onSuccess }: ModernAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        {/* Modal Container */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-blue-100 mt-2">
                {isLogin 
                  ? 'Sign in to continue your conversation' 
                  : 'Join us to start chatting with AI'
                }
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-6">
            {isLogin ? (
              <ModernLoginForm
                onSwitchToRegister={() => setIsLogin(false)}
                onSuccess={() => {
                  onSuccess?.();
                  onClose();
                }}
              />
            ) : (
              <ModernRegisterForm
                onSwitchToLogin={() => setIsLogin(true)}
                onSuccess={() => {
                  onSuccess?.();
                  onClose();
                }}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
