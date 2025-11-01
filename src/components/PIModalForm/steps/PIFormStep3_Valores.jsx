// src/components/PIModalForm/steps/PIFormStep3_Valores.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Etapa 3 do formulário de PI: Datas, Valores e Pagamento.
 */
function PIFormStep3_Valores({
    register,
    errors,
    isSubmitting,
    dataInicio, // Vem do 'watch' do RHF no componente pai
    setValue,
    watch
}) {

    // Observa o tipo de período
    const tipoPeriodo = watch('tipoPeriodo');

    // Lógica para calcular a data final automaticamente (movida para cá)
    const calculaDataFim = (inicio, periodo) => {
        if (!inicio || !periodo) return '';

        try {
            const data = new Date(inicio + 'T00:00:00'); // Trata como data local
            if (periodo === 'quinzenal') {
                data.setDate(data.getDate() + 14); // 15 dias (0 + 14)
            } else if (periodo === 'mensal') {
                data.setMonth(data.getMonth() + 1);
                data.setDate(data.getDate() - 1); // Ex: 01/01 -> 31/01
            }
            return data.toISOString().split('T')[0];
        } catch (e) {
            console.error("Erro ao calcular data final:", e);
            return '';
        }
    };

    // Efeito para atualizar a data final automaticamente
    useEffect(() => {
        const dataFimCalculada = calculaDataFim(dataInicio, tipoPeriodo);
        if (dataFimCalculada) {
            setValue('dataFim', dataFimCalculada, { shouldValidate: true });
        }
    }, [dataInicio, tipoPeriodo, setValue]);


    return (
        <>
            {/* --- Linha 1: Período e Datas --- */}
            <div className="modal-form__input-group">
                <label htmlFor="tipoPeriodo">Tipo de Período</label>
                <select
                    id="tipoPeriodo"
                    className={`modal-form__input ${errors.tipoPeriodo ? 'input-error' : ''}`}
                    {...register('tipoPeriodo', { required: 'O período é obrigatório.' })}
                    disabled={isSubmitting}
                >
                    <option value="mensal">Mensal</option>
                    <option value="quinzenal">Quinzenal</option>
                </select>
                {errors.tipoPeriodo && <div className="modal-form__error-message">{errors.tipoPeriodo.message}</div>}
            </div>

            <div className="modal-form__input-group">
                <label htmlFor="dataInicio">Data de Início</label>
                <input
                    type="date"
                    id="dataInicio"
                    className={`modal-form__input ${errors.dataInicio ? 'input-error' : ''}`}
                    {...register('dataInicio', { required: 'A data de início é obrigatória.' })}
                    disabled={isSubmitting}
                />
                {errors.dataInicio && <div className="modal-form__error-message">{errors.dataInicio.message}</div>}
            </div>

            <div className="modal-form__input-group">
                <label htmlFor="dataFim">Data de Fim (Automática)</label>
                <input
                    type="date"
                    id="dataFim"
                    className={`modal-form__input ${errors.dataFim ? 'input-error' : ''}`}
                    {...register('dataFim', { required: 'A data final é obrigatória.' })}
                    disabled={isSubmitting}
                    readOnly // Sugestão: tornar readOnly se for sempre automático
                />
                {errors.dataFim && <div className="modal-form__error-message">{errors.dataFim.message}</div>}
            </div>

            {/* --- Linha 2: Valores e Pagamento --- */}
            <div className="modal-form__input-group">
                <label htmlFor="valorTotal">Valor Total (R$)</label>
                <input
                    type="number"
                    step="0.01"
                    id="valorTotal"
                    className={`modal-form__input ${errors.valorTotal ? 'input-error' : ''}`}
                    {...register('valorTotal', {
                        required: 'O valor é obrigatório.',
                        valueAsNumber: true,
                        min: { value: 0.01, message: 'O valor deve ser positivo.' }
                    })}
                    disabled={isSubmitting}
                />
                {errors.valorTotal && <div className="modal-form__error-message">{errors.valorTotal.message}</div>}
            </div>

            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="formaPagamento">Forma de Pagamento</label>
                <input
                    type="text"
                    id="formaPagamento"
                    className={`modal-form__input ${errors.formaPagamento ? 'input-error' : ''}`}
                    placeholder="Ex: Boleto 30/60/90, PIX, etc."
                    {...register('formaPagamento')}
                    disabled={isSubmitting}
                />
                {errors.formaPagamento && <div className="modal-form__error-message">{errors.formaPagamento.message}</div>}
            </div>
        </>
    );
}

PIFormStep3_Valores.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string,
    setValue: PropTypes.func.isRequired,
    watch: PropTypes.func.isRequired,
};

export default PIFormStep3_Valores;