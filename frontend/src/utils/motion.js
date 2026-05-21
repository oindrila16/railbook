/**
 * Shared Framer Motion easing and variants — smooth, modern, consistent.
 */

export const ease = {
  smooth: [0.22, 1, 0.36, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  gentle: [0.25, 0.46, 0.45, 0.94],
};

export const spring = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 0.85,
};

export const springSnappy = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

export const springSoft = {
  type: 'spring',
  stiffness: 260,
  damping: 26,
  mass: 1,
};

export const duration = {
  fast: 0.22,
  normal: 0.38,
  slow: 0.55,
};

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: duration.fast, ease: ease.smooth },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
};

export const fadeUpTight = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal, ease: ease.smooth },
  },
};

export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerFast = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

export const listItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

export const cardHover = {
  rest: { y: 0 },
  hover: {
    y: -6,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: springSnappy,
};

export const hoverLift = {
  whileHover: { y: -4 },
  transition: { duration: duration.fast, ease: ease.out },
};
