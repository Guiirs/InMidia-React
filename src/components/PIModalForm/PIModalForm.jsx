// src/components/PIModalForm/PIModalForm.jsx
import React, { useEffect, useState, useMemo } from 'react'; 
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchClientes, fetchPlacas, fetchRegioes } from '../../services/api'; 

// --- HOOK DE DEBOUNCE ---
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
// -------------------------


// Componente puro para o formulário de PI
function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    
    // Estados para os filtros
    const [selectedRegiao, setSelectedRegiao] = useState(''); 
    const [placaSearch, setPlacaSearch] = useState(''); 
    const debouncedPlacaSearch = useDebounce(placaSearch, 300); 

    // Query de Clientes (Corrigida)
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientes'], 
        queryFn: fetchClientes,  
        staleTime: 1000 * 60 * 10
    });

    // Query de Regiões (Correta)
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({ 
        queryKey: ['regioes'], 
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 10 
    });

    // Query de Placas (Buscar TODAS 1x)
    const { data: placasData = [], isLoading: isLoadingPlacas } = useQuery({
        queryKey: ['placas', 'all'], 
        queryFn: () => fetchPlacas(new URLSearchParams({ limit: 1000 })), 
        staleTime: 1000 * 60 * 10,
        select: (data) => data.data ?? [], 
        placeholderData: { data: [] }      
    });

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
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas?.map(p => p._id || p) || []
        }
    });

    // Observa o campo 'placas' (array de IDs)
    const watchedPlacas = watch('placas') || [];

    function formatDateForInput(isoDate) {
        if (!isoDate) return '';
        return new Date(isoDate).toISOString().split('T')[0];
    }
    
    // Efeito para resetar o form
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
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas?.map(p => p._id || p) || []
        });
        setSelectedRegiao('');
        setPlacaSearch('');
    }, [initialData, reset]);

    // Efeito para auto-preencher dados do cliente
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

    const dataInicio = watch('dataInicio');
    
    const handleFormSubmit = (data) => {
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setModalError); 
    };


    // --- LÓGICA DE FILTRAGEM LOCAL (CORRIGIDA) ---

    // 1. Lista de Placas DISPONÍVEIS (filtrada)
    const availablePlacas = useMemo(() => {
        const search = debouncedPlacaSearch.toLowerCase();
        
        return placasData.filter(placa => {
            // 1. Não pode estar na lista de selecionadas
            if (watchedPlacas.includes(placa._id)) {
                return false;
            }
            
            // --- CORREÇÃO 2: VERIFICA 'null' ---
            // 2. Verifica a região
            const regiaoId = (typeof placa.regiao === 'object' && placa.regiao !== null) 
                ? placa.regiao._id 
                : placa.regiao; // Agora 'regiaoId' pode ser null, string, ou undefined
            // ------------------------------------
            
            const matchesRegiao = !selectedRegiao || (regiaoId === selectedRegiao);

            // 3. Verifica a pesquisa
            const matchesSearch = !search || (placa.numero_placa && placa.numero_placa.toLowerCase().includes(search));
            
            return matchesRegiao && matchesSearch;
        });
    }, [placasData, selectedRegiao, debouncedPlacaSearch, watchedPlacas]);

    // 2. Lista de Placas SELECIONADAS (objetos completos)
    const selectedPlacasObjects = useMemo(() => {
        const allPlacasMap = new Map(placasData.map(p => [p._id, p]));
        return watchedPlacas
            .map(id => allPlacasMap.get(id))
            .filter(Boolean); // Filtra IDs que não foram encontrados (segurança)
    }, [watchedPlacas, placasData]);

    // --- HANDLERS DE SELEÇÃO (CORRIGIDOS) ---
    const handleSelectPlaca = (placaId) => { 
        setValue('placas', [...watchedPlacas, placaId], { shouldValidate: true });
    };

    const handleRemovePlaca = (placaId) => { 
        setValue('placas', watchedPlacas.filter(id => id !== placaId), { shouldValidate: true });
    };
    // -----------------------------------

    
    // Função helper para pegar o nome da região (usada nas duas listas)
    const getRegiaoNome = (placa) => {
        if (!placa.regiao) return 'Sem região';
        const regiaoId = (typeof placa.regiao === 'object' && placa.regiao !== null) ? placa.regiao._id : placa.regiao;
        const reg = regioes.find(r => r._id === regiaoId);
        return reg ? reg.nome : 'Sem região';
    };


    return (
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
                           disabled 
                    />
                </div>

                {/* Segmento (Automático) */}
                <div className="modal-form__input-group">
                    <label htmlFor="segmento">Segmento (do Cliente)</label>
                    <input type="text" id="segmento"
                           className="modal-form__input"
                           {...register('segmento')}
                           disabled 
                    />
                </div>
                
                {/* Forma de Pagamento */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    <label htmlFor="formaPagamento">Forma de Pagamento</label>
                    <input type="text" id="formaPagamento"
                           placeholder="Ex: 30/60 dias, Ato, PIX na instalação"
                           className={`modal-form__input ${modalErrors.formaPagamento ? 'input-error' : ''}`}
                           {...register('formaPagamento')} 
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
                
                {/* --- GRUPO DE SELEÇÃO DE PLACAS (MODIFICADO) --- */}
                <div className="modal-form__input-group modal-form__input-group--full">
                    
                    {/* 1. Campo de Placas Selecionadas */}
                    <label>Placas Selecionadas ({selectedPlacasObjects.length})</label>
                    <div className="modal-form__selected-list">
                        {isLoadingPlacas ? (
                            <span className="modal-form__selected-empty">A carregar...</span>
                        ) : selectedPlacasObjects.length === 0 ? (
                            <span className="modal-form__selected-empty">Nenhuma placa selecionada.</span>
                        ) : (
                            selectedPlacasObjects.map(placa => (
                                <div key={placa._id} className="modal-form__selected-item">
                                    <span>
                                        {placa.numero_placa || `ID ${placa._id}`} - {getRegiaoNome(placa)}
                                    </span>
                                    <button 
                                        type="button" 
                                        className="modal-form__selected-remove-btn" 
                                        onClick={() => handleRemovePlaca(placa._id)} // <<< CORREÇÃO 1
                                        title="Remover"
                                        disabled={isSubmitting}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-form__input-group modal-form__input-group--full modal-form__multi-select-wrapper">
                    {/* 2. Campo de Placas Disponíveis (com filtros) */}
                    <label>Placas Disponíveis</label>
                    
                    {/* Filtro de Região (Cidade) */}
                    <select 
                        id="regiao-filtro"
                        className="modal-form__input"
                        value={selectedRegiao} 
                        onChange={(e) => setSelectedRegiao(e.target.value)} 
                        disabled={isSubmitting || isLoadingRegioes}
                    >
                        <option value="">{isLoadingRegioes ? 'A carregar...' : 'Filtrar por Região'}</option>
                        {regioes.map(r => <option key={r._id} value={r._id}>{r.nome}</option>)}
                    </select>

                    {/* Filtro de Busca (Número da Placa) */}
                    <input 
                        type="text"
                        className="modal-form__input"
                        placeholder="Pesquisar por número da placa..."
                        value={placaSearch}
                        onChange={(e) => setPlacaSearch(e.target.value)}
                        disabled={isSubmitting || isLoadingPlacas}
                    />
                    
                    {/* Lista de Placas Disponíveis (para clicar) */}
                    <div id="placas-list" className="modal-form__multi-select-list" tabIndex={0}>
                        {isLoadingPlacas ? (
                            <div className="modal-form__multi-select-option">A carregar placas...</div>
                        ) : (
                            availablePlacas.map(placa => (
                                <div 
                                    key={placa._id}
                                    className="modal-form__multi-select-option"
                                    onClick={() => handleSelectPlaca(placa._id)} // <<< CORREÇÃO 1
                                    onKeyDown={(e) => e.key === 'Enter' && handleSelectPlaca(placa._id)}
                                    tabIndex={0}
                                >
                                    {placa.numero_placa || `ID ${placa._id}`} - {getRegiaoNome(placa)}
                                </div>
                            ))
                        )}
                        {/* Mensagem se não houver resultados */}
                        {!isLoadingPlacas && availablePlacas.length === 0 && (
                             <div className="modal-form__multi-select-option">
                                {debouncedPlacaSearch || selectedRegiao
                                    ? 'Nenhuma placa encontrada com estes filtros.'
                                    : 'Nenhuma placa disponível (ou todas já selecionadas).'
                                }
                            </div>
                        )}
                    </div>
                    {/* (O input hidden 'placas' é registrado, mas não precisamos dele visível) */}
                    <input type="hidden" {...register('placas')} /> 
                    {modalErrors.placas && <div className="modal-form__error-message">{modalErrors.placas.message}</div>}
                </div>
                {/* --- FIM DO GRUPO DE PLACAS --- */}


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
                <button 
                    type="submit" 
                    className="modal-form__button modal-form__button--confirm" 
                    disabled={isSubmitting || isLoadingClientes || isLoadingPlacas || isLoadingRegioes}>
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