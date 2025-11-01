// src/components/PIModalForm/steps/PIFormStep1_Cliente.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../Spinner/Spinner';

/**
 * Etapa 1 do formulário de PI: Seleção de Cliente e Informações Iniciais.
 * Este componente recebe todos os controles do React Hook Form do componente pai.
 */
function PIFormStep1_Cliente({
    register,
    errors,
    isSubmitting,
    clientes,
    isLoadingClientes,
    watchedClienteId,
    setValue
}) {

    // Efeito para auto-preencher os campos 'responsavel' e 'segmento'
    // quando um cliente é selecionado na lista.
    useEffect(() => {
        if (watchedClienteId) {
            const clienteSelecionado = clientes.find(c => c._id === watchedClienteId);
            if (clienteSelecionado) {
                setValue('responsavel', clienteSelecionado.responsavel || '', { shouldValidate: true });
                setValue('segmento', clienteSelecionado.segmento || '', { shouldValidate: true });
            }
        } else {
            // Limpa os campos se nenhum cliente estiver selecionado
             setValue('responsavel', '', { shouldValidate: false });
             setValue('segmento', '', { shouldValidate: false });
        }
    }, [watchedClienteId, clientes, setValue]);

    return (
        <>
            {/* --- Seletor de Cliente --- */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="clienteId">Cliente</label>
                {isLoadingClientes ? (
                    <Spinner message="A carregar clientes..." mini />
                ) : (
                    <select
                        id="clienteId"
                        className={`modal-form__input ${errors.clienteId ? 'input-error' : ''}`}
                        {...register('clienteId', { required: 'O cliente é obrigatório.' })}
                        disabled={isSubmitting}
                    >
                        <option value="">Selecione um cliente...</option>
                        {clientes.map(cliente => (
                            <option key={cliente._id} value={cliente._id}>
                                {cliente.nome}
                            </option>
                        ))}
                    </select>
                )}
                {errors.clienteId && <div className="modal-form__error-message">{errors.clienteId.message}</div>}
            </div>

            {/* --- Campos de Auto-Preenchimento --- */}
            <div className="modal-form__input-group">
                <label htmlFor="responsavel">Responsável</label>
                <input
                    type="text"
                    id="responsavel"
                    className="modal-form__input"
                    {...register('responsavel')}
                    readOnly
                    disabled
                    placeholder="Automático"
                />
            </div>

            <div className="modal-form__input-group">
                <label htmlFor="segmento">Segmento</label>
                <input
                    type="text"
                    id="segmento"
                    className="modal-form__input"
                    {...register('segmento')}
                    readOnly
                    disabled
                    placeholder="Automático"
                />
            </div>
            
            {/* --- Descrição --- */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="descricao">Descrição (Título da Proposta)</label>
                <textarea
                    id="descricao"
                    rows="3"
                    className={`modal-form__input ${errors.descricao ? 'input-error' : ''}`}
                    placeholder="Ex: Campanha Dia das Mães - Cliente X"
                    {...register('descricao', { required: 'A descrição é obrigatória.' })}
                    disabled={isSubmitting}
                ></textarea>
                {errors.descricao && <div className="modal-form__error-message">{errors.descricao.message}</div>}
            </div>
        </>
    );
}

PIFormStep1_Cliente.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    clientes: PropTypes.array.isRequired,
    isLoadingClientes: PropTypes.bool.isRequired,
    watchedClienteId: PropTypes.string,
    setValue: PropTypes.func.isRequired,
};

export default PIFormStep1_Cliente;