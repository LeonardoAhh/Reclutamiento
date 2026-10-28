import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { motionTransition } from '@/lib/motionTokens';
import './TypewriterTitle.css';

type TypewriterSequence = {
  text: string;
  deleteAfter?: boolean;
  pauseAfter?: number;
};

type TypewriterTitleProps = {
  sequences?: TypewriterSequence[];
  typingSpeed?: number;
  startDelay?: number;
  autoLoop?: boolean;
  loopDelay?: number;
  deleteSpeed?: number;
  pauseBeforeDelete?: number;
  naturalVariance?: boolean;
  className?: string;
  reserveSpace?: boolean;
  showCursor?: boolean;
};

const DEFAULT_SEQUENCES: TypewriterSequence[] = [
  { text: 'Recruitment', deleteAfter: true },
];

export function TypewriterTitle({
  sequences = DEFAULT_SEQUENCES,
  typingSpeed = 50,
  startDelay = 200,
  autoLoop = true,
  loopDelay = 1000,
  deleteSpeed = 30,
  pauseBeforeDelete = 1000,
  naturalVariance = true,
  className = '',
  reserveSpace = false,
  showCursor = true,
}: TypewriterTitleProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [displayText, setDisplayText] = useState('');
  const sequenceIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sequencesRef = useRef(sequences);
  useEffect(() => {
    sequencesRef.current = sequences;
  }, [sequences]);

  useEffect(() => {
    if (reduceMotion) return;
    const getTypingDelay = () => {
      if (!naturalVariance) {
        return typingSpeed;
      }
      const random = Math.random();
      if (random < 0.1) return typingSpeed * 2;
      if (random > 0.9) return typingSpeed * 0.5;
      const variance = 0.4;
      const min = typingSpeed * (1 - variance);
      const max = typingSpeed * (1 + variance);
      return Math.random() * (max - min) + min;
    };

    const runTypewriter = () => {
      const currentSequence = sequencesRef.current[sequenceIndexRef.current];
      if (!currentSequence) return;

      if (isDeletingRef.current) {
        if (charIndexRef.current > 0) {
          charIndexRef.current -= 1;
          setDisplayText(currentSequence.text.slice(0, charIndexRef.current));
          timeoutRef.current = setTimeout(runTypewriter, deleteSpeed);
        } else {
          isDeletingRef.current = false;
          const isLastSequence =
            sequenceIndexRef.current === sequencesRef.current.length - 1;

          if (isLastSequence && autoLoop) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current = 0;
              runTypewriter();
            }, loopDelay);
          } else if (!isLastSequence) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current += 1;
              runTypewriter();
            }, 100);
          }
        }
      } else if (charIndexRef.current < currentSequence.text.length) {
        charIndexRef.current += 1;
        setDisplayText(currentSequence.text.slice(0, charIndexRef.current));
        timeoutRef.current = setTimeout(runTypewriter, getTypingDelay());
      } else {
        const pauseDuration = currentSequence.pauseAfter ?? pauseBeforeDelete;

        if (currentSequence.deleteAfter) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = true;
            runTypewriter();
          }, pauseDuration);
        } else {
          const isLastSequence =
            sequenceIndexRef.current === sequencesRef.current.length - 1;

          if (isLastSequence && autoLoop) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current = 0;
              charIndexRef.current = 0;
              setDisplayText('');
              runTypewriter();
            }, loopDelay);
          } else if (!isLastSequence) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current += 1;
              charIndexRef.current = 0;
              setDisplayText('');
              runTypewriter();
            }, pauseDuration);
          }
        }
      }
    };

    timeoutRef.current = setTimeout(runTypewriter, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    typingSpeed,
    deleteSpeed,
    pauseBeforeDelete,
    autoLoop,
    loopDelay,
    startDelay,
    naturalVariance,
    reduceMotion,
  ]);

  const fullText = sequences[0]?.text ?? '';
  const visibleText = reduceMotion ? fullText : displayText;

  return (
    <motion.span
      className={`typewriter-title ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={motionTransition('--transition-base')}
    >
      <span className="sr-only">{fullText}</span>
      {reserveSpace && <span className="typewriter-title__reserve" aria-hidden="true">{fullText}</span>}
      <span className="typewriter-title__written" aria-hidden="true">
        <span>{visibleText}</span>
        {showCursor && !reduceMotion && <span className="typewriter-title__cursor" />}
      </span>
    </motion.span>
  );
}
