import { useState, useEffect } from 'react';

const useMotionPreference = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleChange = () => {
      setReduceMotion(mediaQuery.matches);
      document.documentElement.classList.toggle('motion-reduce', mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduceMotion;
};

export default useMotionPreference;
