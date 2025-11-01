
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { fetchRegioes, fetchPlacasDisponiveis } from '../../services/api';
import { useController } from 'react-hook-form';
import { useState, useMemo } from 'react';
import Spinner from '../Spinner/Spinner';
import PlacaCard from '../PlacaCard/PlacaCard'; // Reutilizando o PlacaCard

/**
 * [CORREÇÃO] Este componente foi refatorado para corrigir o bug dos filtros.
 * * O bug "placas desaparecem ao selecionar" ocorre quando o estado que armazena
 * as placas filtradas é o mesmo que armazena a seleção, ou quando o filtro
 * é reaplicado de forma incorreta após a seleção.
 * * Correção:
 * 1. `allPlacas`: (do useQuery) Lista mestre de todas as placas disponíveis. NUNCA é modificada.
 * 2. `selectedRegiao`: (useState) Armazena o ID da região selecionada no filtro.
 * 3. `filteredPlacas`: (useMemo) Uma lista *derivada* de `allPlacas` baseada no `selectedRegiao`.
 * 4. `selectedPlacas` (do useController): Armazena APENAS os IDs das placas selecionadas.
 * * Ao selecionar/desmarcar uma placa, alteramos APENAS `selectedPlacas`.
 * Isso causa um re-render, mas `allPlacas` e `selectedRegiao` não mudam,
 * então `filteredPlacas` é estável e as outras placas não desaparecem.
 */
function PIModalFormPlacaSelector({ control, name, isSubmitting, dataInicio, dataFim }) {

    // --- 1. Estado de Filtro ---
    const [selectedRegiao, setSelectedRegiao] = useState(''); // Filtro de região
    const [searchTerm, setSearchTerm] = useState('');      // Filtro de busca (Bônus)

    // --- 2. Busca de Dados (React Query) ---

    // Busca Regiões para o dropdown de filtro
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: ['regioes', 'all'],
        queryFn: fetchRegioes,
        select: (data) => data.data ?? [],
        staleTime: 1000 * 60 * 15, // Cache de 15 min
    });

    // Busca Placas *Disponíveis*
    // A queryKey agora depende de dataInicio e dataFim.
    // Se as datas mudarem no Step 1, o React Query buscará novas placas.
    const { data: allPlacas = [], isLoading: isLoadingPlacas } = useQuery({
        queryKey: ['placas', 'disponiveis', dataInicio, dataFim],
        queryFn: () => fetchPlacasDisponiveis(dataInicio, dataFim),
        select: (data) => data.data ?? [], // Garante que seja um array
        enabled: !!dataInicio && !!dataFim, // Só busca se as datas existirem
        staleTime: 1000 * 60 * 5, // Cache de 5 min
    });

    // --- 3. Controle do Formulário (React Hook Form) ---
    // `field.value` será o array de IDs de placas selecionadas (ex: ['id1', 'id2'])
    const { field, fieldState } = useController({
        name,
        control,
        rules: { required: 'Selecione pelo menos uma placa.' },
    });

    // O array de IDs de placas selecionadas (ex: ['id1', 'id2'])
    const selectedPlacas = field.value || [];

    // --- 4. Lógica de Filtragem (Memoizada) ---
    
    const filteredPlacas = useMemo(() => {
        // Começa com todas as placas
        let placas = [...allPlacas];

        // 1. Filtra por Região
        if (selectedRegiao) {
            placas = placas.filter(placa => placa.regiao?._id === selectedRegiao);
        }

        // 2. Filtra por Termo de Busca (Bônus: busca por código ou endereço)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            placas = placas.filter(placa => 
                placa.codigo.toLowerCase().includes(lowerTerm) ||
                placa.endereco.toLowerCase().includes(lowerTerm)
            );
        }

        return placas;
    }, [allPlacas, selectedRegiao, searchTerm]);

    // --- 5. Handlers (Seleção de Placa) ---

    const handlePlacaToggle = (placaId) => {
        // Verifica se a placa (pelo ID) já está no array 'selectedPlacas'
        const isSelected = selectedPlacas.includes(placaId);
        let novoArrayDeIds;

        if (isSelected) {
            // Remove o ID
            novoArrayDeIds = selectedPlacas.filter(id => id !== placaId);
        } else {
            // Adiciona o ID
            novoArrayDeIds = [...selectedPlacas, placaId];
        }

        // Atualiza o estado do react-hook-form com o novo array de IDs
        field.onChange(novoArrayDeIds);
    };

    // --- 6. Renderização ---

    const isLoading = isLoadingPlacas || isLoadingRegioes;

    if (isLoading) {
        return <Spinner />;
    }

    if (!dataInicio || !dataFim) {
        return <p className="form-error">Por favor, defina as datas de início e fim na Etapa 1.</p>;
    }

    return (
        <fieldset>
            <legend>Etapa 2: Seleção de Placas</legend>

            {/* Filtros */}
            <div className="placa-selector__filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="filtro-regiao">Filtrar por Região</label>
                    <select
                        id="filtro-regiao"
                        value={selectedRegiao}
                        onChange={(e) => setSelectedRegiao(e.target.value)}
                        disabled={isSubmitting}
                    >
                        <option value="">Todas as Regiões</option>
                        {regioes.map(regiao => (
                            <option key={regiao._id} value={regiao._id}>{regiao.nome}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="filtro-busca">Buscar por Código</label>
                    <input
                        type="text"
                        id="filtro-busca"
                        placeholder="Ex: P-001"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Contador */}
            <div className="placa-selector__counter">
                <strong>{selectedPlacas.length}</strong> placa(s) selecionada(s). 
                Exibindo <strong>{filteredPlacas.length}</strong> de <strong>{allPlacas.length}</strong> disponíveis.
            </div>

            {/* Grid de Placas */}
            <div className="placa-selector__grid" style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1rem',
                padding: '0.5rem'
            }}>
                {filteredPlacas.length > 0 ? (
                    filteredPlacas.map(placa => {
                        const isSelected = selectedPlacas.includes(placa._id);
                        return (
                            <PlacaCard
                                key={placa._id}
                                placa={placa}
                                isSelected={isSelected}
                                onClick={() => handlePlacaToggle(placa._id)}
                                disabled={isSubmitting} // Desativa o clique se estiver submetendo
                                // O status 'Disponível' aqui é garantido pela API
                                status={{ text: 'Disponível', color: 'var(--color-success)' }} 
                            />
                        );
                    })
                ) : (
                    <p>Nenhuma placa encontrada para este período ou filtro.</p>
                )}
            </div>

            {/* Exibe erro de validação (ex: nenhuma placa selecionada) */}
            {fieldState.error && (
                <span className="form-error" style={{ marginTop: '1rem', display: 'block' }}>
                    {fieldState.error.message}
                </span>
            )}
        </fieldset>
    );
}

PIModalFormPlacaSelector.propTypes = {
    control: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string.isRequired, // Vem do watch() do form principal
    dataFim: PropTypes.string.isRequired,    // Vem do watch() do form principal
};

export default PIModalFormPlacaSelector;