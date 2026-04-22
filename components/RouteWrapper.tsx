import React from 'react';
import { motion } from 'motion/react';

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.2 }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

export default RouteWrapper;
