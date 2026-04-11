/* 每日 AIGC 早报 JS */
(function(){
'use strict';
var P=window.__POSTS__||[],cY,cM,isHD=localStorage.getItem('daily_hd')==='true';

function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

function thumb(u,s){
  if(!u)return'';
  return isHD?u:'https://images.weserv.nl/?url='+encodeURIComponent(u)+'&w='+s+'&h='+s+'&output=jpg&q=80&fit=cover';
}

/* 主题 */
function initTheme(){
  var s=localStorage.getItem('daily_theme')||'system';
  apply(s);
  document.querySelectorAll('.theme-btn').forEach(function(b){
    b.addEventListener('click',function(){localStorage.setItem('daily_theme',this.dataset.theme);apply(this.dataset.theme)});
  });
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(){
    if((localStorage.getItem('daily_theme')||'system')==='system')apply('system');
  });
}
function apply(p){
  document.documentElement.setAttribute('data-theme',p==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):p);
  document.querySelectorAll('.theme-btn').forEach(function(b){b.classList.toggle('active',b.dataset.theme===p)});
}

/* HD */
function initHD(){
  var f=document.getElementById('hdToggle'),m=document.getElementById('hdToggleMobile');
  function set(v){
    isHD=v;localStorage.setItem('daily_hd',v?'true':'false');
    if(f)f.checked=v;if(m)m.checked=v;
    if(document.getElementById('calendarContainer'))renderCal();
    refImg();
  }
  if(isHD){if(f)f.checked=true;if(m)m.checked=true}
  if(f)f.addEventListener('change',function(){set(this.checked)});
  if(m)m.addEventListener('change',function(){set(this.checked)});
  refImg();
}
function refImg(){
  var c=document.querySelector('.article-cover img');
  if(c){var o=c.getAttribute('data-original');if(o)c.src=isHD?o:thumb(o,640)}
  var ct=document.querySelector('.article-content');
  if(ct)ct.querySelectorAll('img').forEach(function(i){
    var s=i.getAttribute('data-original')||i.src;
    if(!i.getAttribute('data-original'))i.setAttribute('data-original',s);
    i.src=isHD?s:(s.includes('weserv.nl')?s:'https://images.weserv.nl/?url='+encodeURIComponent(s)+'&output=jpg&q=80');
  });
}

/* 汉堡 */
function initMenu(){
  var b=document.getElementById('hamburgerButton'),o=document.getElementById('mobileOverlay'),m=document.getElementById('mobileMenu');
  if(!b)return;
  function open(){if(m)m.classList.add('open');if(o)o.classList.add('active');document.body.style.overflow='hidden'}
  function close(){if(m)m.classList.remove('open');if(o)o.classList.remove('active');document.body.style.overflow=''}
  b.addEventListener('click',function(){m.classList.contains('open')?close():open()});
  if(o)o.addEventListener('click',close);
  if(m)m.addEventListener('click',function(e){if(e.target.tagName==='A')close()});
  var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){if(innerWidth>1023)close()},100)});
}

/* 日历 */
function initCal(){
  var c=document.getElementById('calendarContainer'),yO=document.getElementById('yearOptions'),mO=document.getElementById('monthOptions');
  if(!c||!P.length)return;
  var years={};
  P.forEach(function(p){if(!years[p.y])years[p.y]={};years[p.y][p.m]=1});
  var yL=Object.keys(years).sort(function(a,b){return b-a});

  var h='';yL.forEach(function(y){h+='<button class="filter-btn year-btn" data-year="'+y+'">'+y+'</button>'});
  yO.innerHTML=h;
  h='';for(var m=1;m<=12;m++){var mm=m<10?'0'+m:''+m;h+='<button class="filter-btn month-btn" data-month="'+mm+'">'+m+'月</button>'}
  mO.innerHTML=h;

  var now=new Date(),dY=''+now.getFullYear(),dM=(now.getMonth()+1<10?'0':'')+(now.getMonth()+1);
  if(!P.some(function(p){return p.y===dY&&p.m===dM})&&yL.length){
    dY=yL[0];var ml=Object.keys(years[dY]).sort(function(a,b){return b-a});dM=ml[0]||'01';
  }
  cY=dY;cM=dM;
  yO.addEventListener('click',function(e){var b=e.target.closest('.year-btn');if(!b)return;cY=b.dataset.year;var ml=Object.keys(years[cY]||{}).sort(function(a,b){return b-a});cM=ml[0]||'01';upd();renderCal()});
  mO.addEventListener('click',function(e){var b=e.target.closest('.month-btn');if(!b)return;cM=b.dataset.month;upd();renderCal()});
  upd();renderCal();
}
function upd(){
  document.querySelectorAll('.year-btn').forEach(function(b){b.classList.toggle('active',b.dataset.year===cY)});
  document.querySelectorAll('.month-btn').forEach(function(b){b.classList.toggle('active',b.dataset.month===cM)});
}
function renderCal(){
  var c=document.getElementById('calendarContainer');if(!c)return;
  var y=+cY,m=+cM,fd=new Date(y,m-1,1),dim=new Date(y,m,0).getDate(),sw=(fd.getDay()+6)%7;
  var byD={};P.forEach(function(p){if(p.y===cY&&p.m===cM)byD[p.day]=p});
  var wd='一二三四五六日',h='<div class="cal-weekdays">';
  for(var i=0;i<7;i++)h+='<div class="cal-weekday">'+wd[i]+'</div>';
  h+='</div><div class="cal-days">';
  for(var i=0;i<sw;i++)h+='<div class="cal-day cal-day-empty"></div>';
  var has=false;
  for(var d=1;d<=dim;d++){
    var dd=d<10?'0'+d:''+d,p=byD[dd];
    if(p){
      has=true;var ts=thumb(p.i,300);
      if(ts){
        h+='<a href="'+esc(p.u)+'" class="cal-day cal-day-has-post"><div class="cal-day-img"><img src="'+esc(ts)+'" alt="'+esc(p.t)+'" loading="lazy"></div><div class="cal-day-overlay"></div><div class="cal-day-num">'+d+'</div></a>';
      }else{
        h+='<a href="'+esc(p.u)+'" class="cal-day cal-day-has-post" style="background:var(--accent)"><div class="cal-day-overlay" style="background:none"></div><div class="cal-day-num">'+d+'</div></a>';
      }
    }else{
      h+='<div class="cal-day cal-day-no-post"><div class="cal-day-num">'+d+'</div></div>';
    }
  }
  var tot=sw+dim,rem=tot%7;
  if(rem)for(var i=rem;i<7;i++)h+='<div class="cal-day cal-day-empty"></div>';
  h+='</div>';
  if(!has)h+='<div class="cal-empty-hint">本月暂无文章</div>';
  c.innerHTML=h;
}

