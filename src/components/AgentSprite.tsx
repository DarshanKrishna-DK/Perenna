'use client';
import {useId} from 'react';
export function AgentSprite({kind=0,active=false,size=120}:{kind?:number;active?:boolean;size?:number}){
 const id=useId().replaceAll(':','');const hue=kind%3===1?'#b5ff46':kind%3===2?'#80e917':'#9dff00';
 return <svg className={`agent-sprite robot-thumb ${active?'working':''}`} width={size} height={size} viewBox="0 0 160 180" role="img" aria-label={kind===0?'Perenna buyer robot':`Perenna supplier robot ${kind}`}>
  <defs><linearGradient id={id+'-chrome'} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f0fff1"/><stop offset=".2" stopColor="#809185"/><stop offset=".45" stopColor="#202a24"/><stop offset=".62" stopColor="#a0b3a6"/><stop offset="1" stopColor="#313e35"/></linearGradient><linearGradient id={id+'-lime'} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e5ffb4"/><stop offset=".4" stopColor={hue}/><stop offset="1" stopColor="#286b00"/></linearGradient><radialGradient id={id+'-halo'}><stop stopColor={hue} stopOpacity=".22"/><stop offset="1" stopColor={hue} stopOpacity="0"/></radialGradient></defs>
  <ellipse cx="80" cy="94" rx="76" ry="80" fill={`url(#${id}-halo)`}/><ellipse className="sprite-shadow" cx="80" cy="163" rx="39" ry="7" fill="#080f06" opacity=".8"/><ellipse cx="80" cy="162" rx="48" ry="11" fill="none" stroke={hue} strokeOpacity=".25"/>
  <g className="sprite-body"><path d="M44 79 34 64 40 29 80 14 120 29 126 64 116 79" fill="none" stroke={`url(#${id}-lime)`} strokeWidth="5" strokeLinejoin="round" opacity=".45"/>
  <path d="M53 113 47 145 59 151 69 143 72 118 M88 118 91 143 101 151 113 145 107 113" fill={`url(#${id}-chrome)`} stroke="#93b29b" strokeWidth="1.3"/><path d="M43 146 63 146 67 157 40 157Z M97 146 116 146 120 157 93 157Z" fill="#111c13" stroke={hue} strokeWidth="1.4"/>
  <path d="M49 84 111 84 121 111 106 134 54 134 39 111Z" fill={`url(#${id}-chrome)`} stroke="#789781" strokeWidth="1.5"/><path d="M55 91 105 91 110 116 99 127 61 127 50 116Z" fill="#101b12"/>
  <path className="sprite-arm" d="M44 94 29 106 36 127 49 122 M116 94 131 106 124 127 111 122" fill="none" stroke={`url(#${id}-chrome)`} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/><circle cx="34" cy="124" r="8" fill={`url(#${id}-lime)`}/><circle cx="126" cy="124" r="8" fill={`url(#${id}-lime)`}/>
  <path d="M44 110 78 99 115 111 111 142 79 156 46 142Z" fill="#173209" stroke={hue} strokeWidth="1.5"/><path d="M44 110 79 122 115 111 M79 122 79 156 M62 104 98 117 98 127 91 124 91 115" fill="none" stroke={`url(#${id}-lime)`} strokeWidth="4" strokeLinejoin="round"/>
  <path d="M58 50 Q58 29 80 29 Q102 29 102 50" fill="none" stroke={hue} strokeWidth="2"/><path d="M40 49 Q42 33 59 33 L101 33 Q118 33 120 49 L120 74 Q118 89 102 91 L58 91 Q42 89 40 74Z" fill={`url(#${id}-chrome)`} stroke="#a5cbb0" strokeWidth="1.6"/>
  <circle cx="38" cy="62" r="12" fill="#132415" stroke={`url(#${id}-lime)`} strokeWidth="5"/><circle cx="122" cy="62" r="12" fill="#132415" stroke={`url(#${id}-lime)`} strokeWidth="5"/>
  <path d="M51 52 Q52 44 62 44 L98 44 Q109 44 110 53 L110 72 Q108 82 98 82 L62 82 Q52 82 51 72Z" fill="#030903" stroke="#38562e" strokeWidth="1.2"/>
  <path className="sprite-eye" d="M60 64 Q67 49 75 64 M86 64 Q94 49 101 64" fill="none" stroke={hue} strokeWidth="5" strokeLinecap="round"/><path d="M73 74 Q81 79 89 74" fill="none" stroke="#baff6a" strokeWidth="2" strokeLinecap="round"/><path d="M52 39 68 35 M113 48 115 59" stroke="#e3ffe9" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
  <circle cx="79" cy="139" r="3" fill={hue}/><path d="M65 133 68 140 91 140 96 130 71 130" fill="none" stroke={hue} strokeWidth="2" strokeLinejoin="round"/></g>
 </svg>;
}
