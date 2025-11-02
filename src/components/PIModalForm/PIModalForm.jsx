// src/components/PIModalForm/PIModalForm.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchClientes } from '../../services/api';

// Importa os novos componentes de Etapa
import PIFormStep1_Cliente from './steps/PIFormStep1_Cliente';
import PIModalFormPlacaSelector from './steps/PIModalFormPlacaSelector';
import PIFormStep3_Valores from './steps/PIFormStep3_Valores';

// Importa o novo CSS para as etapas
import './steps/PIFormSteps.css';

// Helper para formatar data
function formatDateForInput(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0];
}

function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    
    // --- 1. Estado de Navegação ---
    const [currentStep, setCurrentStep] = useState(1);

    // --- 2. Lógica de Clientes (para Etapa 1) ---
    const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
        // --- CORREÇÃO DO BUG DE CACHE AQUI ---
        // A chave agora é ['clientes'].
        // Quando a ClientesPage invalidar ['clientes'], esta query será
        // automaticamente atualizada.
        queryKey: ['clientes'], 
        // --- FIM DA CORREÇÃO ---
        
        queryFn: () => fetchClientes(new URLSearchParams({ limit: 1000 })), // Busca todos
        select: (data) => data.data ?? [],
        staleTime: 1000 * 60 * 10 // 10 min cache
    });

    // --- 3. Lógica do Formulário (RHF) ---
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue, 
        control, 
        trigger, // Usado para validar etapas
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

    // Observa campos necessários para outras etapas/lógica
    const dataInicio = watch('dataInicio');
    const dataFim = watch('dataFim'); 
    const watchedClienteId = watch('clienteId');

    const isLoadingPlacasEAfins = false; // Etapa 2 cuida do seu próprio loading
    
    // --- 5. Handlers e Efeitos ---
    
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

    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setModalError); 
    };
    
    const isLoading = isSubmitting || isLoadingClientes; // Removido isLoadingPlacasEAfins

    // --- 6. Navegação de Etapas ---
    const nextStep = async () => {
        let fieldsToValidate;
        if (currentStep === 1) {
            fieldsToValidate = ['clienteId', 'descricao'];
        } else if (currentStep === 2) {
            fieldsToValidate = ['placas']; 
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

    // --- 7. Renderização ---
    return (
        <form id="pi-form" className="modal-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            
            {/* Indicador de Etapas */}
            <div className="pi-form-steps">
                <div className={`pi-form-step ${currentStep === 1 ? 'active' : (currentStep > 1 ? 'completed' : '')}`}>
                    <div className="pi-form-step__bubble">1</div>
                    <span>Cliente</span>
                </div>
                <div className={`pi-form-step ${currentStep === 2 ? 'active' : (currentStep > 2 ? 'completed' : '')}`}>
                    <div className="pi-form-step__bubble">2</div>
                    <span>Placas</span>
                </div>
                <div className={`pi-form-step ${currentStep === 3 ? 'active' : ''}`}>
                    <div className="pi-form-step__bubble">3</div>
                    <span>Valores</span>
                </div>
            </div>

            {/* Conteúdo da Etapa (Renderização Condicional) */}
            <div className="modal-form__grid pi-form__step-content">
                
                {currentStep === 1 && (
                    <PIFormStep1_Cliente
                        register={register}
                        errors={modalErrors}
                        isSubmitting={isSubmitting}
                        clientes={clientes}
                        isLoadingClientes={isLoadingClientes}
                        watchedClienteId={watchedClienteId}
                        setValue={setValue}
                    />
                )}
                
                {currentStep === 2 && (
                    <PIModalFormPlacaSelector
                        control={control}
                        name="placas"
                        isSubmitting={isSubmitting}
                        dataInicio={dataInicio}
                        dataFim={dataFim}
                    />
                )}

                {currentStep === 3 && (
                    <PIFormStep3_Valores
                        register={register}
                        errors={modalErrors}
                        isSubmitting={isSubmitting}
                        dataInicio={dataInicio}
                        setValue={setValue}
                        watch={watch} 
                    />
                )}

            </div>

            {/* Ações do Formulário (Navegação) */}
            <div className="modal-form__actions">
                <button 
                    type="button" 
                    className="modal-form__button modal-form__button--cancel" 
                    onClick={onClose} 
                    disabled={isLoading}>
                    Cancelar
                </button>
                
                {currentStep > 1 && (
                    <button 
                        type="button" 
                        className="modal-form__button modal-form__button--cancel" 
                        onClick={prevStep} 
                        disabled={isLoading}>
                        Voltar
                    </button>
                )}

                {currentStep < 3 && (
                    <button 
                        type="button" 
                        className="modal-form__button modal-form__button--confirm" 
                        onClick={nextStep} 
                        disabled={isLoading}>
                        Próximo
                    </button>
                )}

                {currentStep === 3 && (
                    <button 
                        type="submit" 
                        className="modal-form__button modal-form__button--confirm" 
                        disabled={isLoading}>
                        {isSubmitting ? 'A guardar...' : (initialData._id ? 'Guardar Alterações' : 'Criar PI')}
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