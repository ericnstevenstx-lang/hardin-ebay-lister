'use client';
import { useState, useCallback, useRef } from "react";

const SUPABASE_URL = "https://ulyycjtrshpsjpvbztkr.supabase.co";
const FN = (name) => `${SUPABASE_URL}/functions/v1/${name}`;

const B = {
  green: "#58815a", greenLight: "#6a9b6c", greenDark: "#3d5e3f",
  bg: "#0c1210", card: "#131f18", cardAlt: "#182620", border: "#2a3d30",
  text: "#e2e8e4", muted: "#7a8f7e", accent: "#8bc98e",
  red: "#e05555", blue: "#5b9bd5", amber: "#d4a843", purple: "#6b5bbf",
};

const EQ_TYPES = ["Circuit Breaker","Transformer","Switchgear","Panelboard","Motor Control Center (MCC)","Disconnect Switch","Bus Duct / Bus Plug","UPS System","PDU","ATS / Transfer Switch","Motor Starter","Fuses","Enclosure"];
const MFRS = ["Square D / Schneider","Eaton / Cutler-Hammer","GE / General Electric","Siemens / ITE","ABB","Westinghouse","Federal Pacific (FPE)","Allen-Bradley","Merlin Gerin","Zinsco","Murray","Challenger","Sylvania","Thomas & Betts","Other"];
const GRADES = [
  { value: "A", label: "Grade A - Excellent" },
  { value: "B", label: "Grade B - Good working" },
  { value: "C", label: "Grade C - Fair / rebuild" },
  { value: "D", label: "Grade D - Parts/scrap" },
];

function copyText(t) { navigator.clipboard.writeText(t).catch(() => { const a=document.createElement("textarea"); a.value=t; document.body.appendChild(a); a.select(); document.execCommand("copy"); document.body.removeChild(a); }); }
function stripHtml(h) { const d=document.createElement("div"); d.innerHTML=h; return d.textContent||""; }

