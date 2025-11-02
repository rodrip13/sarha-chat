import React, { useEffect, useRef } from 'react';
import { X, LogOut, Settings, History, Phone } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    onSignOut: () => Promise<void>;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    userEmail,
    onSignOut,
}) => {
    const firstButtonRef = useRef<HTMLButtonElement>(null);

    // Focus trap: enfocar el primer elemento cuando se abre
    useEffect(() => {
        if (isOpen && firstButtonRef.current) {
            firstButtonRef.current.focus();
            // Prevenir scroll del body cuando drawer está abierto
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Cerrar con tecla Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleSignOut = async () => {
        await onSignOut();
        onClose();
    };

    return (
        <>
            {/* Overlay semi-transparente */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Panel Drawer */}
            <div
                className={`fixed left-0 top-0 h-screen w-[80vw] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                role="navigation"
                aria-label="Menú de navegación"
            >
                {/* Header del Drawer */}
                <div className="bg-gradient-to-r from-pink-400 to-contessa-500 px-4 py-6 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Bienvenida</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Avatar y Email */}
                    <div className="bg-white/20 rounded-lg p-3">
                        <p className="text-sm font-semibold text-white truncate">
                            {userEmail || 'Usuario'}
                        </p>
                    </div>
                </div>

                {/* Opciones del Menú */}
                <div className="px-4 py-6 space-y-3 flex-1">
                    {/* Historial */}
                    <button
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                        aria-label="Ver historial de conversaciones"
                    >
                        <History className="w-5 h-5 text-purple-400" />
                        <span>Historial</span>
                    </button>

                    {/* Contacto */}
                    <button
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                        aria-label="Contactar soporte"
                    >
                        <Phone className="w-5 h-5 text-contessa-400" />
                        <span>Contacto</span>
                    </button>
                </div>

                {/* Cerrar Sesión (Abajo del todo) */}
                <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0 space-y-3">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 font-medium"
                        aria-label="Cerrar sesión"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
};
