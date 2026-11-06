import {Temporal} from '@js-temporal/polyfill';

export function deliveryInstant(date:string,time:string,timeZone:string):string{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}(?::\d{2})?$/.test(time))throw new Error('Choose a valid delivery date and time.');
  try{
    const plain=Temporal.PlainDateTime.from(date+'T'+time,{overflow:'reject'});
    return plain.toZonedDateTime(timeZone,{disambiguation:'reject'}).toInstant().toString();
  }catch{throw new Error('The delivery date, time or timezone is invalid or ambiguous. Choose an explicit valid local time.');}
}

export function deliveryLocalParts(instant:string,timeZone:string){
  try{const value=Temporal.Instant.from(instant).toZonedDateTimeISO(timeZone);return {date:value.toPlainDate().toString(),time:value.toPlainTime().toString({smallestUnit:'minute'})};}
  catch{throw new Error('The recorded delivery time or timezone is invalid.');}
}
