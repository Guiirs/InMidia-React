// src/components/PIModalForm/system/usePIFormLogic.js
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDebounce } from '../../../hooks/useDebounce'; // Importa o hook

// Helper para formatar data (movido para cá ou para um utils)
function formatDateForInput(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0];
}

/**
 * Hook customizado para gerenciar toda a lógica do PIModalForm.
 * Isso inclui o estado do formulário (RHF), o estado de navegação (etapas)
 * e o estado dos filtros da Etapa 2 (Placas), corrigindo o bug de perda de estado.
 */
export const usePIFormLogic = (onSubmit, initialData = {}, isSubmitting) => {
    
    // --- 1. Estado de Navegação ---
    const [currentStep, setCurrentStep] = useState(1);

    // --- 2. Estado dos Filtros (Resolvendo o Bug) ---
    // O estado dos filtros de placa agora vive aqui, no hook principal.
    const [selectedRegiao, setSelectedRegiao] = useState('');
    const [placaSearch, setPlacaSearch] = useState('');
    const debouncedPlacaSearch = useDebounce(placaSearch, 300);

    // --- 3. Lógica do Formulário (RHF) ---
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue, 
        control, 
        trigger,
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

    // Observa campos necessários para outras lógicas
    const dataInicio = watch('dataInicio');
    const dataFim = watch('dataFim'); 
    const watchedClienteId = watch('clienteId');

    // --- 4. Handlers e Efeitos ---
    
    // Efeito para resetar o formulário e os estados locais (filtros/etapa)
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
        
        setCurrentStep(1); // Reseta para a etapa 1 ao abrir
        setSelectedRegiao(''); // Reseta o filtro de região
        setPlacaSearch(''); // Reseta o filtro de busca

    }, [initialData, reset]);

    // Handler para o submit final
    const handleFormSubmit = (data) => {
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setModalError); 
    };

    // --- 5. Navegação de Etapas ---
    const nextStep = async () => {
        let fieldsToValidate;
        if (currentStep === 1) {
            fieldsToValidate = ['clienteId', 'descricao'];
        } else if (currentStep === 2) {
            // Adicionamos uma validação de mínimo 1 placa
            fieldsToValidate = ['placas']; 
            trigger('placas'); // Aciona a validação
        }
        
        if (fieldsToValidate) {
            const isValid = await trigger(fieldsToValidate);
            if (!isValid) return; 
        }
        
        if (currentStep < 3) {
            setCurrentStep(step => step + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(step => step - 1);
        }
    };

    // --- 6. Retorno do Hook ---
    // Retorna todos os estados e funções que a UI (Páginas e Container) precisa
    return {
        currentStep,
        
        // Controles do RHF
        formControls: {
            register,
            handleSubmit,
            watch,
            setValue,
            control,
            trigger,
            errors: modalErrors,
        },
        
        // Estados observados
        watchedValues: {
            dataInicio,
            dataFim,
            watchedClienteId,
        },

        // Controles de Filtro (para a Etapa 2)
        placaFilters: {
            selectedRegiao,
            setSelectedRegiao,
            placaSearch,
            setPlacaSearch,
            debouncedPlacaSearch
        },

        // Controles de Navegação
        navigation: {
            nextStep,
            prevStep,
            handleFormSubmit
        }
    };
};