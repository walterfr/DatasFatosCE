#!/usr/bin/env python3
"""Lê todos os arquivos docs/20*.md e gera docs/javascripts/acervo_data.js automaticamente.
Executado automaticamente pelo GitHub Actions antes do `mkdocs gh-deploy` para que qualquer
edição nos arquivos .md atualize também o Explorador Interativo, os filtros e os gráficos.
"""
import os, re, json, glob

MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

DRIVE_IDS = {
    "manual": "13vnzltpGelUU8-kjBJNAsIpr1T_1W4KejKguA13-CBU",
    "folder": "1Y6mZxoxTUsz_T5QI_Rs4Td39n5o4PsA9",
    "2014": "1XS3R49YVmLzxk4axCmL-6r33eMfBKEL5FKqD5IaCXro",
    "2015": "1BAc-pqBrZYLcBCR3U6mA8N6pfTmvuUDXWEuc5Whuavc",
    "2016": "1xVQ_kHpG37sNhvRJ2vSoZ3TdOZW07vDGltwYsHKHNhM",
    "2017": "1iLtuvyWpb1xbYLMB3TVYjRjd1whldNigwPPqgVTiRjY",
    "2018": "1kT19yMvXrzxwD7QrLoomzafrdE8h8jJrhMnYfIkiVgc",
    "2019": "1em3AblyGISuT_XFB0CbxVx3JI_odjl1oxhgUfnAIhQQ",
    "2020": "1r9W2qpTkrWsR0C1rWbdke0ZJj1KMGpEn7TrjMdq2SQg",
    "2021": "1egaOiby896ia-FVP7T7W33xBe7CxTd-AIpTFaJ6FRm0",
    "2022": "1axAEkcfsJufm1G-I3hUmiTW1sWWhSNFThkJwIPiETHw",
    "2023": "1qOwSkbD7x296h0EUcF_y2pjupZfD2ZU7vzbjIKiLdVU",
    "2024": "1yJDGJUHxiYrFMM86cUyqo83kr3QWcEyBBlvEryoVofQ",
    "2025": "1MELvgRIaPXpADStPZuWqA0dYwVU2DPmcgUaMkby6O8Q",
}

def md_to_html(md_text):
    # Convert markdown links [text](url)
    s = re.sub(
        r"\[([^\]]+)\]\((https?://[^\s)]+)\)",
        r'<a href="\2" target="_blank" rel="noopener noreferrer" class="ef-link">\1</a>',
        md_text
    )
    # Bold + Italic
    s = re.sub(r"\*\*\*([^*]+)\*\*\*", r"<strong><em>\1</em></strong>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\*([^*\n]+)\*", r"<em>\1</em>", s)
    # Bullet sub-items
    lines = s.split("\n")
    out_lines = []
    in_list = False
    for line in lines:
        if re.match(r"^\s*-\s+", line):
            if not in_list:
                out_lines.append("<ul class='ef-sublist'>")
                in_list = True
            item_txt = re.sub(r"^\s*-\s+", "", line).strip()
            out_lines.append(f"<li>{item_txt}</li>")
        else:
            if in_list:
                out_lines.append("</ul>")
                in_list = False
            if line.strip():
                out_lines.append(line.strip())
    if in_list:
        out_lines.append("</ul>")
    return "<br>".join(out_lines).replace("<ul class='ef-sublist'><br>", "<ul class='ef-sublist'>").replace("</li><br><li>", "</li><li>").replace("</li><br></ul>", "</li></ul>")

