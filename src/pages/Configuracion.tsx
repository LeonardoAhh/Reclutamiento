import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Sparkles, Search, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusquedaView } from './configuracion-views/BusquedaView';
import { IndicadoresView } from './configuracion-views/IndicadoresView';
import './Configuracion.css';

export function Configuracion() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'busqueda' | 'indicadores'>('busqueda');

  if (loading) {
    return (
      <div className="config-layout">
         <main className="config-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="type-body-md text-muted">Cargando configuración...</span>
         </main>
      </div>
    );
  }

  // Protección exclusiva para el usuario específico
  if (user?.email !== 'leonardo@reclutamiento.local') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="config-layout">
      <aside className="config-sidebar" aria-label="Menú de Features">
        <header className="config-sidebar__header">
          <Sparkles size={24} aria-hidden="true" className="text-primary" />
          <h1 className="type-heading-sm m-0">Features</h1>
        </header>
        <nav className="config-sidebar__nav">
          <button
            className={`config-sidebar__link ${activeTab === 'busqueda' ? 'active' : ''}`}
            onClick={() => setActiveTab('busqueda')}
            aria-current={activeTab === 'busqueda' ? 'page' : undefined}
          >
            <Search size={18} aria-hidden="true" />
            <span>Búsqueda Global</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'indicadores' ? 'active' : ''}`}
            onClick={() => setActiveTab('indicadores')}
            aria-current={activeTab === 'indicadores' ? 'page' : undefined}
          >
            <BarChart2 size={18} aria-hidden="true" />
            <span>Indicadores</span>
          </button>
        </nav>
      </aside>

      <main className="config-main" aria-label="Contenido principal">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}
          >
            {activeTab === 'busqueda' && <BusquedaView />}
            {activeTab === 'indicadores' && <IndicadoresView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
