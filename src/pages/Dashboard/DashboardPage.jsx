// src/pages/Dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react'; // useState e useEffect podem ser removidos após confirmação
// 1. Importar useQuery
import { useQuery } from '@tanstack/react-query';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
// Importa as funções da API diretamente
import { fetchDashboardSummary, fetchPlacasPorRegiaoReport } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { generateColors } from '../../utils/charts';
import './Dashboard.css'; // O CSS já está importado corretamente

// Regista elementos Chart.js (inalterado)
ChartJS.register( ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title );

function DashboardPage() {
  const showToast = useToast();

  // --- 2. useQuery para Dados do Resumo ---
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: errorSummary,
  } = useQuery({
    queryKey: ['dashboardSummary'], // Chave para o cache do resumo
    queryFn: fetchDashboardSummary, // Função da API
    staleTime: 1000 * 60 * 2, // Exemplo: Cache de 2 minutos para o resumo
    placeholderData: { totalPlacas: '...', placasDisponiveis: '...', regiaoPrincipal: '...' } // Dados placeholder
  });

  // --- 3. useQuery para Dados dos Gráficos ---
  const {
    data: reportData, // Dados brutos do relatório
    isLoading: isLoadingChart,
    isError: isErrorChart,
    error: errorChart,
  } = useQuery({
    queryKey: ['placasPorRegiaoReport'], // Chave para o cache do relatório
    queryFn: fetchPlacasPorRegiaoReport, // Função da API
    staleTime: 1000 * 60 * 10, // Exemplo: Cache de 10 minutos para o relatório
    placeholderData: [] // Array vazio como placeholder
  });

  // --- 4. Processamento dos Dados do Gráfico (quando disponíveis) ---
  // Usamos useState para guardar os dados formatados para o Chart.js
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Processa os dados do relatório APENAS quando eles mudam e não estão em loading
    if (reportData && !isLoadingChart) {
      if (!reportData || reportData.length === 0) {
        setChartData(null);
        // Opcional: mostrar toast se os dados vierem vazios (o useQuery não faz isso)
        // showToast('Nenhum dado encontrado para gerar gráficos.', 'info');
        return;
      }
      const labels = reportData.map(item => item.regiao || 'Sem Região');
      const dataValues = reportData.map(item => item.total_placas);
      const backgroundColors = generateColors(labels.length);

      setChartData({
        labels,
        datasets: [{
          label: 'Total de Placas',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1,
          hoverOffset: 4
        }]
      });
    } else if (!reportData && !isLoadingChart) {
        // Caso em que reportData é null/undefined após o loading (pode acontecer se a API retornar erro não capturado pelo react-query)
        setChartData(null);
    }
  }, [reportData, isLoadingChart]); // Depende dos dados do useQuery


  // --- Renderização dos Cards de Resumo ---
  const renderSummaryCards = () => {
    // Mostra placeholder enquanto carrega
    const dataToShow = isLoadingSummary ? { totalPlacas: '...', placasDisponiveis: '...', regiaoPrincipal: '...' } : summaryData;

    if (isErrorSummary) {
      return <div className="dashboard-page__error" style={{ gridColumn: '1 / -1' }}>Erro resumo: {errorSummary.message}</div>;
    }

    return (
      <>
        <div className="summary-card">
          <div className="summary-card__icon summary-card__icon--total"><i className="fas fa-th-large"></i></div>
          <div className="summary-card__info">
            <p className="summary-card__value">{dataToShow?.totalPlacas ?? '0'}</p>
            <span className="summary-card__label">Total de Placas</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon summary-card__icon--disponivel"><i className="fas fa-check-circle"></i></div>
          <div className="summary-card__info">
            <p className="summary-card__value">{dataToShow?.placasDisponiveis ?? '0'}</p>
            <span className="summary-card__label">Placas Disponíveis</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon summary-card__icon--regiao"><i className="fas fa-map-pin"></i></div>
          <div className="summary-card__info">
            <p className="summary-card__value">{dataToShow?.regiaoPrincipal ?? 'N/A'}</p>
            <span className="summary-card__label">Região Principal</span>
          </div>
        </div>
      </>
    );
  };

  // --- Opções Comuns para Gráficos (inalteradas) ---
  const chartOptions = { responsive: true, maintainAspectRatio: false, };
  const barChartOptions = { /* ... */ };
  const pieChartOptions = { /* ... */ };
  barChartOptions.scales = { y: { beginAtZero: true, ticks: { precision: 0 } } };
  barChartOptions.plugins = { legend: { display: false } };
  pieChartOptions.plugins = { legend: { position: 'top' } };


  // --- Renderização dos Gráficos ---
  const renderCharts = () => {
    if (isLoadingChart && !chartData) { // Mostra spinner só no loading inicial
      return (
        <>
          <div className="dashboard-page__chart-container"><Spinner message="A carregar gráfico..." /></div>
          <div className="dashboard-page__chart-container"><Spinner message="A carregar gráfico..." /></div>
        </>
      );
    }
    if (isErrorChart) {
      return (
        <>
          <div className="dashboard-page__chart-container"><p className="error-message">Erro gráfico: {errorChart.message}</p></div>
          <div className="dashboard-page__chart-container"><p className="error-message">Erro gráfico: {errorChart.message}</p></div>
        </>
      );
    }
    if (!chartData) { // Se chartData for null (sem dados ou erro no processamento)
      return (
        <>
          <div className="dashboard-page__chart-container"><p>Sem dados para exibir.</p></div>
          <div className="dashboard-page__chart-container"><p>Sem dados para exibir.</p></div>
        </>
      );
    }
    // Renderiza os gráficos se houver chartData
    return (
      <>
        <div className="dashboard-page__chart-container">
          <h3 className="dashboard-page__chart-title">Placas por Região</h3>
          <div style={{ position: 'relative', height: '350px' }}>
            <Bar options={barChartOptions} data={chartData} />
          </div>
        </div>
        <div className="dashboard-page__chart-container">
          <h3 className="dashboard-page__chart-title">Distribuição</h3>
          <div style={{ position: 'relative', height: '350px' }}>
            <Pie options={pieChartOptions} data={chartData} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__summary" id="dashboard-summary">
        {renderSummaryCards()}
      </div>

      <div className="dashboard-page__charts-grid">
        {renderCharts()}
      </div>
    </div>
  );
}

export default DashboardPage;