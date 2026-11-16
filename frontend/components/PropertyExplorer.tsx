"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FormEvent, useEffect, useState } from 'react';

import { ArrowUpRight, MapPin, Search, ShieldCheck } from 'lucide-react';

import { ApiProperty, PropertyListResponse, fetchProperties, formatPrice, formatPropertyType, formatPropertyMeta } from '@/lib/api';
import { scenicImageStyle } from '@/lib/site-images';
import { useSiteImages, usePropertyCategories, useSitePage } from '@/lib/site-data';

import InquiryForm from './InquiryForm';

import FeaturedSlider from './FeaturedSlider';
import HomeHero from './HomeHero';

import { Header, Footer } from './SiteChrome';

export interface PropertyExplorerProps { catalogue?: boolean }

export function PropertyExplorer({catalogue=false}:PropertyExplorerProps){
 return <Explorer catalogue={catalogue}/>;
}

function Explorer({catalogue=false}:PropertyExplorerProps){
 const router=useRouter();
 const [routeQuery,setRouteQuery]=useState('');const [routeReady,setRouteReady]=useState(false);
 const content=useSitePage<Record<string,Record<string,string>>>(catalogue?'properties':'home');
 const categories=usePropertyCategories();
 const image=useSiteImages();
 useEffect(()=>{const sync=()=>setRouteQuery(window.location.search.slice(1));sync();setRouteReady(true);window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
 const [data,setData]=useState<PropertyListResponse|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [query,setQuery]=useState('');

 useEffect(()=>{if(!routeReady)return;const params=new URLSearchParams(routeQuery);if(query)params.set('q',query);if(!catalogue){params.set('pageSize','6');params.set('includeTotal','false')}else{params.delete('includeTotal')}let active=true;setLoading(true);setError('');fetchProperties(params.toString()).then(result=>{if(active)setData(result)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[query,catalogue,routeQuery,routeReady]);

 function search(event:FormEvent<HTMLFormElement>){event.preventDefault();const fields=new FormData(event.currentTarget);router.push(`/properties?${new URLSearchParams({q:String(fields.get('q')||''),category:String(fields.get('category')||''),purpose:String(fields.get('purpose')||'')})}`);}
  function searchInline(event:FormEvent<HTMLFormElement>){event.preventDefault();const submitted=String(new FormData(event.currentTarget).get('q')||'').trim();const params=new URLSearchParams(routeQuery);if(submitted)params.set('q',submitted);else params.delete('q');params.delete('page');const suffix=params.toString();window.history.pushState(null,'',suffix?`/properties?${suffix}`:'/properties');setRouteQuery(suffix);setQuery(submitted);}

 return <><Header/><main id="main-content">{!catalogue?<HomeHero categories={categories} onSearch={search}/>:<section className="catalogue-intro" style={scenicImageStyle(image("collectionHero",content.hero?.image).src)}><p className="eyebrow">{content.hero?.eyebrow}</p><h1>{content.hero?.title}</h1><p>{content.hero?.intro}</p><form className="inline-search" onSubmit={searchInline}><input name="q" aria-label="Search properties" placeholder="Search a location or property"/><button className="button"><Search size={18}/>Search</button></form><div className="filter-links"><Link href="/properties" onClick={()=>{setRouteQuery('');setQuery('');}}>All properties</Link>{categories.map(category=><Link key={category.value} href={`/properties?category=${category.value}`} onClick={()=>{setRouteQuery(`category=${category.value}`);setQuery('');}}>{category.label}</Link>)}</div></section>}

 {!catalogue&&<section className="section" id="collection"><div className="section-heading"><div><p className="eyebrow">A DIFFERENT KIND OF ASSET</p><h2>Consider the possibilities.</h2></div><p>From established hospitality to a home among the apple trees. Begin with what moves you.</p></div><div className="category-grid">{categories.map((category,i)=><Link className="category-card" key={category.value} href={`/properties?category=${category.value}`}><img src={image(`category${category.value}`).src || undefined} hidden={!image(`category${category.value}`).src} alt={image(`category${category.value}`).alt} width={700} height={600} loading="lazy"/><div><h3>{category.label}</h3><p>{category.description}</p><span>Explore collection <ArrowUpRight size={17}/></span></div></Link>)}</div></section>}

 {!catalogue&&data?.items.length&&<FeaturedSlider properties={data.items}/>}<section className="section listings" id="properties"><div className="section-heading"><div><p className="eyebrow">PLACES WITH POSSIBILITY</p><h2>{catalogue?(content.listings?.title??'The estate collection.'):(content.listings?.title??'Explore the collection.')}</h2></div>{!catalogue&&<Link className="text-link" href="/properties">View the full collection <ArrowUpRight size={17}/></Link>}</div>{loading?<div className="loading-grid" aria-label="Loading properties" aria-busy="true">{[1,2,3].map(n=><div className="skeleton" key={n}/>)}</div>:error?<div className="empty-state" role="alert"><h3>The collection is unavailable.</h3><p>{error}</p><button className="button" onClick={()=>window.location.reload()}>Try again</button></div>:data?.items.length?<><div className="listing-grid">{data.items.map(property=><PropertyCard key={property.id} property={property}/>)}</div>{catalogue&&<div className="pagination"><span>{data.pagination.total} properties · Page {data.pagination.page} of {data.pagination.totalPages}</span>{data.pagination.page>1&&<a className="button" href={`?${new URLSearchParams({...Object.fromEntries(new URLSearchParams(window.location.search)),page:String(data.pagination.page-1)})}`}>Previous</a>}{data.pagination.hasMore&&<a className="button" href={`?${new URLSearchParams({...Object.fromEntries(new URLSearchParams(window.location.search)),page:String(data.pagination.page+1)})}`}>Next page</a>}</div>}</>:<div className="empty-state"><MapPin/><h3>Your search is a little off the beaten path.</h3><p>Try another location or browse the complete collection.</p><Link className="button" href="/properties">View all properties</Link></div>}</section>

 {!catalogue&&<section className="approach-section"><img src={image("homeApproach",content.approach?.image).src || undefined} hidden={!image("homeApproach",content.approach?.image).src} alt={image("homeApproach").alt} width={1000} height={800} loading="lazy"/><div><p className="eyebrow">ROOTED IN MANALI</p><h2>{content.approach?.title??<>A mountain address.<br/><i>A grounded approach.</i></>}</h2><p>{content.approach?.body??'The right place starts with the right questions. Access, land records, local conditions and the life you want to build here.'}</p><p>We bring local context to your search, with personal viewings and clear conversations at every step.</p><Link className="text-link" href="/advisory">Understand buying in Manali <ArrowUpRight size={17}/></Link></div></section>}

 <InquiryForm/><Footer/></main></>;

}

function PropertyCard({property}:{property:ApiProperty}){const cover=property.media?.find(m=>m.isCover)??property.media?.[0];return <article className="property-card"><Link className="property-image" href={`/properties/${property.slug}`}>{cover?<img src={cover.deliveryUrl} alt={cover.altText} width={900} height={650} loading="lazy"/>:<div className="image-placeholder"><MapPin/><span>Photography available on enquiry</span></div>}<span className="property-type">{formatPropertyType(property.category)}</span>{property.verificationStatus==='VERIFIED'&&<span className="verified"><ShieldCheck size={13}/>Verified</span>}</Link><div className="property-info"><p className="eyebrow"><MapPin size={12}/>{property.locality} · {property.city}</p><Link href={`/properties/${property.slug}`}><h3>{property.title}</h3></Link><p>{property.description.slice(0,110)}{property.description.length>110?'…':''}</p><div className="property-meta">{formatPropertyMeta(property)}</div><div className="property-bottom"><strong>{formatPrice(property)}</strong><Link href={`/properties/${property.slug}`} aria-label={`View ${property.title}`}>View dossier <ArrowUpRight size={16}/></Link></div></div></article>}
