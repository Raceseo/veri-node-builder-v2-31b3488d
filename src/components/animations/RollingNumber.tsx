import { useState, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface RollingNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const RollingNumber = ({ 
  value, 
  duration = 1.5, 
  className = "",
  prefix = "",
  suffix = "",
  decimals = 0
}: RollingNumberProps) => {
  const spring = useSpring(0, { 
    stiffness: 100, 
    damping: 30,
    duration: duration * 1000
  });
  
  const display = useTransform(spring, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.floor(latest).toLocaleString();
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};

export default RollingNumber;