def classify_entry(text):
    t = text.lower()
    cats = []
    if re.search(r"\b(morre|falece|falecimento|óbito|sepultad[oa]|vítima fatal|necrológio)\b", t):
        cats.append("Necrologia")
    if re.search(r"\b(campeão|campeã|bicampeão|tricampeão|tetracampeão|pentacampeão|copa do nordeste|campeonato cearense|taça fares lopes|taça padre cícero|taça dos campeões|série [abcd]|sul-americana|arena castelão|estádio presidente vargas|estádio domingão|futebol|clube|ferroviário|fortaleza esporte clube|ceará sporting club|icasa|guarany de sobral|floresta esporte clube)\b", t):
        cats.append("Esportes")
    if re.search(r"\b(denomina|lei estadual nº|lei municipal nº|lei ordinária|lei complementar|decreto legislativo|toponímia|dá nome|passa a denominar-se)\b", t):
        cats.append("Legislação e Toponímia")
    if re.search(r"\b(toma posse|tomam posse|eleito|eleita|reeleito|reeleita|eleições|1º turno|2º turno|prefeito|governador|governadora|assembl[eé]ia legislativa|câmara municipal|tribunal de justiça|oab-ce|procurador-geral|reitor|diplomação)\b", t):
        cats.append("Política e Instituições")
    if re.search(r"\b(sereia de ouro|medalha da abolição|academia cearense|instituto do ceará|romaria|arcebispo|bispo|festival|theatro|museu|livro|cultura|universidade|ufc|uece|unifor|urca|uva|escola|eeep)\b", t):
        cats.append("Cultura, Educação e Religião")
    if not cats or re.search(r"\b(inaugura|hospital|covid-19|lockdown|salário mínimo|rodovia|açude|transposição|metrô|vlt|aeroporto|hub|motim|segurança|chacina|operação)\b", t):
        if "Infraestrutura, Saúde e Sociedade" not in cats:
            cats.append("Infraestrutura, Saúde e Sociedade")
    return cats

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(base_dir, "docs")
    md_files = sorted(glob.glob(os.path.join(docs_dir, "[0-9][0-9][0-9][0-9].md")))

    years_summary = []
    entries_flat = []
    cat_totals = {}
    seq = 1

    for mf in md_files:
        yr_str = os.path.splitext(os.path.basename(mf))[0]
        yr = int(yr_str)
        content = open(mf, "r", encoding="utf-8").read()
        current_month = None
        yr_count = 0
        lines = content.splitlines()
        cur_entry = None

        def flush_entry(e):
            nonlocal yr_count
            if not e:
                return
            md_body = "\n".join(e["md_lines"]).strip()
            plain_txt = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md_body)
            plain_txt = re.sub(r"[*_`#>-]", "", plain_txt)
            plain_txt = re.sub(r"\s+", " ", plain_txt).strip()
            cats = classify_entry(plain_txt)
            for c in cats:
                cat_totals[c] = cat_totals.get(c, 0) + 1
            html_body = md_to_html(md_body)
            has_links = 1 if ("<a " in html_body) else 0
            entries_flat.append({
                "id": e["id"],
                "y": yr,
                "m": e["monthIndex"],
                "d": e["day"],
                "h": html_body,
                "c": cats,
                "l": has_links
            })
            yr_count += 1

        for line in lines:
            m_hdr = re.match(r"^##\s+([A-Za-zçÇãõáéíóúÁÉÍÓÚ]+)\s*/\s*(\d{4})", line.strip())
            if m_hdr:
                flush_entry(cur_entry)
                cur_entry = None
                m_name = m_hdr.group(1)
                if m_name in MONTH_NAMES:
                    current_month = m_name
                continue
            if current_month is None:
                continue
            day_match = re.match(r"^\*\*(\d{1,2}(?:\s*(?:a|e|,)\s*\d{1,2})*)\*\*\s*[—–-]\s*(.+)$", line.strip())
            if day_match:
                flush_entry(cur_entry)
                m_idx = MONTH_NAMES.index(current_month) + 1
                cur_entry = {
                    "id": f"ce-{yr}-{m_idx:02d}-{seq:04d}",
                    "monthIndex": m_idx,
                    "day": day_match.group(1).strip(),
                    "md_lines": [day_match.group(2).strip()]
                }
                seq += 1
            elif cur_entry is not None and line.strip():
                cur_entry["md_lines"].append(line)

        flush_entry(cur_entry)
        drive_id = DRIVE_IDS.get(yr_str, "")
        drive_url = f"https://docs.google.com/document/d/{drive_id}/edit" if drive_id else f"https://drive.google.com/drive/folders/{DRIVE_IDS['folder']}"
        years_summary.append({
            "year": yr,
            "driveUrl": drive_url,
            "githubMdUrl": f"https://github.com/walterfr/DatasFatosCE/blob/main/docs/{yr}.md",
            "pageUrl": f"../{yr}/",
            "entryCount": yr_count
        })

    payload = {
        "project": "Datas e Fatos para a História do Ceará",
        "repository": "https://github.com/walterfr/DatasFatosCE",
        "driveFolderUrl": f"https://drive.google.com/drive/folders/{DRIVE_IDS['folder']}",
        "totalEntries": len(entries_flat),
        "totalYears": len(years_summary),
        "totalMonths": len(years_summary) * 12,
        "categoryTotals": cat_totals,
        "years": years_summary,
        "entries": entries_flat
    }

    out_js = os.path.join(docs_dir, "javascripts", "acervo_data.js")
    os.makedirs(os.path.dirname(out_js), exist_ok=True)
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("window.ACERVO_RAW_DATA = ")
        f.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
        f.write(";\n")
    print(f"Synced {len(entries_flat)} entries across {len(years_summary)} years into {out_js}")

if __name__ == "__main__":
    main()
