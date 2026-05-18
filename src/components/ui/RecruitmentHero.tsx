import { motion } from 'framer-motion';
import {
  Briefcase,
  ClipboardCheck,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import './RecruitmentHero.css';

const STAGES = [
  { icon: Search, label: 'Búsqueda' },
  { icon: ClipboardCheck, label: 'Evaluación' },
  { icon: Users, label: 'Entrevistas' },
  { icon: UserCheck, label: 'Selección' },
  { icon: Briefcase, label: 'Contratación' },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.4 },
  },
};

const stageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
};

const connectorVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

interface RecruitmentHeroProps {
  displayName: string;
}

export function RecruitmentHero({ displayName }: RecruitmentHeroProps) {
  return (
    <section className="rh" aria-label="Bienvenida">

      {/* Background grid */}
      <div className="rh__grid" aria-hidden="true" />

      {/* Greeting */}
      <motion.div
        className="rh__greeting"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <p className="rh__label">Reclutamiento y selección de personal</p>
        <h2 className="rh__welcome">
          Bienvenido,{' '}
          <span className="rh__name">{displayName}</span>
        </h2>
      </motion.div>

      <div className="rh__divider" />

      {/* Animated pipeline stages */}
      <motion.div
        className="rh__pipeline"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div className="rh__stage-group" key={stage.label}>
              {i > 0 && (
                <motion.div
                  className="rh__connector"
                  variants={connectorVariants}
                  style={{ originX: 0 }}
                />
              )}
              <motion.div
                className="rh__stage"
                variants={stageVariants}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                <div className="rh__num">0{i + 1}</div>
                <div className="rh__icon-ring">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <span className="rh__stage-label">{stage.label}</span>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="rh__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <div className="rh__progress">
          <div className="rh__progress-fill" />
        </div>
        <span className="rh__progress-label">5 etapas</span>
      </motion.div>

    </section>
  );
}
