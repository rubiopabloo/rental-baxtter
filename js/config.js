// Configuración de Supabase
const SUPABASE_URL = 'https://gayfmyemgzbzqxqlfanw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheWZteWVtZ3pienF4cWxmYW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDcxMDgsImV4cCI6MjA5NzY4MzEwOH0.LPfjLnEuNQ4iUoOZHf374WgOMmawGkinD-Q0m-nMDn8';

// Clave VAPID para notificaciones push
// Reemplazar con tu clave publica real:
const VAPID_PUBLIC_KEY = 'BC7Osq7Ha5nnz8e6X8rWD1nF71D96q0DlHem3lJVKnRZp_7CzvznbwUKP4hjaxO9HraAOaZmgzPsTg9QYjgHpzM';

// Initialize Supabase Client globally
let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('TU_PROYECTO')) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ---- HAZE DevTools Branding (HAZE-WEB-STANDARD §1) ----
(function hazeSignature() {
    const rows = [
        '##   ##   #####    #######  #######',
        '##   ##  ##   ##      ###   ##     ',
        '#######  #######     ###    ###### ',
        '##   ##  ##   ##    ###     ##     ',
        '##   ##  ##   ##   #######  #######'
    ];
    const base = 'font-size:15px;line-height:1.25;';
    let fmt = '\n';
    const styles = [];
    rows.forEach(row => {
        let i = 0;
        while (i < row.length) {
            const on = row[i] === '#';
            let j = i;
            while (j < row.length && (row[j] === '#') === on) j++;
            fmt += '%c' + '●'.repeat(j - i);
            styles.push(base + (on ? 'color:#213f95;' : 'color:transparent;'));
            i = j;
        }
        fmt += '\n';
    });
    console.log(fmt, ...styles);
    console.log(
        '%c Desarrollado por HAZE %c Soluciones digitales para PyMEs · @hazesolutions',
        'background:#213f95;color:#ffffff;font-size:12px;font-weight:bold;padding:5px 12px;border-radius:6px 0 0 6px;',
        'background:#a1e1bc;color:#213f95;font-size:12px;font-weight:600;padding:5px 12px;border-radius:0 6px 6px 0;'
    );
    console.log(
        '%c⚠ Esta consola es para desarrolladores. No pegues código que no entiendas: podría comprometer tu información.',
        'color:#e24b4a;font-size:11px;font-weight:bold;'
    );
})();

document.addEventListener('copy', (e) => {
    const tagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (['input', 'textarea', 'select'].includes(tagName)) {
        return; // Allow copy
    }
    e.preventDefault();
});

document.addEventListener('contextmenu', (e) => {
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        e.preventDefault();
    }
});
