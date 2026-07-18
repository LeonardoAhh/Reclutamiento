import { motion } from 'framer-motion';
import './Typewriter.css';

interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}

export function Typewriter({ 
  text, 
  delay = 0, 
  speed = 0.05, 
  className = '',
  showCursor = true,
  onComplete 
}: TypewriterProps) {
  const characters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: speed,
        delayChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.1 }
    },
  };

  return (
    <motion.h1
      className={`typewriter ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label={text}
      onAnimationComplete={onComplete}
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="typewriter-cursor"
          aria-hidden="true"
        >
          |
        </motion.span>
      )}
    </motion.h1>
  );
}
