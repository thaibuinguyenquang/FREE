(() => {
  const paper = document.getElementById('paper');
  const toc = document.getElementById('toc');
  const pageToc = document.getElementById('pageToc');
  const progress = document.getElementById('progress');
  const leftRail = document.getElementById('leftRail');
  const mobileTocToggle = document.getElementById('mobileTocToggle');
  let rawMarkdown = '';

  const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const slugify = s => s.toLowerCase().replace(/[`*_]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-') || `section-${Math.random().toString(36).slice(2,8)}`;
  const inline = s => escapeHtml(s)
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');

  function renderMarkdown(md){
    const lines = md.replace(/\r/g,'').split('\n');
    let html = '', i = 0, inCode = false, code = [], list = null;
    const closeList = () => { if(list){ html += `</${list}>`; list = null; } };
    while(i < lines.length){
      const line = lines[i];
      if(line.startsWith('```')){
        closeList();
        if(!inCode){ inCode = true; code=[]; } else { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; inCode=false; }
        i++; continue;
      }
      if(inCode){ code.push(line); i++; continue; }
      if(/^\|.+\|\s*$/.test(line) && i+1<lines.length && /^\|?\s*:?-{3,}/.test(lines[i+1])){
        closeList(); const rows=[]; rows.push(line); i+=2; while(i<lines.length && /^\|.+\|\s*$/.test(lines[i])) rows.push(lines[i++]);
        const cells = r => r.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
        const head=cells(rows[0]); html += '<div class="table-wrap"><table><thead><tr>'+head.map(x=>`<th>${inline(x)}</th>`).join('')+'</tr></thead><tbody>';
        for(const r of rows.slice(1)) html += '<tr>'+cells(r).map(x=>`<td>${inline(x)}</td>`).join('')+'</tr>';
        html += '</tbody></table></div>'; continue;
      }
      const h = /^(#{1,3})\s+(.+)$/.exec(line);
      if(h){ closeList(); const level=h[1].length, text=h[2].trim(), id=slugify(text); html += `<h${level} id="${id}">${inline(text)}</h${level}>`; i++; continue; }
      if(/^\s*[-*]\s+/.test(line)){ if(list!=='ul'){closeList();list='ul';html+='<ul>'} html += `<li>${inline(line.replace(/^\s*[-*]\s+/,''))}</li>`; i++; continue; }
      if(/^\s*\d+\.\s+/.test(line)){ if(list!=='ol'){closeList();list='ol';html+='<ol>'} html += `<li>${inline(line.replace(/^\s*\d+\.\s+/,''))}</li>`; i++; continue; }
      closeList();
      if(/^>\s?/.test(line)){ html += `<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`; i++; continue; }
      if(/^---+$/.test(line.trim())){html+='<hr>';i++;continue}
      if(!line.trim()){i++;continue}
      const para=[line.trim()]; i++; while(i<lines.length && lines[i].trim() && !/^(#{1,3})\s+/.test(lines[i]) && !/^```/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\|.+\|\s*$/.test(lines[i])) para.push(lines[i++].trim());
      const p = para.join(' ');
      const equationish = /^`[^`]+\s*=/.test(p) || /^[A-Za-z][A-Za-z()]+\([^)]*\)\s*=/.test(p);
      html += equationish ? `<div class="equation">${inline(p.replace(/^`|`$/g,''))}</div>` : `<p>${inline(p)}</p>`;
    }
    closeList(); return html;
  }

  function buildToc(){
    const headings=[...paper.querySelectorAll('h2,h3')];
    const top = headings.filter(h=>h.tagName==='H2');
    toc.innerHTML = headings.map((h,idx)=>`<a class="${h.tagName.toLowerCase()}" href="#${h.id}"><span class="section-number">${h.tagName==='H2'?String(top.indexOf(h)+1).padStart(2,'0'):''}</span>${h.textContent.replace(/^\d+\.\s*/, '')}</a>`).join('');
    pageToc.innerHTML = top.slice(0,8).map(h=>`<a href="#${h.id}">${h.textContent.replace(/^\d+\.\s*/, '')}</a>`).join('');
    const links=[...document.querySelectorAll('.toc a,.page-toc a')];
    const obs=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){links.forEach(a=>a.classList.toggle('current',a.getAttribute('href')===`#${e.target.id}`));}}},{rootMargin:'-20% 0px -70% 0px'});
    headings.forEach(h=>obs.observe(h));
  }

  fetch('/whitepaper.md',{cache:'no-store'}).then(r=>{if(!r.ok) throw new Error(`HTTP ${r.status}`);return r.text()}).then(md=>{
    rawMarkdown=md; paper.innerHTML=renderMarkdown(md); buildToc();
  }).catch(err=>{paper.innerHTML=`<p>Whitepaper could not be loaded: ${escapeHtml(err.message)}</p>`});

  window.addEventListener('scroll',()=>{
    const doc=document.documentElement; const max=doc.scrollHeight-doc.clientHeight; progress.style.width=(max>0?Math.min(100,(doc.scrollTop/max)*100):0)+'%';
  },{passive:true});
  document.getElementById('copyMarkdown').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(rawMarkdown);const old=e.currentTarget.textContent;e.currentTarget.textContent='Copied';setTimeout(()=>e.currentTarget.textContent=old,1200)}catch{}});
  mobileTocToggle.addEventListener('click',()=>{const open=leftRail.classList.toggle('open');mobileTocToggle.setAttribute('aria-expanded',String(open))});
  toc.addEventListener('click',()=>leftRail.classList.remove('open'));
})();
