document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('measurements-form');
    const nomeInput = document.getElementById('nome');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
    const idadeInput = document.getElementById('idade');
    const sexoInput = document.getElementById('sexo');
    const protocoloInput = document.getElementById('protocolo');
    const dobrasCampos = document.getElementById('dobras-campos');
    const resultadosContainer = document.getElementById('resultados-container'); // Não está sendo usado, pode remover se quiser
    const exportarPdfButton = document.getElementById('exportar-pdf');
    const exportarCsvButton = document.getElementById('export-csv');
    const limparCamposButton = document.getElementById('limpar-campos');
    const resultadoAvaliacaoButton = document.getElementById('resultado-avaliacao-button');
    const exportarPdfFormButton = document.getElementById('exportar-pdf-form');
    const tabSaveButtons = document.querySelectorAll('.btn-tab-save');

    // Elementos das abas
    const tabNav = document.getElementById('tab-nav');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabRmlContent = document.getElementById('tab-content-rml'); // Não está sendo usado diretamente, pode remover se quiser

    // Inicializa a aba ativa (Dados do Aluno por padrão)
    let activeTab = 'dados-aluno';
    showTab(activeTab);

    // Event listeners para a navegação das abas
    tabNav.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'LI') {
            const tabId = e.target.dataset.tab;
            if (tabId) {
                showTab(tabId);
            }
        }
    });

    function showTab(tabId) {
        tabContents.forEach(content => {
            content.classList.remove('tab-visible');
        });
        tabNav.querySelectorAll('li').forEach(tab => {
            tab.classList.remove('tab-active');
        });

        const selectedTabContent = document.getElementById(`tab-content-${tabId}`);
        const selectedNavLink = tabNav.querySelector(`li[data-tab="${tabId}"]`);

        if (selectedTabContent && selectedNavLink) {
            selectedTabContent.classList.add('tab-visible');
            selectedNavLink.classList.add('tab-active');
            activeTab = tabId;
        }
    }

    protocoloInput.addEventListener('change', () => {
        const protocolo = protocoloInput.value;
        dobrasCampos.innerHTML = '';

        const protocolos = {
            'pollock3': ['Peitoral', 'Abdômen', 'Coxa'],
            'pollock7': ['Peitoral', 'Abdômen', 'Coxa', 'Tríceps', 'Subescapular', 'Axilar Média', 'Suprailíaca'],
            'weltman': ['Bíceps', 'Tríceps', 'Subescapular', 'Suprailíaca']
        };

        (protocolos[protocolo] || []).forEach(addDobrasCampo);
    });

    function addDobrasCampo(nome) {
        const label = document.createElement('label');
        label.textContent = `Dobra ${nome} (mm):`;
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `dobra-${nome.toLowerCase()}`;
        // ADICIONANDO O ATRIBUTO name DINAMICAMENTE
        input.name = `dobra-${nome.toLowerCase()}`;
        input.required = true;
        label.appendChild(input);
        dobrasCampos.appendChild(label);
    }

    function calcularResultados() {
        const nome = nomeInput.value.trim();
        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value) / 100;
        const idade = parseInt(idadeInput.value);
        const sexo = sexoInput.value;
        const protocolo = protocoloInput.value;

        // Validações do formulário
        if (!nome) {
            Swal.fire('Erro', 'Por favor, insira o nome do avaliado.', 'error');
            showTab('dados-aluno');
            return;
        }
        if (isNaN(idade) || idade <= 0) {
            Swal.fire('Erro', 'Por favor, insira uma idade válida (maior que zero).', 'error');
            showTab('dados-aluno');
            return;
        }
        if (isNaN(peso) || peso <= 0) {
            Swal.fire('Erro', 'Por favor, insira um peso válido (maior que zero).', 'error');
            showTab('peso-altura');
            return;
        }
        if (isNaN(altura) || altura <= 0) {
            Swal.fire('Erro', 'Por favor, insira uma altura válida (maior que zero).', 'error');
            showTab('peso-altura');
            return;
        }

        // Calcular IMC
        const imc = (peso / (altura * altura)).toFixed(2);

        // Calcular percentual de gordura corporal baseado no protocolo e idade
        let percentualGordura = calcularPercentualGordura(protocolo, sexo, idade);

        // Calcular massa gorda, massa magra, massa óssea e massa residual
        const massaGorda = (peso * (percentualGordura / 100)).toFixed(2);
        const massaMagra = (peso - massaGorda).toFixed(2);
        const massaOssea = (peso * 0.15).toFixed(2);
        const massaResidual = (peso * 0.05).toFixed(2);

        // Classificação de IMC
        let classificacaoIMC;
        if (imc < 18.5) {
            classificacaoIMC = 'Abaixo do peso';
        } else if (imc < 24.9) {
            classificacaoIMC = 'Peso normal';
        } else if (imc < 29.9) {
            classificacaoIMC = 'Sobrepeso';
        } else {
            classificacaoIMC = 'Obesidade';
        }

        // Classificação de risco cardiovascular
        let classificacaoRisco;
        const abdomenInput = document.getElementById('abdomen'); // Garante que o elemento existe
        const abdomenValue = abdomenInput ? parseFloat(abdomenInput.value) : NaN; // Pega o valor ou NaN se não existir

        if (isNaN(abdomenValue)) {
            classificacaoRisco = 'Circunferência Abdominal não informada';
        } else if (sexo === 'M') {
            classificacaoRisco = (abdomenValue > 102) ? 'Risco aumentado' : 'Risco baixo';
        } else {
            classificacaoRisco = (abdomenValue > 88) ? 'Risco aumentado' : 'Risco baixo';
        }

        // Atualizar os resultados na página (seção RESULTADOS COMPLETA)
        document.getElementById('resultado-imc-valor').textContent = imc;
        document.getElementById('resultado-imc-classificacao').textContent = classificacaoIMC;
        document.getElementById('percentual-gordura').textContent = percentualGordura.toFixed(2);
        document.getElementById('massa-gorda').textContent = massaGorda;
        document.getElementById('massa-magra').textContent = massaMagra;
        document.getElementById('massa-ossea').textContent = massaOssea;
        document.getElementById('massa-residual').textContent = massaResidual;
        const circunferenciaAbdominalElement = document.getElementById('circunferencia-abdominal'); // Garante que o elemento existe
        if (circunferenciaAbdominalElement) {
            circunferenciaAbdominalElement.textContent = isNaN(abdomenValue) ? 'Não Informada' : abdomenValue.toFixed(1);
        }
        document.getElementById('classificacao-risco-cardiovascular').textContent = classificacaoRisco;
        document.getElementById('alerta-risco-cardiovascular').textContent = ''; // Removido o alerta fixo

        // Atualizar os resultados na aba RML (seção RML dentro das abas)
        document.getElementById('percentual-gordura-tab').textContent = percentualGordura.toFixed(2);
        document.getElementById('massa-gorda-tab').textContent = massaGorda;
        document.getElementById('massa-magra-tab').textContent = massaMagra;
        document.getElementById('massa-ossea-tab').textContent = massaOssea;
        document.getElementById('massa-residual-tab').textContent = massaResidual;

        // Atualizar o gráfico principal (seção RESULTADOS COMPLETA)
        atualizarGrafico('composicaoCorporalChart', massaGorda, massaMagra, massaResidual, massaOssea);

        // Atualizar o gráfico da aba RML (seção RML dentro das abas)
        atualizarGraficoDonutModal('composicaoCorporalChart-tab', massaGorda, percentualGordura); // Usar função Donut aqui

        // Mostrar a seção de resultados (caso esteja escondida)
        document.getElementById('resultados').style.display = 'block';
    }

    function atualizarGraficoDonutModal(canvasId, massaGorda, percentualGordura) {
        const canvas = document.getElementById(canvasId);
        const ctxModal = canvas.getContext('2d');

        // Verifica se já existe um gráfico no canvas e destrói se existir
        if (Chart.getChart(canvasId)) { // Chart.getChart verifica se há um gráfico no canvas
            Chart.getChart(canvasId).destroy(); // Destrói o gráfico existente
        }

        new Chart(ctxModal, {
            type: 'doughnut',
            data: {
                labels: ['Gordura', 'Músculos e Outros'],
                datasets: [{
                    data: [parseFloat(massaGorda), parseFloat((100 - percentualGordura).toFixed(2))],
                    backgroundColor: ['#ff6384', '#d3d3d3'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutoutPercentage: 70,
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: false
                },
                plugins: {
                    datalabels: {
                        formatter: (value, context) => {
                            if (context.datasetIndex === 0) {
                                return `${percentualGordura.toFixed(0)}%\nGordura`;
                            }
                            return null;
                        },
                        color: '#36a2eb',
                        font: {
                            size: '16',
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    function atualizarGrafico(canvasId, massaGorda, massaMagra, massaResidual, massaOssea) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        // Verifica se já existe um gráfico no canvas e destrói se existir
        if (Chart.getChart(canvasId)) { // Chart.getChart verifica se há um gráfico no canvas
            Chart.getChart(canvasId).destroy(); // Destrói o gráfico existente
        }

        new Chart(ctx, {
            type: 'pie', // ALTERADO PARA PIE CHART (GRÁFICO DE PIZZA)
            data: {
                labels: ['Gordura', 'Músculos', 'Resíduos', 'Ossos'],
                datasets: [{
                    data: [massaGorda, massaMagra, massaResidual, massaOssea],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0'] // Cores para o gráfico
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} kg`;
                            }
                        }
                    }
                }
            }
        });
    }


    function calcularPercentualGordura(protocolo, sexo, idade) {
        const dobras = Array.from(dobrasCampos.querySelectorAll('input')).map(input => parseFloat(input.value));
        const somaDobras = dobras.reduce((a, b) => a + b, 0);
        let densidadeCorporal;

        if (protocolo === 'pollock3') {
            if (sexo === 'M') {
                densidadeCorporal = 1.10938 - (0.0008267 * somaDobras) + (0.0000016 * Math.pow(somaDobras, 2)) - (0.0002574 * idade);
            } else {
                densidadeCorporal = 1.0994921 - (0.0009929 * somaDobras) + (0.0000023 * Math.pow(somaDobras, 2)) - (0.0001392 * idade);
            }
        } else if (protocolo === 'pollock7') {
            if (sexo === 'M') {
                densidadeCorporal = 1.112 - (0.00043499 * somaDobras) + (0.00000055 * Math.pow(somaDobras, 2)) - (0.00028826 * idade);
            } else {
                densidadeCorporal = 1.097 - (0.00046971 * somaDobras) + (0.00000056 * Math.pow(somaDobras, 2)) - (0.00012828 * idade);
            }
        } else if (protocolo === 'weltman') {
            if (sexo === 'M') {
                densidadeCorporal = 1.1043 - (0.001327 * somaDobras);
            } else {
                densidadeCorporal = 1.0764 - (0.000812 * somaDobras);
            }
        } else {
            densidadeCorporal = 1;
        }

        return ((4.95 / densidadeCorporal) - 4.5) * 100;
    }

    function exportarParaPdf(exportType) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.setFont('helvetica', 'normal'); // Define a fonte padrão

        // Cores para o PDF
        const corPrimaria = '#28a745'; // Verde primário
        const corSecundaria = '#333333'; // Cinza escuro para texto geral
        const corTituloSecao = corPrimaria; // Verde para títulos de seção
        const corTextoSecao = corSecundaria; // Cinza para texto de seção

        let yPosition = 20;

        // Função para adicionar um título formatado
        function adicionarTitulo(texto, tamanho, cor, estilo = 'bold') {
            doc.setFontSize(tamanho);
            doc.setFont('helvetica', estilo);
            doc.setTextColor(cor);
            doc.text(texto, 20, yPosition);
            yPosition += tamanho * 0.353 + 5; // Ajuste para espaçamento baseado no tamanho da fonte
        }

        // Função para adicionar seção de texto formatada
        function adicionarSecaoTexto(titulo, conteudo) {
            adicionarTitulo(titulo, 16, corTituloSecao, 'bold'); // Título da seção em verde

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(corTextoSecao); // Texto da seção em cinza

            if (typeof conteudo === 'string') {
                const linhas = doc.splitTextToSize(conteudo, 170);
                linhas.forEach(linha => {
                    doc.text(linha, 20, yPosition);
                    yPosition += 5;
                });
            } else if (Array.isArray(conteudo)) {
                conteudo.forEach(item => {
                    doc.text(`- ${item}`, 25, yPosition);
                    yPosition += 5;
                });
            } else if (typeof conteudo === 'object' && conteudo !== null) {
                for (const key in conteudo) {
                    if (conteudo.hasOwnProperty(key)) {
                        doc.text(`${key}: ${conteudo[key]}`, 25, yPosition);
                        yPosition += 5;
                    }
                }
            }
            yPosition += 10; // Espaçamento após a seção
        }


        adicionarTitulo('Relatório de Avaliação Física - MaxComp App', 20, corPrimaria, 'bold'); // Título principal em verde e maior

        const dadosAluno = {
            "Nome": nomeInput.value,
            "Idade": idadeInput.value,
            "Sexo": sexoInput.value
        };
        const pesoAltura = {
            "Peso (kg)": pesoInput.value,
            "Altura (cm)": alturaInput.value
        };
        let dobrasData = {};
        const dobrasInputs = dobrasCampos.querySelectorAll('input');
        dobrasInputs.forEach(input => {
            const nomeDobra = input.id.replace('dobra-', '').replace('-', ' ').toLocaleUpperCase();
            dobrasData[`Dobra ${nomeDobra} (mm)`] = input.value;
        });
        let perimetriaData = {};
        const perimetriaInputs = [
            'ombro', 'peito', 'braco-direito', 'braco-esquerdo', 'cintura', 'abdomen', 'quadril', 'coxa-direita', 'coxa-esquerda', 'panturrilha-direita', 'panturrilha-esquerda'
        ];
        perimetriaInputs.forEach(id => {
            const nomePerimetria = document.getElementById(id).id.replace('-', ' ').toLocaleUpperCase();
            perimetriaData[`${nomePerimetria} (cm)`] = document.getElementById(id).value;
        });
        const resultadosRml = {
            "Percentual de Gordura": document.getElementById('percentual-gordura-tab').textContent + '%',
            "Massa Gorda": document.getElementById('massa-gorda-tab').textContent + ' kg',
            "Massa Magra": document.getElementById('massa-magra-tab').textContent + ' kg',
            "Massa Óssea": document.getElementById('massa-ossea-tab').textContent + ' kg',
            "Massa Residual": document.getElementById('massa-residual-tab').textContent + ' kg'
        };
        const metasRecomendacoes = {
            "Metas": document.getElementById('metas-text').value,
            "Recomendações": document.getElementById('recomendacoes-text').value
        };
        const resultadosCompleto = {
            "IMC": document.getElementById('resultado-imc-valor').textContent,
            "Classificação IMC": document.getElementById('resultado-imc-classificacao').textContent,
            "Percentual de Gordura": document.getElementById('percentual-gordura').textContent + '%',
            "Massa Gorda": document.getElementById('massa-gorda').textContent + ' kg',
            "Massa Magra": document.getElementById('massa-magra').textContent + ' kg',
            "Massa Óssea": document.getElementById('massa-ossea').textContent + ' kg',
            "Massa Residual": document.getElementById('massa-residual-tab').textContent + ' kg',
            "Circunferência Abdominal": document.getElementById('circunferencia-abdominal').textContent + ' cm',
            "Classificação Risco Cardiovascular": document.getElementById('classificacao-risco-cardiovascular').textContent,
            "Alerta Risco Cardiovascular": document.getElementById('alerta-risco-cardiovascular').textContent
        };

        if (exportType === "avaliacao-form-content" || exportType === "resultados-avaliacao-completa") {
            adicionarSecaoTexto("Dados do Aluno", dadosAluno);
            adicionarSecaoTexto("Peso e Altura", pesoAltura);
            adicionarSecaoTexto("Dobras Cutâneas", dobrasData);
            adicionarSecaoTexto("Perimetria", perimetriaData);
            adicionarSecaoTexto("RML - Composição Corporal", resultadosRml);
            adicionarSecaoTexto("Metas e Recomendações", metasRecomendacoes);
        }
        if (exportType === "resultados-avaliacao-completa") {
            adicionarSecaoTexto("Resultados Completos da Avaliação", resultadosCompleto);
        }

        const canvasRml = document.getElementById('composicaoCorporalChart-tab');
        if (canvasRml) {
            // Adiciona um atraso de 200ms (0.2 segundos) antes de capturar o gráfico
            setTimeout(() => {
                const imgDataRml = canvasRml.toDataURL('image/png');
                doc.addImage(imgDataRml, 'PNG', 20, yPosition, 60, 60);
                yPosition += 65; // Ajuste a posição Y após a imagem

                const nomeArquivo = `relatorio-avaliacao-fisica-${nomeInput.value.replace(/\s/g, '_')}.pdf`;
                doc.save(nomeArquivo);

            }, 200); // 200 milissegundos de atraso (0.2 segundos)
        } else {
            console.error('Canvas do gráfico RML não encontrado!');
        }
    }

    exportarCsvButton.addEventListener('click', () => {
        const nome = nomeInput.value;
        const imc = document.getElementById('resultado-imc-valor').textContent;
        const percentualGordura = document.getElementById('percentual-gordura').textContent;
        const massaGorda = document.getElementById('massa-gorda').textContent;
        const massaMagra = document.getElementById('massa-magra').textContent;
        const massaOssea = document.getElementById('massa-ossea').textContent;
        const massaResidual = document.getElementById('massa-residual').textContent;

        const csvContent = [
            ['Nome', 'IMC', 'Percentual de Gordura', 'Massa Gorda', 'Massa Magra', 'Massa Óssea', 'Massa Residual'],
            [nome, imc, percentualGordura, massaGorda, massaMagra, massaOssea, massaResidual]
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `resultados-composicao-corporal-${nome}.csv`;
        link.click();
    });

    limparCamposButton.addEventListener('click', () => {
        nomeInput.value = '';
        pesoInput.value = '';
        alturaInput.value = '';
        idadeInput.value = '';
        sexoInput.value = '';
        protocoloInput.value = '';
        dobrasCampos.innerHTML = '';
        document.getElementById('metas-text').value = '';
        document.getElementById('recomendacoes-text').value = '';

        document.getElementById('resultado-imc-valor').textContent = '';
        document.getElementById('resultado-imc-classificacao').innerHTML = '';
        document.getElementById('percentual-gordura').textContent = '';
        document.getElementById('massa-gorda').textContent = '';
        document.getElementById('massa-magra').textContent = '';
        document.getElementById('massa-ossea').textContent = '';
        document.getElementById('massa-residual').textContent = '';
        document.getElementById('circunferencia-abdominal').textContent = '';
        document.getElementById('classificacao-risco-cardiovascular').innerHTML = '';
        document.getElementById('alerta-risco-cardiovascular').textContent = '';
        atualizarGrafico('composicaoCorporalChart', 0, 0, 0, 0);

        document.getElementById('percentual-gordura-tab').textContent = '';
        document.getElementById('massa-gorda-tab').textContent = '';
        document.getElementById('massa-magra-tab').textContent = '';
        document.getElementById('massa-ossea-tab').textContent = '';
        document.getElementById('massa-residual-tab').textContent = '';
        atualizarGrafico('composicaoCorporalChart-tab', 0, 0, 0, 0);

        showTab('dados-aluno');

        // Esconde a seção de resultados ao limpar os campos
        document.getElementById('resultados').style.display = 'none';
    });

    resultadoAvaliacaoButton.addEventListener('click', () => {
        calcularResultados();
        Swal.fire({
            title: 'Resultado da Avaliação',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="margin-bottom: 20px; text-align: center;">
                        <h3>IMC</h3>
                        <p class="result-value">${document.getElementById('resultado-imc-valor').textContent}</p>
                        <p class="result-label">Índice de massa corporal</p>
                        <p class="classification">${document.getElementById('resultado-imc-classificacao').textContent}</p>
                        <p style="font-size: 0.9em;">Altura: ${alturaInput.value} m / Peso: ${pesoInput.value} kg</p>
                    </div>

                    <div style="margin-bottom: 20px; text-align: center;">
                        <h3>Composição corporal</h3>
                        <canvas id="composicaoCorporalChart-modal" width="200" height="200" style="margin: 10px auto;"></canvas>
                        <p class="result-label">Gordura: <span id="percentual-gordura-modal"></span>%</p>
                        <ul style="list-style: none; padding: 0; text-align: left; margin: 0 auto; max-width: 200px;">
                            <li>Gordura: <span id="massa-gorda-modal"></span> kg</li>
                            <li>Músculos: <span id="massa-magra-modal"></span> kg</li>
                            <li>Resíduos: <span id="massa-residual-modal"></span> kg</li>
                            <li>Ossos: <span id="massa-ossea-modal"></span> kg</li>
                        </ul>
                    </div>

                    <div style="text-align: center;">
                        <h3>Risco Cardiovascular</h3>
                        <p class="result-value">${document.getElementById('abdomen').value} <span style="font-size: 1.5rem;">cm</span></p>
                        <p class="result-label">Circunferência abdominal</p>
                        <p class="classification" style="color: ${document.getElementById('classificacao-risco-cardiovascular').textContent.includes('Risco aumentado') ? 'red' : 'green'};">${document.getElementById('classificacao-risco-cardiovascular').textContent}</p>
                    </div>
                </div>
            `,
            icon: 'info',
            width: 600,
            padding: '20px',
            background: '#ffffff',
            showConfirmButton: false,
            showCloseButton: true,
            // closeButtonArialLabel: 'Fechar este popup',  <-- REMOVIDO OU COMENTADO
            didOpen: () => {
                atualizarGraficoDonutModal('composicaoCorporalChart-modal', document.getElementById('massa-gorda-tab').textContent, document.getElementById('percentual-gordura-tab').textContent);
                document.getElementById('percentual-gordura-modal').textContent = document.getElementById('percentual-gordura-tab').textContent;
                document.getElementById('massa-gorda-modal').textContent = document.getElementById('massa-gorda-tab').textContent;
                document.getElementById('massa-magra-modal').textContent = document.getElementById('massa-magra-tab').textContent;
                document.getElementById('massa-residual-modal').textContent = document.getElementById('massa-residual-tab').textContent;
                document.getElementById('massa-ossea-modal').textContent = document.getElementById('massa-ossea-tab').textContent;
            }
        });

        // Mostra a seção de resultados (caso esteja escondida)
        document.getElementById('resultados').style.display = 'block';
    });

    tabSaveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.dataset.tabSave;
            let tabName = getNomeAba(tabId);
            Swal.fire('Sucesso', `Dados da aba "${tabName}" salvos temporariamente.`, 'success');
            // Adicione qualquer lógica de salvamento específica para cada aba aqui, se necessário no futuro
        });
    });

    // Verificação se exportCsvButton é nulo após DOMContentLoaded
    if (!exportarCsvButton) {
        console.error('Erro: elemento exportCsvButton não encontrado no DOM. Verifique seu index.html se há um elemento com id="export-csv"');
    } else {
        exportarCsvButton.addEventListener('click', () => { // Garante que o event listener seja anexado apenas se o botão existir
            const nome = nomeInput.value;
            const imc = document.getElementById('resultado-imc-valor').textContent;
            const percentualGordura = document.getElementById('percentual-gordura').textContent;
            const massaGorda = document.getElementById('massa-gorda').textContent;
            const massaMagra = document.getElementById('massa-magra').textContent;
            const massaOssea = document.getElementById('massa-ossea').textContent;
            const massaResidual = document.getElementById('massa-residual').textContent;

            const csvContent = [
                ['Nome', 'IMC', 'Percentual de Gordura', 'Massa Gorda', 'Massa Magra', 'Massa Óssea', 'Massa Residual'],
                [nome, imc, percentualGordura, massaGorda, massaMagra, massaOssea, massaResidual]
            ].map(e => e.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `resultados-composicao-corporal-${nome}.csv`;
            link.click();
        });
    }

    exportarPdfButton.addEventListener('click', () => {
        exportarParaPdf("resultados-avaliacao-completa");
    });

    exportarPdfFormButton.addEventListener('click', () => {
        exportarParaPdf("avaliacao-form-content");
    });

    function getNomeAba(tabId) {
        switch (tabId) {
            case 'dados-aluno': return 'Dados do Aluno';
            case 'peso-altura': return 'Peso e Altura';
            case 'dobras': return 'Dobras Cutâneas';
            case 'perimetria': return 'Perimetria';
            case 'rml': return 'RML';
            case 'metas': return 'Metas e Recomendações';
            default: return 'Aba Desconhecida';
        }
    }
});