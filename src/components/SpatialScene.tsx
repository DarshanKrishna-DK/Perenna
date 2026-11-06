'use client';

import {Suspense, useEffect, useMemo, useRef, useState, type RefObject} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Center, Environment, Lightformer, RoundedBox, Text3D, PerformanceMonitor} from '@react-three/drei';
import {CatmullRomCurve3, Group, Shape, Path, Vector3, MathUtils, Color} from 'three';
import type {SpatialMode, SceneMotion} from './SpatialStage';

const lime='#a4ff00',font='/fonts/orbitron-600.typeface.json';
const labels:Record<SpatialMode,string>={landing:'BUSINESS IN MOTION',onboarding:'ESTABLISH CONNECTION',workspace:'COMMAND CENTRE',negotiations:'NEGOTIATION NETWORK',suppliers:'SUPPLIER CONSTELLATION',orders:'DELIVERY CIRCUIT',agreements:'BILATERAL PROTOCOL',settings:'CONTROL SYSTEMS'};
type Props={mode:SpatialMode;motion:RefObject<SceneMotion>;mobile:boolean;reduced:boolean;visible:boolean;onReady:()=>void;onFailure:()=>void};
function Tube({points,color=lime,radius=.018,opacity=1}:{points:number[][];color?:string;radius?:number;opacity?:number}){
 const curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p as [number,number,number]))),[points]);
 return <mesh><tubeGeometry args={[curve,40,radius,6,false]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.3} transparent={opacity<1} opacity={opacity}/></mesh>;
}
function Box({position=[0,0,0],scale=[1,1,1],color='#778c7c',metalness=.94,emissive=false}:{position?:[number,number,number];scale?:[number,number,number];color?:string;metalness?:number;emissive?:boolean}){
 return <RoundedBox args={scale} radius={Math.min(...scale)*.19} smoothness={3} position={position}><meshStandardMaterial color={color} roughness={.24} metalness={metalness} emissive={emissive?color:'#000000'} emissiveIntensity={emissive?.38:0}/></RoundedBox>;
}
function Parcel({scale=1}:{scale?:number}){return <group scale={scale}>
 <Box scale={[.87,.66,.65]} color="#4a9506" metalness={.65}/><Box position={[0,0,.334]} scale={[.13,.67,.015]} color={lime} emissive/><Box position={[0,.336,0]} scale={[.13,.015,.66]} color={lime} emissive/>
 <Tube points={[[.15,.12,.35],[.2,-.11,.35],[.39,-.11,.35],[.43,.04,.35],[.2,.04,.35]]} radius={.012}/>{[.23,.37].map(x=><mesh key={x} position={[x,-.19,.35]}><sphereGeometry args={[.025,10,8]}/><meshBasicMaterial color={lime}/></mesh>)}
 </group>;}
function Courier(){return <group>
 <Box position={[0,.4,0]} scale={[1.28,.86,.76]} color="#b4c6b7"/>
 <Box position={[0,.41,.401]} scale={[1.08,.53,.06]} color="#020603" metalness={.45}/>
 {[-1,1].map(side=><group key={side}>
  <mesh position={[side*.7,.44,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.23,.23,.14,24]}/><meshStandardMaterial color="#152a14" metalness={.9} roughness={.22}/></mesh>
  <mesh position={[side*.79,.44,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.17,.045,8,28]}/><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={.8} metalness={.7} roughness={.2}/></mesh>
  <Tube points={[[side*.35,.41,.442],[side*.28,.47,.447],[side*.2,.48,.449],[side*.13,.42,.442]]} radius={.023}/>
  <Box position={[side*.31,-1.02,.02]} scale={[.25,.49,.3]}/><Box position={[side*.32,-1.28,.13]} scale={[.41,.18,.55]} color="#111d14"/>
  <mesh position={[side*.58,-.45,.08]} rotation={[0,0,side*.43]}><capsuleGeometry args={[.13,.35,5,12]}/><meshStandardMaterial color="#95ab9b" metalness={.98} roughness={.19}/></mesh>
  <mesh position={[side*.48,-.69,.37]}><sphereGeometry args={[.15,16,12]}/><meshStandardMaterial color={lime} metalness={.75} roughness={.25}/></mesh>
 </group>)}
 <Tube points={[[-.19,.27,.445],[0,.22,.46],[.19,.27,.445]]} radius={.014}/>
 <Tube points={[[-.68,.47,-.04],[-.55,1,-.04],[0,1.1,-.04],[.55,1,-.04],[.68,.47,-.04]]} radius={.045} color="#687f6b"/>
 <Box position={[0,-.45,-.03]} scale={[.89,.65,.61]} color="#26352b"/>
 <group position={[0,-.72,.47]} rotation={[-.07,-.12,0]}><Parcel/></group>
 <mesh position={[0,.98,.02]}><sphereGeometry args={[.055,12,10]}/><meshBasicMaterial color={lime}/></mesh>
 </group>;}
