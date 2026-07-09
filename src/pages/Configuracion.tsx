import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Search, BarChart2, Wallet, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusquedaView } from './configuracion-views/BusquedaView';
import { IndicadoresView } from './configuracion-views/IndicadoresView';
import { TabuladorView } from './configuracion-views/TabuladorView';
import { DocumentosView } from './configuracion-views/DocumentosView';
import { ToulouseView } from './configuracion-views/ToulouseView';
import { RutasView } from './configuracion-views/RutasView';
import { ClipboardCheck, Bus } from 'lucide-react';
import './Configuracion.css';

export function Configuracion() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'busqueda' | 'indicadores' | 'tabulador' | 'documentos' | 'toulouse' | 'rutas'>('busqueda');

  if (loading) {
    return (
      <div className="config-layout">
         <main className="config-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="type-body-md text-muted">Cargando configuración...</span>
         </main>
      </div>
    );
  }

  // Protección exclusiva removida por petición del usuario

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
            <span>Búsqueda</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'documentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentos')}
            aria-current={activeTab === 'documentos' ? 'page' : undefined}
          >
            <FileText size={18} aria-hidden="true" />
            <span>Documentos</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'indicadores' ? 'active' : ''}`}
            onClick={() => setActiveTab('indicadores')}
            aria-current={activeTab === 'indicadores' ? 'page' : undefined}
          >
            <BarChart2 size={18} aria-hidden="true" />
            <span>Indicadores</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'rutas' ? 'active' : ''}`}
            onClick={() => setActiveTab('rutas')}
            aria-current={activeTab === 'rutas' ? 'page' : undefined}
          >
            <Bus size={18} aria-hidden="true" />
            <span>Rutas</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'tabulador' ? 'active' : ''}`}
            onClick={() => setActiveTab('tabulador')}
            aria-current={activeTab === 'tabulador' ? 'page' : undefined}
          >
            <Wallet size={18} aria-hidden="true" />
            <span>Tabulador</span>
          </button>
          <button
            className={`config-sidebar__link ${activeTab === 'toulouse' ? 'active' : ''}`}
            onClick={() => setActiveTab('toulouse')}
            aria-current={activeTab === 'toulouse' ? 'page' : undefined}
          >
            <ClipboardCheck size={18} aria-hidden="true" />
            <span>Toulouse</span>
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
            {activeTab === 'tabulador' && <TabuladorView />}
            {activeTab === 'documentos' && <DocumentosView />}
            {activeTab === 'toulouse' && <ToulouseView />}
            {activeTab === 'rutas' && <RutasView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
