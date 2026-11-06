import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const orbitron=localFont({src:'../../public/fonts/orbitron-latin-600-normal.woff2',variable:'--font-orbitron',weight:'600',display:'swap'});
const rajdhani=localFont({src:[{path:'../../public/fonts/rajdhani-latin-400-normal.woff2',weight:'400'},{path:'../../public/fonts/rajdhani-latin-500-normal.woff2',weight:'500'},{path:'../../public/fonts/rajdhani-latin-600-normal.woff2',weight:'600'},{path:'../../public/fonts/rajdhani-latin-700-normal.woff2',weight:'700'}],variable:'--font-rajdhani',display:'swap'});
const devanagari=localFont({src:[{path:'../../public/fonts/noto-sans-devanagari-400-normal.woff2',weight:'400'},{path:'../../public/fonts/noto-sans-devanagari-600-normal.woff2',weight:'600'}],variable:'--font-devanagari',display:'swap'});
export const metadata:Metadata={title:'Perenna | Business moves smarter.',description:'Your business, in motion. Bilingual procurement with agent negotiation and human control.',icons:{icon:'/brand/perenna-logo.png',apple:'/brand/perenna-logo.png'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" className={`${orbitron.variable} ${rajdhani.variable} ${devanagari.variable}`}><body>{children}</body></html>;}
