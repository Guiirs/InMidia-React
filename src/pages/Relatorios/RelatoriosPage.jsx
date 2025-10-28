// src/pages/RelatoriosPage.jsx
import React, { useState, useEffect } from 'react';
// Importações do Chart.js (já devem estar instaladas pela DashboardPage)
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
// Funções API e utilitários
import { fetchPlacasPorRegiaoReport } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { generateColors } from '../../utils/charts'; // Utilitário para cores
import './Relatorios.css'; // CSS da página

// Regista os elementos necessários do Chart.js (se ainda não globalmente)
// É seguro registar novamente
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function RelatoriosPage() {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const showToast = useToast();

  // Busca dados para os gráficos
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchPlacasPorRegiaoReport()
      .then(reportData => {
        if (!reportData || reportData.length === 0) {
          setChartData(null); // Sem dados
          showToast('Nenhum dado encontrado para gerar relatórios.', 'info');
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
        setError(err.message);
        showToast(err.message || 'Erro ao carregar dados dos relatórios.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [showToast]); // Adiciona showToast às dependências

  // --- Opções Comuns para Gráficos ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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

  // --- Renderização ---
  const renderCharts = () => {
    if (isLoading) {
      return (
        <>
          {/* Usamos o Spinner dentro do layout da página */}
          <div className="relatorios-page__chart-container"><Spinner message="A carregar gráfico..." /></div>
          <div className="relatorios-page__chart-container"><Spinner message="A carregar gráfico..." /></div>
        </>
      );
    }
    if (error) {
       return (
         <>
           <div className="relatorios-page__chart-container"><p className="error-message">Erro ao carregar gráfico: {error}</p></div>
           <div className="relatorios-page__chart-container"><p className="error-message">Erro ao carregar gráfico: {error}</p></div>
         </>
       );
    }
    if (!chartData) {
       return (
         <>
           <div className="relatorios-page__chart-container"><p>Sem dados para exibir.</p></div>
           <div className="relatorios-page__chart-container"><p>Sem dados para exibir.</p></div>
         </>
       );
    }
    // Renderiza os dois gráficos se houver dados
    return (
      <>
        <div className="relatorios-page__chart-container">
          <h3 className="relatorios-page__chart-title">Placas por Região (Barras)</h3>
          {/* Wrapper div para controlar altura do canvas */}
          <div style={{ position: 'relative', height: '350px' }}>
            <Bar options={barChartOptions} data={chartData} />
          </div>
        </div>
        <div className="relatorios-page__chart-container">
          <h3 className="relatorios-page__chart-title">Distribuição de Placas (Pizza)</h3>
          <div style={{ position: 'relative', height: '350px' }}>
            <Pie options={pieChartOptions} data={chartData} />
          </div>
        </div>
      </>
    );
  };

  return (
    // A classe relatorios-page já define o grid de 2 colunas
    <div className="relatorios-page">
      {renderCharts()}
    </div>
  );
}

export default RelatoriosPage;