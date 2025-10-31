// src/components/PIModalForm/PIModalForm.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchClientes } from '../../services/api'; // Reutiliza a função da API

// Componente puro para o formulário de PI
function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    
    // Busca clientes para o <select>
    // Reutiliza o cache ['clientes'] que a página ClientesPage usa
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientes'], 
        queryFn: fetchClientes,
        staleTime: 1000 * 60 * 10 
    });

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors: modalErrors },
        setError: setModalError
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            clienteId: initialData.cliente?.id || '',
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : new Date().toISOString().split('T')[0],
            dataFim: initialData.dataFim ? formatDateForInput(initialData.dataFim) : '',
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
        }
    });

    // Formata data da API (ISOString) para o input (YYYY-MM-DD)
    function formatDateForInput(isoDate) {
        if (!isoDate) return '';
        return new Date(isoDate).toISOString().split('T')[0];
    }
    
    // Reseta o form se o initialData mudar (quando abre o modal para edição)
    useEffect(() => {
        reset({
            clienteId: initialData.cliente?.id || initialData.cliente || '',
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : new Date().toISOString().split('T')[0],
            dataFim: initialData.dataFim ? formatDateForInput(initialData.dataFim) : '',
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
        });
    }, [initialData, reset]);

    const dataInicio = watch('dataInicio');

    const handleFormSubmit = (data) => {
        onSubmit(data, setModalError); // Passa dados e setError para o handler pai
    };

    return (
        // Usamos os estilos genéricos de modal-form
        <form id="pi-form" className="modal-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            <div className="modal-form__grid">
                
                {/* Cliente */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="clienteId">Cliente</label>
                    <select id="clienteId"
                           className={`modal-form__input ${modalErrors.clienteId ? 'input-error' : ''}`}
                           {...register('clienteId', { required: 'O cliente é obrigatório.' })}
                           disabled={isSubmitting || isLoadingClientes}>
                        <option value="">{isLoadingClientes ? 'A carregar...' : 'Selecione...'}</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    {modalErrors.clienteId && <div className="modal-form__error-message">{modalErrors.clienteId.message}</div>}
                </div>

                {/* Tipo de Período */}
                <div className="modal-form__input-group">
                    <label htmlFor="tipoPeriodo">Tipo de Período</label>
                    <select id="tipoPeriodo"
                            className={`modal-form__input ${modalErrors.tipoPeriodo ? 'input-error' : ''}`}
                            {...register('tipoPeriodo', { required: 'O período é obrigatório.' })}
                            disabled={isSubmitting}>
                        <option value="mensal">Mensal</option>
                        <option value="quinzenal">Quinzenal</option>
                    </select>
                </div>

                {/* Valor Total */}
                <div className="modal-form__input-group">
                    <label htmlFor="valorTotal">Valor Total (R$)</label>
                    <input type="number" id="valorTotal" step="0.01"
                           className={`modal-form__input ${modalErrors.valorTotal ? 'input-error' : ''}`}
                           {...register('valorTotal', { 
                               required: 'O valor é obrigatório.',
                               valueAsNumber: true,
                               min: { value: 0.01, message: 'Valor deve ser positivo.'}
                           })}
                           disabled={isSubmitting} />
                    {modalErrors.valorTotal && <div className="modal-form__error-message">{modalErrors.valorTotal.message}</div>}
                </div>
                
                {/* Data Início */}
                <div className="modal-form__input-group">
                    <label htmlFor="dataInicio">Data Início</label>
                    <input type="date" id="dataInicio"
                           className={`modal-form__input ${modalErrors.dataInicio ? 'input-error' : ''}`}
                           {...register('dataInicio', { required: 'Data de início é obrigatória.' })}
                           disabled={isSubmitting} />
                    {modalErrors.dataInicio && <div className="modal-form__error-message">{modalErrors.dataInicio.message}</div>}
                </div>

                {/* Data Fim */}
                <div className="modal-form__input-group">
                    <label htmlFor="dataFim">Data Fim</label>
                    <input type="date" id="dataFim"
                           className={`modal-form__input ${modalErrors.dataFim ? 'input-error' : ''}`}
                           {...register('dataFim', { 
                               required: 'Data final é obrigatória.',
                               validate: (value) => value > dataInicio || 'A data final deve ser posterior à inicial.'
                           })}
                           disabled={isSubmitting} />
                    {modalErrors.dataFim && <div className="modal-form__error-message">{modalErrors.dataFim.message}</div>}
                </div>

                {/* Descrição */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="descricao">Descrição dos Serviços</label>
                    <textarea id="descricao" rows="4"
                           className={`modal-form__input ${modalErrors.descricao ? 'input-error' : ''}`}
                           {...register('descricao', { required: 'A descrição é obrigatória.' })}
                           disabled={isSubmitting}
                    ></textarea>
                    {modalErrors.descricao && <div className="modal-form__error-message">{modalErrors.descricao.message}</div>}
                </div>
            </div>

            <div className="modal-form__actions">
                <button type="button" className="modal-form__button modal-form__button--cancel" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                </button>
                <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting || isLoadingClientes}>
                    {isSubmitting ? 'A guardar...' : 'Guardar PI'}
                </button>
            </div>
        </form>
    );
}

PIModalForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    initialData: PropTypes.object,
};

export default PIModalForm;