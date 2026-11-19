import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageHeroProps {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}

const PageHero = ({ image, imageAlt, eyebrow, title, subtitle, children }: PageHeroProps) => (
  <section className="relative text-white py-20 md:py-28 overflow-hidden">
    <div className="absolute inset-0">
      <img src={image} alt={imageAlt} className="w-full h-full object-cover" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary-dark/80 to-black/40" />
    </div>
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        {eyebrow && (
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-accent mb-4">{eyebrow}</p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">{title}</h1>
        <p className="text-lg text-white/85 max-w-2xl">{subtitle}</p>
        {children && <div className="mt-8">{children}</div>}
      </motion.div>
    </div>
  </section>
);

export default PageHero;
