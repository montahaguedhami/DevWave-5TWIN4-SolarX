import { motion, useInView } from "framer-motion";
import { useRef } from "react";
const AnimatedItem = ({ children, index, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
    transition={{ duration: 0.4, delay: index * 0.1 + delay }}
  >
            {children}
        </motion.div>;
};
var stdin_default = AnimatedItem;
export {
  stdin_default as default
};
