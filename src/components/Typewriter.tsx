import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  texts: string[];
  delay?: number;
  loop?: boolean;
}

const Typewriter: React.FC<TypewriterProps> = ({ texts, delay = 100, loop = true }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [typingDelay, setTypingDelay] = useState(delay);

  useEffect(() => {
    const currentText = texts[textIndex];
    
    const handleTyping = () => {
      if (isDeleting) {
        // Backspace effect
        setDisplayText(currentText.substring(0, displayText.length - 1));
        setTypingDelay(delay / 2);
      } else {
        // Typing effect
        setDisplayText(currentText.substring(0, displayText.length + 1));
        setTypingDelay(delay);
      }

      if (!isDeleting && displayText === currentText) {
        // Pause at end of text
        setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && displayText === '') {
        // Move to next text or loop
        setIsDeleting(false);
        setTextIndex((textIndex + 1) % texts.length);
        setTypingDelay(500); // Pause before starting next text
      }
    };

    const timer = setTimeout(handleTyping, typingDelay);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, textIndex, texts, delay, typingDelay]);

  return (
    <span className="text-green-600 inline-block min-w-[120px]">
      {displayText}
      <span className="animate-blink">|</span>
    </span>
  );
};

export default Typewriter;
