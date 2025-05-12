import React, { useState, useEffect } from 'react';
import Typewriter from './Typewriter';

interface RotatingTypewriterProps {
  text: string[];
  delay?: number;
  phraseDelay?: number;
}

const RotatingTypewriter: React.FC<RotatingTypewriterProps> = ({ 
  text = [], 
  delay = 100,
  phraseDelay = 2000 
}) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex(prev => (prev + 1) % text.length);
    }, phraseDelay);

    return () => clearInterval(interval);
  }, [text.length, phraseDelay]);

  return <Typewriter text={text[currentPhraseIndex]} delay={delay} />;
};

export default RotatingTypewriter;