/* 迷你日历 */
function initMini(){
  var hd=document.getElementById('miniCalHeader'),cal=document.getElementById('miniCalendar'),data=window.__MONTH__;
  if(!hd||!cal||!data)return;
  var y=+data.y,m=+data.m,today=+data.d,posts=data.posts||{};
  hd.textContent=data.y+'年'+(+data.m)+'月';
  var fd=new Date(y,m-1,1),dim=new Date(y,m,0).getDate(),sw=(fd.getDay()+6)%7;
  var wd='一二三四五六日',h='';
  for(var i=0;i<7;i++)h+='<div class="mini-cal-weekday">'+wd[i]+'</div>';
  for(var i=0;i<sw;i++)h+='<div class="mini-cal-day mini-cal-day-empty"></div>';
  for(var d=1;d<=dim;d++){
    var dd=d<10?'0'+d:''+d,u=posts[dd];
    if(d===today)h+='<div class="mini-cal-day mini-cal-day-today">'+d+'</div>';
    else if(u)h+='<a href="'+esc(u)+'" class="mini-cal-day-link"><div class="mini-cal-day">'+d+'</div></a>';
    else h+='<div class="mini-cal-day">'+d+'</div>';
  }
  var tot=sw+dim,rem=tot%7;
  if(rem)for(var i=rem;i<7;i++)h+='<div class="mini-cal-day mini-cal-day-empty"></div>';
  cal.innerHTML=h;
}

/* 分享 */
function initShare(){
  var cb=document.getElementById('copyLinkBtn');
  if(cb)cb.addEventListener('click',function(){navigator.clipboard.writeText(location.href).then(function(){cb.title='已复制！';setTimeout(function(){cb.title='复制链接'},1500)})});
  var wb=document.getElementById('wechatShareBtn'),wo=document.getElementById('wechatQrOverlay'),wc=document.getElementById('wechatQrClose'),wq=document.getElementById('wechatQrCode');
  if(wb&&wo&&wq){
    function show(){wq.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(location.href)+'" alt="QR" loading="lazy">';wo.classList.add('active')}
    function hide(){wo.classList.remove('active')}
    wb.addEventListener('click',show);if(wc)wc.addEventListener('click',hide);
    wo.addEventListener('click',function(e){if(e.target===wo)hide()});
  }
}

/* 超宽 */
function initScale(){
  function u(){var s=(innerWidth*2/3)/1200;document.documentElement.style.setProperty('--page-zoom',s>1?s.toFixed(4):0);if(s<=1)document.documentElement.style.removeProperty('--page-zoom')}
  u();window.addEventListener('resize',u);
}

/* 外链 */
function initExt(){
  var a=document.querySelector('.article-content');if(!a)return;
  a.querySelectorAll('a').forEach(function(l){if(l.hostname!==location.hostname){l.target='_blank';l.rel='noopener noreferrer'}});
}

document.addEventListener('DOMContentLoaded',function(){initTheme();initHD();initMenu();initCal();initMini();initShare();initScale();initExt()});
})();
