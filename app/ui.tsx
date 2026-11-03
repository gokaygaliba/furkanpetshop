"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Product = { id:string; barcode:string; name:string; category:string; costPrice:string|number; salePrice:string|number; minStock:number; stocks:{quantity:number;location:{name:string}}[] };
type Forecast = { productId:string; barcode:string; product:string; category:string; locationId:string; location:string; onHand:number; soldInPeriod:number; avgDaily:number; daysCover:number|null; leadTimeDays:number; safetyStock:number; reorderPoint:number; targetStock:number; suggestedOrder:number; status:string; estimatedPurchaseCost:number };
const money = (n:number) => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(n);
async function api(url:string, options?:RequestInit) { const r=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options?.headers||{})}}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"İşlem başarısız"); return d; }

export default function Dashboard() {
  const [products,setProducts]=useState<Product[]>([]);
  const [forecast,setForecast]=useState<Forecast[]>([]);
  const [stats,setStats]=useState<any>({});
  const [locations,setLocations]=useState<any[]>([]);
  const [selectedLocation,setSelectedLocation]=useState("");
  const [barcode,setBarcode]=useState("");
  const [notice,setNotice]=useState("");
  const [tab,setTab]=useState("overview");
  const [period,setPeriod]=useState(30);
  const [newProduct,setNewProduct]=useState(false);
  const [form,setForm]=useState({barcode:"",name:"",category:"Genel",costPrice:"",salePrice:"",minStock:"5",targetStockDays:"21",leadTimeDays:"3"});
  const scanRef=useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [p,f,s]=await Promise.all([api("/api/products"),api(`/api/forecast?days=${period}`),api("/api/dashboard")]);
      setProducts(p); setForecast(f.rows); setStats(s);
      const locs=Array.from(new Set(p.flatMap((x:Product)=>x.stocks.map(y=>y.location.name))));
      setLocations(locs.map(name=>({name})));
      if(!selectedLocation && locs.length) setSelectedLocation(locs[0]);
    } catch(e:any) { setNotice(e.message); }
  }
  useEffect(()=>{load();},[period]);
  const critical=forecast.filter(x=>x.status!=="OK");
  const totalSuggested=critical.reduce((n,x)=>n+x.suggestedOrder,0);
  const totalCost=critical.reduce((n,x)=>n+x.estimatedPurchaseCost,0);
  const scanned=products.find(p=>p.barcode===barcode.trim());
  async function addProduct(e:React.FormEvent) {
    e.preventDefault();
    try { await api("/api/products",{method:"POST",body:JSON.stringify(form)}); setNotice("Ürün eklendi."); setNewProduct(false); setForm({barcode:"",name:"",category:"Genel",costPrice:"",salePrice:"",minStock:"5",targetStockDays:"21",leadTimeDays:"3"}); await load(); }
    catch(e:any){setNotice(e.message);}
  }
  async function logout(){await api("/api/auth/logout",{method:"POST"});location.href="/login";}
  const nav=[["overview","Genel Bakış"],["forecast","Akıllı Stok Asistanı"],["products","Ürün & Barkod"]];
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">FP</div><div><b>FURKAN PETSHOP</b><small>COMMAND CENTER</small></div></div>
      <div className="sideLabel">OPERASYON</div>
      {nav.map(([id,label])=><button key={id} className={`nav ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>)}
      <div className="sideBottom"><div className="secure"><span/> Özel yönetim alanı</div><button className="logout" onClick={logout}>Oturumu kapat ↗</button></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><div className="eyebrow">FURKAN PETSHOP / OPERASYON MERKEZİ</div><h1>{nav.find(x=>x[0]===tab)?.[1]}</h1></div><div className="topRight"><span className="live"><i/> SİSTEM AKTİF</span><div className="avatar">FY</div></div></header>
      {notice&&<div className="notice" onClick={()=>setNotice("")}>{notice} <b>×</b></div>}
      {tab==="overview"&&<><div className="hero"><div><div className="eyebrow">BUGÜNÜN OPERASYONEL GÖRÜNÜMÜ</div><h2>Stoklarını kontrol altında tut.</h2><p>Satış, stok ve satın alma kararlarını tek merkezden yönet.</p></div><div className="heroOrb"><div className="orbCore">FP</div></div></div>
        <div className="stats">
          <Stat label="Aktif ürün" value={stats.products??"—"} sub="Ürün kataloğu"/>
          <Stat label="Toplam stok" value={stats.stockUnits??"—"} sub="Tüm lokasyonlar"/>
          <Stat label="Kritik stok satırı" value={stats.lowStock??"—"} sub="Minimum stok altı"/>
          <Stat label="30 günlük ciro" value={money(stats.revenue30d||0)} sub={`${stats.salesUnits30d||0} adet satış`}/>
        </div>
        <div className="sectionHead"><div><div className="eyebrow">ÖNCELİKLİ AKSİYONLAR</div><h3>Stok asistanı özeti</h3></div><button className="textButton" onClick={()=>setTab("forecast")}>Tüm önerileri gör →</button></div>
        <div className="panel"><div className="panelTop"><div><b>Satın alma önerileri</b><small>Satış hızına ve tedarik süresine göre</small></div><span className="pill warn">{critical.length} aksiyon</span></div>
          {critical.slice(0,5).map(x=><div className="listRow" key={x.productId+x.locationId}><div className="productDot">P</div><div className="grow"><b>{x.product}</b><small>{x.location} · {x.barcode}</small></div><div className="rightMetric"><b>{x.onHand} adet</b><small>Öneri: {x.suggestedOrder} adet</small></div><Status status={x.status}/></div>)}
          {!critical.length&&<div className="empty">Şu an kritik stok önerisi bulunmuyor.</div>}
        </div>
      </>}
      {tab==="forecast"&&<><div className="intro"><div><div className="eyebrow">TALEP TAHMİNİ & TEDARİK PLANLAMA</div><h2>Akıllı Stok Asistanı</h2><p>Son satış hızını, eldeki stoğu, güvenlik stoğunu ve tedarik süresini birlikte değerlendirir.</p></div><select value={period} onChange={e=>setPeriod(Number(e.target.value))}><option value={7}>Son 7 gün</option><option value={14}>Son 14 gün</option><option value={30}>Son 30 gün</option><option value={60}>Son 60 gün</option><option value={90}>Son 90 gün</option></select></div>
        <div className="stats three"><Stat label="Sipariş önerilen satır" value={critical.length} sub="Ürün × lokasyon"/><Stat label="Önerilen toplam adet" value={totalSuggested} sub="Tüm kritik kalemler"/><Stat label="Tahmini satın alma maliyeti" value={money(totalCost)} sub="Ürün alış maliyeti üzerinden"/></div>
        <div className="formula"><b>Hesaplama mantığı</b><span>Günlük ortalama satış = dönem satış adedi ÷ gün sayısı</span><span>Yeniden sipariş noktası = (günlük satış × tedarik süresi) + güvenlik stoğu</span><span>Sipariş önerisi = hedef stok − mevcut stok</span></div>
        <div className="panel"><div className="panelTop"><div><b>Ürün bazlı satın alma önerileri</b><small>Öncelik sırasına göre listelenir</small></div><button className="outline" onClick={()=>downloadCSV(forecast)}>CSV dışa aktar ↓</button></div>
          <div className="tableWrap"><table><thead><tr><th>ÜRÜN / LOKASYON</th><th>STOK</th><th>GÜNLÜK SATIŞ</th><th>STOK GÜNÜ</th><th>SİPARİŞ NOKTASI</th><th>ÖNERİ</th><th>DURUM</th></tr></thead><tbody>
          {forecast.map(x=><tr key={x.productId+x.locationId}><td><b>{x.product}</b><small>{x.location} · {x.barcode}</small></td><td>{x.onHand}</td><td>{x.avgDaily.toFixed(2)}</td><td>{x.daysCover===null?"Veri yok":`${x.daysCover} gün`}</td><td>{x.reorderPoint}</td><td><b className={x.suggestedOrder>0?"accent":""}>{x.suggestedOrder} adet</b><small>{money(x.estimatedPurchaseCost)}</small></td><td><Status status={x.status}/></td></tr>)}
          </tbody></table></div>
          <p className="footnote">Not: Satış geçmişi olmayan ürünlerde talep tahmini üretilemez. Bu ürünler için minimum stok ve manuel hedef değerler kullanılır. Öneriler otomatik sipariş oluşturmaz; onay gerektirir.</p>
        </div>
      </>}
      {tab==="products"&&<><div className="intro"><div><div className="eyebrow">ÜRÜN KATALOĞU</div><h2>Barkod ve ürün yönetimi</h2><p>Barkod okuyucuyu USB ile bağlayın; okuyucu klavye gibi çalışır. Barkod alanına tıklayıp okutun.</p></div><button className="primary" onClick={()=>setNewProduct(!newProduct)}>＋ Ürün ekle</button></div>
        {newProduct&&<form className="panel formGrid" onSubmit={addProduct}><label>Barkod<input required value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/></label><label>Ürün adı<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Kategori<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Alış fiyatı<input type="number" step="0.01" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})}/></label><label>Satış fiyatı<input type="number" step="0.01" value={form.salePrice} onChange={e=>setForm({...form,salePrice:e.target.value})}/></label><label>Minimum stok<input type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})}/></label><label>Tedarik süresi (gün)<input type="number" value={form.leadTimeDays} onChange={e=>setForm({...form,leadTimeDays:e.target.value})}/></label><label>Hedef stok günü<input type="number" value={form.targetStockDays} onChange={e=>setForm({...form,targetStockDays:e.target.value})}/></label><button className="primary">Kaydet</button></form>}
        <div className="panel"><div className="panelTop"><div><b>Barkod ile hızlı ürün bul</b><small>El tipi barkod okuyucu veya klavye ile okut</small></div></div><div className="scan"><span>⌕</span><input ref={scanRef} autoFocus value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="Barkodu okut veya yaz..." onKeyDown={e=>{if(e.key==="Enter"&&scanned)setNotice(`${scanned.name} · Satış ${money(Number(scanned.salePrice))}`)}}/><button className="outline" onClick={()=>{setBarcode("");scanRef.current?.focus()}}>Temizle</button></div>
          {scanned&&<div className="scanResult"><div><b>{scanned.name}</b><small>{scanned.category} · {scanned.barcode}</small></div><strong>{money(Number(scanned.salePrice))}</strong><span>{scanned.stocks.map(s=>`${s.location.name}: ${s.quantity}`).join(" · ")}</span></div>}
        </div>
        <div className="panel"><div className="panelTop"><div><b>Ürün listesi</b><small>{products.length} aktif ürün</small></div></div><div className="tableWrap"><table><thead><tr><th>ÜRÜN</th><th>BARKOD</th><th>ALIŞ</th><th>SATIŞ</th><th>LOKASYON STOKLARI</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.category}</small></td><td>{p.barcode}</td><td>{money(Number(p.costPrice))}</td><td>{money(Number(p.salePrice))}</td><td>{p.stocks.map(s=>`${s.location.name}: ${s.quantity}`).join(" · ")}</td></tr>)}</tbody></table></div></div>
      </>}
    </section>
  </main>;
}
function Stat({label,value,sub}:{label:string,value:any,sub:string}){return <div className="stat"><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>}
function Status({status}:{status:string}){const map:any={OUT:["Tükendi","bad"],ORDER:["Sipariş ver","warn"],LOW:["Düşük","warn"],OK:["Normal","good"]};const [label,cls]=map[status]||map.OK;return <span className={`status ${cls}`}>{label}</span>}
function downloadCSV(rows:Forecast[]){const header=["Ürün","Barkod","Lokasyon","Mevcut stok","Dönem satışı","Günlük ortalama","Stok günü","Sipariş noktası","Önerilen adet","Tahmini alış maliyeti","Durum"];const body=rows.map(x=>[x.product,x.barcode,x.location,x.onHand,x.soldInPeriod,x.avgDaily,x.daysCover??"",x.reorderPoint,x.suggestedOrder,x.estimatedPurchaseCost,x.status]);const csv=[header,...body].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="furkan-petshop-stok-onerileri.csv";a.click();URL.revokeObjectURL(a.href);}

export function Login(){const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});location.href="/";}catch(e:any){setError(e.message);}finally{setBusy(false);}}return <main className="loginPage"><div className="loginGlow"/><form className="loginCard" onSubmit={submit}><div className="brandMark large">FP</div><div className="eyebrow">PRIVATE BUSINESS SYSTEM</div><h1>Furkan Petshop</h1><p>Command Center'a güvenli giriş yapın.</p><label>E-posta<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@..." /></label><label>Parola<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••" /></label>{error&&<div className="error">{error}</div>}<button className="primary full" disabled={busy}>{busy?"Giriş yapılıyor...":"Güvenli giriş →"}</button><small className="muted">Bu alan yalnızca yetkili kullanıcı içindir.</small></form></main>}
