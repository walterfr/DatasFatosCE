---
title: Explorador Interativo, Filtros e Estatísticas
hide:
  - navigation
  - toc
---

# Explorador Interativo, Filtros Temáticos & Fichário (2014–2025)

Filtre simultaneamente os **896 verbetes** dos 12 volumes por **Eixo Temático** (Necrologia, Esportes, Legislação e Toponímia, Política e Instituições, Cultura/Educação/Religião, Infraestrutura/Saúde), **Ano**, **Mês** ou **Palavra-chave**, visualize os gráficos da coleção e monte seu **Fichário de Pesquisa** para exportação em Markdown.

<div id="ef-app-root" class="ef-wrapper">
  <div class="ef-subtabs">
    <button type="button" id="ef-tab-busca" class="ef-subtab active" onclick="window.efSwitchSubtab('busca')">
      Filtro Cruzado de Verbetes (896)
    </button>
    <button type="button" id="ef-tab-graficos" class="ef-subtab" onclick="window.efSwitchSubtab('graficos')">
      Painel Quantitativo &amp; Gráficos
    </button>
    <button type="button" id="ef-tab-fichario" class="ef-subtab" onclick="window.efSwitchSubtab('fichario')">
      Fichário de Pesquisa (<span id="ef-badge-fichario">0</span>)
    </button>
  </div>

  <div id="ef-view-busca">
    <div class="ef-card">
      <div class="ef-label">Volume Anual</div>
      <div id="ef-year-buttons" class="ef-btn-group"></div>

      <div class="ef-grid-controls">
        <div class="ef-search-box">
          <input id="ef-search-input" type="text" placeholder="Pesquisar por nome, município, lei (ex: 17.165), clube, Sereia de Ouro..." oninput="window.efHandleSearch(this.value)" />
        </div>
        <div class="ef-select-box">
          <select id="ef-category-select" onchange="window.efSelectCategory(this.value)">
            <option value="all">Todos os Eixos Temáticos (6)</option>
            <option value="Política e Instituições">Política e Instituições</option>
            <option value="Infraestrutura, Saúde e Sociedade">Infraestrutura, Saúde e Sociedade</option>
            <option value="Cultura, Educação e Religião">Cultura, Educação e Religião</option>
            <option value="Legislação e Toponímia">Legislação e Toponímia</option>
            <option value="Necrologia">Necrologia / Obituários</option>
            <option value="Esportes">Esportes Cearenses</option>
          </select>
        </div>
        <div class="ef-action-box">
          <button type="button" class="ef-btn ef-btn-primary" onclick="window.efExportFiltered()">Copiar Recorte (.md)</button>
          <button type="button" class="ef-btn ef-btn-outline" onclick="window.efResetFilters()">Redefinir</button>
        </div>
      </div>

      <div class="ef-label" style="margin-top:0.85rem;">Filtro Mensal (Janeiro a Dezembro)</div>
      <div id="ef-month-buttons" class="ef-btn-group"></div>

      <div class="ef-status-bar">
        <span id="ef-status-text">Carregando acervo...</span>
        <label class="ef-checkbox-label">
          <input type="checkbox" id="ef-chk-links" onchange="window.efToggleLinks(this.checked)" />
          <span>Apenas verbetes com link de fonte primária</span>
        </label>
      </div>
    </div>

    <div id="ef-entries-list" class="ef-entries-container"></div>
  </div>

  <div id="ef-view-graficos" style="display:none;">
    <div class="ef-kpi-grid">
      <div class="ef-kpi-card">
        <div class="ef-kpi-title">Total de Efemérides</div>
        <div class="ef-kpi-value" id="ef-kpi-total">896</div>
        <div class="ef-kpi-sub">Padrão M. A. Azevedo (Nirez)</div>
      </div>
      <div class="ef-kpi-card">
        <div class="ef-kpi-title">Cobertura Temporal</div>
        <div class="ef-kpi-value" id="ef-kpi-months">144 meses</div>
        <div class="ef-kpi-sub">2014 a 2025 (100% dos meses)</div>
      </div>
      <div class="ef-kpi-card">
        <div class="ef-kpi-title">Necrologia Histórica</div>
        <div class="ef-kpi-value" id="ef-kpi-necro">185</div>
        <div class="ef-kpi-sub">Registros biográficos e obituários</div>
      </div>
      <div class="ef-kpi-card">
        <div class="ef-kpi-title">Toponímia &amp; Esportes</div>
        <div class="ef-kpi-value" id="ef-kpi-leis">332</div>
        <div class="ef-kpi-sub">232 atos/leis • 100 marcos esportivos</div>
      </div>
    </div>

    <div class="ef-charts-grid">
      <div class="ef-card">
        <h3 style="margin-top:0;">Verbetes por Volume Anual (2014–2025)</h3>
        <p style="font-size:0.8rem;opacity:0.75;margin-bottom:0.75rem;">Clique em uma barra para filtrar diretamente os verbetes daquele ano.</p>
        <div style="position:relative;height:290px;">
          <canvas id="ef-chart-years"></canvas>
        </div>
      </div>
      <div class="ef-card">
        <h3 style="margin-top:0;">Ocorrências por Eixo Temático</h3>
        <p style="font-size:0.8rem;opacity:0.75;margin-bottom:0.75rem;">Clique em qualquer eixo para filtrar todos os verbetes correspondentes.</p>
        <div style="position:relative;height:290px;">
          <canvas id="ef-chart-cats"></canvas>
        </div>
      </div>
    </div>
  </div>

  <div id="ef-view-fichario" style="display:none;">
    <div class="ef-card">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;margin-bottom:1rem;">
        <div>
          <h3 style="margin:0;">Fichário Pessoal de Citações</h3>
          <p style="margin:0.2rem 0 0 0;font-size:0.82rem;opacity:0.8;">Salve verbetes de diferentes anos clicando em "☆ Fichar" e copie todos de uma vez em formato Markdown.</p>
        </div>
        <div style="display:flex;gap:0.5rem;">
          <button type="button" class="ef-btn ef-btn-primary" onclick="window.efExportBookmarks()">Copiar Fichário (.md)</button>
          <button type="button" class="ef-btn ef-btn-outline" onclick="window.efClearBookmarks()">Limpar Fichário</button>
        </div>
      </div>
      <div id="ef-fichario-list"></div>
    </div>
  </div>

  <div id="ef-toast" class="ef-toast" style="display:none;"></div>
</div>
