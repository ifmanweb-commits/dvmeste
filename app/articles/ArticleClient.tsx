"use client";

import { useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function ArticleClient() {
  useEffect(() => {
    const progressBar = document.getElementById('progress-bar') as HTMLDivElement | null;
    const scrollButton = document.getElementById('scroll-to-top') as HTMLButtonElement | null;
    
    function updateProgress() {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      if (progressBar) {
        progressBar.style.width = progress + '%';
      }
      
      if (scrollButton) {
        if (scrollTop > 300) {
          scrollButton.classList.remove('opacity-0', 'invisible');
          scrollButton.classList.add('opacity-100', 'visible');
        } else {
          scrollButton.classList.remove('opacity-100', 'visible');
          scrollButton.classList.add('opacity-0', 'invisible');
        }
      }
    }
    
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();
    
    // Плавный скролл к заголовкам
    document.querySelectorAll('a[href^="#"]').forEach((anchor: Element) => {
      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href') || '';
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          const headerHeight = 100;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Прогресс-бар */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div id="progress-bar" className="h-full bg-[#5858E2] transition-all duration-150" style={{ width: '0%' }} />
      </div>

      {/* Кнопка "Наверх" */}
      <button
        id="scroll-to-top"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-12 h-12 bg-[#5858E2] text-white rounded-full shadow-lg flex items-center justify-center opacity-0 invisible transition-all duration-300 hover:bg-[#4b4bcf] z-50"
        aria-label="Наверх"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}