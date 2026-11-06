'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

type Phase='idle'|'acquiring'|'recording'|'transcribing';
type Capture={token:number;media:MediaRecorder|null;stream:MediaStream|null;chunks:Blob[];bytes:number;submit:boolean;controller:AbortController|null;timer:ReturnType<typeof setTimeout>|null;cancel:(()=>void)|null;timedOut:boolean};
const MAX_AUDIO_BYTES=8*1024*1024;
const REQUEST_TIMEOUT_MS=60_000;
const LIMIT_MESSAGE='Recording exceeded 8 MB and was discarded without submission. Your typed draft is unchanged.';
const TIMEOUT_MESSAGE='Speech recognition timed out. The recording was released and your typed draft is unchanged.';

export function useVoiceCapture(language:string,onTranscript:(text:string)=>void,onError:(message:string)=>void){
 const [phase,setPhase]=useState<Phase>('idle');const currentPhase=useRef<Phase>('idle'),generation=useRef(0),active=useRef<Capture|null>(null);
 const callbacks=useRef({onTranscript,onError});callbacks.current={onTranscript,onError};
 const update=(value:Phase)=>{currentPhase.current=value;setPhase(value);};
 const release=useCallback((capture:Capture)=>{
  if(capture.timer!==null)clearTimeout(capture.timer);capture.timer=null;
  capture.cancel?.();capture.cancel=null;capture.controller?.abort();capture.controller=null;
  const media=capture.media;capture.media=null;
  if(media){media.ondataavailable=null;media.onstop=null;media.onerror=null;if(media.state!=='inactive')media.stop();}
  capture.stream?.getTracks().forEach(track=>track.stop());capture.stream=null;
  capture.chunks.length=0;capture.bytes=0;capture.submit=false;
  if(active.current===capture)active.current=null;
 },[]);
 const discard=useCallback(()=>{generation.current++;if(active.current)release(active.current);currentPhase.current='idle';setPhase('idle');},[release]);
 useEffect(()=>()=>{generation.current++;if(active.current)release(active.current);},[release]);
 useEffect(()=>{discard();},[language,discard]);
 async function start(){
  if(currentPhase.current!=='idle')return;
  const capture:Capture={token:++generation.current,media:null,stream:null,chunks:[],bytes:0,submit:false,controller:null,timer:null,cancel:null,timedOut:false};active.current=capture;const recordingLanguage=language;update('acquiring');
  const owns=()=>generation.current===capture.token&&active.current===capture;
  const failCapture=(message:string)=>{if(!owns()){release(capture);return;}generation.current++;release(capture);update('idle');callbacks.current.onError(message);};
  try{
   const input=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!owns()){input.getTracks().forEach(track=>track.stop());return;}
   capture.stream=input;const media=new MediaRecorder(input);capture.media=media;
   media.ondataavailable=event=>{if(!owns()||!event.data.size)return;if(capture.bytes+event.data.size>MAX_AUDIO_BYTES){failCapture(LIMIT_MESSAGE);return;}capture.bytes+=event.data.size;capture.chunks.push(event.data);};
   media.onerror=()=>failCapture('Recording failed. Please type your request.');
   media.onstop=async()=>{
    if(!owns()){release(capture);return;}
    capture.stream?.getTracks().forEach(track=>track.stop());capture.stream=null;
    media.onstop=null;media.ondataavailable=null;media.onerror=null;capture.media=null;
    if(!capture.submit||!capture.bytes){failCapture('No audio was recorded. Your typed draft is unchanged.');return;}
    update('transcribing');const controller=new AbortController();capture.controller=controller;
    try{
     const form=new FormData();form.append('audio',new Blob(capture.chunks,{type:media.mimeType}),'request.webm');form.append('language',recordingLanguage);
     // Fetch snapshots this request body. Release the application chunk array and form audio entry immediately afterward.
     capture.chunks.length=0;capture.bytes=0;
     const stopped=new Promise<never>((_,reject)=>{capture.cancel=()=>reject(new DOMException('Recording discarded','AbortError'));capture.timer=setTimeout(()=>{capture.timedOut=true;controller.abort();reject(new Error(TIMEOUT_MESSAGE));},REQUEST_TIMEOUT_MS);});
     const pending=fetch('/api/speech/transcribe',{method:'POST',body:form,signal:controller.signal});form.delete('audio');
     const result=await Promise.race([pending.then(async response=>({response,result:await response.json()})),stopped]);
     if(!owns()||controller.signal.aborted)return;
     if(!result.response.ok)throw new Error(result.result.error||'Speech recognition is unavailable.');
     const text=result.result.transcript??result.result.text;if(typeof text!=='string'||!text.trim())throw new Error('No transcript was returned. Your typed draft is unchanged.');
     callbacks.current.onTranscript(text);
    }catch(error){if(owns())callbacks.current.onError(capture.timedOut?TIMEOUT_MESSAGE:error instanceof Error?error.message:'Please type your request.');}
    finally{const current=owns();release(capture);if(current)update('idle');}
   };
   media.start(250);update('recording');
  }catch{failCapture('Microphone access is unavailable. You can type your request.');}
 }
 function stop(){const capture=active.current;if(currentPhase.current==='recording'&&capture?.media){capture.submit=true;update('transcribing');capture.media.stop();}}
 return {phase,start,stop,discard};
}