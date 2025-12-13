import React from 'react';
export default function Footer() {
    return (
        <div className="fixed bottom-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full text-center px-12 sm:px-0">
            <a
                href="https://github.com/JACKURUVI99"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col sm:flex-row items-center justify-center font-bold text-black bg-white/90 backdrop-blur px-2 py-0.5 sm:px-4 sm:py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] transition-all cursor-pointer pointer-events-auto whitespace-nowrap text-[8px] sm:text-sm md:text-base rotate-0 hover:rotate-0 no-underline gap-0 sm:gap-1"
            >
                <span>Made with ❤️</span>
                <span>by HarishAnnavisamy</span>
            </a>
        </div>
    );
}
