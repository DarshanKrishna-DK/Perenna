'use client';
export function AgentSprite({kind=0,active=false,size=120}:{kind?:number;active?:boolean;size?:number}) {
 const colors=['#c2cf9c','#94aea1','#b6bdad'];
 return <svg className={`agent-sprite ${active?'working':''}`} width={size} height={size} viewBox="0 0 160 180" role="img" aria-label={kind===0?'Perenna buyer agent':`Supplier agent ${kind}`}>
 <ellipse className="sprite-shadow" cx="80" cy="159" rx="33" ry="8" fill="#080b0a" opacity=".55"/>
 <g className="sprite-body"><path d={kind===1?'M34 82 Q22 22 80 26 Q138 22 126 82 L118 129 Q80 160 42 129Z':kind===2?'M35 80 Q30 30 80 21 Q130 30 125 80 L132 116 Q80 162 28 116Z':'M35 80 Q22 32 80 27 Q138 32 125 80 L122 124 Q80 158 38 124Z'} fill={colors[kind%3]}/>
 <path d="M48 41 Q71 23 105 42" fill="none" stroke="white" strokeWidth="4" opacity=".27" strokeLinecap="round"/>
 <path d="M80 29 Q65 1 46 10 Q42 30 80 29" fill="#7e9670"/><path d="M80 29 Q85 2 108 9 Q117 30 80 29" fill="#c4d89a"/>
 <rect x="43" y="65" width="74" height="45" rx="22" fill="#25352d"/><ellipse className="sprite-eye" cx="64" cy="85" rx="4" ry="6" fill="#e1ecc7"/><ellipse className="sprite-eye" cx="96" cy="85" rx="4" ry="6" fill="#e1ecc7"/><path d="M72 96 Q80 102 88 96" fill="none" stroke="#b6cc9c" strokeWidth="2.5" strokeLinecap="round"/>
 <path className="sprite-arm" d="M36 92 Q13 96 22 113" fill="none" stroke={colors[kind%3]} strokeWidth="12" strokeLinecap="round"/><path d="M124 92 Q146 96 137 113" fill="none" stroke={colors[kind%3]} strokeWidth="12" strokeLinecap="round"/><path d="M58 139 L54 151 M101 139 L106 151" stroke={colors[kind%3]} strokeWidth="11" strokeLinecap="round"/>
 <circle cx="80" cy="122" r="5" fill="#edf2d2" opacity=".75"/></g></svg>;
}
