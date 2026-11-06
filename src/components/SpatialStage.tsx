'use client';

import dynamic from 'next/dynamic';
import {Component, useEffect, useRef, useState, type ReactNode} from 'react';

export type SpatialMode='landing'|'onboarding'|'workspace'|'negotiations'|'suppliers'|'orders'|'agreements'|'settings';
export type SceneMotion={x:number;y:number;scroll:number;anchorX:number;anchorY:number};
export type SpatialStageProps={mode:SpatialMode;status?:string;className?:string;variant?:'immersive'|'hero';onReady?:(available:boolean)=>void};
const Scene=dynamic(()=>import('./SpatialScene'),{ssr:false});
class SceneBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onFailure();}
 render(){return this.state.failed?null:this.props.children;}
}

export function SpatialStage({mode,status,className='',variant='immersive',onReady}:SpatialStageProps){
 const root=useRef<HTMLDivElement>(null),motion=useRef<SceneMotion>({x:0,y:0,scroll:0,anchorX:.5,anchorY:2}),ready=useRef(onReady);
 const [supported,setSupported]=useState(false),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false),[visible,setVisible]=useState(true),[reduced,setReduced]=useState(true),[mobile,setMobile]=useState(false);
 ready.current=onReady;
 useEffect(()=>{
  const canvas=document.createElement('canvas');let gl:WebGL2RenderingContext|null=null;
  try{gl=canvas.getContext('webgl2',{failIfMajorPerformanceCaveat:false});}catch{/* The static brand scene remains available. */}
  if(!gl){setFailed(true);ready.current?.(false);return;}
  gl.getExtension('WEBGL_lose_context')?.loseContext();setSupported(true);
  const media=window.matchMedia('(prefers-reduced-motion: reduce)'),small=window.matchMedia('(max-width: 760px)');
  const preferences=()=>{setReduced(media.matches);setMobile(small.matches);};preferences();media.addEventListener('change',preferences);small.addEventListener('change',preferences);
  let intersecting=true;const visibility=()=>setVisible(!document.hidden&&intersecting);document.addEventListener('visibilitychange',visibility);
  const observer=new IntersectionObserver(entries=>{intersecting=entries[0]?.isIntersecting??true;visibility();});if(root.current)observer.observe(root.current);
  const pointer=(event:PointerEvent)=>{motion.current.x=event.clientX/window.innerWidth*2-1;motion.current.y=event.clientY/window.innerHeight*2-1;};
  const scroll=()=>{motion.current.scroll=window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight);};scroll();
  window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('scroll',scroll,{passive:true});
  return()=>{media.removeEventListener('change',preferences);small.removeEventListener('change',preferences);document.removeEventListener('visibilitychange',visibility);observer.disconnect();window.removeEventListener('pointermove',pointer);window.removeEventListener('scroll',scroll);};
 },[]);
 useEffect(()=>{
  let frame=0;const measure=()=>{frame=0;const anchor=document.querySelector<HTMLElement>('.hero-stage');if(!anchor){motion.current.anchorY=2;return;}const rect=anchor.getBoundingClientRect();motion.current.anchorX=(rect.left+rect.width/2)/window.innerWidth;motion.current.anchorY=Math.max(.43,(rect.top+rect.height/2)/window.innerHeight);};
  const update=()=>{if(!frame)frame=requestAnimationFrame(measure);};measure();
  const observer=new ResizeObserver(update);observer.observe(document.documentElement);const anchor=document.querySelector('.hero-stage');if(anchor)observer.observe(anchor);
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});document.fonts.ready.then(update);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[mode]);
 const failure=()=>{setFailed(true);setLoaded(false);ready.current?.(false);};
 return <div ref={root} className={`spatial-stage spatial-stage--${variant} ${className}`} data-scene-mode={mode} data-scene-state={failed?'fallback':loaded?'ready':'loading'} aria-hidden="true">
  {(failed||(!loaded&&!mobile))&&<div className="spatial-fallback"><img src="/brand/perenna-logo.png" alt=""/><span className="spatial-label">PERENNA / {mode.toUpperCase()}</span></div>}
  {supported&&!failed&&<SceneBoundary onFailure={failure}><Scene mode={mode} motion={motion} mobile={mobile} reduced={reduced} visible={visible} onFailure={failure} onReady={()=>{setLoaded(true);ready.current?.(true);}}/></SceneBoundary>}
  {status&&<span className="spatial-caption">{status}</span>}
 </div>;
}
