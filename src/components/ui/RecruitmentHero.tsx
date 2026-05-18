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
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const stageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

const connectorVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

interface RecruitmentHeroProps {
  displayName: string;
}

export function RecruitmentHero({ displayName }: RecruitmentHeroProps) {
  return (
    <section className="recruitment-hero" aria-label="Bienvenida">
      {/* Greeting */}
      <motion.div
        className="recruitment-hero__greeting"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h2 className="recruitment-hero__welcome">
          Bienvenido, <span className="recruitment-hero__name">{displayName}</span>
        </h2>
        <p className="recruitment-hero__tagline">
          Reclutamiento y Selección de Personal
        </p>
      </motion.div>

      {/* Animated pipeline stages */}
      <motion.div
        className="recruitment-hero__pipeline"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <div className="recruitment-hero__stage-group" key={stage.label}>
              {i > 0 && (
                <motion.div
                  className="recruitment-hero__connector"
                  variants={connectorVariants}
                  style={{ originX: 0 }}
                />
              )}
              <motion.div
                className="recruitment-hero__stage"
                variants={stageVariants}
                whileHover={{ scale: 1.08, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                <div className="recruitment-hero__icon-ring">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <span className="recruitment-hero__stage-label">{stage.label}</span>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
