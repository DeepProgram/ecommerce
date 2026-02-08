'use client';

import { useEffect } from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function ErrorModal({ isOpen, onClose, title = 'Error', message }: ErrorModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-[440px] w-full mx-16 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-20 pb-16 border-b border-gray-200">
          <div className="flex items-center gap-12">
            <div className="w-40 h-40 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 6V10M10 14H10.01M9 2L2.5 16C2.22429 16.5 2.5 17 3 17H17C17.5 17 17.7757 16.5 17.5 16L11 2C10.7243 1.5 10.2757 1.5 9 2Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-32 h-32 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-20">
          <p className="text-[14px] text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-12 p-20 pt-16 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-24 h-40 bg-brand-600 text-white rounded-lg font-semibold text-[14px] hover:bg-brand-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
