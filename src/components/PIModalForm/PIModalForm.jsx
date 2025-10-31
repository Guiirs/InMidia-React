// src/components/PIModalForm/PIModalForm.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
// --- ALTERAÇÃO AQUI ---
import { fetchClientes, fetchPlacas } from '../../services/api'; 

// Componente puro para o formulário de PI
function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    
    // Busca clientes para o <select>
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientes'], 
        queryFn: fetchClientes,
        staleTime: 1000 * 60 * 10 
    });

    // --- NOVA QUERY PARA BUSCAR PLACAS ---
    const { data: placasData = [], isLoading: isLoadingPlacas } = useQuery({
        queryKey: ['placas'], // Cache de placas
        queryFn: fetchPlacas, // Função da sua api.js
        staleTime: 1000 * 60 * 10
    });
    // ------------------------------------

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue, 
        formState: { errors: modalErrors },
        setError: setModalError
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            clienteId: initialData.cliente?._id || '', 
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : new Date().toISOString().split('T')[0],
            dataFim: initialData.dataFim ? formatDateForInput(initialData.dataFim) : '',
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
            responsavel: initialData.cliente?.responsavel || '',
            segmento: initialData.cliente?.segmento || '',
            // --- CAMPOS NOVOS ADICIONADOS ---
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas || [] // Espera um array de IDs
        }
    });

    // Formata data da API (ISOString) para o input (YYYY-MM-DD)
    function formatDateForInput(isoDate) {
        if (!isoDate) return '';
        return new Date(isoDate).toISOString().split('T')[0];
    }
    
    // Reseta o form se o initialData mudar (quando abre o modal para edição)
    useEffect(() => {
        const cliente = initialData.cliente || {};
        reset({
            clienteId: cliente._id || initialData.cliente || '',
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : new Date().toISOString().split('T')[0],
            dataFim: initialData.dataFim ? formatDateForInput(initialData.dataFim) : '',
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
            responsavel: cliente.responsavel || '',
            segmento: cliente.segmento || '',
            // --- CAMPOS NOVOS ADICIONADOS ---
            formaPagamento: initialData.formaPagamento || '',
            // Garante que o valor seja um array de IDs, 
            // mesmo que 'initialData.placas' venha como objetos populados
            placas: initialData.placas?.map(p => p._id || p) || []
        });
    }, [initialData, reset]);

    const dataInicio = watch('dataInicio');
    
    // --- LÓGICA DE PREENCHIMENTO AUTOMÁTICO (Cliente) ---
    const watchedClienteId = watch('clienteId');

    useEffect(() => {
        if (watchedClienteId && clientes.length > 0) {
            const clienteSelecionado = clientes.find(c => c._id === watchedClienteId);
            
            if (clienteSelecionado) {
                setValue('responsavel', clienteSelecionado.responsavel || '', { shouldValidate: false });
                setValue('segmento', clienteSelecionado.segmento || '', { shouldValidate: false });
            }
        } else if (!watchedClienteId) {
            setValue('responsavel', '', { shouldValidate: false });
            setValue('segmento', '', { shouldValidate: false });
        }
    }, [watchedClienteId, clientes, setValue]);
    // ------------------------------------------

    const handleFormSubmit = (data) => {
        // Remove os campos de visualização (responsavel, segmento)
        // Os campos 'placas' e 'formaPagamento' SÃO MANTIDOS e enviados
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setModalError); // Passa dados corretos para a API
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
                        {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
                    </select>
                    {modalErrors.clienteId && <div className="modal-form__error-message">{modalErrors.clienteId.message}</div>}
                </div>
                
                {/* Responsável (Automático) */}
                <div className="modal-form__input-group">
                    <label htmlFor="responsavel">Responsável (do Cliente)</label>
                    <input type="text" id="responsavel"
                           className="modal-form__input"
                           {...register('responsavel')}
                           disabled // Este campo é apenas para visualização
                    />
                </div>

                {/* Segmento (Automático) */}
                <div className="modal-form__input-group">
                    <label htmlFor="segmento">Segmento (do Cliente)</label>
                    <input type="text" id="segmento"
                           className="modal-form__input"
                           {...register('segmento')}
                           disabled // Este campo é apenas para visualização
                    />
                </div>
                
                {/* --- CAMPO NOVO: FORMA DE PAGAMENTO --- */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="formaPagamento">Forma de Pagamento</label>
                    <input type="text" id="formaPagamento"
                           placeholder="Ex: 30/60 dias, Ato, PIX na instalação"
                           className={`modal-form__input ${modalErrors.formaPagamento ? 'input-error' : ''}`}
                           {...register('formaPagamento')} // Validação é opcional (Etapa 6)
                           disabled={isSubmitting} />
                    {modalErrors.formaPagamento && <div className="modal-form__error-message">{modalErrors.formaPagamento.message}</div>}
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

                {/* --- CAMPO NOVO: SELETOR DE PLACAS --- */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="placas">Placas Selecionadas</label>
                    <select id="placas"
                            multiple // Permite seleção múltipla
                            size="6" // Define a altura da caixa de seleção
                            className={`modal-form__input ${modalErrors.placas ? 'input-error' : ''}`}
                            {...register('placas')} // O 'react-hook-form' trata o 'multiple' automaticamente
                            disabled={isSubmitting || isLoadingPlacas}
                    >
                        {isLoadingPlacas ? (
                            <option value="" disabled>A carregar placas...</option>
                        ) : (
                            placasData.map(placa => (
                                <option key={placa._id} value={placa._id}>
                                    {placa.codigo} - {placa.regiao?.nome || 'Sem região'}
                                </option>
                            ))
                        )}
                    </select>
                    <small className="modal-form__helper-text">Segure Ctrl (ou Cmd no Mac) para selecionar várias placas.</small>
                    {modalErrors.placas && <div className="modal-form__error-message">{modalErrors.placas.message}</div>}
                    {modalErrors.placas?.root && <div className="modal-form__error-message">{modalErrors.placas.root.message}</div>}
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
                {/* --- ALTERAÇÃO AQUI --- (Desabilita se estiver a carregar placas) */}
                <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmitting || isLoadingClientes || isLoadingPlacas}>
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