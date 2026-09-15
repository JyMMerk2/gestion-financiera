import React from 'react';

interface ModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  children: React.ReactNode;
}

export const ModalGlobal: React.FC<ModalGlobalProps> = ({
  isOpen,
  onClose,
  titulo,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {titulo}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
};
