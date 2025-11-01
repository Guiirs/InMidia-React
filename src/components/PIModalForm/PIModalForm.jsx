// src/components/PIModalForm/PIModalForm.jsx
import React, { useEffect, useState, useCallback } from 'react'; 
import PropTypes from 'prop-types'; 
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchClientes } from '../../services/api'; 

// Importa os steps e o seletor isolado
import PIFormStep1_Client from './steps/PIFormStep1_Client'; 
import PIModalFormPlacaSelector from './PIModalFormPlacaSelector'; 
import PIFormStep3_Payment from './steps/PIFormStep3_Payment'; 

function formatDateForInput(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0];
}

const today = new Date().toISOString().split('T')[0];

const STEPS = [
    { 
        name: "Cliente e Detalhes", 
        fields: ['clienteId', 'tipoPeriodo', 'dataInicio', 'dataFim', 'valorTotal'] 
    },
    { 
        name: "Seleção de Placas", 
        fields: ['placas'] 
    },
    { 
        name: "Pagamento e Descrição", 
        fields: ['formaPagamento', 'descricao'] 
    },
];
const TOTAL_STEPS = STEPS.length;


function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    
    const [currentStep, setCurrentStep] = useState(1);

    // --- 1. Lógica de Clientes ---
    // Busca clientes via React Query. 'clientes' será undefined ou o array.
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        queryKey: ['clientes', 'all'], 
        queryFn: () => fetchClientes(new URLSearchParams({ limit: 1000 })),
        select: (data) => data.data ?? [], // Garante que 'clientes' seja sempre um array
        staleTime: 1000 * 60 * 10 // Cache de 10 minutos
    });

    // --- 2. Lógica do Formulário (React Hook Form) ---
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
    });

    const watchedPlacas = watch('placas'); 

    // --- 3. Handlers de Navegação ---

    const validateStep = useCallback(async () => {
        const currentStepFields = STEPS[currentStep - 1].fields;
        const isValid = await trigger(currentStepFields);

        // Validação extra para o Passo 2: Placas (Checa se o array não está vazio)
        if (currentStep === 2) {
            const hasPlacas = watchedPlacas && watchedPlacas.length > 0;
            
            if (!hasPlacas) {
                setModalError('placas', { type: 'required', message: 'Selecione pelo menos uma placa.' });
                return false;
            }
        }
        // Limpa o erro de placas se ele estiver correto
        if (currentStep === 2 && modalErrors.placas && watchedPlacas && watchedPlacas.length > 0) {
            setModalError('placas', { type: 'clear' }); // Truque para limpar o erro
        }

        return isValid;
    }, [currentStep, trigger, watchedPlacas, setModalError, modalErrors]);


    const nextStep = useCallback(async () => {
        const isValid = await validateStep();

        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
        }
    }, [validateStep]);

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };


    // --- 4. Efeitos de Inicialização ---

    // Efeito principal: Inicializa o formulário com dados de edição (initialData)
    // [CORREÇÃO/DEBUG] Adicionado logs para diagnosticar o problema de "cliente não carregar".
    useEffect(() => {
        console.log("%c[PIModalForm] EFEITO: Tentando inicializar formulário...", "color: blue;");

        // 1. Se os clientes ainda estão carregando (isLoadingClientes = true), não faz nada.
        // O React vai rodar este efeito de novo quando isLoadingClientes mudar para false.
        // Isso previne a "race condition" de resetar o form antes dos clientes existirem.
        if (isLoadingClientes) {
            console.log("%c[PIModalForm] ...Aguardando clientes.", "color: gray;");
            return;
        }

        // Se chegou aqui, isLoadingClientes é false.
        console.log(`%c[PIModalForm] ...Clientes carregados (${clientes.length} encontrados).`, "color: green;");
        console.log("[PIModalForm] InitialData recebido:", initialData);

        const cliente = initialData.cliente || {};
        
        // 2. Construímos o objeto de reset com os valores de initialData
        const resetData = {
            clienteId: cliente._id || initialData.cliente || '', // Tenta pegar o _id do objeto, ou o ID solto
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : today,
            dataFim: initialData.dataFim ? formatDateForInput(initialData.dataFim) : '',
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
            responsavel: cliente.responsavel || '', // Campo extra do Step 1
            segmento: cliente.segmento || '',     // Campo extra do Step 1
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas?.map(p => p._id || p) || [] // Garante que temos apenas os IDs
        };

        console.log("[PIModalForm] Resetando formulário com:", resetData);

        // 3. Reseta o formulário com os valores
        reset(resetData);
        setCurrentStep(1); // Garante que começa no Step 1

    // A dependência [isLoadingClientes] é INTENCIONAL e CORRETA.
    // Queremos que este efeito rode QUANDO os dados de initialData mudam (ex: editar outra PI)
    // E TAMBÉM quando os clientes terminam de carregar (isLoadingClientes muda de true para false).
    // Adicionado 'clientes' apenas para garantir que o log reflita o estado mais recente.
    }, [initialData, isLoadingClientes, reset, clientes]); 


    // Handler de Submissão Final
    const handleFormSubmit = (data) => {
        // Remove os campos extras (responsavel, segmento) que são só de exibição
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setModalError); 
    };
    
    // O loading geral do modal considera o submit ou o carregamento inicial de clientes
    const isLoading = isSubmitting || isLoadingClientes;


    // --- 5. Renderização dos Steps ---

    const renderStepContent = () => {
        // Props comuns que todo Step precisa
        const commonProps = { 
            register, 
            errors: modalErrors, 
            isSubmitting, 
            control, 
            watch, 
            setValue, 
            clientes, // Passa a lista de clientes para Step 1
            isLoadingClientes // Passa o status de loading para Step 1
        };
        
        switch (currentStep) {
            case 1:
                return (
                    <PIFormStep1_Client 
                        {...commonProps} 
                    />
                );
            case 2:
                // O componente PlacaSelector é auto-suficiente
                return (
                    <PIModalFormPlacaSelector
                        control={control}
                        name="placas"
                        isSubmitting={isSubmitting}
                        initialData={initialData} // Usado para reset interno do filtro
                        // Passa as datas para o seletor de placas poder usá-las
                        dataInicio={watch('dataInicio')}
                        dataFim={watch('dataFim')}
                    />
                );
            case 3:
                return (
                    <PIFormStep3_Payment 
                        register={register}
                        errors={modalErrors}
                        isSubmitting={isSubmitting}
                    />
                );
            default:
                return <div>Erro: Passo inválido</div>;
        }
    };


    return (
        <form id="pi-form" className="modal-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            
            {/* Indicador de Progresso (Simples) */}
            <div className="modal-form__stepper">
                {STEPS.map((step, index) => (
                    <span 
                        key={step.name} 
                        className={`modal-form__step ${currentStep === index + 1 ? 'active' : ''} ${currentStep > index + 1 ? 'completed' : ''}`}
                    >
                        {index + 1}. {step.name}
                    </span>
                ))}
            </div>


            {/* Conteúdo do Passo Atual */}
            <div className="modal-form__grid modal-form__grid--stepped">
                {renderStepContent()}
            </div>

            {/* Ações do Formulário (Próximo, Voltar, Guardar) */}
            <div className="modal-form__actions">
                <button type="button" className="modal-form__button modal-form__button--cancel" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                </button>

                {currentStep > 1 && (
                    <button type="button" className="modal-form__button modal-form__button--secondary" onClick={prevStep} disabled={isLoading}>
                        &larr; Voltar
                    </button>
                )}
                
                {currentStep < TOTAL_STEPS ? (
                    <button 
                        type="button" 
                        className="modal-form__button modal-form__button--confirm" 
                        onClick={nextStep}
                        disabled={isLoading} // Desativa se estiver carregando clientes ou submetendo
                    >
                        Próximo &rarr;
                    </button>
                ) : (
                    <button 
                        type="submit" 
                        className="modal-form__button modal-form__button--confirm" 
                        disabled={isLoading}>
                        {isSubmitting ? 'A guardar...' : 'Guardar PI'}
                    </button>
                )}
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