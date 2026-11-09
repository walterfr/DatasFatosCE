# Datas e Fatos para a História do Ceará (2014–2025) — MkDocs Material + Explorador Interativo

Repositório híbrido estruturado nativamente em **[MkDocs Material](https://squidfunk.github.io/mkdocs-material/)** com **Explorador Interativo, Filtros por Eixo Temático, Gráficos Estatísticos e Fichário de Pesquisa** integrados, pronto para publicação em **[https://walterfr.github.io/DatasFatosCE/](https://walterfr.github.io/DatasFatosCE/)** a partir de **[https://github.com/walterfr/DatasFatosCE](https://github.com/walterfr/DatasFatosCE)**.

## O Melhor dos Dois Mundos

1. **Páginas Individuais em Markdown (`docs/2014.md` a `docs/2025.md`):** Cada ano tem sua própria URL, sumário lateral automático de janeiro a dezembro, indexação completa no Google e edição simples em texto puro.
2. **Aba "Explorador & Filtros" (`docs/explorador.md`):** Permite cruzar filtros nos 896 verbetes (isolar apenas *Necrologia*, *Esportes*, *Legislação e Toponímia*, *Política e Instituições*, etc.), visualizar gráficos interativos (Chart.js) e salvar verbetes no **Fichário de Pesquisa**.
3. **Sincronização 100% Automática (`scripts/update_acervo_from_md.py`):** Sempre que você editar qualquer arquivo `docs/20XX.md` (ou criar `docs/2026.md`), a GitHub Action roda automaticamente o script `scripts/update_acervo_from_md.py` antes de publicar o site, atualizando sozinho o banco de dados do Explorador Interativo e os gráficos!

## Como Publicar em `github.com/walterfr/DatasFatosCE`

1. Extraia o pacote `DatasFatosCE-mkdocs-material.zip` e envie os arquivos para a branch `main` do repositório `https://github.com/walterfr/DatasFatosCE`:

```bash
unzip DatasFatosCE-mkdocs-material.zip -d DatasFatosCE-mkdocs
cd DatasFatosCE-mkdocs
git init
git branch -M main
git remote add origin https://github.com/walterfr/DatasFatosCE.git
git add .
git commit -m "Publica MkDocs Material com Explorador Interativo integrado (2014-2025)"
git push -u origin main
```

2. No GitHub, acesse **Settings → Actions → General → Workflow permissions** e selecione **Read and write permissions** (clique em *Save*).
3. Após a conclusão do workflow na aba **Actions**, acesse **Settings → Pages** e selecione **Deploy from a branch → Branch: `gh-pages` / `/(root)`**.
