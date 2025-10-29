// src/components/UserTable/UserTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

// O componente recebe os utilizadores e as funções de callback como props
function UserTable({ users, loggedInUserId, onRoleChange, onDeleteClick }) {

    // Renderiza as linhas da tabela
    return (
        <tbody>
            {users.map(user => {
                // Verifica se esta linha corresponde ao utilizador logado
                const isCurrentUser = loggedInUserId && String(user._id) === String(loggedInUserId);
                const disableActions = isCurrentUser;
                const disableReason = isCurrentUser ? "Não pode alterar/apagar a sua própria conta aqui" : "";

                return (
                    <tr key={user._id}>
                        <td>{user._id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                            <select
                                className="admin-users-page__role-select" // Mantém a classe original para estilos
                                value={user.role}
                                onChange={(e) => onRoleChange(user._id, e.target.value, e.target)} // Chama o callback
                                disabled={disableActions}
                                title={disableReason}
                            >
                                <option value="user">Utilizador</option>
                                <option value="admin">Admin</option>
                            </select>
                        </td>
                        <td className="admin-users-page__actions"> {/* Mantém a classe original para estilos */}
                            <button
                                className="admin-users-page__action-button admin-users-page__action-button--delete" // Mantém a classe original para estilos
                                title={disableReason || "Apagar"}
                                onClick={() => onDeleteClick(user)} // Chama o callback
                                disabled={disableActions}
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                            {/* Poderia adicionar um botão de editar aqui se necessário no futuro */}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

UserTable.propTypes = {
    users: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
    })).isRequired,
    loggedInUserId: PropTypes.string, // ID do utilizador logado para desativar ações
    onRoleChange: PropTypes.func.isRequired, // Função para lidar com a mudança de role
    onDeleteClick: PropTypes.func.isRequired, // Função para lidar com o clique em apagar
};

export default UserTable;