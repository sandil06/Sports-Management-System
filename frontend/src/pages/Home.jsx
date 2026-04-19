import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';

const features = [
  { icon: '🏆', title: 'Tournaments', desc: 'Create, manage, and compete in university-wide sports tournaments with real-time updates.', link: '/tournaments', accent: '#f97316' },
  { icon: '📅', title: 'Events', desc: 'Stay on top of upcoming sports events, schedules, and registrations all in one place.', link: '/events', accent: '#3b82f6' },
  { icon: '🏟️', title: 'Facilities', desc: 'Browse and book SLIIT sports facilities — courts, fields, and gyms — with ease.', link: '/facilities', accent: '#10b981' },
  { icon: '🎽', title: 'Equipment', desc: 'Track and manage sports equipment inventory across all departments and teams.', link: '/equipment', accent: '#a855f7' },
  { icon: '🤝', title: 'Sponsorships', desc: 'Connect sponsors with tournaments and events to power the next generation of athletes.', link: '/login', accent: '#eab308' },
  { icon: '👥', title: 'Team Management', desc: 'Build teams, assign coaches, and manage rosters effortlessly from your dashboard.', link: '/dashboard', accent: '#ec4899' },
];

const stats = [
  { value: '20+', label: 'Sports Events', icon: '🗓️' },
  { value: '500+', label: 'Athletes', icon: '🏃' },
  { value: '12', label: 'Facilities', icon: '🏟️' },
  { value: '30+', label: 'Sponsors', icon: '🤝' },
];

const roles = [
  {
    role: 'Student', emoji: '🎓',
    gradient: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    border: 'rgba(59,130,246,0.35)',
    badge: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    perks: ['Join tournaments & events','Track your registrations','Browse facilities & equipment','View team standings'],
    cta: '/register', ctaLabel: 'Register as Student',
  },
  {
    role: 'Coach', emoji: '🏅',
    gradient: 'linear-gradient(135deg,#c2410c,#f97316)',
    border: 'rgba(249,115,22,0.35)',
    badge: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
    perks: ['Create & manage tournaments','Schedule events','Manage team rosters','Approve player registrations'],
    cta: '/register', ctaLabel: 'Register as Coach',
  },
  {
    role: 'Sponsor', emoji: '💼',
    gradient: 'linear-gradient(135deg,#7e22ce,#a855f7)',
    border: 'rgba(168,85,247,0.35)',
    badge: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
    perks: ['Sponsor tournaments','Track your sponsorships','Connect with SLIIT sports','Manage your profile'],
    cta: '/sponsor/register', ctaLabel: 'Become a Sponsor',
  },
];

function Counter({ target }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  const numeric = parseInt(target);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(numeric / 50);
        const interval = setInterval(() => {
          start += step;
          if (start >= numeric) { setCount(numeric); clearInterval(interval); }
          else setCount(start);
        }, 28);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numeric]);
  return <span ref={ref}>{count}{target.includes('+') ? '+' : ''}</span>;
}

