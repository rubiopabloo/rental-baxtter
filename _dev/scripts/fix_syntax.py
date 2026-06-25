import os

with open('js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

bad_code = """const btnDownloadAllEl = document.getElementById(\\'btn-download-all-images\\');
if (btnDownloadAllEl) {
    btnDownloadAllEl.addEventListener
    btnDownloadAll.addEventListener('click', async () => {"""

good_code = """if (btnDownloadAll) {
    btnDownloadAll.addEventListener('click', async () => {"""

js = js.replace(bad_code, good_code)

bad_inner = """const btnOriginalText = btnDownloadAllEl.innerHTML;
        btnDownloadAllEl.innerHTML ="""
good_inner = """const btnOriginalText = btnDownloadAll.innerHTML;
        btnDownloadAll.innerHTML ="""
js = js.replace(bad_inner, good_inner)

js = js.replace('btnDownloadAllEl.innerHTML = btnOriginalText;', 'btnDownloadAll.innerHTML = btnOriginalText;')

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)