function Portal({onDraw}:{onDraw:()=>void}){
 const shape=useMemo(()=>{const s=new Shape();s.moveTo(-1.67,-1.6);s.lineTo(-1.67,1.2);s.quadraticCurveTo(-1.67,1.65,-1.2,1.65);s.lineTo(1.16,1.65);s.quadraticCurveTo(1.64,1.65,1.64,1.16);s.lineTo(1.64,-.61);s.quadraticCurveTo(1.64,-1.12,1.13,-1.12);s.lineTo(-.96,-1.12);s.lineTo(-1.67,-1.8);s.closePath();const h=new Path();h.moveTo(-1.28,-.66);h.lineTo(1.25,-.66);h.lineTo(1.25,1.22);h.lineTo(-1.28,1.22);h.closePath();s.holes.push(h);return s;},[]);
 return <mesh position={[0,.1,-.75]} onAfterRender={onDraw}><extrudeGeometry args={[shape,{depth:.16,bevelEnabled:true,bevelSize:.07,bevelThickness:.06,bevelSegments:3,steps:1,curveSegments:14}]}/><meshStandardMaterial color="#6cba00" emissive="#306500" emissiveIntensity={.35} metalness={.85} roughness={.18}/></mesh>;
}
function Satellites({mode,mobile,reduced}:{mode:SpatialMode;mobile:boolean;reduced:boolean}){
 const ref=useRef<Group>(null);useFrame((state,delta)=>{if(ref.current&&!reduced)ref.current.rotation.y+=delta*.075;});
 const count=mobile?3:mode==='suppliers'?7:5;
 return <group ref={ref}>
 {Array.from({length:count},(_,i)=>{const angle=i/count*Math.PI*2,x=Math.cos(angle)*2.65,z=Math.sin(angle)*1.1-.2,y=Math.sin(angle*2)*.55+.15;return <group key={i} position={[x,y,z]}>
  {mode==='orders'?<Parcel scale={.32}/>:mode==='agreements'?<group scale={.26}><Courier/></group>:<mesh rotation={[Math.PI/4,Math.PI/4,0]}><octahedronGeometry args={[.12,0]}/><meshStandardMaterial color={i%2?lime:'#a8c2ae'} metalness={.85} roughness={.2} emissive={i%2?lime:'#000'} emissiveIntensity={.6}/></mesh>}
  <mesh rotation={[Math.PI/2,0,0]} position={[0,-.26,0]}><torusGeometry args={[.2,.01,5,24]}/><meshBasicMaterial color={lime} transparent opacity={.4}/></mesh>
 </group>;})}
 {mode==='negotiations'||mode==='suppliers'||mode==='workspace'?Array.from({length:3},(_,i)=><Tube key={i} points={[[0,-.9,-.6],[Math.cos(i*2.1)*1.3,.15,-1],[Math.cos(i*2.1)*2.65,Math.sin(i*4.2)*.55+.15,Math.sin(i*2.1)*1.1-.2]]} radius={.008} opacity={.35}/>):null}
 </group>;
}
function World({mode,motion,mobile,reduced,visible,onReady}:Omit<Props,'onFailure'>){
 const robot=useRef<Group>(null),orbit=useRef<Group>(null),world=useRef<Group>(null),{camera,invalidate,size}=useThree();const t=useRef(0);
 const drawn=useRef(false),readyFrame=useRef(0);
 useEffect(()=>()=>cancelAnimationFrame(readyFrame.current),[]);
 const firstDraw=()=>{if(drawn.current)return;drawn.current=true;readyFrame.current=requestAnimationFrame(()=>{readyFrame.current=requestAnimationFrame(onReady);});};
 useEffect(()=>{invalidate();},[mode,mobile,reduced,invalidate]);
 useEffect(()=>{const refresh=()=>{requestAnimationFrame(()=>invalidate());};window.addEventListener('scroll',refresh,{passive:true});window.addEventListener('resize',refresh,{passive:true});return()=>{window.removeEventListener('scroll',refresh);window.removeEventListener('resize',refresh);};},[invalidate]);
 useFrame((_,delta)=>{if(!visible)return;if(!reduced)t.current+=Math.min(delta,.05);const p=motion.current;const k=1-Math.exp(-delta*3);
  if(robot.current){robot.current.position.y=reduced?0:Math.sin(t.current*1.3)*.075;robot.current.rotation.y=MathUtils.lerp(robot.current.rotation.y,reduced?-.16:p.x*.17-.16,k);}
  if(orbit.current&&!reduced){orbit.current.rotation.z=Math.sin(t.current*.2)*.13;orbit.current.rotation.y=t.current*.06;}
  if(world.current){const height=2*Math.tan(43*Math.PI/360)*10.5;const x=mobile?.1+(p.anchorX-.5)*height*size.width/size.height:1.75;const y=mobile?.1+(.5-p.anchorY)*height:0;world.current.position.x=mobile||reduced?x:MathUtils.lerp(world.current.position.x,x,k);world.current.position.y=mobile||reduced?y:MathUtils.lerp(world.current.position.y,y,k);world.current.rotation.y=MathUtils.lerp(world.current.rotation.y,reduced?-.1:p.x*.055-.1,k);}
  camera.position.y=MathUtils.lerp(camera.position.y,.45+(reduced||mobile?0:p.scroll*.8-p.y*.13),k);camera.position.z=MathUtils.lerp(camera.position.z,(mobile?10.5:8.8)+(reduced||mobile?0:p.scroll*.6),k);camera.lookAt(mobile?.1:.35,.1,0);
 });
 return <>
 <ambientLight intensity={.75}/><directionalLight position={[-4,6,5]} intensity={3} color="#dbffe1"/><pointLight position={[2,0,3]} color={lime} intensity={10} distance={10}/>
 <Environment resolution={mobile?64:128} frames={1}><Lightformer intensity={3} position={[-3,4,3]} scale={[4,5,1]}/><Lightformer intensity={4} position={[3,1,1]} rotation={[0,-Math.PI/2,0]} scale={[3,5,1]} color="#b9ff7a"/><Lightformer intensity={2} position={[0,-3,2]} scale={[5,1,1]}/></Environment>
 <group ref={world} position={[mobile?.1:1.75,mobile?-12:0,0]} scale={mobile?.6:1}>
  <Portal onDraw={firstDraw}/><group ref={robot}><Courier/></group>
  <group ref={orbit} rotation={[.28,0,-.14]}><mesh rotation={[Math.PI/2,0,0]} position={[0,-.55,0]} scale={[1.35,1,1]}><torusGeometry args={[1.9,.022,8,100]}/><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={2} metalness={.5} roughness={.2}/></mesh></group>
  <Satellites mode={mode} mobile={mobile} reduced={reduced}/>
  <mesh position={[0,-1.52,0]}><cylinderGeometry args={[1.2,1.5,.05,48]}/><meshStandardMaterial color="#09110b" metalness={.9} roughness={.3}/></mesh>
  <mesh position={[0,-1.46,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.45,.014,6,70]}/><meshBasicMaterial color={lime}/></mesh>
  <group position={[0,2.09,-.3]}><Center><Text3D font={font} size={.34} height={.07} bevelEnabled bevelSize={.006} bevelThickness={.008} bevelSegments={2} curveSegments={5} letterSpacing={.025}>PERENNA<meshStandardMaterial color="#dfffbc" metalness={.8} roughness={.22} emissive="#4e8009" emissiveIntensity={.3}/></Text3D></Center></group>
  <group position={[0,-1.92,.1]}><Center><Text3D font={font} size={mobile?.075:.09} height={.012} curveSegments={3} letterSpacing={.012}>{labels[mode]??labels.workspace}<meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={.4}/></Text3D></Center></group>
  {mode==='settings'&&[0,1,2].map(i=><mesh key={i} rotation={[.4+i*.4,0,i*.6]}><torusGeometry args={[2.4+i*.17,.009,5,70]}/><meshBasicMaterial color={lime} transparent opacity={.2}/></mesh>)}
  {mode==='agreements'&&<Tube points={[[-2,.7,0],[-1.6,1.1,.3],[0,1.3,.5],[1.6,1.1,.3],[2,.7,0]]} radius={.014}/>}
 </group>
 <gridHelper args={[50,50,'#162b0e','#0c170c']} position={[0,-1.66,0]}/><fog attach="fog" args={['#020502',8,24]}/>
 </>;
}
export default function SpatialScene(props:Props){
 const [dpr,setDpr]=useState(props.mobile?1:1.4);
 return <Canvas className="spatial-canvas" dpr={props.mobile?1:dpr} frameloop={!props.visible?'never':props.reduced?'demand':'always'} camera={{position:[0,.45,props.mobile?10.5:8.8],fov:43,near:.1,far:60}} gl={{alpha:true,antialias:false,powerPreference:'low-power',stencil:false}} onCreated={({gl})=>{gl.setClearColor(new Color('#020502'),0);gl.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();props.onFailure();},{once:true});}} fallback={<div/>}>
  <Suspense fallback={null}><World {...props}/></Suspense><PerformanceMonitor onDecline={()=>setDpr(1)}/>
 </Canvas>;
}
