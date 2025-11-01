// src/components/PIModalForm/steps/PIFormStep1_Client.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { fetchClientes } from '../../../services/api';

/**
 * Etapa 1 do formulário de PI: Seleção de cliente e informações gerais.
 */
function PIFormStep1_Client({ register, errors, isSubmitting, control, watch, setValue }) {
    
    // Busca a lista de todos os clientes para o dropdown.
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientes', 'all'], 
        queryFn: () => fetchClientes(new URLSearchParams({ limit: 1000, sortBy: 'nome', order: 'asc' })),
        select: (data) => data.data ?? [],
        staleTime: 1000 * 60 * 10 // Cache de 10 minutos
    });

    const watchedClienteId = watch('clienteId');
    const dataInicio = watch('dataInicio');

    // Efeito para preencher campos de responsável e segmento quando um cliente é selecionado.
    useEffect(() => {
        
        if (watchedClienteId && clientes.length > 0) {
            const clienteSelecionado = clientes.find(c => c._id === watchedClienteId);
            if (clienteSelecionado) {
                // Seta os valores nos campos do formulário
                setValue('responsavel', clienteSelecionado.responsavel || '', { shouldValidate: false });
                setValue('segmento', clienteSelecionado.segmento || '', { shouldValidate: false });
            }
        } else if (!watchedClienteId) {
            // Limpa os campos
            setValue('responsavel', '', { shouldValidate: false });
            setValue('segmento', '', { shouldValidate: false });
        }
    }, [watchedClienteId, clientes, setValue]);


    return (
        <>
            {/* Cliente */}
            <div className="modal-form__input-group modal-form__input-group--full">
                 <label htmlFor="clienteId">Cliente*</label>
                <select id="clienteId"
                        className={`modal-form__input ${errors.clienteId ? 'input-error' : ''}`}
                        {...register('clienteId', { required: 'O cliente é obrigatório.' })}
                        disabled={isSubmitting || isLoadingClientes}>
                    <option value="">{isLoadingClientes ? 'A carregar clientes...' : 'Selecione um cliente'}</option>
                    {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
                </select>
                {errors.clienteId && <div className="modal-form__error-message">{errors.clienteId.message}</div>}
            </div>
            
            {/* Campos automáticos (Responsável, Segmento) */}
            <div className="modal-form__input-group">
                <label htmlFor="responsavel">Responsável (do Cliente)</label>
                <input type="text" id="responsavel" className="modal-form__input" {...register('responsavel')} disabled />
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="segmento">Segmento (do Cliente)</label>
                <input type="text" id="segmento" className="modal-form__input" {...register('segmento')} disabled />
            </div>
            
            {/* Período e Valor */}
             <div className="modal-form__input-group">
                <label htmlFor="tipoPeriodo">Tipo de Período*</label>
                <select id="tipoPeriodo" className={`modal-form__input ${errors.tipoPeriodo ? 'input-error' : ''}`}
                        {...register('tipoPeriodo', { required: 'O período é obrigatório.' })} disabled={isSubmitting}>
                    <option value="mensal">Mensal</option>
                    <option value="quinzenal">Quinzenal</option>
                </select>
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="valorTotal">Valor Total (R$)*</label>
                <input type="number" id="valorTotal" step="0.01" className={`modal-form__input ${errors.valorTotal ? 'input-error' : ''}`}
                        {...register('valorTotal', { 
                            required: 'O valor é obrigatório.', valueAsNumber: true,
                            min: { value: 0.01, message: 'O valor deve ser positivo.'}
                        })} disabled={isSubmitting} />
                {errors.valorTotal && <div className="modal-form__error-message">{errors.valorTotal.message}</div>}
            </div>
            
            {/* Datas */}
            <div className="modal-form__input-group">
                <label htmlFor="dataInicio">Data de Início*</label>
                <input type="date" id="dataInicio" className={`modal-form__input ${errors.dataInicio ? 'input-error' : ''}`}
                        {...register('dataInicio', { required: 'A data de início é obrigatória.' })} disabled={isSubmitting} />
                {errors.dataInicio && <div className="modal-form__error-message">{errors.dataInicio.message}</div>}
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="dataFim">Data de Fim*</label>
                <input type="date" id="dataFim" className={`modal-form__input ${errors.dataFim ? 'input-error' : ''}`}
                        {...register('dataFim', { 
                            required: 'A data final é obrigatória.',
                            validate: (value) => !dataInicio || value > dataInicio || 'A data final deve ser posterior à data de início.'
                        })} disabled={isSubmitting} />
                {errors.dataFim && <div className="modal-form__error-message">{errors.dataFim.message}</div>}
            </div>
        </>
    );
}

PIFormStep1_Client.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    control: PropTypes.object.isRequired,
    watch: PropTypes.func.isRequired,
    setValue: PropTypes.func.isRequired,
};

export default PIFormStep1_Client;