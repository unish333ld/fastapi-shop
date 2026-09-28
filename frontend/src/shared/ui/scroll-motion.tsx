import { motion, useAnimationControls, useInView, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  return <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-foreground" style={{ scaleX }} />
}

export function ScrollReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const isInView = useInView(ref, { once: false, margin: '-40px 0px -40px 0px', amount: 0.1 })
  const entered = useRef(false)

  useEffect(() => {
    if (reduceMotion) return
    if (isInView) {
      entered.current = true
      void controls.start({ opacity: 1, y: 0, scale: 1 })
    } else if (entered.current) {
      // Keep the card visible outside the viewport; only prepare its next entrance.
      controls.set({ opacity: 1, y: 44, scale: 0.985 })
    } else {
      controls.set({ opacity: 0, y: 70, scale: 0.96 })
    }
  }, [controls, isInView, reduceMotion])

  return <motion.div ref={ref} initial={reduceMotion ? false : { opacity: 0, y: 70, scale: 0.96 }} animate={reduceMotion ? undefined : controls} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>{children}</motion.div>
}
