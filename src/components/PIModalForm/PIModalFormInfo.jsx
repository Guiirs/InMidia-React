// src/components/PIModalForm/PIModalFormInfo.jsx
import React from 'react';
import PropTypes from 'prop-types'; // <-- CORREÇÃO: Importar PropTypes

function PIModalFormInfo({ 
    register, 
    errors, 
    isSubmitting, 
    dataInicio, 
    clientes, 
    isLoadingClientes 
}) {
    return (
        <>
            {/* Cliente */}
            <div className="modal-form__input-group modal-form__input-group--full">
                 <label htmlFor="clienteId">Cliente</label>
                <select id="clienteId"
                       className={`modal-form__input ${errors.clienteId ? 'input-error' : ''}`}
                       {...register('clienteId', { required: 'O cliente é obrigatório.' })}
                       disabled={isSubmitting || isLoadingClientes}>
                    <option value="">{isLoadingClientes ? 'A carregar...' : 'Selecione...'}</option>
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
            
            {/* Campos da PI (Pagamento, Período, Valor, Datas) */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="formaPagamento">Forma de Pagamento</label>
                <input type="text" id="formaPagamento" placeholder="Ex: 30/60 dias, Ato, PIX na instalação"
                       className={`modal-form__input ${errors.formaPagamento ? 'input-error' : ''}`}
                       {...register('formaPagamento')} disabled={isSubmitting} />
                {errors.formaPagamento && <div className="modal-form__error-message">{errors.formaPagamento.message}</div>}
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="tipoPeriodo">Tipo de Período</label>
                <select id="tipoPeriodo" className={`modal-form__input ${errors.tipoPeriodo ? 'input-error' : ''}`}
                        {...register('tipoPeriodo', { required: 'O período é obrigatório.' })} disabled={isSubmitting}>
                    <option value="mensal">Mensal</option>
                    <option value="quinzenal">Quinzenal</option>
                </select>
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="valorTotal">Valor Total (R$)</label>
                <input type="number" id="valorTotal" step="0.01" className={`modal-form__input ${errors.valorTotal ? 'input-error' : ''}`}
                       {...register('valorTotal', { 
                           required: 'O valor é obrigatório.', valueAsNumber: true,
                           min: { value: 0.01, message: 'Valor deve ser positivo.'}
                       })} disabled={isSubmitting} />
                {errors.valorTotal && <div className="modal-form__error-message">{errors.valorTotal.message}</div>}
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="dataInicio">Data Início</label>
                <input type="date" id="dataInicio" className={`modal-form__input ${errors.dataInicio ? 'input-error' : ''}`}
                       {...register('dataInicio', { required: 'Data de início é obrigatória.' })} disabled={isSubmitting} />
                {errors.dataInicio && <div className="modal-form__error-message">{errors.dataInicio.message}</div>}
            </div>
            <div className="modal-form__input-group">
                <label htmlFor="dataFim">Data Fim</label>
                <input type="date" id="dataFim" className={`modal-form__input ${errors.dataFim ? 'input-error' : ''}`}
                       {...register('dataFim', { 
                           required: 'Data final é obrigatória.',
                           validate: (value) => value > dataInicio || 'A data final deve ser posterior à inicial.'
                       })} disabled={isSubmitting} />
                {errors.dataFim && <div className="modal-form__error-message">{errors.dataFim.message}</div>}
            </div>

            {/* Descrição */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="descricao">Descrição dos Serviços</label>
                <textarea id="descricao" rows="4"
                       className={`modal-form__input ${errors.descricao ? 'input-error' : ''}`}
                       {...register('descricao', { required: 'A descrição é obrigatória.' })}
                       disabled={isSubmitting}
                ></textarea>
                {errors.descricao && <div className="modal-form__error-message">{errors.descricao.message}</div>}
            </div>
        </>
    );
}

// PropTypes para garantir que as props são passadas
PIModalFormInfo.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string,
    clientes: PropTypes.array.isRequired,
    isLoadingClientes: PropTypes.bool.isRequired,
};

export default PIModalFormInfo;