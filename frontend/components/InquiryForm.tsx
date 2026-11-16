"use client";

import { FormEvent, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';

import { useSitePage } from '@/lib/site-data';
import { sitePageDefaults } from '@/lib/site-page-defaults';
import { API_BASE_URL } from '@/lib/api';

import { ArrowUpRight, Check } from 'lucide-react';

export interface InquiryFormProps { propertyId?: string; title?: string; intro?: ReactNode; context?: string; formTitle?: string; source?: string }

export default function InquiryForm({propertyId,title,intro,context,formTitle,source='website'}:InquiryFormProps){
 const {inquiry:content}=useSitePage<typeof sitePageDefaults.global>('global');

 const [preferredContact,setPreferredContact]=useState('EMAIL');
 const [state,setState]=useState<'idle'|'sending'|'success'|'error'>('idle');const [error,setError]=useState('');const key=useRef('');

 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const fields=new FormData(form);if(!key.current)key.current=crypto.randomUUID();setState('sending');

 try{const response=await fetch(`${API_BASE_URL}/inquiries`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key.current},body:JSON.stringify({propertyId,requesterName:fields.get('name'),email:fields.get('email')||undefined,phone:fields.get('phone')||undefined,preferredContact,message:context?`${context}\n\n${fields.get('message')}`:fields.get('message'),consent:fields.get('consent')==='on',source})});const result=await response.json();if(!response.ok)throw new Error(result.error?.message||'Please check your details and try again.');setState('success');form.reset();setPreferredContact('EMAIL');key.current='';}catch(reason){setError(reason instanceof Error?reason.message:'Please try again.');setState('error');}}

 return <section id="contact" className="contact-section"><div className="contact-intro">{intro ?? <><p className="eyebrow">{content.eyebrow}</p><h2>{content.title}</h2><p>{content.body}</p><span className="location-note">{content.location}</span></>}</div><div className="inquiry-panel"><p className="eyebrow">{content.formEyebrow}</p><h3>{formTitle??(title?`Enquire about ${title}`:content.formTitle)}</h3>{context&&<p className="inquiry-context">{context}</p>}{state==='success'?<div className="success-state" role="status"><Check/><h3>{content.successTitle}</h3><p>{content.successBody}</p><button className="button" onClick={()=>setState('idle')}>Send another enquiry</button></div>:<form onSubmit={submit}><div className="form-grid"><label>{content.name}<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label><label>{content.preferred}<select name="preferredContact" value={preferredContact} onChange={event=>{setPreferredContact(event.target.value);setError('');if(state==='error')setState('idle');}}><option value="EMAIL">Email</option><option value="PHONE">Phone</option><option value="WHATSAPP">WhatsApp</option></select></label>{preferredContact==='EMAIL'?<label>{content.email}<input name="email" type="email" autoComplete="email" maxLength={200} required/></label>:<label>{content.phone}<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={30} required/></label>}</div><label>{content.message}<textarea name="message" minLength={10} maxLength={2000-(context?context.length+2:0)} rows={3} placeholder={content.placeholder} required/></label><label className="consent"><input name="consent" type="checkbox" required/>{content.consent}</label><p className="consent-policy"><Link href="/privacy" target="_blank" rel="noopener noreferrer">Read our privacy policy<span className="sr-only"> (opens in a new tab)</span></Link></p>{state==='error'&&<p role="alert" className="error-text">{error}</p>}<button className="button" disabled={state==='sending'}>{state==='sending'?'Sending enquiry…':content.submit}<ArrowUpRight size={17}/></button></form>}</div></section>

}