function csvEscape(v) { if (v==null) return ""; const s=String(v); return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s; }
function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const lines = [cols.map(csvEscape).join(",")];
  rows.forEach(r => lines.push(cols.map(c => csvEscape(r[c])).join(",")));
  const blob = new Blob(["\uFEFF"+lines.join("\n")], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
function DlBtn({onClick,disabled,children}) {
  return <button onClick={onClick} disabled={disabled} style={{padding:"6px 14px",background:disabled?B.border:"#2a5a2e",color:disabled?B.muted:"#fff",border:`1px solid ${disabled?B.border:B.green}`,borderRadius:4,fontSize:12,fontWeight:600,cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5}}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    {children}
  </button>;
}

const Logo = ({size=36}) => (
  <svg width={size} height={size} viewBox="0 0 212 191" fill="none"><path d="M113.977 155.659C106.789 156.563 99.7953 156.218 93.1887 154.777C92.0481 154.518 91.4671 153.227 92.0266 152.194L98.0737 141.134C98.418 140.489 99.1497 140.144 99.8814 140.23C101.904 140.51 103.992 140.661 106.101 140.661C131.236 140.661 151.702 120.197 151.702 95.0634C151.702 89.813 150.798 84.7562 149.162 80.0652L124.5 125.34C124.199 125.899 123.618 126.222 122.994 126.222H109.243C107.951 126.222 107.134 124.845 107.736 123.704L116.28 108.039C116.602 107.436 116.172 106.726 115.483 106.726H90.1328C89.724 106.726 89.3581 106.942 89.1645 107.307L77.2209 129.234L70.313 141.801C69.7534 142.834 68.3762 143.135 67.4508 142.382C52.4083 130.052 43.3054 110.664 45.2637 89.2965C47.9752 59.9887 71.8839 36.4692 101.237 34.1883C109.587 33.5427 117.614 34.5756 125.038 37.0071C126.286 37.416 126.824 38.8792 126.2 40.0412L120.67 50.1118C120.196 50.994 119.185 51.3814 118.216 51.1231C111.61 49.2941 104.422 48.9068 96.9762 50.3915C78.0601 54.1572 63.3835 69.8871 60.8872 89.0168C59.553 99.2595 61.6619 108.964 66.2026 117.141L93.3824 67.2403C93.5976 66.8315 94.0495 66.5732 94.5014 66.5732H109.221C110.189 66.5732 110.814 67.6061 110.34 68.4669L98.8269 89.6193C98.418 90.3509 98.956 91.2332 99.7953 91.2332H124.931C125.253 91.2332 125.555 91.061 125.727 90.7598L139.995 64.5721L139.952 64.529L146.903 51.7687C147.29 51.0586 148.258 50.9079 148.839 51.4674C161.386 63.7544 168.681 81.3993 166.959 100.658C164.441 128.933 142.19 152.108 114.02 155.659H113.977Z" fill={B.green}/></svg>
);

function PriceTag({label,value,color}) {
  return (<div style={{textAlign:"center",padding:"8px 12px",background:B.card,borderRadius:6,border:`1px solid ${B.border}`,minWidth:85}}>
    <div style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:2}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:color||B.accent,fontFamily:"'JetBrains Mono',monospace"}}>{value!=null?`$${Number(value).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`:"---"}</div>
  </div>);
}
function CompRow({comp,source}) {
  return (<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${B.border}`,fontSize:13}}>
    {comp.image&&<img src={comp.image} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:4,flexShrink:0}}/>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:B.text}}>{comp.title}</div>
      <div style={{fontSize:11,color:B.muted}}>{source==="ebay"?(comp.seller||"eBay"):(comp.displayLink||"Web")}{comp.condition&&` · ${comp.condition}`}</div>
    </div>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:B.accent,flexShrink:0}}>{comp.price?`$${Number(comp.price).toLocaleString()}`:"Quote"}</div>
    <a href={source==="ebay"?comp.itemUrl:comp.link} target="_blank" rel="noopener noreferrer" style={{color:B.blue,fontSize:11,flexShrink:0,textDecoration:"none"}}>View</a>
  </div>);
}
function TabB({active,onClick,children,badge}) {
  return (<button onClick={onClick} style={{padding:"11px 16px",background:active?B.green:"transparent",color:active?"#fff":B.muted,border:"none",borderBottom:active?`2px solid ${B.greenLight}`:"2px solid transparent",fontWeight:active?700:500,fontSize:13,cursor:"pointer",position:"relative",fontFamily:"inherit"}}>{children}{badge>0&&<span style={{position:"absolute",top:4,right:2,background:B.red,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>{badge}</span>}</button>);
}
function Inp({label,value,onChange,placeholder,style:xs}) {
  return (<div style={{display:"flex",flexDirection:"column",gap:3,...xs}}>
    <label style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}</label>
    <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{padding:"8px 10px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:4,color:B.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
  </div>);
}
function Sel({label,value,onChange,options,style:xs}) {
  return (<div style={{display:"flex",flexDirection:"column",gap:3,...xs}}>
    <label style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}</label>
    <select value={value||""} onChange={e=>onChange(e.target.value)} style={{padding:"8px 10px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:4,color:B.text,fontSize:13,fontFamily:"inherit",outline:"none"}}><option value="">Select...</option>{options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}</select>
  </div>);
}
function ActBtn({onClick,disabled,color,children,small}) {
  return (<button onClick={onClick} disabled={disabled} style={{padding:small?"6px 14px":"12px 24px",background:disabled?B.border:color,color:disabled?B.muted:"#fff",border:"none",borderRadius:6,fontWeight:700,fontSize:small?12:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1}}>{children}</button>);
}

// ========== SCANNER ==========
function ScannerPanel({ onNameplate, onBarcode }) {
  const [mode, setMode] = useState(null);
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  const stopCam = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current=null; }
  }, []);

  const doNameplate = async (b64, mt) => {
    setStatus("Reading nameplate via AI...");
    try {
      const r = await fetch(FN("scan-nameplate"), { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({image_base64:b64,media_type:mt}) });
      const d = await r.json();
      if (d.error) { setStatus(`Error: ${d.error}`); return; }
      onNameplate(d);
      setStatus("✓ Nameplate scanned. Form auto-filled.");
      setTimeout(() => { setMode(null); setStatus(null); setPreview(null); }, 2500);
    } catch(e) { setStatus(`Error: ${e.message}`); }
  };

  const doBarcode = async (src) => {
    if (!('BarcodeDetector' in window)) { setStatus("BarcodeDetector not available. Use Chrome/Edge."); return; }
    setStatus("Detecting...");
    try {
      const fmts = mode==="qr" ? ["qr_code"] : ["code_128","code_39","ean_13","ean_8","upc_a","upc_e","itf","codabar","data_matrix"];
      const det = new BarcodeDetector({formats:fmts});
      const res = await det.detect(src);
      if (!res.length) { setStatus("No code detected. Try again or adjust angle."); return; }
      onBarcode(res[0].rawValue, res[0].format);
      setStatus(`✓ ${res[0].format}: ${res[0].rawValue}`);
      setTimeout(() => { setMode(null); setStatus(null); setPreview(null); }, 2500);
    } catch(e) { setStatus(`Error: ${e.message}`); }
  };

  const onFile = async (e) => {
    const f=e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target.result;
      setPreview(url);
      if (mode==="nameplate") {
        let mt=f.type||"image/jpeg"; if(mt==="image/jpg") mt="image/jpeg"; if(mt.includes("heic")) mt="image/jpeg";
        await doNameplate(url.split(",")[1], mt);
      } else {
        const img=new Image(); img.onload=()=>doBarcode(img); img.src=url;
      }
    };
    reader.readAsDataURL(f);
    e.target.value="";
  };

  const startLive = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject=s; videoRef.current.play(); }
      if (!('BarcodeDetector' in window)) { setStatus("Live scan needs Chrome/Edge. Use photo."); return; }
      const fmts = mode==="qr" ? ["qr_code"] : ["code_128","code_39","ean_13","ean_8","upc_a","upc_e","itf","codabar","data_matrix","qr_code"];
      const det = new BarcodeDetector({formats:fmts});
      const tick = async () => {
        if (!videoRef.current||!streamRef.current) return;
        try {
          const r = await det.detect(videoRef.current);
          if (r.length) { stopCam(); onBarcode(r[0].rawValue,r[0].format); setStatus(`✓ ${r[0].format}: ${r[0].rawValue}`); setTimeout(()=>{setMode(null);setStatus(null);},2500); return; }
        } catch{}
        animRef.current = requestAnimationFrame(tick);
      };
      videoRef.current.onloadeddata = () => { animRef.current=requestAnimationFrame(tick); };
    } catch(e) { setStatus(`Camera: ${e.message}. Use photo.`); }
  };

  const go = (m) => {
    stopCam(); setPreview(null); setStatus(null);
    if (mode===m) { setMode(null); return; }
    setMode(m);
    if (m==="nameplate") { setTimeout(()=>fileRef.current?.click(),100); }
    else { setTimeout(()=>startLive(),100); }
  };

  const sBtn = (m, label, icon, clr) => (
    <button onClick={()=>go(m)} style={{
      padding:"10px 14px",background:mode===m?clr:B.cardAlt,color:mode===m?"#fff":B.text,
      border:`1px solid ${mode===m?clr:B.border}`,borderRadius:6,fontSize:13,fontWeight:600,
      cursor:"pointer",display:"flex",alignItems:"center",gap:6,
    }}>{icon} {label}</button>
  );

  return (<div style={{marginBottom:16}}>
    <div style={{display:"flex",gap:8,marginBottom:mode?12:0,flexWrap:"wrap"}}>
      {sBtn("nameplate","Scan Nameplate",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
        B.green)}
      {sBtn("barcode","Scan Barcode",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5v14"/><path d="M6 5v14"/><path d="M10 5v14"/><path d="M14 5v14"/><path d="M18 5v14"/><path d="M21 5v14"/></svg>,
        B.amber)}
      {sBtn("qr","Scan QR",
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/></svg>,
        B.purple)}
      {mode&&<button onClick={()=>{stopCam();setMode(null);setStatus(null);setPreview(null);}} style={{padding:"10px 14px",background:B.red,color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>}
    </div>
    <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{display:"none"}}/>
    {mode&&mode!=="nameplate"&&(<div style={{position:"relative",borderRadius:8,overflow:"hidden",background:"#000",marginBottom:8}}>
      <video ref={videoRef} playsInline muted style={{width:"100%",maxHeight:260,objectFit:"cover",display:"block"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:mode==="qr"?160:"70%",height:mode==="qr"?160:80,border:`2px solid ${mode==="qr"?B.purple:B.amber}`,borderRadius:8,boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)"}}/>
      <div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center"}}>
        <button onClick={()=>fileRef.current?.click()} style={{padding:"5px 14px",background:"rgba(255,255,255,0.9)",color:"#000",border:"none",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer"}}>Photo Instead</button>
      </div>
    </div>)}
    {preview&&mode==="nameplate"&&<div style={{borderRadius:8,overflow:"hidden",marginBottom:8}}><img src={preview} alt="" style={{width:"100%",maxHeight:200,objectFit:"contain",background:"#000",display:"block"}}/></div>}
    {status&&<div style={{padding:"8px 14px",borderRadius:6,fontSize:13,fontWeight:500,background:status.startsWith("✓")?`${B.green}22`:status.startsWith("Error")?`${B.red}22`:`${B.amber}22`,color:status.startsWith("✓")?B.accent:status.startsWith("Error")?B.red:B.amber,border:`1px solid ${status.startsWith("✓")?B.green:status.startsWith("Error")?B.red:B.amber}33`}}>{status}</div>}
  </div>);
}

// ========== MAIN ==========
export default function HardinLister() {
  const [tab, setTab] = useState("entry");
  const [loading, setLoading] = useState({});
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({equipment_type:"",manufacturer:"",model_number:"",catalog_number:"",serial_number:"",voltage_rating:"",voltage_secondary:"",amperage_rating:"",kva_rating:"",phase:"3",frequency:"60",grade:"B",condition_notes:"",year_manufactured:"",weight_lbs:"",interrupting_rating:"",frame_size:"",trip_rating:"",breaker_type:"",bus_rating:"",cooling_class:"",liquid_type:"",winding_material:""});
  const [ebayComps, setEbayComps] = useState(null);
  const [webComps, setWebComps] = useState(null);
  const [listing, setListing] = useState(null);
  const [errors, setErrors] = useState({});
  const sf = (k,v) => setForm(p=>({...p,[k]:v}));

  const buildQ = useCallback(()=>{
    const p=[];
    if(form.manufacturer) p.push(form.manufacturer.split(" / ")[0]);
    if(form.equipment_type) p.push(form.equipment_type.replace(/ *\(.*\)/,""));
    if(form.catalog_number) p.push(form.catalog_number);
    else if(form.model_number) p.push(form.model_number);
    if(form.amperage_rating) p.push(form.amperage_rating+"A");
    else if(form.kva_rating) p.push(form.kva_rating+"KVA");
    if(form.voltage_rating) p.push(form.voltage_rating+"V");
    return p.join(" ");
  },[form]);

  const fetchEbay=async()=>{const q=buildQ();if(!q)return;setLoading(p=>({...p,ebay:true}));setErrors(p=>({...p,ebay:null}));try{const r=await fetch(FN("ebay-comps"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:q})});const d=await r.json();if(d.error)setErrors(p=>({...p,ebay:d.error}));setEbayComps(d);}catch(e){setErrors(p=>({...p,ebay:String(e)}));}setLoading(p=>({...p,ebay:false}));};
  const fetchWeb=async()=>{const q=buildQ();if(!q)return;setLoading(p=>({...p,web:true}));setErrors(p=>({...p,web:null}));try{const r=await fetch(FN("web-comps"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:q,num:10})});const d=await r.json();if(d.error)setErrors(p=>({...p,web:d.error}));setWebComps(d);}catch(e){setErrors(p=>({...p,web:String(e)}));}setLoading(p=>({...p,web:false}));};
  const genListing=async()=>{if(!form.equipment_type)return;setLoading(p=>({...p,listing:true}));setErrors(p=>({...p,listing:null}));try{const cp=ebayComps?.stats?{low:ebayComps.stats.low,median:ebayComps.stats.median,high:ebayComps.stats.high,count:ebayComps.stats.count}:null;const r=await fetch(FN("generate-listing"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,comp_prices:cp})});const d=await r.json();if(d.error)setErrors(p=>({...p,listing:d.error}));else setListing(d);}catch(e){setErrors(p=>({...p,listing:String(e)}));}setLoading(p=>({...p,listing:false}));};

  const handleCopy=(t,id)=>{copyText(t);setCopied(id);setTimeout(()=>setCopied(null),2000);};
  const CopyBtn=({text,id,label})=>(<button onClick={()=>handleCopy(text,id)} style={{padding:"4px 10px",background:copied===id?B.green:B.border,color:"#fff",border:"none",borderRadius:4,fontSize:11,cursor:"pointer"}}>{copied===id?"✓ Copied":label||"Copy"}</button>);

  const handleNameplate = (d) => {
    const mfr={"square d":"Square D / Schneider","schneider":"Square D / Schneider","eaton":"Eaton / Cutler-Hammer","cutler":"Eaton / Cutler-Hammer","ge":"GE / General Electric","general electric":"GE / General Electric","siemens":"Siemens / ITE","ite":"Siemens / ITE","abb":"ABB","westinghouse":"Westinghouse","federal pacific":"Federal Pacific (FPE)","fpe":"Federal Pacific (FPE)","allen-bradley":"Allen-Bradley","zinsco":"Zinsco","murray":"Murray","challenger":"Challenger"};
    const eqm={"transformer":"Transformer","circuit breaker":"Circuit Breaker","switchgear":"Switchgear","panelboard":"Panelboard","motor control center":"Motor Control Center (MCC)","mcc":"Motor Control Center (MCC)","disconnect":"Disconnect Switch","bus duct":"Bus Duct / Bus Plug","ups":"UPS System","pdu":"PDU","transfer switch":"ATS / Transfer Switch"};
    setForm(prev=>{
      const n={...prev};
      if(d.equipment_type){const l=d.equipment_type.toLowerCase();for(const[k,v]of Object.entries(eqm)){if(l.includes(k)){n.equipment_type=v;break;}}}
      if(d.manufacturer){const l=d.manufacturer.toLowerCase();let ok=false;for(const[k,v]of Object.entries(mfr)){if(l.includes(k)){n.manufacturer=v;ok=true;break;}}if(!ok)n.manufacturer="Other";}
      if(d.serial_number)n.serial_number=d.serial_number;
      if(d.model_number)n.model_number=d.model_number;
      if(d.catalog_number)n.catalog_number=d.catalog_number;
      if(d.voltage_rating)n.voltage_rating=d.voltage_rating;
      if(d.voltage_secondary)n.voltage_secondary=d.voltage_secondary;
      if(d.amperage_rating)n.amperage_rating=d.amperage_rating;
      if(d.kva_rating)n.kva_rating=String(d.kva_rating);
      if(d.phase)n.phase=String(d.phase);
      if(d.frequency)n.frequency=String(d.frequency);
      if(d.year_manufactured)n.year_manufactured=String(d.year_manufactured);
      if(d.weight_lbs)n.weight_lbs=String(d.weight_lbs);
      if(d.frame_size)n.frame_size=String(d.frame_size);
      if(d.trip_rating)n.trip_rating=String(d.trip_rating);
      if(d.interrupting_rating)n.interrupting_rating=String(d.interrupting_rating);
      if(d.breaker_type)n.breaker_type=d.breaker_type;
      if(d.winding_material)n.winding_material=d.winding_material;
      if(d.cooling_class)n.cooling_class=d.cooling_class;
      if(d.liquid_type)n.liquid_type=d.liquid_type;
      if(d.bus_rating)n.bus_rating=String(d.bus_rating);
      return n;
    });
  };

  const handleBarcode = (val, fmt) => {
    if(fmt==="qr_code"&&val.startsWith("http")){window.open(val,"_blank");sf("condition_notes",(form.condition_notes?form.condition_notes+"\n":"")+"QR: "+val);}
    else sf("catalog_number",val);
  };

  const sq=buildQ();
  const hasEq=form.equipment_type&&(form.manufacturer||form.catalog_number);

  const ts = () => new Date().toISOString().slice(0,10);
  const eqLabel = () => [form.manufacturer?.split(" / ")[0],form.equipment_type,form.catalog_number||form.model_number].filter(Boolean).join("_").replace(/\s+/g,"_");

  const exportEbayCSV = () => {
    if (!ebayComps?.comps?.length) return;
    downloadCSV(ebayComps.comps.map(c=>({Source:"eBay",Title:c.title,Price:c.price||"",Condition:c.condition||"",Seller:c.seller||"",URL:c.itemUrl||""})), `Hardin_eBay_Comps_${eqLabel()}_${ts()}.csv`);
  };
  const exportWebCSV = () => {
    if (!webComps?.comps?.length) return;
    downloadCSV(webComps.comps.map(c=>({Source:c.displayLink||"Dealer",Title:c.title,Price:c.price||"Quote",URL:c.link||"",Snippet:c.snippet||""})), `Hardin_Dealer_Comps_${eqLabel()}_${ts()}.csv`);
  };
  const exportFullReport = () => {
    const rows = [];
    // Equipment info row
    rows.push({Section:"Equipment",Field:"Type",Value:form.equipment_type});
    rows.push({Section:"Equipment",Field:"Manufacturer",Value:form.manufacturer});
    rows.push({Section:"Equipment",Field:"Model",Value:form.model_number});
    rows.push({Section:"Equipment",Field:"Catalog #",Value:form.catalog_number});
    rows.push({Section:"Equipment",Field:"Serial #",Value:form.serial_number});
    rows.push({Section:"Equipment",Field:"Voltage",Value:form.voltage_rating});
    rows.push({Section:"Equipment",Field:"Amperage",Value:form.amperage_rating});
    rows.push({Section:"Equipment",Field:"KVA",Value:form.kva_rating});
    rows.push({Section:"Equipment",Field:"Grade",Value:form.grade});
    rows.push({Section:"Equipment",Field:"Condition Notes",Value:form.condition_notes});
    rows.push({Section:"",Field:"",Value:""});
    // eBay stats
    if (ebayComps?.stats) {
      rows.push({Section:"eBay Stats",Field:"Count",Value:ebayComps.stats.count});
      rows.push({Section:"eBay Stats",Field:"Low",Value:ebayComps.stats.low});
      rows.push({Section:"eBay Stats",Field:"Median",Value:ebayComps.stats.median});
      rows.push({Section:"eBay Stats",Field:"Average",Value:ebayComps.stats.avg});
      rows.push({Section:"eBay Stats",Field:"High",Value:ebayComps.stats.high});
    }
    // Dealer stats
    if (webComps?.stats) {
      rows.push({Section:"Dealer Stats",Field:"Count",Value:webComps.stats.count});
      rows.push({Section:"Dealer Stats",Field:"Low",Value:webComps.stats.low});
      rows.push({Section:"Dealer Stats",Field:"Median",Value:webComps.stats.median});
      rows.push({Section:"Dealer Stats",Field:"High",Value:webComps.stats.high});
    }
    // AI pricing
    if (listing?.suggested_price) {
      rows.push({Section:"AI Suggested",Field:"Low",Value:listing.suggested_price.low});
      rows.push({Section:"AI Suggested",Field:"Target",Value:listing.suggested_price.mid});
      rows.push({Section:"AI Suggested",Field:"High",Value:listing.suggested_price.high});
      rows.push({Section:"AI Suggested",Field:"Reasoning",Value:listing.suggested_price.reasoning||""});
    }
    // Recommended price
    const ps=[ebayComps?.stats?.median,listing?.suggested_price?.mid,webComps?.stats?.median].filter(Boolean);
    if(ps.length){const avg=ps.reduce((a,b)=>a+b,0)/ps.length;const m={A:1.0,B:0.75,C:0.45,D:0.15}[form.grade]||0.75;rows.push({Section:"Recommended",Field:"List Price",Value:Math.round(avg*m)});}
    rows.push({Section:"",Field:"",Value:""});
    // Listing content
    if (listing) {
      rows.push({Section:"Listing",Field:"Title",Value:listing.title});
      rows.push({Section:"Listing",Field:"Subtitle",Value:listing.subtitle||""});
      rows.push({Section:"Listing",Field:"Description (text)",Value:stripHtml(listing.description_html||"")});
      if(listing.search_keywords) rows.push({Section:"Listing",Field:"Keywords",Value:listing.search_keywords.join(", ")});
      if(listing.item_specifics) Object.entries(listing.item_specifics).filter(([,v])=>v).forEach(([k,v])=>rows.push({Section:"Item Specifics",Field:k,Value:v}));
    }
    rows.push({Section:"",Field:"",Value:""});
    // eBay comp details
    (ebayComps?.comps||[]).forEach((c,i)=>rows.push({Section:`eBay Comp ${i+1}`,Field:c.title,Value:c.price||"N/A"}));
    // Dealer comp details
    (webComps?.comps||[]).forEach((c,i)=>rows.push({Section:`Dealer Comp ${i+1}`,Field:c.title,Value:c.price||"Quote"}));
    downloadCSV(rows, `Hardin_Full_Report_${eqLabel()}_${ts()}.csv`);
  };

  return (
    <div style={{fontFamily:"'Segoe UI',-apple-system,sans-serif",background:B.bg,color:B.text,minHeight:"100vh",maxWidth:920,margin:"0 auto"}}>
      <div style={{padding:"14px 20px",borderBottom:`2px solid ${B.green}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(135deg,${B.bg} 0%,${B.card} 100%)`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Logo size={42}/>
          <div>
            <div style={{fontSize:18,fontWeight:800,letterSpacing:0.5,lineHeight:1.1}}><span style={{color:B.green}}>HARDIN</span><span style={{color:B.text,fontWeight:400,fontSize:14,marginLeft:6}}>ELECTRICAL GROUP</span></div>
            <div style={{fontSize:11,color:B.muted,marginTop:1,letterSpacing:1.5,textTransform:"uppercase"}}>eBay Lister + Comp Pricing + SEO Generator</div>
          </div>
        </div>
        {sq&&<div style={{background:B.card,padding:"6px 12px",borderRadius:6,fontSize:12,color:B.muted,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",border:`1px solid ${B.border}`}}><span style={{color:B.accent}}>{sq}</span></div>}
      </div>

      <div style={{display:"flex",borderBottom:`1px solid ${B.border}`,background:B.card,flexWrap:"wrap"}}>
        <TabB active={tab==="entry"} onClick={()=>setTab("entry")}>Equipment</TabB>
        <TabB active={tab==="comps"} onClick={()=>setTab("comps")} badge={ebayComps?.comps?.length||0}>eBay Comps</TabB>
        <TabB active={tab==="web"} onClick={()=>setTab("web")} badge={webComps?.comps?.length||0}>Dealer Comps</TabB>
        <TabB active={tab==="listing"} onClick={()=>setTab("listing")}>{listing?"✓ ":""}Listing</TabB>
        <TabB active={tab==="pricing"} onClick={()=>setTab("pricing")}>Pricing</TabB>
      </div>

      <div style={{padding:20}}>
        {tab==="entry"&&(<div>
          <ScannerPanel onNameplate={handleNameplate} onBarcode={handleBarcode}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Equipment Type" value={form.equipment_type} onChange={v=>sf("equipment_type",v)} options={EQ_TYPES} style={{gridColumn:"1 / -1"}}/>
            <Sel label="Manufacturer" value={form.manufacturer} onChange={v=>sf("manufacturer",v)} options={MFRS}/>
            <Sel label="Grade" value={form.grade} onChange={v=>sf("grade",v)} options={GRADES.map(g=>({value:g.value,label:g.label}))}/>
            <Inp label="Model Number" value={form.model_number} onChange={v=>sf("model_number",v)}/>
            <Inp label="Catalog / Style #" value={form.catalog_number} onChange={v=>sf("catalog_number",v)}/>
            <Inp label="Serial Number" value={form.serial_number} onChange={v=>sf("serial_number",v)}/>
            <Inp label="Year Mfg" value={form.year_manufactured} onChange={v=>sf("year_manufactured",v)}/>
            <Inp label="Voltage (HV)" value={form.voltage_rating} onChange={v=>sf("voltage_rating",v)} placeholder="480, 13800"/>
            <Inp label="Voltage (LV)" value={form.voltage_secondary} onChange={v=>sf("voltage_secondary",v)} placeholder="208Y/120"/>
            <Inp label="Amperage" value={form.amperage_rating} onChange={v=>sf("amperage_rating",v)}/>
            <Inp label="KVA" value={form.kva_rating} onChange={v=>sf("kva_rating",v)}/>
            <Inp label="Phase" value={form.phase} onChange={v=>sf("phase",v)}/>
            <Inp label="Hz" value={form.frequency} onChange={v=>sf("frequency",v)}/>
            <Inp label="Weight (lbs)" value={form.weight_lbs} onChange={v=>sf("weight_lbs",v)}/>
            {form.equipment_type==="Circuit Breaker"&&<><Inp label="Frame (A)" value={form.frame_size} onChange={v=>sf("frame_size",v)}/><Inp label="Trip (A)" value={form.trip_rating} onChange={v=>sf("trip_rating",v)}/><Inp label="kAIC" value={form.interrupting_rating} onChange={v=>sf("interrupting_rating",v)}/><Sel label="Type" value={form.breaker_type} onChange={v=>sf("breaker_type",v)} options={["Molded Case","Insulated Case","Air","Vacuum"]}/></>}
            {form.equipment_type==="Transformer"&&<><Sel label="Winding" value={form.winding_material} onChange={v=>sf("winding_material",v)} options={["CU (Copper)","AL (Aluminum)","CU/AL (Mixed)"]}/><Sel label="Cooling" value={form.cooling_class} onChange={v=>sf("cooling_class",v)} options={["AA","AA/FA","OA","OA/FA"]}/><Sel label="Type" value={form.liquid_type} onChange={v=>sf("liquid_type",v)} options={["Dry Type","Oil Filled","Silicone"]}/></>}
            {(form.equipment_type==="Switchgear"||form.equipment_type==="Panelboard")&&<Inp label="Bus (A)" value={form.bus_rating} onChange={v=>sf("bus_rating",v)}/>}
            <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:0.8,display:"block",marginBottom:3}}>Condition Notes</label><textarea value={form.condition_notes} onChange={e=>sf("condition_notes",e.target.value)} placeholder="Missing parts, damage, test results..." rows={3} style={{width:"100%",padding:"8px 10px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:4,color:B.text,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}>
            <ActBtn onClick={()=>{fetchEbay();fetchWeb();setTab("comps");}} disabled={!hasEq||loading.ebay} color={B.green}>{loading.ebay?"Searching...":"Pull Comps"}</ActBtn>
            <ActBtn onClick={()=>{genListing();setTab("listing");}} disabled={!hasEq||loading.listing} color={B.purple}>{loading.listing?"Generating...":"Generate Listing"}</ActBtn>
            <ActBtn onClick={()=>{fetchEbay();fetchWeb();genListing();setTab("pricing");}} disabled={!hasEq} color={B.greenDark}>Full Analysis</ActBtn>
          </div>
        </div>)}

        {tab==="comps"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16}}>eBay Market Comps</h3><div style={{display:"flex",gap:6}}><DlBtn onClick={exportEbayCSV} disabled={!ebayComps?.comps?.length}>CSV</DlBtn><ActBtn onClick={fetchEbay} disabled={!hasEq||loading.ebay} color={B.green} small>{loading.ebay?"...":"Refresh"}</ActBtn></div></div>
          {errors.ebay&&<div style={{padding:12,background:"#2d1b1b",borderRadius:6,color:B.red,fontSize:12,marginBottom:12}}>{errors.ebay}</div>}
          {ebayComps?.stats&&<div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}><PriceTag label="Low" value={ebayComps.stats.low} color={B.red}/><PriceTag label="Median" value={ebayComps.stats.median} color={B.amber}/><PriceTag label="Avg" value={ebayComps.stats.avg} color={B.accent}/><PriceTag label="High" value={ebayComps.stats.high} color={B.blue}/><div style={{textAlign:"center",padding:"8px 12px",background:B.card,borderRadius:6,border:`1px solid ${B.border}`}}><div style={{fontSize:10,color:B.muted,textTransform:"uppercase"}}>Ct</div><div style={{fontSize:20,fontWeight:700,color:B.text}}>{ebayComps.stats.count}</div></div></div>}
          {ebayComps?.comps?.length>0?<div style={{background:B.card,borderRadius:8,padding:12,border:`1px solid ${B.border}`}}>{ebayComps.comps.map((c,i)=><CompRow key={i} comp={c} source="ebay"/>)}</div>:!loading.ebay?<div style={{padding:40,textAlign:"center",color:B.muted}}>Enter equipment and Pull Comps</div>:null}
          {loading.ebay&&<div style={{padding:40,textAlign:"center",color:B.green}}>Searching eBay...</div>}
        </div>)}

        {tab==="web"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16}}>Dealer Site Comps</h3><div style={{display:"flex",gap:6}}><DlBtn onClick={exportWebCSV} disabled={!webComps?.comps?.length}>CSV</DlBtn><ActBtn onClick={fetchWeb} disabled={!hasEq||loading.web} color={B.green} small>{loading.web?"...":"Refresh"}</ActBtn></div></div>
          {errors.web&&<div style={{padding:12,background:"#2d1b1b",borderRadius:6,color:B.red,fontSize:12,marginBottom:12}}>{errors.web}</div>}
          {webComps?.comps?.length>0?<div style={{background:B.card,borderRadius:8,padding:12,border:`1px solid ${B.border}`}}>{webComps.comps.map((c,i)=><CompRow key={i} comp={c} source="web"/>)}</div>:!loading.web?<div style={{padding:40,textAlign:"center",color:B.muted}}>{errors.web?"Add GOOGLE_CSE_API_KEY to Supabase":"Enter equipment and Pull Comps"}</div>:null}
          {loading.web&&<div style={{padding:40,textAlign:"center",color:B.green}}>Searching dealers...</div>}
          {hasEq&&<div style={{marginTop:20,padding:16,background:B.card,borderRadius:8,border:`1px solid ${B.border}`}}><div style={{fontSize:11,color:B.muted,marginBottom:8}}>Quick Search:</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[{l:"SurplusRecord",u:`https://surplusrecord.com/listings/?keyword=${encodeURIComponent(sq)}`},{l:"GovPlanet",u:`https://www.govplanet.com/search?q=${encodeURIComponent(sq)}`},{l:"Bay Power",u:`https://www.baypower.com/?s=${encodeURIComponent(sq)}`},{l:"eBay",u:`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(sq)}&LH_ItemCondition=3000|7000`}].map(s=><a key={s.l} href={s.u} target="_blank" rel="noopener noreferrer" style={{padding:"6px 12px",background:B.border,color:B.blue,borderRadius:4,fontSize:12,textDecoration:"none"}}>{s.l}</a>)}</div></div>}
        </div>)}

        {tab==="listing"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16}}>eBay Listing Generator</h3><ActBtn onClick={genListing} disabled={!hasEq||loading.listing} color={B.purple} small>{loading.listing?"...":"Regenerate"}</ActBtn></div>
          {errors.listing&&<div style={{padding:12,background:"#2d1b1b",borderRadius:6,color:B.red,fontSize:12,marginBottom:12}}>{errors.listing}</div>}
          {loading.listing&&<div style={{padding:40,textAlign:"center",color:B.purple}}>Generating listing...</div>}
          {listing&&(<div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:B.card,borderRadius:8,padding:16,border:`1px solid ${B.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:11,color:B.muted}}>TITLE ({listing.title?.length||0}/80)</span><CopyBtn text={listing.title} id="title" label="Copy Title"/></div>
              <div style={{fontSize:16,fontWeight:700,color:B.accent,lineHeight:1.3}}>{listing.title}</div>
              {listing.subtitle&&<div style={{fontSize:13,color:B.muted,marginTop:4}}>{listing.subtitle}</div>}
            </div>
            <div style={{background:B.card,borderRadius:8,padding:16,border:`1px solid ${B.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:11,color:B.muted}}>DESCRIPTION</span><div style={{display:"flex",gap:6}}><CopyBtn text={listing.description_html} id="dh" label="HTML"/><CopyBtn text={stripHtml(listing.description_html)} id="dt" label="Text"/></div></div>
              <div style={{background:"#fff",color:"#333",padding:16,borderRadius:6,fontSize:13,lineHeight:1.5,maxHeight:400,overflow:"auto"}} dangerouslySetInnerHTML={{__html:listing.description_html}}/>
            </div>
            {listing.item_specifics&&<div style={{background:B.card,borderRadius:8,padding:16,border:`1px solid ${B.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:11,color:B.muted}}>ITEM SPECIFICS</span><CopyBtn text={Object.entries(listing.item_specifics).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join("\n")} id="sp"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{Object.entries(listing.item_specifics).filter(([,v])=>v).map(([k,v])=><div key={k} style={{display:"flex",gap:8,fontSize:13}}><span style={{color:B.muted,minWidth:80}}>{k}:</span><span style={{color:B.text}}>{v}</span></div>)}</div>
            </div>}
            {listing.search_keywords?.length>0&&<div style={{background:B.card,borderRadius:8,padding:16,border:`1px solid ${B.border}`}}><div style={{fontSize:11,color:B.muted,marginBottom:8}}>SEO KEYWORDS</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{listing.search_keywords.map((kw,i)=><span key={i} style={{padding:"4px 10px",background:B.border,borderRadius:12,fontSize:12,color:B.muted}}>{kw}</span>)}</div></div>}
            {listing.suggested_price&&<div style={{background:B.card,borderRadius:8,padding:16,border:`1px solid ${B.border}`}}><div style={{fontSize:11,color:B.muted,marginBottom:8}}>AI PRICE (Grade {form.grade})</div><div style={{display:"flex",gap:10}}><PriceTag label="Low" value={listing.suggested_price.low} color={B.red}/><PriceTag label="Target" value={listing.suggested_price.mid} color={B.accent}/><PriceTag label="High" value={listing.suggested_price.high} color={B.blue}/></div>{listing.suggested_price.reasoning&&<div style={{marginTop:8,fontSize:12,color:B.muted,fontStyle:"italic"}}>{listing.suggested_price.reasoning}</div>}</div>}
          </div>)}
          {!listing&&!loading.listing&&<div style={{padding:40,textAlign:"center",color:B.muted}}>Enter equipment and Generate Listing</div>}
        </div>)}

        {tab==="pricing"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16}}>Price Analysis: Grade {form.grade}</h3><DlBtn onClick={exportFullReport} disabled={!ebayComps?.stats&&!listing}>Full Report CSV</DlBtn></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>
            {[{t:"eBay",c:B.green,d:ebayComps?.stats,lk:"ebay",f:["low","median","high"],x:ebayComps?.stats?.count?`${ebayComps.stats.count} listings`:null},{t:"Dealers",c:B.purple,d:webComps?.stats,lk:"web",f:["low","median","high"],x:webComps?.stats?.count?`${webComps.stats.count} priced`:null},{t:"AI",c:B.accent,d:listing?.suggested_price,lk:"listing",f:["low","mid","high"]}].map(col=><div key={col.t} style={{background:B.card,borderRadius:8,padding:16,border:`1px solid ${B.border}`}}>
              <div style={{fontSize:12,color:col.c,fontWeight:600,marginBottom:12}}>{col.t}</div>
              {col.d?<>{col.f.map(f=><div key={f} style={{marginBottom:8}}><PriceTag label={f==="mid"?"Target":f} value={col.d[f]} color={f==="low"?B.red:f==="high"?B.blue:B.amber}/></div>)}{col.x&&<div style={{fontSize:11,color:B.muted,textAlign:"center"}}>{col.x}</div>}</>:<div style={{color:B.muted,fontSize:12,textAlign:"center",padding:20}}>{loading[col.lk]?"Loading...":"No data"}</div>}
            </div>)}
          </div>
          {(ebayComps?.stats||listing?.suggested_price)&&<div style={{background:`linear-gradient(135deg,${B.card} 0%,${B.cardAlt} 100%)`,borderRadius:8,padding:20,border:`1px solid ${B.green}44`}}>
            <div style={{fontSize:14,fontWeight:700,color:B.green,marginBottom:8}}>Recommended (Grade {form.grade})</div>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontSize:36,fontWeight:800,color:B.accent,fontFamily:"'JetBrains Mono',monospace"}}>${(()=>{const ps=[ebayComps?.stats?.median,listing?.suggested_price?.mid,webComps?.stats?.median].filter(Boolean);if(!ps.length)return"---";const a=ps.reduce((a,b)=>a+b,0)/ps.length;const m={A:1.0,B:0.75,C:0.45,D:0.15}[form.grade]||0.75;return Math.round(a*m).toLocaleString();})()}</div>
              <div style={{fontSize:12,color:B.muted}}>Weighted average adjusted for Grade {form.grade}.</div>
            </div>
          </div>}
        </div>)}
      </div>
      <div style={{padding:"12px 20px",borderTop:`1px solid ${B.border}`,textAlign:"center",fontSize:11,color:B.muted}}>Hardin Electrical Group · Dallas, TX · Powered by WES Platform</div>
    </div>
  );
}
