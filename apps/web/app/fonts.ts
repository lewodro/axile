import localFont from 'next/font/local';

export const editorialFont = localFont({
  src: [
    { path: '../public/fonts/instrument-serif-regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/instrument-serif-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-editorial',
  display: 'swap',
  preload: true,
});

export const readingFont = localFont({
  src: '../public/fonts/archivo-variable.woff2',
  weight: '100 900',
  variable: '--font-reading',
  display: 'swap',
  preload: true,
});

export const technicalFont = localFont({
  src: '../public/fonts/jetbrains-mono-variable.woff2',
  weight: '100 800',
  variable: '--font-technical',
  display: 'swap',
  preload: true,
});
