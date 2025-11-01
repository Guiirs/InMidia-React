// src/components/PIModalForm/steps/PIFormStep3_Payment.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Etapa 3 do formulário de PI: Pagamento e Observações/Descrição.
 */
function PIFormStep3_Payment({ register, errors, isSubmitting }) {
    
    return (
        <>
            {/* Pagamento */}
            <div className="modal-form__input-group">
                <label htmlFor="formaPagamento">Condição de Pagamento*</label>
                <input type="text" id="formaPagamento" 
                    className={`modal-form__input ${errors.formaPagamento ? 'input-error' : ''}`}
                    placeholder="Ex: À vista, 30/60/90, PIX"
                    {...register('formaPagamento', { 
                        required: 'A condição de pagamento é obrigatória.', 
                        maxLength: { value: 100, message: 'Máximo de 100 caracteres.'}
                    })} 
                    disabled={isSubmitting} 
                />
                {errors.formaPagamento && <div className="modal-form__error-message">{errors.formaPagamento.message}</div>}
            </div>

            {/* Placeholder para preencher a grade */}
            <div className="modal-form__input-group">
                {/* Deixado vazio para manter o layout de grade */}
            </div>

            {/* Descrição dos Serviços (Movido para cá) */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="descricao">Descrição dos Serviços*</label>
                <textarea id="descricao" rows="3"
                    className={`modal-form__input ${errors.descricao ? 'input-error' : ''}`}
                    placeholder="Ex: Veiculação de campanha em placas selecionadas durante o período de XX a YY."
                    {...register('descricao', { required: 'A descrição é obrigatória.' })}
                    disabled={isSubmitting}
                ></textarea>
                {errors.descricao && <div className="modal-form__error-message">{errors.descricao.message}</div>}
            </div>
        </>
    );
}

PIFormStep3_Payment.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
};

export default PIFormStep3_Payment;