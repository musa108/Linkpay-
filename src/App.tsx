import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Check, Copy, CreditCard, ExternalLink, FilePlus2, Files, Home, Link2, Menu, Search, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import { WalletButton, usePollar } from '@pollar/react';
import type { PollarClient, SubmitOutcome } from '@pollar/core';
import { getInvoice, readInvoices, updateInvoice, upsertInvoice } from './storage';
import { isValidStellarAccount } from './validation';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | Invoice['status']>('ALL');
  const { isAuthenticated, wallet } = usePollarSafe();
  useEffect(() => { const sync = () => setItems(readInvoices()); window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  const filtered = useMemo(() => items.filter((x) => (statusFilter === 'ALL' || x.status === statusFilter) && `${x.title} ${x.customerName} ${x.id} ${x.transactionHash || ''}`.toLowerCase().includes(query.toLowerCase())), [items, query, statusFilter]);
  const paid = items.filter((x) => x.status === 'PAID');
  const pending = items.filter((x) => x.status === 'PENDING');
  const total = paid.reduce((sum, x) => sum + Number(x.amount), 0);
  const nav = <><div className="brand"><img className="brand-logo" src="/paylink-lockup.png" alt="PayLink — Pay. Share. Get Paid." /></div><div className="nav-label">WORKSPACE</div><Link className="nav-item active" to="/"><Home size={18}/> Overview</Link><a className="nav-item" href="#invoices"><Files size={18}/> Invoices <span className="nav-count">{items.length}</span></a><a className="nav-item" href="#invoices"><CreditCard size={18}/> Transactions</a><div className="nav-spacer"/><div className="sidebar-bottom"><div className="secure-icon"><ShieldCheck size={17}/></div><div><strong>Payments protected</strong><small>Powered by Pollar</small></div></div></>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>{nav}</aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19}/></button><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="network-pill"><i/> Stellar Testnet</span>{isAuthenticated && wallet?.address ? <span className="wallet-address"><span className="wallet-dot"/>{short(wallet.address)}</span> : null}<div className="wallet-cta">{pollarEnabled ? <WalletButton /> : <span className="muted-small">Pollar key required</span>}</div></div></header>
      <div className="content-wrap">
        <div className="welcome-row"><div><div className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</div><h1>Your business, <em>in motion.</em></h1><p className="subhead">A clear view of what you've earned and what's still on its way.</p></div><button className="primary-btn" onClick={() => setShowCreate(true)}><FilePlus2 size={17}/> Create payment link</button></div>
        <section className="stat-grid"><StatCard label="Total received" value={money(total)} hint={`${paid.length} completed payments`} icon={<ArrowDownLeft size={18}/>} tone="green"/><StatCard label="Awaiting payment" value={money(pending.reduce((s, x) => s + Number(x.amount), 0))} hint={`${pending.length} open invoices`} icon={<ArrowUpRight size={18}/>} tone="amber"/><StatCard label="Payment links" value={String(items.length).padStart(2, '0')} hint="All invoices created" icon={<Link2 size={18}/>} tone="blue"/><StatCard label="Failed payments" value={String(items.filter((x) => x.status === 'FAILED').length)} hint="Review and share a fresh link" icon={<BadgeCheck size={18}/>} tone="violet"/></section>
        <section className="panel invoice-panel" id="invoices"><div className="panel-heading"><div><div className="section-kicker">YOUR ACTIVITY</div><h2>Recent payments & links</h2><p>Requests, payment status, and references in one place.</p></div><button className="text-btn" onClick={() => setShowCreate(true)}>New invoice <span>＋</span></button></div><div className="table-tools"><div className="search-box"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search links, customers, or references"/></div><label className="status-filter">Status <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as typeof statusFilter)}><option value="ALL">All</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option></select></label><span className="muted-small">{filtered.length} records</span></div>
          {filtered.length ? <div className="table-scroll"><table><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>AMOUNT</th><th>DATE</th><th>STATUS</th><th/></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="invoice-id"><span className="invoice-icon"><Files size={15}/></span><div><Link className="invoice-title-link" to={`/pay/${item.id}`}>{item.title}</Link><small>#{item.id.slice(-7).toUpperCase()}</small></div></div></td><td>{item.customerName}</td><td className="amount-cell">{money(item.amount)} <small>USDC</small></td><td>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td><td><Status status={item.status}/><small className="transaction-ref">{item.transactionHash ? short(item.transactionHash) : "No transaction yet"}</small></td><td><button className="row-more" onClick={() => {navigator.clipboard?.writeText(`${location.origin}/pay/${item.id}`).then(() => window.alert("Payment link copied"), () => window.alert("Copy is unavailable in this browser"));}} aria-label="Copy payment link" title="Copy payment link"><Copy size={16}/></button></td></tr>)}</tbody></table></div> : <EmptyState onCreate={() => setShowCreate(true)}/>}
        </section>
        <section className="bottom-grid"><div className="panel activity-panel" id="transactions"><div className="panel-heading compact"><div><div className="section-kicker">PAYMENT FLOW</div><h2>Made for getting paid</h2></div><span className="live-tag"><i/> POLLAR FLOW</span></div><div className="flow-list"><FlowStep number="01" title="Create a payment link" desc="Set the amount and tell your customer what it's for."/><FlowStep number="02" title="Share it anywhere" desc="Send one simple link by chat, email or QR code."/><FlowStep number="03" title="Receive USDC" desc="Your customer pays with their Pollar-connected wallet."/></div></div><div className="panel network-card"><div className="network-orbit"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-core"><Sparkles size={23}/></div></div><div className="network-copy"><span className="section-kicker">BUILT ON POLLAR</span><h3>Payments without the friction.</h3><p>Wallet connection and stablecoin transfers, brought into one simple checkout.</p><a href="https://pollar.xyz" target="_blank" rel="noreferrer">Explore Pollar <ExternalLink size={13}/></a></div></div></section>
        <footer className="footer"><span>© 2026 PayLink</span><span>Simple payments. Clear records.</span><span className="footer-secure"><ShieldCheck size={13}/> Pollar-powered</span></footer>
      </div>
    </main>
    {showCreate && <CreateInvoice onClose={() => setShowCreate(false)} onCreate={(invoice) => {setItems(upsertInvoice(invoice)); setShowCreate(false);}} walletAddress={wallet?.address || ''} />}
  </div>;
}

function usePollarSafe(): {isAuthenticated: boolean; wallet?: {address?: string} | null; getClient?: () => PollarClient} {
  try { return usePollar(); } catch { return { isAuthenticated: false, wallet: null }; }
}

function StatCard({label, value, hint, icon, tone}: {label:string;value:string;hint:string;icon:React.ReactNode;tone:string}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div><div className={`stat-line ${tone}`}/></div>; }
function Status({status}: {status: Invoice['status']}) { return <span className={`status ${status.toLowerCase()}`}><i/>{status === 'PAID' ? 'Paid' : status === 'FAILED' ? 'Failed' : 'Pending'}</span>; }
function FlowStep({number,title,desc}: {number:string;title:string;desc:string}) {return <div className="flow-step"><span>{number}</span><div><strong>{title}</strong><p>{desc}</p></div><Check size={16}/></div>;}
function EmptyState({onCreate}: {onCreate:()=>void}) {return <div className="empty-state"><div className="empty-icon"><Link2 size={22}/></div><h3>Your next payment starts here.</h3><p>Create a payment link and send it to your first customer.</p><button className="primary-btn small" onClick={onCreate}>Create your first link</button></div>;}

function CreateInvoice({onClose,onCreate,walletAddress}: {onClose:()=>void;onCreate:(invoice:Invoice)=>void;walletAddress:string}) {
  const [title,setTitle] = useState(''); const [description,setDescription] = useState(''); const [customer,setCustomer] = useState(''); const [email,setEmail] = useState(''); const [amount,setAmount] = useState(''); const [recipient,setRecipient] = useState(walletAddress); const [error,setError] = useState('');
  function submit(e:React.FormEvent) { e.preventDefault(); if (!title.trim() || !customer.trim() || !/^\d+(\.\d{1,7})?$/.test(amount) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {setError('Add a title, customer and a valid amount.'); return;} if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {setError('Enter a valid customer email or leave it blank.');return;} if (!isValidStellarAccount(recipient.trim())) {setError('Enter a valid Stellar G-address. Connect a Pollar wallet or paste the receiving address.'); return;} const existing=readInvoices(); let id=''; do { id=crypto.randomUUID(); } while(existing.some((item)=>item.id===id)); const invoice:Invoice={id,title:title.trim(),description:description.trim(),customerName:customer.trim(),customerEmail:email.trim()||undefined,amount,currency:'USDC',recipientAddress:recipient.trim(),status:'PENDING',createdAt:new Date().toISOString()}; onCreate(invoice); }
  return <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}><form className="modal" onSubmit={submit}><div className="modal-top"><div><span className="section-kicker">NEW REQUEST</span><h2>Create payment link</h2><p>One invoice, one link, less chasing.</p></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div><label>Payment title<input required maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Brand identity design"/></label><label>Description (optional)<input maxLength={240} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Add details about this payment"/></label><label>Customer name<input required maxLength={100} value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="e.g. Ada Okafor"/></label><label>Customer email (optional)<input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="ada@example.com"/></label><div className="amount-field"><label>Amount</label><div><span>$</span><input required value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/><b>USDC</b></div></div><label>Receiving Stellar address<input required value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="G…"/></label>{error && <div className="form-error" role="alert">{error}</div>}<div className="modal-note"><ShieldCheck size={16}/> Payments are sent directly to this wallet address.</div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">Create payment link <ArrowUpRight size={16}/></button></div></form></div>;
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
      const result:SubmitOutcome=await client.sendPayment({destination:invoice.recipientAddress,amount:invoice.amount,asset:{type:'credit_alphanum4',code:'USDC',issuer}});
      if(result.status==='error') throw new Error(result.details || result.message || 'Pollar could not submit this payment.');
      if(result.status==='cosign_pending') { const updated=updateInvoice(invoice.id,{attemptState:'AWAITING_APPROVAL'});setInvoice(updated.find(x=>x.id===invoice.id));setMessage('Payment is waiting for an additional wallet approval. Do not submit it again. No confirmation has been recorded.'); return; }
      const hash=result.hash;
      setTxHash(hash);setInvoice({...invoice,transactionHash:hash});updateInvoice(invoice.id,{transactionHash:hash});setMessage('Payment submitted. Checking Stellar confirmation…');
      let finalStatus='PENDING';
      for(let attempt=0;attempt<8;attempt++){ const status=await client.getTxStatus(hash); finalStatus=status.status; if(finalStatus==='SUCCESS'||finalStatus==='FAILED')break; await new Promise(r=>setTimeout(r,1800)); }
      if(finalStatus==='SUCCESS'){const updated=updateInvoice(invoice.id,{status:'PAID',transactionHash:hash,confirmedAt:new Date().toISOString(),attemptState:undefined});setInvoice(updated.find(x=>x.id===invoice.id));setMessage('Payment confirmed on Stellar.');}
      else if(finalStatus==='FAILED'){const updated=updateInvoice(invoice.id,{status:'FAILED',transactionHash:hash,attemptState:undefined});setInvoice(updated.find(x=>x.id===invoice.id));setMessage('The network reported that this transaction failed.');}
      else setMessage('Transaction submitted and still pending. Its transaction ID is saved to prevent an accidental duplicate. Check its status before trying again.');
    } catch(error){setMessage(error instanceof Error?error.message:'Payment failed. Please try again.');}
    finally{setPaying(false);}
  }
  useEffect(() => {
    if (!invoice?.transactionHash || invoice.status !== 'PENDING' || invoice.attemptState || !isAuthenticated || !getClient || paying) return;
    let stopped = false;
    const refreshStatus = async () => {
      const client = getClient();
      for (let attempt = 0; attempt < 10 && !stopped; attempt++) {
        try {
          const result = await client.getTxStatus(invoice.transactionHash!);
          if (result.status === 'SUCCESS' || result.status === 'FAILED') {
            const patch: Partial<Invoice> = result.status === 'SUCCESS'
              ? { status: 'PAID', confirmedAt: new Date().toISOString() }
              : { status: 'FAILED' };
            const updated = updateInvoice(invoice.id, patch);
            setInvoice(updated.find((item) => item.id === invoice.id));
            setMessage(result.status === 'SUCCESS' ? 'Payment confirmed on Stellar.' : 'The network reported that this transaction failed.');
            return;
          }
        } catch {
          // Keep the recorded transaction pending and retry; a lookup failure is not a settlement result.
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      if (!stopped) setMessage('We could not confirm the transaction yet. The saved transaction ID prevents another payment attempt.');
    };
    void refreshStatus();
    return () => { stopped = true; };
  }, [id, invoice?.transactionHash, invoice?.status, invoice?.attemptState, isAuthenticated, paying]);
  if(!invoice) return <div className="checkout-shell"><div className="checkout-card not-found"><div className="brand"><img className="brand-logo" src="/paylink-lockup.png" alt="PayLink — Pay. Share. Get Paid." /></div><h1>We couldn't find this invoice.</h1><p>This link may be invalid or the invoice isn't stored in this browser yet.</p><button className="primary-btn" onClick={()=>navigate('/')}>Go to dashboard</button></div></div>;
  return <div className="checkout-shell"><div className="checkout-top"><Link to="/" className="brand"><img className="brand-logo" src="/paylink-lockup.png" alt="PayLink — Pay. Share. Get Paid." /></Link><span className="checkout-secure"><ShieldCheck size={14}/> SECURE CHECKOUT</span></div><div className="checkout-layout"><div className="checkout-intro"><span className="eyebrow">A BETTER WAY TO SETTLE UP</span><h1>Good work.<br/><em>Easy payment.</em></h1><p>You're one step away from completing this payment. Review the details and pay securely with your Pollar wallet.</p><div className="checkout-perks"><span><Check size={15}/> Stablecoin settlement</span><span><Check size={15}/> On-chain confirmation</span><span><Check size={15}/> Direct to the recipient</span></div></div><div className="checkout-card"><div className="checkout-card-top"><div><span className="section-kicker">PAYMENT REQUEST</span><h2>{invoice.title}</h2><p>From {invoice.customerName}</p>{invoice.description&&<p className="invoice-description">{invoice.description}</p>}</div><span className="invoice-badge">#{invoice.id.slice(-6).toUpperCase()}</span></div><div className="checkout-amount"><span>AMOUNT DUE</span><strong>{money(invoice.amount)} <small>USDC</small></strong><span className="network-note"><i/> Stellar Testnet</span></div><div className="recipient-row"><span>Paying to</span><strong>{short(invoice.recipientAddress)}</strong></div>{invoice.status==='PAID'?<div className="success-box"><BadgeCheck size={19}/><div><strong>Payment confirmed</strong>{invoice.confirmedAt&&<p>Confirmed {new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short"}).format(new Date(invoice.confirmedAt))}</p>}<p>Reference: {invoice.id}</p><p>{money(invoice.amount)} USDC received</p>{invoice.transactionHash&&<a href={`https://stellar.expert/explorer/testnet/tx/${invoice.transactionHash}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={12}/></a>}</div></div>:<><div className="wallet-connect"><div className="wallet-connect-icon"><Wallet size={19}/></div><div><strong>{isAuthenticated?'Wallet connected':'Connect your wallet'}</strong><small>{isAuthenticated?short(wallet?.address):'Use Pollar to securely connect'}</small></div>{pollarEnabled ? <WalletButton /> : <small>Configure Pollar key</small>}</div><button className="pay-button" onClick={pay} disabled={paying||!isAuthenticated||invoice.status==='FAILED'||(invoice.status==='PENDING'&&(Boolean(invoice.transactionHash)||invoice.attemptState==='AWAITING_APPROVAL'))}>{paying?'Processing payment…':invoice.attemptState==='AWAITING_APPROVAL'?'Awaiting wallet approval':invoice.transactionHash&&invoice.status==='PENDING'?'Checking payment status':<>Pay {money(invoice.amount)} <ArrowUpRight size={17}/></>}</button>{message&&<div className={`payment-message ${message.includes('confirmed')?'good':''}`}>{message}</div>}{(txHash||invoice.transactionHash)&&<a className="tx-link" href={`https://stellar.expert/explorer/testnet/tx/${txHash||invoice.transactionHash}`} target="_blank" rel="noreferrer">View transaction on Stellar Explorer <ExternalLink size={13}/></a>}</>}<div className="checkout-foot"><ShieldCheck size={14}/> Your payment is processed through Pollar. PayLink never sees your private keys.</div></div></div><div className="checkout-bottom">© 2026 PayLink <span>Powered by Pollar</span></div></div>;
}
export default App;
