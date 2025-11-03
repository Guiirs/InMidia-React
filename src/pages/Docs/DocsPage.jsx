import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Spinner from '../../components/Spinner/Spinner';
import docFile from './documentacao.md'; // Importa o caminho para o ficheiro .md
import './DocsPage.css'; // Criaremos este CSS no próximo passo

function DocsPage() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Usa fetch para ler o conteúdo do ficheiro .md importado
    fetch(docFile)
      .then(response => response.text())
      .then(text => {
        setMarkdownContent(text);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar documentação:", err);
        setMarkdownContent("# Erro ao carregar documentação\n\nNão foi possível carregar o ficheiro `documentacao.md`.");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Spinner message="A carregar documentação..." />;
  }

  return (
    <div className="docs-page-container">
      {/* A classe 'markdown-body' será usada para aplicar estilos */}
      <div className="markdown-body">
        <ReactMarkdown>
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default DocsPage;