import { motion } from 'framer-motion';

export function AnimatedCheck({ size = 16 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      animate="visible"
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { 
            pathLength: 1, 
            opacity: 1,
            transition: { 
              pathLength: { type: "spring", duration: 1.5, bounce: 0 },
              opacity: { duration: 0.1 }
            } 
          }
        }}
      />
    </motion.svg>
  );
}

export function AnimatedError({ size = 16 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      animate="visible"
    >
      {/* Circle drawing */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { 
            pathLength: 1, 
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" } 
          }
        }}
      />
      {/* X lines popping in */}
      <motion.path
        d="M15 9l-6 6M9 9l6 6"
        variants={{
          hidden: { pathLength: 0, opacity: 0, scale: 0.5 },
          visible: { 
            pathLength: 1, 
            opacity: 1,
            scale: 1,
            transition: { delay: 0.3, duration: 0.4, type: "spring", bounce: 0.5 } 
          }
        }}
      />
    </motion.svg>
  );
}
