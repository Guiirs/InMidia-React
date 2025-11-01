// src/components/PIModalForm/PIModalForm.jsx
import React, { useEffect } from 'react'; 
import PropTypes from 'prop-types'; 
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchClientes } from '../../services/api'; 

// Importa os sub-componentes e o hook
import PIModalFormInfo from './PIModalFormInfo';
import PIModalFormPlacaSelector from './PIModalFormPlacaSelector';
// Corrigido o caminho se 'hooks' estiver em src/
import { usePlacaFilters } from '../../hooks/usePlacaFilters'; 


function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    
    // --- ESTÁGIO 1: Renderização ---
    console.log("--- [PIModalForm] ESTÁGIO 1: Componente RENDERIZOU ---");

    // --- 1. Lógica de Clientes ---
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientes', 'all'], 
        queryFn: () => fetchClientes(new URLSearchParams({ limit: 1000 })),
        select: (data) => data.data ?? [],
        staleTime: 1000 * 60 * 10
    });

    // --- 2. Lógica do Formulário (React Hook Form) ---
    const {
        register,
        handleSubmit,
        reset, // A função reset vem daqui
        watch,
        setValue, 
        control, 
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

    // Observa campos
    const dataInicio = watch('dataInicio');
    const watchedClienteId = watch('clienteId');
    const watchedPlacas = watch('placas') || [];

    // --- 3. Lógica de Placas (Vive no Pai) ---
    const {
        isLoading: isLoadingPlacasEAfins,
        regioes,
        availablePlacas,
        selectedPlacasObjects,
        getRegiaoNome,
        selectedRegiao,
        setSelectedRegiao,
        placaSearch,
        setPlacaSearch
    } = usePlacaFilters(watchedPlacas); // Passa os IDs selecionados para o hook

    // --- ESTÁGIO 2: Estado dos Filtros ---
    console.log(
        `[PIModalForm] ESTÁGIO 2: Hook usePlacaFilters. Estado atual:`,
        `\n  - Regiao: "${selectedRegiao}"`,
        `\n  - Search: "${placaSearch}"`,
        `\n  - Placas Selecionadas (IDs): [${watchedPlacas.length}]`
    );

    
    // --- 4. Handlers e Efeitos ---
    function formatDateForInput(isoDate) {
        if (!isoDate) return '';
        return new Date(isoDate).toISOString().split('T')[0];
    }
    
    // ---
    // --- ALTERAÇÃO NECESSÁRIA ESTÁ AQUI ---
    // ---
    // Efeito para resetar o form (agora também reseta os filtros)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        // --- ESTÁGIO 3: Reset (Abertura do Modal) ---
        console.log("%c[PIModalForm] ESTÁGIO 3 (EFEITO): Resetando formulário e filtros (Modal abriu).", "color: red; font-weight: bold;");
        
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
        
        // Reseta os filtros no hook
        setSelectedRegiao('');
        setPlacaSearch('');

    // A lista de dependências SÓ deve incluir 'initialData'.
    // Removemos 'reset' porque ele está a causar o re-trigger do efeito.
    // O 'eslint-disable-next-line' acima é para suprimir o aviso sobre isso.
    }, [initialData]);
    // --- FIM DA ALTERAÇÃO ---


    // Efeito para auto-preencher dados do cliente
    useEffect(() => {
        // --- ESTÁGIO 4: Efeito de Cliente ---
        console.log(`[PIModalForm] ESTÁGIO 4 (EFEITO): Verificando auto-preenchimento (Cliente ID: ${watchedClienteId}).`);
        
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

    
    const handleFormSubmit = (data) => {
        // --- ESTÁGIO 5: Submit ---
        console.log("[PIModalForm] ESTÁGIO 5 (AÇÃO): Formulário submetido.", data);
        const { responsavel, segmento, ...piData } = data;
        // Passa o setModalError para o PIsPage poder definir erros de API
        onSubmit(piData, setModalError); 
    };
    
    // Loading total (para os botões de Ação)
    const isLoading = isSubmitting || isLoadingClientes || isLoadingPlacasEAfins;

    // --- 4. Renderização (JSX) ---
    
    // --- ESTÁGIO 6: Pré-Renderização ---
    console.log(
        `%c[PIModalForm] ESTÁGIO 6: Preparando renderização...`,
        "color: blue;",
        `\n  - Filtros que serão passados: Regiao="${selectedRegiao}", Search="${placaSearch}"`
    );

    return (
        <form id="pi-form" className="modal-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            
            <div className="modal-form__grid">
                
                {/* Componente 1: Campos de Informação */}
                <PIModalFormInfo
                    register={register}
                    errors={modalErrors}
                    isSubmitting={isSubmitting}
                    dataInicio={dataInicio}
                    clientes={clientes}
                    isLoadingClientes={isLoadingClientes}
                />
                
                {/* Componente 2: Seletor de Placas */}
                <PIModalFormPlacaSelector
                    control={control}
                    name="placas"
                    isSubmitting={isSubmitting}
                    
                    // Passa todos os resultados e setters do hook para o componente-filho
                    isLoading={isLoadingPlacasEAfins}
                    regioes={regioes}
                    availablePlacas={availablePlacas}
                    selectedPlacasObjects={selectedPlacasObjects}
                    getRegiaoNome={getRegiaoNome}
                    
                    // As props mais importantes: o estado e as funções de set
                    selectedRegiao={selectedRegiao}
                    setSelectedRegiao={setSelectedRegiao}
                    placaSearch={placaSearch}
                    setPlacaSearch={setPlacaSearch}
                />

            </div>

            {/* Ações do Formulário */}
            <div className="modal-form__actions">
                <button type="button" className="modal-form__button modal-form__button--cancel" onClick={onClose} disabled={isLoading}>
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    className="modal-form__button modal-form__button--confirm" 
                    disabled={isLoading}>
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