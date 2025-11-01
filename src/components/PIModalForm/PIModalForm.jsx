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
    // Esta lista é necessária para o dropdown de clientes na Etapa 1.
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
    // E garante que os dados sejam aplicados logo após os clientes serem carregados.
    // [CORREÇÃO DE SINCRONIZAÇÃO DE CLIENTES]
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        console.log("%c[PIModalForm] EFEITO: Inicializando Formulário e Steps.", "color: red; font-weight: bold;");
        
        // Só tenta resetar se os clientes estiverem carregados, garantindo que o dropdown não fique vazio
        if (isLoadingClientes) return;

        const cliente = initialData.cliente || {};
        
        // Construímos o objeto de reset com os valores de initialData
        const resetData = {
            clienteId: cliente._id || initialData.cliente || '', // Aplica o ID do cliente carregado
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : today,
            dataFim: initialData.dataFim ? formatDateForInput(initialData.dataFim) : '',
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
            responsavel: cliente.responsavel || '',
            segmento: cliente.segmento || '',
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas?.map(p => p._id || p) || []
        };

        // Reseta o formulário com os valores
        reset(resetData);
        setCurrentStep(1); // Garante que começa no Step 1

    // Depende de initialData (troca de modal) e isLoadingClientes (dados carregados)
    // Se isLoadingClientes for removido, o form inicializará com campos vazios e resetará após o fetch.
    // Manter a dependência garante que reset seja chamado apenas uma vez, quando os dados estiverem prontos.
    }, [initialData, isLoadingClientes, reset]); 


    // Handler de Submissão Final
    const handleFormSubmit = (data) => {
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setModalError); 
    };
    
    const isLoading = isSubmitting || isLoadingClientes;


    // --- 5. Renderização dos Steps ---

    const renderStepContent = () => {
        // Props comuns que todo Step precisa
        const commonProps = { 
            register, errors: modalErrors, isSubmitting, control, watch, setValue, 
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
                        disabled={isLoading}
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