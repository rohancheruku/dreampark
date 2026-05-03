import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FerrisWheelBg } from "../components/FerrisWheelBg";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Home() {
  return (
    <div className="home">
      <FerrisWheelBg />
      <section className="home-hero">
        <motion.h1 className="home-title display" custom={0} variants={fadeUp} initial="hidden" animate="show">
          Where gravity
          <span className="home-title__accent"> takes a holiday</span>
        </motion.h1>
        <motion.p className="home-lead" custom={1} variants={fadeUp} initial="hidden" animate="show">
          Pick your park, lock in day passes or VIP, and spend the day on coasters, water rides, and skyline wheels.
          Check current wait times anytime so you line up smarter, not longer.
        </motion.p>
        <motion.div className="home-cta" custom={2} variants={fadeUp} initial="hidden" animate="show">
          <Link to="/tickets" className="btn-primary">
            Get tickets
          </Link>
          <Link to="/operations" className="btn-ghost">
            Wait times
          </Link>
        </motion.div>
        <motion.div
          className="home-stats glass-subtle"
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div>
            <span className="home-stats__num">30</span>
            <span className="home-stats__lbl">rides &amp; attractions</span>
          </div>
          <div className="home-stats__divider" />
          <div>
            <span className="home-stats__num">3</span>
            <span className="home-stats__lbl">theme parks</span>
          </div>
          <div className="home-stats__divider" />
          <div>
            <span className="home-stats__num">3</span>
            <span className="home-stats__lbl">ticket types</span>
          </div>
          <div className="home-stats__divider" />
          <div>
            <span className="home-stats__num">∞</span>
            <span className="home-stats__lbl">satisfied dreamers</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
