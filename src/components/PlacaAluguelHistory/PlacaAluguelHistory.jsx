// src/components/PlacaAluguelHistory/PlacaAluguelHistory.jsx
import React from 'react'; // Removido useState, useEffect, useCallback
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Importa hooks
import Spinner from '../Spinner/Spinner';
import { formatDate } from '../../utils/helpers';
import { fetchAlugueisByPlaca, deleteAluguel } from '../../services/api';
import { useToast } from '../ToastNotification/ToastNotification';
import { useConfirmation } from '../../context/ConfirmationContext';

const alugueisQueryKey = (placaId) => ['alugueis', placaId];

function PlacaAluguelHistory({ placaId, onAluguelChange }) {
    const showToast = useToast();
    const showConfirmation = useConfirmation();
    const queryClient = useQueryClient();

    // 1. useQuery para buscar aluguéis
    const {
        data: alugueis = [], // Dados com fallback
        isLoading: isLoadingAlugueis,
        isError: isErrorAlugueis,
        error: errorAlugueis
    } = useQuery({
        queryKey: alugueisQueryKey(placaId), // Chave de query dinâmica
        queryFn: () => fetchAlugueisByPlaca(placaId),
        enabled: !!placaId, // Só executa se placaId existir
        placeholderData: [],
    });

    // 2. useMutation para apagar aluguel
    const deleteAluguelMutation = useMutation({
        mutationFn: deleteAluguel, // API fn (recebe aluguelId)
        onSuccess: () => {
            showToast('Aluguel cancelado com sucesso!', 'success');
            // Invalida o cache dos aluguéis
            queryClient.invalidateQueries({ queryKey: alugueisQueryKey(placaId) });
            // Chama o callback para a página pai recarregar a placa (ex: atualizar status de 'Alugada')
            if (onAluguelChange) {
                onAluguelChange();
            }
        },
        onError: (error) => {
            showToast(error.message || 'Erro ao cancelar aluguel.', 'error');
        }
    });


    // 3. Função de exclusão (agora usa a mutação)
    const handleDeleteAluguelClick = async (aluguel) => {
        try {
            await showConfirmation({
                message: `Tem a certeza que deseja cancelar o aluguel para "${aluguel.cliente_nome || 'Cliente Apagado'}" (${formatDate(aluguel.data_inicio)} - ${formatDate(aluguel.data_fim)})?`,
                title: "Confirmar Cancelamento",
                confirmText: "Sim, Cancelar Aluguel",
                confirmButtonType: "red",
            });

            // Se o usuário confirmar, chama a mutação
            deleteAluguelMutation.mutate(aluguel.id);

        } catch (error) {
            // Se o usuário cancelar (promessa rejeitada)
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
            return <Spinner message="A carregar histórico..." />;
        }
        if (isErrorAlugueis) {
            return <p className="error-message">Erro ao carregar histórico: {errorAlugueis.message}</p>;
        }
        if (alugueis.length === 0) {
            return <p>Nenhum aluguel encontrado para esta placa.</p>;
        }
        return (
            <table className="regioes-page__table"> {/* Reutiliza estilos */}
                <thead>
                    <tr><th>Cliente</th><th>Início</th><th>Fim</th><th>Ação</th></tr>
                </thead>
                <tbody>
                    {alugueis.map(a => {
                        const isDeleting = deleteAluguelMutation.isPending && deleteAluguelMutation.variables === a.id;
                        return (
                            <tr key={a.id}>
                                <td>{a.cliente_nome || 'Cliente Apagado'}</td>
                                <td>{formatDate(a.data_inicio)}</td>
                                <td>{formatDate(a.data_fim)}</td>
                                <td className="regioes-page__actions">
                                    <button
                                        className="regioes-page__action-button regioes-page__action-button--delete delete-aluguel-btn"
                                        title="Cancelar Aluguel"
                                        onClick={() => handleDeleteAluguelClick(a)}
                                        // Desabilita se esta linha estiver sendo apagada
                                        disabled={isDeleting}
                                    >
                                        {/* 4. Renderização condicional do spinner (sem manipulação do DOM) */}
                                        {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div className="placa-details-page__alugueis-container">
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