// src/hooks/useTypingEffect.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for typing animation effect
 * Cycles through multiple keywords with typing/deleting animation
 */
export function useTypingEffect(keywords: string[], speed = 100, deleteSpeed = 50, pauseDuration = 2000) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentKeyword = keywords[currentIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentKeyword.length) {
          setCurrentText(currentKeyword.substring(0, currentText.length + 1));
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.substring(0, currentText.length - 1));
        } else {
          // Finished deleting, move to next keyword
          setIsDeleting(false);
          setCurrentIndex((currentIndex + 1) % keywords.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [currentText, currentIndex, isDeleting, keywords, speed, deleteSpeed, pauseDuration]);

  return currentText;
}
