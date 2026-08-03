// Live Radio & Schedule Page Interactivity

document.addEventListener('DOMContentLoaded', () => {
    // Micro-interactions for equalizer bars
    document.querySelectorAll('.equalizer-bar').forEach(bar => {
        const randomDuration = 0.4 + Math.random() * 0.4;
        bar.style.animationDuration = `${randomDuration}s`;
    });

    // Sticky Header behavior
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;

            if (scrollTop > 50) {
                header.classList.add('shadow-lg');
                header.classList.replace('bg-surface/70', 'bg-surface/95');
            } else {
                header.classList.remove('shadow-lg');
                header.classList.replace('bg-surface/95', 'bg-surface/70');
            }
        });
    }
});
