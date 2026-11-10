(() => {
'use strict';

let figures = [];

const esc = v => String(v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

const distance = (a,b) =>
    Math.sqrt(
        Math.pow(Number(a.eco)-Number(b.eco),2) +
        Math.pow(Number(a.soc)-Number(b.soc),2)
    );

const percent = d => Math.max(0, Math.round(100-d*2));

function findResult() {
    const selectors = [
        '#result',
        '#results',
        '#result-screen',
        '#resultSection',
        '.result',
        '.results'
    ];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) return el;
    }

    return null;
}

function createBlock() {
    let block = document.getElementById('figures-comparison');

    if (block) return block;

    block = document.createElement('section');
    block.id = 'figures-comparison';

    block.style.cssText = `
        margin-top:24px;
        padding:20px;
        background:var(--card-bg,#fff);
        border:1px solid var(--border,#d1d5db);
        border-radius:4px;
        color:var(--text,#111827);
        box-sizing:border-box;
    `;

    const result = findResult();

    if (result) {
        result.appendChild(block);
    } else {
        document.body.appendChild(block);
    }

    return block;
}

function card(item) {
    const f = item.figure;
    const el = document.createElement('div');

    el.style.cssText = `
        border:1px solid var(--border,#d1d5db);
        padding:12px;
        border-radius:4px;
        background:var(--card-bg,#fff);
        box-sizing:border-box;
    `;

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:7px">
            <strong>${esc(f.name)}</strong>
            <strong>${item.percent}%</strong>
        </div>
        <div style="font-size:13px;color:var(--muted,#6b7280);margin-bottom:7px">
            ${esc(f.country)}
        </div>
        <div style="font-size:13px;margin-bottom:8px">
            Eco: ${f.eco >= 0 ? '+' : ''}${f.eco}
            &nbsp;·&nbsp;
            Soc: ${f.soc >= 0 ? '+' : ''}${f.soc}
        </div>
        <div style="font-size:13px;line-height:1.45;color:var(--muted,#6b7280)">
            ${esc(f.description)}
        </div>
    `;

    return el;
}

function render(eco,soc) {
    eco = Number(eco);
    soc = Number(soc);

    if (!Number.isFinite(eco) || !Number.isFinite(soc) || !figures.length) {
        return;
    }

    const result = findResult();
    if (!result) return;

    const existing = document.getElementById('figures-comparison');
    if (existing && existing.dataset.eco === String(eco) && existing.dataset.soc === String(soc)) {
        return;
    }

    const calculated = figures.map(figure => {
        const d = distance({eco,soc},figure);
        return {
            figure,
            distance:d,
            percent:percent(d)
        };
    });

    const closest = [...calculated]
        .sort((a,b) => a.distance-b.distance)
        .slice(0,3);

    const opposite = [...calculated]
        .sort((a,b) => b.distance-a.distance)
        .slice(0,3);

    const block = createBlock();

    block.dataset.eco = String(eco);
    block.dataset.soc = String(soc);

    block.innerHTML = `
        <h2 style="margin:0 0 7px;font-size:20px;font-weight:600">
            Похожие фигуры
        </h2>

        <div style="font-size:12px;line-height:1.45;color:var(--muted,#6b7280);margin-bottom:18px">
            Координаты фигур являются справочными точками для визуального сравнения,
            а не точными научными измерениями.
        </div>

        <h3 style="margin:0 0 10px;font-size:15px">
            Наиболее близкие
        </h3>

        <div id="figures-close"
             style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        </div>

        <h3 style="margin:22px 0 10px;font-size:15px">
            Наиболее далёкие
        </h3>

        <div id="figures-opposite"
             style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        </div>
    `;

    const close = block.querySelector('#figures-close');
    const far = block.querySelector('#figures-opposite');

    closest.forEach(x => close.appendChild(card(x)));
    opposite.forEach(x => far.appendChild(card(x)));
}

function tryFromUrl() {
    const p = new URLSearchParams(location.search);

    if (!p.has('e') || !p.has('s')) return;

    const e = Number(p.get('e'));
    const s = Number(p.get('s'));

    if (Number.isFinite(e) && Number.isFinite(s)) {
        render(e,s);
    }
}

function tryFromText() {
    const result = findResult();
    if (!result) return;

    const text = result.innerText || '';

    const ecoMatch = text.match(/Eco\s*[:=]\s*([+-]?\d+(?:\.\d+)?)/i);
    const socMatch = text.match(/Soc\s*[:=]\s*([+-]?\d+(?:\.\d+)?)/i);

    if (ecoMatch && socMatch) {
        render(Number(ecoMatch[1]),Number(socMatch[1]));
    }
}

async function init() {
    try {
        const response = await fetch('/data/figures.json',{
            headers:{'Accept':'application/json'},
            cache:'no-cache'
        });

        if (!response.ok) throw new Error('HTTP '+response.status);

        const data = await response.json();

        if (!Array.isArray(data)) throw new Error('Invalid API response');

        figures = data;

        window.PoliticalCompassFigures = { render };

        tryFromUrl();

        window.addEventListener('political-compass-result',e => {
            if (e.detail) {
                render(e.detail.eco,e.detail.soc);
            }
        });

        setTimeout(tryFromText,300);
        setTimeout(tryFromText,1000);
        setTimeout(tryFromText,2000);
        setTimeout(tryFromText,4000);

        const observer = new MutationObserver(() => {
            if (!document.getElementById('figures-comparison')) {
                tryFromUrl();
                tryFromText();
            }
        });

        observer.observe(document.body,{
            childList:true,
            subtree:true
        });

        console.log('Полит-Компас: загружено фигур:',figures.length);
    } catch (error) {
        console.error('Ошибка загрузки политических фигур:',error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init);
} else {
    init();
}
})();
