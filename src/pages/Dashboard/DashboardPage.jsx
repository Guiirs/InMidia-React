// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'; // Importa módulos do Chart.js
import { Bar, Pie } from 'react-chartjs-2'; // Importa componentes de gráfico
import { fetchDashboardSummary, fetchPlacasPorRegiaoReport } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { generateColors } from '../../utils/charts'; // Utilitário para cores
import './Dashboard.css'; // Importa o CSS da página

// Regista os elementos necessários do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function DashboardPage() {
  const [summaryData, setSummaryData] = useState({ totalPlacas: '...', placasDisponiveis: '...', regiaoPrincipal: '...' });
  const [chartData, setChartData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [errorSummary, setErrorSummary] = useState(null);
  const [errorChart, setErrorChart] = useState(null);
  const showToast = useToast();

  // Busca dados do resumo
  useEffect(() => {
    setIsLoadingSummary(true);
    setErrorSummary(null);
    fetchDashboardSummary()
      .then(data => setSummaryData(data))
      .catch(err => {
        setErrorSummary(err.message);
        showToast(err.message || 'Erro ao carregar resumo.', 'error');
      })
      .finally(() => setIsLoadingSummary(false));
  }, [showToast]); // Adiciona showToast às dependências se usado dentro do effect

  // Busca dados para os gráficos
  useEffect(() => {
    setIsLoadingChart(true);
    setErrorChart(null);
    fetchPlacasPorRegiaoReport()
      .then(reportData => {
        if (!reportData || reportData.length === 0) {
          setChartData(null); // Sem dados
          showToast('Nenhum dado encontrado para gerar gráficos.', 'info');
          return;
        }
        const labels = reportData.map(item => item.regiao || 'Sem Região');
        const dataValues = reportData.map(item => item.total_placas);
        const backgroundColors = generateColors(labels.length);

        setChartData({
          labels,
          datasets: [{
            label: 'Total de Placas', // Usado no Bar chart
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1,
            hoverOffset: 4 // Para Pie chart
          }]
        });
      })
      .catch(err => {
        setErrorChart(err.message);
        showToast(err.message || 'Erro ao carregar dados dos gráficos.', 'error');
      })
      .finally(() => setIsLoadingChart(false));
  }, [showToast]); // Adiciona showToast às dependências

  // --- Renderização dos Cards de Resumo ---
  const renderSummaryCards = () => {
    if (isLoadingSummary) {
      return (
        <>
          <div className="summary-card"><Spinner message="" /></div>
          <div className="summary-card"><Spinner message="" /></div>
          <div className="summary-card"><Spinner message="" /></div>
        </>
      );
    }
    if (errorSummary) {
      return <div className="dashboard-page__error" style={{ gridColumn: '1 / -1' }}>Erro ao carregar resumo: {errorSummary}</div>;
    }
    return (
      <>
        <div className="summary-card">
          <div className="summary-card__icon summary-card__icon--total"><i className="fas fa-th-large"></i></div>
          <div className="summary-card__info">
            <p className="summary-card__value">{summaryData.totalPlacas ?? '0'}</p>
            <span className="summary-card__label">Total de Placas</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon summary-card__icon--disponivel"><i className="fas fa-check-circle"></i></div>
          <div className="summary-card__info">
            <p className="summary-card__value">{summaryData.placasDisponiveis ?? '0'}</p>
            <span className="summary-card__label">Placas Disponíveis</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card__icon summary-card__icon--regiao"><i className="fas fa-map-pin"></i></div>
          <div className="summary-card__info">
            {/* Garante que N/A não seja tratado como 0 */}
            <p className="summary-card__value">{summaryData.regiaoPrincipal === null || summaryData.regiaoPrincipal === undefined ? 'N/A' : summaryData.regiaoPrincipal}</p>
            <span className="summary-card__label">Região Principal</span>
          </div>
        </div>
      </>
    );
  };

  // --- Opções Comuns para Gráficos ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permite controlar altura
  };

  const barChartOptions = {
    ...chartOptions,
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    plugins: { legend: { display: false } }
  };

  const pieChartOptions = {
    ...chartOptions,
    plugins: { legend: { position: 'top' } }
  };

  // --- Renderização dos Gráficos ---
  const renderCharts = () => {
    if (isLoadingChart) {
      return (
        <>
          <div className="dashboard-page__chart-container"><Spinner message="A carregar gráfico..." /></div>
          <div className="dashboard-page__chart-container"><Spinner message="A carregar gráfico..." /></div>
        </>
      );
    }
    if (errorChart) {
      return (
        <>
          <div className="dashboard-page__chart-container"><p className="error-message">Erro ao carregar gráfico: {errorChart}</p></div>
          <div className="dashboard-page__chart-container"><p className="error-message">Erro ao carregar gráfico: {errorChart}</p></div>
        </>
      );
    }
    if (!chartData) {
      return (
        <>
          <div className="dashboard-page__chart-container"><p>Sem dados para exibir.</p></div>
          <div className="dashboard-page__chart-container"><p>Sem dados para exibir.</p></div>
        </>
      );
    }
    return (
      <>
        <div className="dashboard-page__chart-container">
          <h3 className="dashboard-page__chart-title">Placas por Região</h3>
          <div style={{ position: 'relative', height: '350px' }}> {/* Wrapper para altura */}
            <Bar options={barChartOptions} data={chartData} />
          </div>
        </div>
        <div className="dashboard-page__chart-container">
          <h3 className="dashboard-page__chart-title">Distribuição</h3>
          <div style={{ position: 'relative', height: '350px' }}> {/* Wrapper para altura */}
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