(function(){
"use strict";

const $=id=>document.getElementById(id);

function number(value){
  if(value===null||value===undefined||String(value).trim()==="") return null;
  const n=Number(String(value).replace(",","."));
  return Number.isFinite(n)&&n>=-10&&n<=10?n:null;
}

function getCoords(){
  const p=new URLSearchParams(location.search);

  let eco=number(p.get("e"));
  let soc=number(p.get("s"));

  if(eco===null&&$("ecoValue"))
    eco=number($("ecoValue").textContent);

  if(soc===null&&$("socValue"))
    soc=number($("socValue").textContent);

  if(eco===null||soc===null) return null;

  return {eco,soc};
}

function saveHistory(coords){
  if(!coords)return;

  try{
    let history=JSON.parse(localStorage.getItem("pc_history")||"[]");

    history=history.filter(x =>
      !(x.eco===coords.eco&&x.soc===coords.soc)
    );

    history.unshift({
      eco:coords.eco,
      soc:coords.soc,
      date:new Date().toISOString()
    });

    history=history.slice(0,10);

    localStorage.setItem(
      "pc_history",
      JSON.stringify(history)
    );
  }catch(e){}
}

function getHistory(){
  try{
    return JSON.parse(
      localStorage.getItem("pc_history")||"[]"
    );
  }catch(e){
    return [];
  }
}

function drawGraph(canvas,a,b){
  if(!canvas)return;

  const cssWidth=Math.min(
    720,
    Math.max(280,canvas.parentElement?.clientWidth||500)
  );

  const dpr=window.devicePixelRatio||1;

  canvas.width=cssWidth*dpr;
  canvas.height=cssWidth*dpr;
  canvas.style.width=cssWidth+"px";
  canvas.style.height=cssWidth+"px";

  const ctx=canvas.getContext("2d");

  ctx.setTransform(dpr,0,0,dpr,0,0);

  const w=cssWidth;
  const h=cssWidth;
  const pad=55;

  ctx.clearRect(0,0,w,h);

  const x=v=>pad+(v+10)*(w-pad*2)/20;
  const y=v=>h-pad-(v+10)*(h-pad*2)/20;

  ctx.strokeStyle="#d1d5db";
  ctx.fillStyle="#111827";
  ctx.lineWidth=1;

  for(let i=-10;i<=10;i+=5){
    ctx.beginPath();
    ctx.moveTo(x(i),y(-10));
    ctx.lineTo(x(i),y(10));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x(-10),y(i));
    ctx.lineTo(x(10),y(i));
    ctx.stroke();
  }

  ctx.lineWidth=2;

  ctx.beginPath();
  ctx.moveTo(x(-10),y(0));
  ctx.lineTo(x(10),y(0));
  ctx.moveTo(x(0),y(-10));
  ctx.lineTo(x(0),y(10));
  ctx.stroke();

  ctx.font="12px sans-serif";

  ctx.fillText("Economic +10",x(10)-75,y(0)-8);
  ctx.fillText("Economic -10",x(-10),y(0)-8);
  ctx.fillText("Social +10",x(0)+8,y(10)+4);
  ctx.fillText("Social -10",x(0)+8,y(-10));

  function point(p,label){
    if(!p)return;

    const px=x(p.eco);
    const py=y(p.soc);

    ctx.beginPath();
    ctx.arc(px,py,7,0,Math.PI*2);
    ctx.fill();

    ctx.font="14px sans-serif";
    ctx.fillText(label,px+10,py-10);
  }

  if(a&&b){
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.moveTo(x(a.eco),y(a.soc));
    ctx.lineTo(x(b.eco),y(b.soc));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  point(a,"Вы");
  point(b,"2");
}

function copy(text){
  if(navigator.clipboard){
    return navigator.clipboard.writeText(text);
  }

  const area=document.createElement("textarea");
  area.value=text;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();

  return Promise.resolve();
}

function installNav(){
  if(document.querySelector(".pc-nav"))return;

  const nav=document.createElement("nav");
  nav.className="pc-nav";

  nav.innerHTML=
    '<a href="/">Тест</a>'+
    '<a href="/methodology.html">Методология</a>'+
    '<a href="/stats.html">Статистика</a>'+
    '<a href="/about.html">О сайте</a>';

  const main=document.querySelector("main");

  if(main)main.prepend(nav);
}

function installResult(){
  const coords=getCoords();

  if(!coords)return;

  saveHistory(coords);

  let box=$("pcEnhancedResult");

  if(!box){
    box=document.createElement("section");
    box.id="pcEnhancedResult";
    box.className="pc-card pc-result";

    const main=document.querySelector("main")||document.body;

    main.prepend(box);
  }

  const url=
    location.origin+
    location.pathname+
    "?e="+
    encodeURIComponent(coords.eco)+
    "&s="+
    encodeURIComponent(coords.soc);

  box.innerHTML=
    '<div class="pc-title">Ваш результат</div>'+
    '<div class="pc-subtitle">Координаты математической модели</div>'+
    '<div class="pc-coords">'+
      '<div class="pc-coordinate">'+
        '<span>Economic</span>'+
        '<strong>'+coords.eco.toFixed(1)+'</strong>'+
      '</div>'+
      '<div class="pc-coordinate">'+
        '<span>Social</span>'+
        '<strong>'+coords.soc.toFixed(1)+'</strong>'+
      '</div>'+
    '</div>'+
    '<canvas id="pcResultCanvas" class="pc-chart"></canvas>'+
    '<div class="pc-actions">'+
      '<button class="pc-btn pc-btn-primary" id="pcCopyCoords">Скопировать координаты</button>'+
      '<button class="pc-btn" id="pcCopyLink">Скопировать ссылку</button>'+
      '<button class="pc-btn" id="pcShare">Поделиться</button>'+
    '</div>';

  drawGraph(
    $("pcResultCanvas"),
    coords,
    null
  );

  $("pcCopyCoords").onclick=async()=>{
    await copy(
      "Economic: "+coords.eco.toFixed(1)+
      "\nSocial: "+coords.soc.toFixed(1)
    );

    $("pcCopyCoords").textContent="Скопировано";
  };

  $("pcCopyLink").onclick=async()=>{
    await copy(url);
    $("pcCopyLink").textContent="Скопировано";
  };

  $("pcShare").onclick=async()=>{
    if(navigator.share){
      await navigator.share({
        title:"Полит-Компас",
        text:"Мой результат Полит-Компаса",
        url:url
      });
    }else{
      await copy(url);
      $("pcShare").textContent="Ссылка скопирована";
    }
  };
}

function installCompare(){
  const main=document.querySelector("main")||document.body;

  let box=$("pcCompare");

  if(!box){
    box=document.createElement("section");
    box.id="pcCompare";
    box.className="pc-card";

    box.innerHTML=
      '<div class="pc-title">Сравнение координат</div>'+
      '<div class="pc-subtitle">Введите координаты второй точки.</div>'+
      '<div class="pc-grid">'+
        '<label>Economic'+
          '<input class="pc-input" id="pcEco2" type="number" min="-10" max="10" step="0.1" placeholder="-10 ... +10">'+
        '</label>'+
        '<label>Social'+
          '<input class="pc-input" id="pcSoc2" type="number" min="-10" max="10" step="0.1" placeholder="-10 ... +10">'+
        '</label>'+
      '</div>'+
      '<div class="pc-actions">'+
        '<button class="pc-btn" id="pcMy">Мои координаты</button>'+
        '<button class="pc-btn pc-btn-primary" id="pcCompareButton">Сравнить</button>'+
        '<button class="pc-btn" id="pcClear">Очистить</button>'+
      '</div>'+
      '<div id="pcCompareOutput" class="pc-notice"></div>'+
      '<canvas id="pcCompareCanvas" class="pc-chart"></canvas>';

    main.appendChild(box);
  }

  const my=getCoords();

  if(!my)return;

  $("pcMy").onclick=()=>{
    $("pcEco2").value=my.eco.toFixed(1);
    $("pcSoc2").value=my.soc.toFixed(1);

    $("pcCompareOutput").textContent=
      "Ваши координаты подставлены. Измените их на координаты второй точки.";

    drawGraph(
      $("pcCompareCanvas"),
      my,
      my
    );
  };

  $("pcCompareButton").onclick=()=>{
    const eco=number($("pcEco2").value);
    const soc=number($("pcSoc2").value);

    if(eco===null||soc===null){
      $("pcCompareOutput").textContent=
        "Введите обе координаты от −10 до +10.";
      return;
    }

    const second={eco,soc};

    const dx=second.eco-my.eco;
    const dy=second.soc-my.soc;
    const distance=Math.hypot(dx,dy);

    $("pcCompareOutput").textContent=
      "Расстояние: "+
      distance.toFixed(2)+
      " · Δ Economic: "+
      dx.toFixed(1)+
      " · Δ Social: "+
      dy.toFixed(1);

    drawGraph(
      $("pcCompareCanvas"),
      my,
      second
    );
  };

  $("pcClear").onclick=()=>{
    $("pcEco2").value="";
    $("pcSoc2").value="";
    $("pcCompareOutput").textContent="";

    const c=$("pcCompareCanvas");

    if(c){
      c.getContext("2d").clearRect(
        0,0,c.width,c.height
      );
    }
  };
}

function installHistory(){
  const history=getHistory();

  if(!history.length)return;

  let box=$("pcHistory");

  if(!box){
    box=document.createElement("section");
    box.id="pcHistory";
    box.className="pc-card";

    const main=document.querySelector("main")||document.body;

    main.appendChild(box);
  }

  box.innerHTML=
    '<div class="pc-title">История результатов</div>'+
    '<div class="pc-subtitle">Хранится только в браузере.</div>';

  history.forEach(item=>{
    const row=document.createElement("div");
    row.className="pc-history-item";

    const date=new Date(item.date);

    row.innerHTML=
      '<span>'+
      date.toLocaleDateString()+
      '</span>'+
      '<strong>'+
      item.eco.toFixed(1)+
      ' / '+
      item.soc.toFixed(1)+
      '</strong>';

    box.appendChild(row);
  });

  const clear=document.createElement("button");

  clear.className="pc-btn";
  clear.textContent="Очистить историю";

  clear.onclick=()=>{
    localStorage.removeItem("pc_history");
    box.remove();
  };

  box.appendChild(clear);
}

function installMobileSafe(){
  window.addEventListener("resize",()=>{
    const coords=getCoords();

    if(!coords)return;

    const resultCanvas=$("pcResultCanvas");

    if(resultCanvas)
      drawGraph(resultCanvas,coords,null);
  });
}

function registerSW(){
  if(!("serviceWorker" in navigator))return;

  navigator.serviceWorker.register(
    "/sw.js?v=4",
    {scope:"/"}
  ).then(reg=>{
    reg.update().catch(()=>{});
  }).catch(()=>{});
}

function boot(){
  installNav();
  installResult();
  installCompare();
  installHistory();
  installMobileSafe();
  registerSW();

  /*
   * Автосохранение результата после завершения теста.
   * Проверяем URL каждые 500 мс первые 20 секунд.
   */
  let tries=0;

  const timer=setInterval(()=>{
    installResult();

    tries++;

    if(tries>=40)
      clearInterval(timer);
  },500);
}

if(document.readyState==="loading")
  document.addEventListener("DOMContentLoaded",boot);
else
  boot();

})();
