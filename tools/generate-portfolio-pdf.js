const { chromium } = require('playwright-core');
const path=require('path');
const OUT=process.argv[2];
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--disable-dev-shm-usage','--no-sandbox','--font-render-hinting=none']});
  const ctx=await b.newContext({viewport:{width:1100,height:1400},deviceScaleFactor:1});
  await ctx.addInitScript(()=>{try{localStorage.setItem('theme','light')}catch(e){}});
  const p=await ctx.newPage();
  p.setDefaultTimeout(0);
  // domcontentloaded: don't wait on the (unreachable) font host
  await p.goto('file://'+path.resolve('/home/user/Portfolio/index.html'),{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(600);
  await p.emulateMedia({media:'print'});
  await p.waitForTimeout(400);
  const stats=await p.evaluate(async()=>{
    document.documentElement.setAttribute('data-theme','light');
    document.querySelectorAll('.reveal').forEach(e=>e.classList.add('reveal-in'));
    document.querySelectorAll('img[data-src]').forEach(i=>{ if(!i.getAttribute('src')) i.src=i.getAttribute('data-src'); });
    document.querySelectorAll('[data-img]').forEach(c=>{ c.style.backgroundImage='url("'+c.getAttribute('data-img')+'")'; c.classList.add('has-img'); });
    await Promise.all(Array.from(document.images).map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,15000)})).filter(Boolean));
    // walk the (very tall) print layout so Chromium actually decodes each image
    const H=document.documentElement.scrollHeight;
    for(let y=0;y<H;y+=900){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,55)); }
    window.scrollTo(0,0);
    await new Promise(r=>setTimeout(r,1500));
    await Promise.all(Array.from(document.images).map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,20000)})).filter(Boolean));
    return { imgs:document.images.length, ok:Array.from(document.images).filter(i=>i.naturalWidth>0).length };
  });
  console.log('IMAGES '+JSON.stringify(stats));
  await p.waitForTimeout(1500);
  console.log('rendering pdf...');
  await p.pdf({ path:OUT, format:'A4', printBackground:true, timeout:0,
    margin:{top:'13mm',bottom:'13mm',left:'11mm',right:'11mm'} });
  console.log('DONE '+OUT);
  await b.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
