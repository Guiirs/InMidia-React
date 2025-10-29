// src/components/PlacaAluguelHistory/PlacaAluguelHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../Spinner/Spinner'; //
import { formatDate } from '../../utils/helpers'; //
import { fetchAlugueisByPlaca, deleteAluguel } from '../../services/api'; //
import { useToast } from '../ToastNotification/ToastNotification'; //
import { useConfirmation } from '../../context/ConfirmationContext'; //

function PlacaAluguelHistory({ placaId, onAluguelChange }) {
    const [alugueis, setAlugueis] = useState([]);
    const [isLoadingAlugueis, setIsLoadingAlugueis] = useState(true);
    const [errorAlugueis, setErrorAlugueis] = useState(null);

    const showToast = useToast();
    const showConfirmation = useConfirmation();

    // Função para carregar aluguéis
    const loadAlugueis = useCallback(async () => {
        setIsLoadingAlugueis(true);
        setErrorAlugueis(null);
        try {
            const data = await fetchAlugueisByPlaca(placaId); //
            setAlugueis(data);
        } catch (err) {
            setErrorAlugueis(err.message);
            console.error("[PlacaAluguelHistory] Erro ao carregar aluguéis:", err);
        } finally {
            setIsLoadingAlugueis(false);
        }
    }, [placaId]);

    // Efeito para carregar aluguéis
    useEffect(() => {
        if (placaId) {
            loadAlugueis();
        }
    }, [loadAlugueis, placaId]);

    // Função de exclusão de aluguel
    const handleDeleteAluguelClick = async (aluguel, buttonElement) => {
        try {
            await showConfirmation({ //
                message: `Tem a certeza que deseja cancelar o aluguel para "${aluguel.cliente_nome || 'Cliente Apagado'}" (${formatDate(aluguel.data_inicio)} - ${formatDate(aluguel.data_fim)})?`, //
                title: "Confirmar Cancelamento",
                confirmText: "Sim, Cancelar Aluguel",
                confirmButtonType: "red", //
            });

            if (buttonElement) {
                buttonElement.disabled = true;
                buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            try {
                await deleteAluguel(aluguel.id); //
                showToast('Aluguel cancelado com sucesso!', 'success');
                loadAlugueis(); // Recarrega apenas a lista de aluguéis
                if (onAluguelChange) {
                    onAluguelChange(); // Chama o callback para a página pai recarregar a placa
                }
            } catch (error) {
                showToast(error.message || 'Erro ao cancelar aluguel.', 'error');
                if (buttonElement) {
                    buttonElement.innerHTML = '<i class="fas fa-trash"></i>';
                    buttonElement.disabled = false;
                }
            }
        } catch (error) {
            if (error.message !== "Ação cancelada pelo usuário.") {
               console.error("Erro no processo de confirmação de cancelamento:", error);
            } else {
               console.log("Cancelamento de aluguel abortado.");
            }
        }
    };

    // Renderização da Tabela
    const renderTable = () => {
        if (isLoadingAlugueis) {
            return <Spinner message="A carregar histórico..." />; //
        }
        if (errorAlugueis) {
            return <p className="error-message">Erro ao carregar histórico: {errorAlugueis}</p>; //
        }
        if (alugueis.length === 0) {
            return <p>Nenhum aluguel encontrado para esta placa.</p>;
        }
        return (
            // Reutiliza estilos CSS da página de regiões para a tabela
            // --- CORREÇÃO: Remover espaços/novas linhas desnecessários ---
            <table className="regioes-page__table">{/* */}
                <thead>
                    <tr><th>Cliente</th><th>Início</th><th>Fim</th><th>Ação</th></tr>
                </thead>
                <tbody>
                    {alugueis.map(a => (
                        <tr key={a.id}>
                            <td>{a.cliente_nome || 'Cliente Apagado'}</td>
                            <td>{formatDate(a.data_inicio)}</td>{/* */}
                            <td>{formatDate(a.data_fim)}</td>{/* */}
                            <td className="regioes-page__actions">{/* */}
                                <button
                                    className="regioes-page__action-button regioes-page__action-button--delete delete-aluguel-btn" //
                                    title="Cancelar Aluguel"
                                    onClick={(e) => handleDeleteAluguelClick(a, e.currentTarget)}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            // --- FIM DA CORREÇÃO ---
        );
    };

    return (
        <div className="placa-details-page__alugueis-container"> {/* */}
            <h3>Histórico de Aluguéis</h3>
            <div id="alugueis-list">
                {renderTable()}
            </div>
        </div>
    );
}

PlacaAluguelHistory.propTypes = {
    placaId: PropTypes.string.isRequired,
    onAluguelChange: PropTypes.func.isRequired,
};

export default PlacaAluguelHistory;