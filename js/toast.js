// ============================================================
// Sistema de notificaciones (toast) — Rental Baxtter
// Aparecen por el costado, fondo blanco y texto negro.
// Accesible (role="alert" / aria-live). Compartido entre
// index.html y admin.html.
// ============================================================
(function () {
    'use strict';

    // Contenedor único donde se apilan los toasts
    function getContainer() {
        let cont = document.getElementById('hz-toast-container');
        if (!cont) {
            cont = document.createElement('div');
            cont.id = 'hz-toast-container';
            cont.setAttribute('aria-live', 'polite');
            cont.setAttribute('aria-atomic', 'false');
            document.body.appendChild(cont);
        }
        return cont;
    }

    // Íconos por tipo (lucide). Sin exponer detalles técnicos.
    const ICONS = {
        success: 'check-circle',
        error: 'alert-circle',
        info: 'info'
    };

    /**
     * Muestra una notificación tipo toast.
     * @param {string} message  Texto a mostrar (texto plano, se escapa).
     * @param {('success'|'error'|'info')} [type='info']
     * @param {number} [duration=4500] ms antes de auto-cerrarse.
     */
    function hzToast(message, type, duration) {
        type = ICONS[type] ? type : 'info';
        duration = typeof duration === 'number' ? duration : 4500;

        const container = getContainer();

        const toast = document.createElement('div');
        toast.className = 'hz-toast hz-toast-' + type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', ICONS[type]);
        icon.className = 'hz-toast-icon';

        const text = document.createElement('p');
        text.className = 'hz-toast-text';
        text.textContent = String(message == null ? '' : message);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'hz-toast-close';
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');
        closeBtn.innerHTML = '&times;';

        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Animación de entrada
        requestAnimationFrame(() => toast.classList.add('hz-toast-show'));

        let timer = null;
        const dismiss = () => {
            if (timer) clearTimeout(timer);
            toast.classList.remove('hz-toast-show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            // Respaldo por si no dispara transitionend
            setTimeout(() => toast.remove(), 400);
        };

        closeBtn.addEventListener('click', dismiss);
        if (duration > 0) timer = setTimeout(dismiss, duration);
        
        let startX = null;
        
        toast.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            toast.style.transition = 'none';
        }, { passive: true });
        
        toast.addEventListener('touchmove', (e) => {
            if (startX === null) return;
            const currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            if (diffX > 0) {
                toast.style.transform = `translateX(${diffX}px)`;
                toast.style.opacity = Math.max(0, 1 - diffX / 150);
            }
        }, { passive: true });
        
        toast.addEventListener('touchend', (e) => {
            if (startX === null) return;
            const currentX = e.changedTouches[0].clientX;
            const diffX = currentX - startX;
            startX = null;
            
            toast.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
            if (diffX > 60) {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
                setTimeout(dismiss, 200);
            } else {
                toast.style.transform = '';
                toast.style.opacity = '';
            }
        });

        return toast;
    }

    // Exponer globalmente
    window.hzToast = hzToast;

    // Compatibilidad con el código existente: mostrarAlerta(mensaje, esExito)
    window.mostrarAlerta = function (mensaje, esExito) {
        hzToast(mensaje, esExito ? 'success' : 'error');
    };

    // ============================================================
    // Confirmación lateral (reemplaza el confirm() nativo centrado)
    // Devuelve una Promesa que resuelve true (confirmar) / false (cancelar)
    // ============================================================
    function hzConfirm(message, opts) {
        opts = opts || {};
        const confirmText = opts.confirmText || 'Confirmar';
        const cancelText = opts.cancelText || 'Cancelar';

        return new Promise(function (resolve) {
            const container = getContainer();

            const card = document.createElement('div');
            card.className = 'hz-toast hz-toast-confirm';
            card.setAttribute('role', 'alertdialog');

            const text = document.createElement('p');
            text.className = 'hz-toast-text';
            text.textContent = String(message == null ? '' : message);

            const actions = document.createElement('div');
            actions.className = 'hz-toast-confirm-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'hz-toast-btn';
            cancelBtn.textContent = cancelText;

            const okBtn = document.createElement('button');
            okBtn.type = 'button';
            okBtn.className = 'hz-toast-btn hz-toast-btn-primary';
            okBtn.textContent = confirmText;

            actions.appendChild(cancelBtn);
            actions.appendChild(okBtn);
            card.appendChild(text);
            card.appendChild(actions);
            container.appendChild(card);

            requestAnimationFrame(() => card.classList.add('hz-toast-show'));

            let done = false;
            const close = function (val) {
                if (done) return;
                done = true;
                card.classList.remove('hz-toast-show');
                card.addEventListener('transitionend', () => card.remove(), { once: true });
                setTimeout(() => card.remove(), 400);
                resolve(val);
            };

            cancelBtn.addEventListener('click', () => close(false));
            okBtn.addEventListener('click', () => close(true));
            okBtn.focus();
        });
    }
    window.hzConfirm = hzConfirm;

    // ============================================================
    // Reemplazo de la validación nativa del navegador
    // ("Complete este campo") por un toast lateral más claro
    // ============================================================
    function getFieldLabel(el) {
        if (el.labels && el.labels.length) return el.labels[0].textContent.trim();
        const group = el.closest('.form-group, .admin-form-group');
        if (group) {
            const l = group.querySelector('label');
            if (l) return l.textContent.trim();
        }
        return el.getAttribute('placeholder') || '';
    }

    function validationMessage(el) {
        const label = getFieldLabel(el);
        const v = el.validity || {};
        if (v.valueMissing) {
            return label ? `Completá el campo "${label}".` : 'Completá los campos obligatorios.';
        }
        if (v.typeMismatch && el.type === 'email') return 'Ingresá un email válido.';
        if (v.tooShort) return label ? `"${label}" es demasiado corto.` : 'El valor es demasiado corto.';
        if (v.patternMismatch) return label ? `Revisá el formato de "${label}".` : 'Revisá el formato.';
        return label ? `Revisá el campo "${label}".` : 'Revisá los datos ingresados.';
    }

    let invalidPending = false;
    document.addEventListener('invalid', function (e) {
        // Suprime el globo nativo centrado del navegador
        e.preventDefault();
        const el = e.target;
        if (!invalidPending) {
            invalidPending = true;
            if (el && typeof el.focus === 'function') el.focus();
            hzToast(validationMessage(el), 'info');
            setTimeout(() => { invalidPending = false; }, 250);
        }
    }, true);
})();
