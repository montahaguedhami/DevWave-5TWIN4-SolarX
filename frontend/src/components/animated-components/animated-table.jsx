import { motion, useInView } from "framer-motion";
import { useRef } from "react";
const wrapperVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1 }
};
const tableBodyVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.25
    }
  }
};
const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
const AnimatedTableWrapper = ({ children, className }) => {
  return <motion.div
    variants={wrapperVariants}
    initial="hidden"
    animate="show"
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={className}
  >
      {children}
    </motion.div>;
};
const AnimatedTableBody = ({ children, className }) => {
  return <motion.tbody
    variants={tableBodyVariants}
    initial="hidden"
    animate="show"
    className={className}
  >
      {children}
    </motion.tbody>;
};
const AnimatedTableRow = ({ children, className, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "0px 0px -10% 0px"
    // Trigger slightly before fully in view
  });
  return <motion.tr
    ref={ref}
    variants={tableRowVariants}
    initial="hidden"
    animate={isInView ? "visible" : "hidden"}
    transition={{
      duration: 0.5,
      ease: "easeOut",
      delay: index * 0.25
    }}
    className={className}
  >
      {children}
    </motion.tr>;
};
export {
  AnimatedTableBody,
  AnimatedTableRow,
  AnimatedTableWrapper
};
