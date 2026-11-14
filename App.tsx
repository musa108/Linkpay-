import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Bell, Check, ChevronDown, CircleHelp, Copy, CreditCard, ExternalLink, FilePlus2, Files, Home, Link2, Menu, MoreHorizontal, Search, Settings, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import { WalletButton, usePollar } from '@pollar/react';
import { getInvoice, readInvoices, updateInvoice, upsertInvoice } from './storage';
import type { Invoice } from './types';

const money = (value: string | number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
const short = (value?: string) => value ? `${value.slice(0, 6)}…${value.slice(-5)}` : 'Not connected';
const pollarEnabled = Boolean(import.meta.env.VITE_POLLAR_API_KEY);

function App() {
  const location = useLocation();
  const isCheckout = location.pathname.startsWith('/pay/');
  return isCheckout ? <Routes><Route path="/pay/:id" element={<Checkout />} /><Route path="*" element={<Checkout />} /></Routes> : <Dashboard />;
}

function Dashboard() {
  const [items, setItems] = useState<Invoice[]>(readInvoices());
  const [showCreate, setShowCreate] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const { isAuthenticated, wallet } = usePollarSafe();
  useEffect(() => { const sync = () => setItems(readInvoices()); window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  const filtered = useMemo(() => items.filter((x) => `${x.title} ${x.customerName} ${x.id}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const paid = items.filter((x) => x.status === 'PAID');
  const pending = items.filter((x) => x.status === 'PENDING');
  const total = paid.reduce((sum, x) => sum + Number(x.amount), 0);
  const nav = <><div className="brand"><div className="brand-mark"><Link2 size={19}/></div><span>pay<span className="brand-light">link</span></span></div><div className="nav-label">WORKSPACE</div><Link className="nav-item active" to="/"><Home size={18}/> Overview</Link><a className="nav-item" href="#invoices"><Files size={18}/> Invoices <span className="nav-count">{items.length}</span></a><a className="nav-item" href="#transactions"><CreditCard size={18}/> Transactions</a><div className="nav-spacer"/><div className="nav-label">PREFERENCES</div><a className="nav-item" href="#settings"><Settings size={18}/> Settings</a><a className="nav-item" href="#help"><CircleHelp size={18}/> Help centre</a><div className="sidebar-bottom"><div className="secure-icon"><ShieldCheck size={17}/></div><div><strong>Payments protected</strong><small>Powered by Pollar</small></div></div></>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>{nav}</aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19}/></button><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="network-pill"><i/> Stellar Testnet</span><button className="icon-btn"><Bell size={18}/></button>{isAuthenticated && wallet?.address ? <span className="wallet-address"><span className="wallet-dot"/>{short(wallet.address)}</span> : null}<div className="wallet-cta">{pollarEnabled ? <WalletButton /> : <span className="muted-small">Pollar key required</span>}</div></div></header>
      <div className="content-wrap">
        <div className="welcome-row"><div><div className="eyebrow">SATURDAY, NOVEMBER 14</div><h1>Your business, <em>in motion.</em></h1><p className="subhead">A clear view of what you've earned and what's still on its way.</p></div><button className="primary-btn" onClick={() => setShowCreate(true)}><FilePlus2 size={17}/> Create payment link</button></div>
        <section className="stat-grid"><StatCard label="Total received" value={money(total)} hint={`${paid.length} completed payments`} icon={<ArrowDownLeft size={18}/>} tone="green"/><StatCard label="Awaiting payment" value={money(pending.reduce((s, x) => s + Number(x.amount), 0))} hint={`${pending.length} open invoices`} icon={<ArrowUpRight size={18}/>} tone="amber"/><StatCard label="Payment links" value={String(items.length).padStart(2, '0')} hint="All invoices created" icon={<Link2 size={18}/>} tone="blue"/><StatCard label="Success rate" value={items.length ? `${Math.round(paid.length / items.length * 100)}%` : '—'} hint="Based on your invoices" icon={<BadgeCheck size={18}/>} tone="violet"/></section>
        <section className="panel invoice-panel" id="invoices"><div className="panel-heading"><div><div className="section-kicker">YOUR ACTIVITY</div><h2>Recent payment links</h2><p>Keep every request in one place.</p></div><button className="text-btn" onClick={() => setShowCreate(true)}>New invoice <span>＋</span></button></div><div className="table-tools"><div className="search-box"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoices or customers"/></div><span className="muted-small">{filtered.length} records</span></div>
          {filtered.length ? <div className="table-scroll"><table><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>AMOUNT</th><th>DATE</th><th>STATUS</th><th/></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="invoice-id"><span className="invoice-icon"><Files size={15}/></span><div><strong>{item.title}</strong><small>#{item.id.slice(-7).toUpperCase()}</small></div></div></td><td>{item.customerName}</td><td className="amount-cell">{money(item.amount)} <small>USDC</small></td><td>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td><td><Status status={item.status}/></td><td><button className="row-more" onClick={() => {navigator.clipboard?.writeText(`${location.origin}/pay/${item.id}`);}} title="Copy payment link"><Copy size={16}/></button></td></tr>)}</tbody></table></div> : <EmptyState onCreate={() => setShowCreate(true)}/>}
        </section>
        <section className="bottom-grid"><div className="panel activity-panel" id="transactions"><div className="panel-heading compact"><div><div className="section-kicker">PAYMENT FLOW</div><h2>Made for getting paid</h2></div><span className="live-tag"><i/> LIVE DEMO</span></div><div className="flow-list"><FlowStep number="01" title="Create a payment link" desc="Set the amount and tell your customer what it's for."/><FlowStep number="02" title="Share it anywhere" desc="Send one simple link by chat, email or QR code."/><FlowStep number="03" title="Receive USDC" desc="Your customer pays with their Pollar-connected wallet."/></div></div><div className="panel network-card"><div className="network-orbit"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-core"><Sparkles size={23}/></div></div><div className="network-copy"><span className="section-kicker">BUILT ON POLLAR</span><h3>Payments without the friction.</h3><p>Wallet connection and stablecoin transfers, brought into one simple checkout.</p><a href="https://pollar.xyz" target="_blank" rel="noreferrer">Explore Pollar <ExternalLink size={13}/></a></div></div></section>
        <footer className="footer"><span>© 2026 PayLink</span><span>Simple payments. Clear records.</span><span className="footer-secure"><ShieldCheck size={13}/> Pollar-powered</span></footer>
      </div>
    </main>
    {showCreate && <CreateInvoice onClose={() => setShowCreate(false)} onCreate={(invoice) => {setItems(upsertInvoice(invoice)); setShowCreate(false);}} walletAddress={wallet?.address || ''} />}
  </div>;
}

function usePollarSafe(): {isAuthenticated: boolean; wallet?: {address?: string} | null; getClient?: () => any} {
  try { return usePollar() as any; } catch { return { isAuthenticated: false, wallet: null }; }
}

function StatCard({label, value, hint, icon, tone}: {label:string;value:string;hint:string;icon:React.ReactNode;tone:string}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div><div className={`stat-line ${tone}`}/></div>; }
function Status({status}: {status: Invoice['status']}) { return <span className={`status ${status.toLowerCase()}`}><i/>{status === 'PAID' ? 'Paid' : status === 'FAILED' ? 'Failed' : 'Pending'}</span>; }
function FlowStep({number,title,desc}: {number:string;title:string;desc:string}) {return <div className="flow-step"><span>{number}</span><div><strong>{title}</strong><p>{desc}</p></div><Check size={16}/></div>;}
function EmptyState({onCreate}: {onCreate:()=>void}) {return <div className="empty-state"><div className="empty-icon"><Link2 size={22}/></div><h3>Your next payment starts here.</h3><p>Create a payment link and send it to your first customer.</p><button className="primary-btn small" onClick={onCreate}>Create your first link</button></div>;}

function CreateInvoice({onClose,onCreate,walletAddress}: {onClose:()=>void;onCreate:(invoice:Invoice)=>void;walletAddress:string}) {
  const [title,setTitle] = useState('Website design'); const [customer,setCustomer] = useState(''); const [amount,setAmount] = useState('10'); const [recipient,setRecipient] = useState(walletAddress); const [error,setError] = useState('');
  function submit(e:React.FormEvent) { e.preventDefault(); if (!title.trim() || !customer.trim() || !/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) {setError('Add a description, customer and a valid amount.'); return;} if (!recipient.trim().startsWith('G') || recipient.trim().length !== 56) {setError('Enter a valid Stellar G-address. Connect a Pollar wallet or paste the receiving address.'); return;} const invoice:Invoice={id:crypto.randomUUID(),title:title.trim(),customerName:customer.trim(),amount,currency:'USDC',recipientAddress:recipient.trim(),status:'PENDING',createdAt:new Date().toISOString()}; onCreate(invoice); }
  return <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}><form className="modal" onSubmit={submit}><div className="modal-top"><div><span className="section-kicker">NEW REQUEST</span><h2>Create payment link</h2><p>One invoice, one link, less chasing.</p></div><button type="button" className="icon-btn" onClick={onClose}><X size={19}/></button></div><label>What is this payment for?<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Brand identity design"/></label><label>Customer name<input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="e.g. Ada Okafor"/></label><div className="amount-field"><label>Amount</label><div><span>$</span><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/><b>USDC</b></div></div><label>Receiving Stellar address<input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="G…"/></label>{error && <div className="form-error">{error}</div>}<div className="modal-note"><ShieldCheck size={16}/> Payments are sent directly to this wallet address.</div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">Create payment link <ArrowUpRight size={16}/></button></div></form></div>;
}

function Checkout() {
  const {id=''}=useParams(); const navigate=useNavigate(); const [invoice,setInvoice]=useState<Invoice|undefined>(()=>getInvoice(id)); const [paying,setPaying]=useState(false); const [message,setMessage]=useState(''); const [txHash,setTxHash]=useState(''); const {isAuthenticated,wallet,getClient}=usePollarSafe();
  const issuer = import.meta.env.VITE_STELLAR_USDC_ISSUER as string | undefined;
  async function pay() {
    if (!invoice || !getClient || !isAuthenticated) {setMessage('Connect your Pollar wallet to continue.');return;}
    if (!issuer) {setMessage('USDC issuer is not configured yet. Set VITE_STELLAR_USDC_ISSUER to the exact Testnet USDC issuer enabled for this Pollar app.');return;}
    if (!wallet?.address) {setMessage('Your connected Pollar wallet address is not available.');return;}
    if (wallet.address === invoice.recipientAddress) {setMessage('This wallet is the invoice recipient. Connect the customer wallet to pay.');return;}
    setPaying(true);setMessage('Approve the transfer in your Pollar wallet…');
    try {
      const client=getClient();
      const result=await client.sendPayment({destination:invoice.recipientAddress,amount:invoice.amount,asset:{type:'credit_alphanum4',code:'USDC',issuer}});
      const raw=result as any; const hash=raw?.hash ?? raw?.transactionHash ?? raw?.txHash;
      if (!hash) { if (String(raw?.status).toLowerCase()==='error') throw new Error(raw?.details || 'Pollar could not submit this payment.'); throw new Error('Pollar did not return a transaction hash. No payment has been marked as paid.'); }
      setTxHash(hash);setMessage('Payment submitted. Checking Stellar confirmation…');
      let finalStatus='PENDING';
      for(let attempt=0;attempt<8;attempt++){ const status=await client.getTxStatus(hash); finalStatus=String((status as any)?.status || 'PENDING').toUpperCase(); if(finalStatus==='SUCCESS'||finalStatus==='FAILED')break; await new Promise(r=>setTimeout(r,1800)); }
      if(finalStatus==='SUCCESS'){const updated=updateInvoice(invoice.id,{status:'PAID',transactionHash:hash});setInvoice(updated.find(x=>x.id===invoice.id));setMessage('Payment confirmed on Stellar.');}
      else if(finalStatus==='FAILED'){const updated=updateInvoice(invoice.id,{status:'FAILED',transactionHash:hash});setInvoice(updated.find(x=>x.id===invoice.id));setMessage('The network reported that this transaction failed.');}
      else setMessage('Transaction submitted and still pending. Check the transaction before treating this invoice as paid.');
    } catch(error){setMessage(error instanceof Error?error.message:'Payment failed. Please try again.');}
    finally{setPaying(false);}
  }
  if(!invoice) return <div className="checkout-shell"><div className="checkout-card not-found"><div className="brand"><div className="brand-mark"><Link2 size={19}/></div><span>pay<span className="brand-light">link</span></span></div><h1>We couldn't find this invoice.</h1><p>This link may be invalid or the invoice isn't stored in this browser yet.</p><button className="primary-btn" onClick={()=>navigate('/')}>Go to dashboard</button></div></div>;
  return <div className="checkout-shell"><div className="checkout-top"><Link to="/" className="brand"><div className="brand-mark"><Link2 size={19}/></div><span>pay<span className="brand-light">link</span></span></Link><span className="checkout-secure"><ShieldCheck size={14}/> SECURE CHECKOUT</span></div><div className="checkout-layout"><div className="checkout-intro"><span className="eyebrow">A BETTER WAY TO SETTLE UP</span><h1>Good work.<br/><em>Easy payment.</em></h1><p>You're one step away from completing this payment. Review the details and pay securely with your Pollar wallet.</p><div className="checkout-perks"><span><Check size={15}/> Stablecoin settlement</span><span><Check size={15}/> On-chain confirmation</span><span><Check size={15}/> Direct to the recipient</span></div></div><div className="checkout-card"><div className="checkout-card-top"><div><span className="section-kicker">PAYMENT REQUEST</span><h2>{invoice.title}</h2><p>From {invoice.customerName}</p></div><span className="invoice-badge">#{invoice.id.slice(-6).toUpperCase()}</span></div><div className="checkout-amount"><span>AMOUNT DUE</span><strong>{money(invoice.amount)} <small>USDC</small></strong><span className="network-note"><i/> Stellar Testnet</span></div><div className="recipient-row"><span>Paying to</span><strong>{short(invoice.recipientAddress)}</strong></div>{invoice.status==='PAID'?<div className="success-box"><BadgeCheck size={19}/><div><strong>Payment confirmed</strong><p>This invoice has been marked paid.</p>{invoice.transactionHash&&<a href={`https://stellar.expert/explorer/testnet/tx/${invoice.transactionHash}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={12}/></a>}</div></div>:<><div className="wallet-connect"><div className="wallet-connect-icon"><Wallet size={19}/></div><div><strong>{isAuthenticated?'Wallet connected':'Connect your wallet'}</strong><small>{isAuthenticated?short(wallet?.address):'Use Pollar to securely connect'}</small></div>{pollarEnabled ? <WalletButton /> : <small>Configure Pollar key</small>}</div><button className="pay-button" onClick={pay} disabled={paying||!isAuthenticated||invoice.status==='FAILED'}>{paying?'Processing payment…':<>Pay {money(invoice.amount)} <ArrowUpRight size={17}/></>}</button>{message&&<div className={`payment-message ${message.includes('confirmed')?'good':''}`}>{message}</div>}{txHash&&<a className="tx-link" href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction on Stellar Explorer <ExternalLink size={13}/></a>}</>}<div className="checkout-foot"><ShieldCheck size={14}/> Your payment is processed through Pollar. PayLink never sees your private keys.</div></div></div><div className="checkout-bottom">© 2026 PayLink <span>Powered by Pollar</span></div></div>;
}