export default function Home() {
  const { user, sponsor } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getDashboardLink = () => {
    if (sponsor) return '/sponsor/dashboard';
    if (user) return '/dashboard';
    return '/login';
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    :root{--or:#f97316;--or-dim:rgba(249,115,22,.15);--or-glow:rgba(249,115,22,.4);--bg:#080b10;--sf:rgba(255,255,255,.032);--bd:rgba(255,255,255,.07);--tx:#f1f5f9;--mu:#64748b;}
    .hr{font-family:'Outfit',sans-serif;color:var(--tx);background:var(--bg);overflow-x:hidden;}
    .hr::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:.6;}
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:all .3s;padding:0 2rem;}
    .nav.sc{background:rgba(8,11,16,.9);backdrop-filter:blur(18px);border-bottom:1px solid var(--bd);box-shadow:0 4px 40px rgba(0,0,0,.4);}
    .ni{max-width:1200px;margin:0 auto;height:70px;display:flex;align-items:center;justify-content:space-between;gap:2rem;}
    .logo{display:flex;align-items:center;gap:.65rem;text-decoration:none;}
    .li{width:38px;height:38px;background:var(--or);border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;box-shadow:0 0 18px var(--or-glow);}
    .lt{font-weight:800;font-size:1.1rem;letter-spacing:-.02em;color:var(--tx);}
    .lt span{color:var(--or);}
    .nl{display:flex;gap:2rem;list-style:none;}
    .nl a{font-size:.875rem;font-weight:500;color:var(--mu);text-decoration:none;transition:color .2s;}
    .nl a:hover{color:var(--tx);}
    .ncta{display:flex;align-items:center;gap:.75rem;}
    .bg{font-size:.875rem;font-weight:600;color:var(--mu);text-decoration:none;transition:color .2s;}
    .bg:hover{color:var(--tx);}
    .bp{background:var(--or);color:#fff;font-size:.875rem;font-weight:700;padding:.55rem 1.25rem;border-radius:10px;text-decoration:none;transition:transform .2s,box-shadow .2s,background .2s;box-shadow:0 0 20px var(--or-dim);white-space:nowrap;}
    .bp:hover{background:#ea6c08;transform:translateY(-1px);box-shadow:0 0 30px var(--or-glow);}
    .hb{display:none;background:none;border:none;cursor:pointer;flex-direction:column;gap:5px;padding:4px;}
    .hb span{display:block;width:22px;height:2px;background:var(--tx);border-radius:2px;}
    .mm{display:none;position:fixed;top:70px;left:0;right:0;background:rgba(8,11,16,.97);border-bottom:1px solid var(--bd);z-index:99;padding:1.5rem 2rem;flex-direction:column;gap:1rem;}
    .mm.op{display:flex;}
    .mm a{color:var(--tx);text-decoration:none;font-weight:600;font-size:1rem;padding:.5rem 0;border-bottom:1px solid var(--bd);}
    .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:8rem 2rem 5rem;overflow:hidden;}
    .hbg{position:absolute;inset:0;z-index:0;}
    .hgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%);}
    .hbl{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
    .hbl1{width:700px;height:500px;top:5%;left:50%;transform:translateX(-50%);background:radial-gradient(ellipse,rgba(249,115,22,.18) 0%,transparent 70%);animation:pls 8s ease-in-out infinite;}
    .hbl2{width:400px;height:400px;top:20%;right:5%;background:radial-gradient(ellipse,rgba(59,130,246,.1) 0%,transparent 70%);animation:fb 10s ease-in-out infinite;}
    .hbl3{width:350px;height:350px;bottom:10%;left:5%;background:radial-gradient(ellipse,rgba(168,85,247,.1) 0%,transparent 70%);animation:fb 12s ease-in-out infinite reverse;}
    @keyframes pls{0%,100%{opacity:1;transform:translateX(-50%) scale(1);}50%{opacity:.7;transform:translateX(-50%) scale(1.08);}}
    @keyframes fb{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.1);opacity:.6;}}
    .hc{position:relative;z-index:1;text-align:center;max-width:880px;animation:fu .8s ease both;}
    @keyframes fu{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
    .hbadge{display:inline-flex;align-items:center;gap:.5rem;margin-bottom:2rem;font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--or);border:1px solid rgba(249,115,22,.3);background:rgba(249,115,22,.08);padding:.5rem 1.1rem;border-radius:100px;animation:fu .8s .1s ease both;}
    .bdot{width:6px;height:6px;background:var(--or);border-radius:50%;box-shadow:0 0 6px var(--or);animation:bk 2s infinite;}
    @keyframes bk{0%,100%{opacity:1;}50%{opacity:.3;}}
    .htitle{font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,10vw,9rem);line-height:.92;letter-spacing:.02em;margin-bottom:1.75rem;animation:fu .8s .2s ease both;}
    .hacc{display:block;background:linear-gradient(90deg,#f97316 0%,#fbbf24 50%,#f97316 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sh 4s linear infinite;}
    @keyframes sh{to{background-position:200% center;}}
    .hsub{font-size:clamp(1rem,2.5vw,1.2rem);font-weight:400;color:var(--mu);max-width:540px;margin:0 auto 2.5rem;line-height:1.75;animation:fu .8s .3s ease both;}
    .hact{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;animation:fu .8s .4s ease both;}
    .bhp{background:var(--or);color:#fff;font-weight:700;font-size:1rem;padding:.9rem 2.25rem;border-radius:14px;text-decoration:none;transition:all .25s;box-shadow:0 0 30px var(--or-glow),0 8px 24px rgba(0,0,0,.3);}
    .bhp:hover{transform:translateY(-2px);box-shadow:0 0 50px var(--or-glow),0 12px 32px rgba(0,0,0,.4);background:#ea6c08;}
    .bhs{background:rgba(255,255,255,.05);color:var(--tx);font-weight:600;font-size:1rem;padding:.9rem 2.25rem;border-radius:14px;text-decoration:none;border:1px solid var(--bd);transition:all .25s;backdrop-filter:blur(8px);}
    .bhs:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.15);transform:translateY(-2px);}
    .hscr{position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.5rem;color:rgba(255,255,255,.2);font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;animation:fu 1s .8s ease both;}
    .sln{width:1px;height:40px;background:linear-gradient(to bottom,rgba(249,115,22,.6),transparent);animation:sd 2s ease-in-out infinite;}
    @keyframes sd{0%,100%{transform:scaleY(1) translateY(0);opacity:1;}50%{transform:scaleY(.6) translateY(8px);opacity:.4;}}
    .ticker{overflow:hidden;border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);background:rgba(249,115,22,.04);padding:.7rem 0;position:relative;z-index:1;}
    .ttrack{display:flex;gap:3rem;animation:tk 25s linear infinite;white-space:nowrap;}
    .ttrack:hover{animation-play-state:paused;}
    @keyframes tk{from{transform:translateX(0);}to{transform:translateX(-50%);}}
    .titem{display:flex;align-items:center;gap:.5rem;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mu);}
    .titem span{color:var(--or);}
    .stats-s{position:relative;z-index:1;padding:5rem 2rem;border-bottom:1px solid var(--bd);}
    .sgrid{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:2px;}
    .scard{text-align:center;padding:2.5rem 1.5rem;position:relative;transition:background .3s;}
    .scard::after{content:'';position:absolute;right:0;top:20%;bottom:20%;width:1px;background:var(--bd);}
    .scard:last-child::after{display:none;}
    .scard:hover{background:var(--sf);}
    .sico{font-size:1.8rem;margin-bottom:.75rem;display:block;}
    .sval{font-family:'Bebas Neue',sans-serif;font-size:3.5rem;line-height:1;color:var(--or);display:block;filter:drop-shadow(0 0 12px var(--or-glow));}
    .slbl{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);margin-top:.35rem;display:block;}
    .stag{display:inline-block;font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--or);border:1px solid rgba(249,115,22,.25);background:rgba(249,115,22,.07);padding:.35rem .9rem;border-radius:100px;margin-bottom:1.1rem;}
    .stitle{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,5vw,4.5rem);line-height:1;letter-spacing:.02em;margin-bottom:1rem;}
    .ssub{font-size:1rem;color:var(--mu);max-width:480px;line-height:1.7;}
    .shdr{text-align:center;margin-bottom:4rem;}
    .shdr .ssub{margin:0 auto;}
    .feat-s{position:relative;z-index:1;padding:6rem 2rem;}
    .fgrid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
    .fc{position:relative;background:var(--sf);border:1px solid var(--bd);border-radius:20px;padding:2rem;text-decoration:none;color:inherit;overflow:hidden;transition:all .3s;display:block;}
    .fc:hover{transform:translateY(-4px);border-color:rgba(249,115,22,.3);box-shadow:0 20px 60px rgba(0,0,0,.4),0 0 40px rgba(249,115,22,.06);}
    .fcgl{position:absolute;inset:-1px;border-radius:21px;opacity:0;transition:opacity .3s;pointer-events:none;background:radial-gradient(ellipse at top left,var(--fa,var(--or)) 0%,transparent 60%);filter:blur(20px);}
    .fc:hover .fcgl{opacity:.08;}
    .fico{font-size:2.5rem;margin-bottom:1.25rem;display:block;}
    .ftitle{font-size:1.1rem;font-weight:800;margin-bottom:.6rem;}
    .fdesc{font-size:.875rem;color:var(--mu);line-height:1.7;}
    .farr{margin-top:1.25rem;font-size:.82rem;font-weight:700;color:var(--or);opacity:0;transform:translateX(-8px);transition:all .3s;display:flex;align-items:center;gap:.35rem;}
    .fc:hover .farr{opacity:1;transform:translateX(0);}
    .roles-s{position:relative;z-index:1;padding:6rem 2rem;background:linear-gradient(to bottom,transparent,rgba(255,255,255,.015),transparent);border-top:1px solid var(--bd);}
    .rgrid{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;align-items:start;}
    .rc{border-radius:22px;border:1px solid;padding:2rem 1.75rem 1.75rem;background:var(--sf);backdrop-filter:blur(8px);display:flex;flex-direction:column;transition:transform .3s,box-shadow .3s;}
    .rc:hover{transform:translateY(-5px);box-shadow:0 24px 60px rgba(0,0,0,.35);}
    .rhdr{display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem;}
    .remo{font-size:1.75rem;}
    .rbadge{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:1px solid;padding:.3rem .8rem;border-radius:100px;}
    .rperks{list-style:none;flex:1;margin-bottom:1.5rem;}
    .rperks li{display:flex;align-items:flex-start;gap:.65rem;font-size:.875rem;color:rgba(241,245,249,.7);padding:.55rem 0;border-bottom:1px solid rgba(255,255,255,.05);line-height:1.45;}
    .rperks li:last-child{border-bottom:none;}
    .rchk{color:#4ade80;font-size:.75rem;margin-top:2px;flex-shrink:0;}
    .rcta{display:block;text-align:center;color:#fff;font-weight:700;font-size:.9rem;padding:.85rem;border-radius:12px;text-decoration:none;transition:opacity .2s,transform .2s;}
    .rcta:hover{opacity:.88;transform:translateY(-1px);}
    .show-s{position:relative;z-index:1;padding:6rem 2rem;border-top:1px solid var(--bd);}
    .splist{max-width:900px;margin:3rem auto 0;display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center;}
    .spchip{display:flex;align-items:center;gap:.5rem;background:var(--sf);border:1px solid var(--bd);border-radius:100px;padding:.5rem 1.1rem;font-size:.875rem;font-weight:600;color:rgba(241,245,249,.75);transition:all .2s;cursor:default;}
    .spchip:hover{background:rgba(249,115,22,.1);border-color:rgba(249,115,22,.3);color:var(--or);transform:scale(1.04);}
    .cta-s{position:relative;z-index:1;padding:5rem 2rem;}
    .ctabox{max-width:860px;margin:0 auto;position:relative;overflow:hidden;border-radius:28px;padding:5rem 3rem;text-align:center;border:1px solid rgba(249,115,22,.2);background:radial-gradient(ellipse at 60% 0%,rgba(249,115,22,.12) 0%,rgba(8,11,16,.8) 60%),radial-gradient(ellipse at 10% 100%,rgba(59,130,246,.08) 0%,transparent 60%),rgba(255,255,255,.025);backdrop-filter:blur(12px);}
    .ctagl{position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:400px;height:200px;background:radial-gradient(ellipse,rgba(249,115,22,.25),transparent);filter:blur(40px);pointer-events:none;}
    .ctatitle{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,7vw,6rem);line-height:.95;margin-bottom:1.25rem;position:relative;}
    .ctasub{font-size:1.05rem;color:var(--mu);margin-bottom:2.5rem;max-width:450px;margin-left:auto;margin-right:auto;line-height:1.7;position:relative;}
    .ctaact{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;position:relative;}
    .footer{position:relative;z-index:1;border-top:1px solid var(--bd);padding:3rem 2rem;text-align:center;}
    .flogo{display:inline-flex;align-items:center;gap:.65rem;margin-bottom:.75rem;text-decoration:none;}
    .fcopy{font-size:.8rem;color:rgba(100,116,139,.7);}
    .flinks{display:flex;justify-content:center;gap:1.5rem;margin:1.25rem 0;list-style:none;}
    .flinks a{font-size:.8rem;color:var(--mu);text-decoration:none;transition:color .2s;}
    .flinks a:hover{color:var(--or);}
    @media(max-width:900px){.fgrid{grid-template-columns:repeat(2,1fr);}.rgrid{grid-template-columns:1fr;}.sgrid{grid-template-columns:repeat(2,1fr);}.scard:nth-child(2)::after{display:none;}.nl{display:none;}.hb{display:flex;}}
    @media(max-width:600px){.fgrid{grid-template-columns:1fr;}.ctabox{padding:3rem 1.5rem;}}
  `;

  const tickerItems = ['⚽ Football','🏀 Basketball','🏸 Badminton','🎾 Tennis','🏐 Volleyball','🏊 Swimming','🏃 Athletics','🥊 Boxing','🏋️ Weightlifting','🤸 Gymnastics'];
  const sportsChips = [['⚽','Football'],['🏀','Basketball'],['🏸','Badminton'],['🎾','Tennis'],['🏐','Volleyball'],['🏊','Swimming'],['🏃','Athletics'],['🥊','Boxing'],['🏋️','Weightlifting'],['🤸','Gymnastics'],['🏑','Hockey'],['🎱','Carrom'],['♟️','Chess'],['🏏','Cricket'],['🎯','Darts'],['🚴','Cycling']];

  return (
    <>
      <style>{CSS}</style>
      <div className="hr">
        {/* NAV */}
        <header className={`nav ${scrolled ? 'sc' : ''}`}>
          <div className="ni">
            <a href="#" className="logo"><div className="li">SA</div><span className="lt">SliitArena <span>360</span></span></a>
            <nav><ul className="nl">
              <li><a href="#features">Features</a></li>
              <li><a href="#stats">Stats</a></li>
              <li><a href="#roles">Join</a></li>
              <li><a href="#sports">Sports</a></li>
            </ul></nav>
            <div className="ncta">
              {user || sponsor ? (
                <Link to={getDashboardLink()} className="bp">Dashboard →</Link>
              ) : (
                <><Link to="/login" className="bg">Sign in</Link><Link to="/register" className="bp">Get Started</Link></>
              )}
            </div>
            <button className="hb" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"><span/><span/><span/></button>
          </div>
        </header>

        <div className={`mm ${menuOpen ? 'op' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#stats" onClick={() => setMenuOpen(false)}>Stats</a>
          <a href="#roles" onClick={() => setMenuOpen(false)}>Join</a>
          <a href="#sports" onClick={() => setMenuOpen(false)}>Sports</a>
          {user || sponsor
            ? <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            : <><Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link><Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link></>
          }
        </div>

        {/* HERO */}
        <section className="hero">
          <div className="hbg">
            <div className="hgrid"/>
            <div className="hbl hbl1"/><div className="hbl hbl2"/><div className="hbl hbl3"/>
          </div>
          <div className="hc">
            <div className="hbadge"><span className="bdot"/>SLIIT Sports Management Platform</div>
            <h1 className="htitle">THE ARENA FOR<span className="hacc">EVERY ATHLETE</span></h1>
            <p className="hsub">SliitArena360 is the all-in-one platform for tournaments, events, facilities, equipment, and sponsorships at SLIIT.</p>
            <div className="hact">
              <Link to={user || sponsor ? getDashboardLink() : '/register'} className="bhp">
                {user || sponsor ? 'Go to Dashboard →' : '🎽 Join as Student / Coach'}
              </Link>
              {!user && !sponsor && <Link to="/sponsor/register" className="bhs">💼 Become a Sponsor</Link>}
            </div>
          </div>
          <div className="hscr"><div className="sln"/>scroll</div>
        </section>

        {/* TICKER */}
        <div className="ticker">
          <div className="ttrack">
            {[...tickerItems,...tickerItems].map((s,i) => (
              <span key={i} className="titem">{s.split(' ')[0]} <span>{s.split(' ').slice(1).join(' ')}</span></span>
            ))}
          </div>
        </div>

        {/* STATS */}
        <section id="stats" className="stats-s">
          <div className="sgrid">
            {stats.map(({value,label,icon}) => (
              <div key={label} className="scard">
                <span className="sico">{icon}</span>
                <span className="sval"><Counter target={value}/></span>
                <span className="slbl">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="feat-s">
          <div className="shdr">
            <span className="stag">Platform Features</span>
            <h2 className="stitle">Everything You Need</h2>
            <p className="ssub">One platform to handle the full lifecycle of sports management at SLIIT.</p>
          </div>
          <div className="fgrid">
            {features.map((f) => (
              <Link key={f.title} to={user || sponsor ? f.link : '/login'} className="fc" style={{'--fa':f.accent}}>
                <div className="fcgl"/>
                <span className="fico">{f.icon}</span>
                <h3 className="ftitle">{f.title}</h3>
                <p className="fdesc">{f.desc}</p>
                <div className="farr">Explore →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="roles-s">
          <div className="shdr">
            <span className="stag">Who&apos;s It For</span>
            <h2 className="stitle">Built for Everyone</h2>
            <p className="ssub">Whether you play, coach, manage, or fund — there&apos;s a role for you.</p>
          </div>
          <div className="rgrid">
            {roles.map((r) => (
              <div key={r.role} className="rc" style={{borderColor:r.border}}>
                <div className="rhdr">
                  <span className="remo">{r.emoji}</span>
                  <span className="rbadge" style={{background:r.badge.bg,color:r.badge.color,borderColor:r.badge.border}}>{r.role}</span>
                </div>
                <ul className="rperks">
                  {r.perks.map((p) => <li key={p}><span className="rchk">✓</span>{p}</li>)}
                </ul>
                <Link to={r.cta} className="rcta" style={{background:r.gradient}}>{r.ctaLabel}</Link>
              </div>
            ))}
          </div>
        </section>

        {/* SPORTS SHOWCASE */}
        <section id="sports" className="show-s">
          <div className="shdr">
            <span className="stag">Sports at SLIIT</span>
            <h2 className="stitle">Your Sport. Our Arena.</h2>
            <p className="ssub">We support a wide range of sports disciplines across the university.</p>
          </div>
          <div className="splist">
            {sportsChips.map(([icon,name]) => (
              <div key={name} className="spchip"><span>{icon}</span>{name}</div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-s">
          <div className="ctabox">
            <div className="ctagl"/>
            <h2 className="ctatitle">READY TO<br/>COMPETE?</h2>
            <p className="ctasub">Join hundreds of SLIIT athletes already using SliitArena360 to compete, manage, and connect.</p>
            <div className="ctaact">
              {user || sponsor ? (
                <Link to={getDashboardLink()} className="bhp">Go to Dashboard →</Link>
              ) : (
                <><Link to="/register" className="bhp">Create Free Account</Link><Link to="/login" className="bhs">Sign In</Link></>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <a href="#" className="flogo"><div className="li">SA</div><span className="lt">SliitArena <span>360</span></span></a>
          <ul className="flinks">
            <li><a href="#features">Features</a></li>
            <li><a href="#stats">Stats</a></li>
            <li><a href="#roles">Join</a></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
          <p className="fcopy">© {new Date().getFullYear()} SLIIT Arena 360. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
