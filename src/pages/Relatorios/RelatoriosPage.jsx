// src/pages/Relatorios/RelatoriosPage.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchRelatorioOcupacao } from '../../services/api';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import { generateColors } from '../../utils/charts';
import './Relatorios.css'; // CSS atualizado

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

// --- Helper para obter datas padrão ---
const getDefaultDates = () => {
    const dataFim = new Date();
    const dataInicio = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1); // Primeiro dia do mês atual
    return {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0]
    };
};

function RelatoriosPage() {
  const showToast = useToast();
  
  // Estado para os filtros de data
  const [dateRange, setDateRange] = useState(getDefaultDates());
  // Estado para "submeter" as datas para a query
  const [submittedRange, setSubmittedRange] = useState(null);

  // 1. useQuery para buscar dados
  const {
      data: reportData, // Dados da API (baseado no JSON que propusemos)
      isLoading,
      isError,
      error,
      isFetching, // Usar isFetching para o loading do botão
      refetch // Função para re-buscar dados
  } = useQuery({
      queryKey: ['relatorioOcupacao', submittedRange], // Depende das datas submetidas
      queryFn: () => {
          if (!submittedRange) return null; // Não busca se as datas não foram submetidas
          return fetchRelatorioOcupacao(submittedRange.inicio, submittedRange.fim);
      },
      enabled: false, // Só executa quando 'refetch' é chamado
      staleTime: Infinity, // Manter os dados até nova submissão
      onError: (err) => {
          showToast(err.message || 'Erro ao carregar relatório.', 'error');
      },
      onSuccess: (data) => {
          if (!data) return;
          if (data.summary.totalAlugueisNoPeriodo === 0) {
              showToast('Nenhum dado encontrado para o período selecionado.', 'info');
          }
      }
  });

  // Handlers dos filtros
  const handleDateChange = (e) => {
      const { name, value } = e.target;
      setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitReport = () => {
      if (!dateRange.inicio || !dateRange.fim) {
          showToast("Por favor, selecione data de início e fim.", "warning");
          return;
      }
      if (dateRange.fim < dateRange.inicio) {
          showToast("A data final deve ser posterior à data inicial.", "warning");
          return;
      }
      // Define as datas submetidas, o que mudará a queryKey
      setSubmittedRange(dateRange);
      
      // Atraso curto para garantir que o estado 'submittedRange' atualize
      // antes do refetch usar a nova queryKey
      setTimeout(() => {
          refetch();
      }, 0);
  };

  // 2. useMemo para processar os dados para os gráficos
  const ocupacaoChartData = useMemo(() => {
    if (!reportData?.ocupacaoPorRegiao || reportData.ocupacaoPorRegiao.length === 0) {
      return null;
    }
    const labels = reportData.ocupacaoPorRegiao.map(item => item.regiao || 'Sem Região');
    const dataValues = reportData.ocupacaoPorRegiao.map(item => item.taxa_ocupacao_regiao);
    const backgroundColors = generateColors(labels.length);

    return {
      labels,
      datasets: [{
        label: 'Taxa de Ocupação (%)',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
      }]
    };
  }, [reportData]);

  const clientesChartData = useMemo(() => {
    if (!reportData?.novosAlugueisPorCliente || reportData.novosAlugueisPorCliente.length === 0) {
      return null;
    }
    const labels = reportData.novosAlugueisPorCliente.map(item => item.cliente_nome || 'Cliente Apagado');
    const dataValues = reportData.novosAlugueisPorCliente.map(item => item.total_novos_alugueis);
    const backgroundColors = generateColors(labels.length);

    return {
      labels,
      datasets: [{
        label: 'Novos Aluguéis',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1,
      }]
    };
  }, [reportData]);


  // --- Opções Comuns para Gráficos ---
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    plugins: { legend: { display: false } }
  };
  
  const clientesBarOptions = {
    ...barChartOptions,
    indexAxis: 'y', // Gráfico de barras horizontal para clientes
    plugins: { legend: { display: false } }
  };


  // --- Renderização ---
  const renderContent = () => {
    if (isLoading || isFetching) { // Mostra spinner ao buscar
      return (
        <div className="relatorios-page__full-width-container">
            <Spinner message="A gerar relatório..." />
        </div>
      );
    }
    if (isError) {
       return (
         <div className="relatorios-page__full-width-container">
            <p className="error-message">Erro ao carregar relatório: {error.message}</p>
         </div>
       );
    }
    if (!reportData || !submittedRange) { // Estado inicial
       return (
         <div className="relatorios-page__full-width-container">
            <p>Selecione um período e clique em "Gerar Relatório".</p>
         </div>
       );
    }
    if (reportData.summary.totalAlugueisNoPeriodo === 0) {
        return (
         <div className="relatorios-page__full-width-container">
            <p>Nenhum dado de aluguel encontrado para o período selecionado.</p>
         </div>
       );
    }
    
    // Renderiza os resultados
    return (
      <>
        {/* Summary Cards */}
        <div className="relatorios-page__summary">
           <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--total"><i className="fas fa-calendar-check"></i></div>
              <div className="summary-card__info">
                <p className="summary-card__value">{reportData.summary.totalAlugueisNoPeriodo}</p>
                <span className="summary-card__label">Aluguéis no Período</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--disponivel"><i className="fas fa-chart-line"></i></div>
              <div className="summary-card__info">
                <p className="summary-card__value">{reportData.summary.taxaOcupacaoMediaGeral.toFixed(1)}%</p>
                <span className="summary-card__label">Ocupação Média</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card__icon summary-card__icon--regiao"><i className="fas fa-bed"></i></div>
              <div className="summary-card__info">
                <p className="summary-card__value">{reportData.summary.totalDiasAlugados}</p>
                <span className="summary-card__label">Total de Dias Alugados</span>
              </div>
            </div>
        </div>

        {/* Gráficos */}
        <div className="relatorios-page__chart-container">
          <h3 className="relatorios-page__chart-title">Taxa de Ocupação por Região (%)</h3>
          <div style={{ position: 'relative', height: '350px' }}>
            {ocupacaoChartData ? 
                <Bar options={barChartOptions} data={ocupacaoChartData} /> : 
                <p>Sem dados de ocupação.</p>}
          </div>
        </div>
        <div className="relatorios-page__chart-container">
          <h3 className="relatorios-page__chart-title">Novos Aluguéis por Cliente</h3>
          <div style={{ position: 'relative', height: '350px' }}>
            {clientesChartData ?
                <Bar options={clientesBarOptions} data={clientesChartData} /> :
                <p>Sem dados de clientes.</p>}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="relatorios-page">
        {/* Controles de Data */}
        <div className="relatorios-page__controls">
            <div className="relatorios-page__filter-group">
                <label htmlFor="data_inicio">Data Início</label>
                <input 
                    type="date" 
                    id="data_inicio"
                    name="inicio"
                    className="relatorios-page__date-input"
                    value={dateRange.inicio}
                    onChange={handleDateChange}
                    disabled={isFetching}
                />
            </div>
            <div className="relatorios-page__filter-group">
                <label htmlFor="data_fim">Data Fim</label>
                <input 
                    type="date" 
                    id="data_fim"
                    name="fim"
                    className="relatorios-page__date-input"
                    value={dateRange.fim}
                    onChange={handleDateChange}
                    disabled={isFetching}
                />
            </div>
            <button 
                className="relatorios-page__submit-button" 
                onClick={handleSubmitReport}
                disabled={isFetching}
            >
                {isFetching ? 'A gerar...' : 'Gerar Relatório'}
            </button>
        </div>

        {/* Conteúdo (Cards e Gráficos) */}
        {renderContent()}
    </div>
  );
}

export default RelatoriosPage;