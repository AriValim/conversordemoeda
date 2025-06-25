/*
 * Arquivo: script.js
 * Descrição: Lógica JavaScript para o Conversor de Moedas.
 * Gerencia a interação do usuário, chamadas de API para taxas de câmbio e exibição de resultados.
 */

// Classe principal do conversor de moedas
class CurrencyConverter {
  /**
   * Construtor da classe CurrencyConverter.
   * Inicializa a chave da API, a URL base e configura os elementos DOM e eventos.
   */
  constructor() {
    // Substitua 'YOUR_API_KEY_HERE' pela sua chave da API real.
    // Recomenda-se usar uma variável de ambiente ou um serviço de proxy para chaves de API em produção.
    this.apiKey = "YOUR_API_KEY_HERE";
    this.baseUrl = "https://api.exchangerate-api.com/v4/latest/";
    this.initializeElements();
    this.bindEvents();
  }

  /**
   * Inicializa os elementos DOM necessários para a aplicação.
   * Armazena referências aos elementos HTML para fácil acesso.
   */
  initializeElements() {
    this.form = document.getElementById("converterForm");
    this.amountInput = document.getElementById("amount");
    this.fromCurrencySelect = document.getElementById("fromCurrency");
    this.toCurrencySelect = document.getElementById("toCurrency");
    this.convertBtn = document.getElementById("convertBtn");
    this.swapBtn = document.getElementById("swapBtn");
    this.resultDiv = document.getElementById("result");
  }

  /**
   * Vincula os eventos aos elementos DOM.
   * Configura listeners para o envio do formulário, troca de moedas e validação de entrada.
   */
  bindEvents() {
    // Adiciona um listener para o evento de 'submit' do formulário.
    // Previne o comportamento padrão de recarregar a página e chama a função de conversão.
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.convertCurrency();
    });

    // Adiciona um listener para o evento de 'click' do botão de troca de moedas.
    this.swapBtn.addEventListener("click", () => {
      this.swapCurrencies();
    });

    // Adiciona validação em tempo real ao campo de valor.
    // Garante que o usuário insira um valor válido enquanto digita.
    this.amountInput.addEventListener("input", () => {
      this.validateAmount();
    });
  }

  /**
   * Valida o valor inserido no campo de entrada.
   * Define uma mensagem de validação personalizada se o valor for inválido (não numérico ou menor/igual a zero).
   */
  validateAmount() {
    const amount = parseFloat(this.amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      this.amountInput.setCustomValidity(
        "Por favor, insira um valor válido maior que zero."
      );
    } else {
      this.amountInput.setCustomValidity("");
    }
  }

  /**
   * Troca as moedas selecionadas nos campos 'De' e 'Para'.
   * Se um resultado já estiver visível, a conversão é automaticamente refeita com as novas moedas.
   */
  swapCurrencies() {
    const fromValue = this.fromCurrencySelect.value;
    const toValue = this.toCurrencySelect.value;

    // Garante que ambas as moedas estejam selecionadas antes de tentar a troca.
    if (fromValue && toValue) {
      this.fromCurrencySelect.value = toValue;
      this.toCurrencySelect.value = fromValue;

      // Se o resultado da conversão estiver visível, refaz a conversão automaticamente.
      if (this.resultDiv.style.display !== "none") {
        this.convertCurrency();
      }
    }
  }

  /**
   * Função principal assíncrona para converter moedas.
   * Obtém os valores de entrada, valida-os, busca a taxa de câmbio e exibe o resultado.
   */
  async convertCurrency() {
    const amount = parseFloat(this.amountInput.value);
    const fromCurrency = this.fromCurrencySelect.value;
    const toCurrency = this.toCurrencySelect.value;

    // Valida os dados de entrada antes de prosseguir com a conversão.
    if (!this.validateInputs(amount, fromCurrency, toCurrency)) {
      return; // Interrompe a execução se a validação falhar.
    }

    // Se as moedas de origem e destino forem as mesmas, exibe o valor original.
    if (fromCurrency === toCurrency) {
      this.displayResult(amount, amount, fromCurrency, toCurrency, 1);
      return;
    }

    try {
      this.showLoading(); // Exibe o indicador de carregamento.
      // Busca a taxa de câmbio da API.
      const exchangeRate = await this.fetchExchangeRate(
        fromCurrency,
        toCurrency
      );
      // Calcula o valor convertido.
      const convertedAmount = amount * exchangeRate;

      // Exibe o resultado da conversão.
      this.displayResult(
        amount,
        convertedAmount,
        fromCurrency,
        toCurrency,
        exchangeRate
      );
    } catch (error) {
      // Em caso de erro na API ou na conversão, exibe uma mensagem de erro e loga no console.
      this.displayError("Erro ao obter taxas de câmbio. Tente novamente.");
      console.error("Erro na conversão:", error);
    }
  }

  /**
   * Valida os dados de entrada fornecidos pelo usuário.
   * Verifica se o valor é um número positivo e se as moedas de origem e destino foram selecionadas.
   * @param {number} amount - O valor a ser convertido.
   * @param {string} fromCurrency - O código da moeda de origem.
   * @param {string} toCurrency - O código da moeda de destino.
   * @returns {boolean} - Retorna true se todos os inputs são válidos, caso contrário, false.
   */
  validateInputs(amount, fromCurrency, toCurrency) {
    if (isNaN(amount) || amount <= 0) {
      this.displayError("Por favor, insira um valor válido maior que zero.");
      return false;
    }

    if (!fromCurrency) {
      this.displayError("Por favor, selecione a moeda de origem.");
      return false;
    }

    if (!toCurrency) {
      this.displayError("Por favor, selecione a moeda de destino.");
      return false;
    }

    return true;
  }

  /**
   * Busca a taxa de câmbio mais recente de uma API externa.
   * @param {string} fromCurrency - O código da moeda de origem.
   * @param {string} toCurrency - O código da moeda de destino.
   * @returns {Promise<number>} - Uma Promise que resolve com a taxa de câmbio.
   * @throws {Error} - Lança um erro se a resposta da API não for bem-sucedida ou se a taxa não for encontrada.
   */
  async fetchExchangeRate(fromCurrency, toCurrency) {
    try {
      // Constrói a URL da API usando a moeda de origem.
      const response = await fetch(`${this.baseUrl}${fromCurrency}`);

      // Verifica se a resposta da rede foi bem-sucedida.
      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      // Verifica se a resposta da API contém as taxas e a moeda de destino.
      if (!data.rates || !data.rates[toCurrency]) {
        throw new Error(
          "Taxa de câmbio não encontrada para as moedas selecionadas."
        );
      }

      return data.rates[toCurrency];
    } catch (error) {
      console.error("Erro ao buscar taxa de câmbio:", error);
      throw error; // Re-lança o erro para ser tratado pela função chamadora.
    }
  }

  /**
   * Exibe um indicador de carregamento no botão de conversão.
   * Desabilita o botão para evitar múltiplas submissões.
   */
  showLoading() {
    this.convertBtn.disabled = true;
    this.convertBtn.innerHTML = '<span class="loading"></span> Convertendo...';
    this.resultDiv.style.display = "none"; // Oculta resultados anteriores
  }

  /**
   * Oculta o indicador de carregamento e restaura o botão de conversão.
   */
  hideLoading() {
    this.convertBtn.disabled = false;
    this.convertBtn.innerHTML = '<i class="fas fa-calculator"></i> Ver Câmbio';
  }

  /**
   * Exibe o resultado da conversão na interface do usuário.
   * Formata os valores e a taxa de câmbio para melhor legibilidade.
   * @param {number} originalAmount - O valor original inserido pelo usuário.
   * @param {number} convertedAmount - O valor após a conversão.
   * @param {string} fromCurrency - O código da moeda de origem.
   * @param {string} toCurrency - O código da moeda de destino.
   * @param {number} exchangeRate - A taxa de câmbio utilizada.
   */
  displayResult(
    originalAmount,
    convertedAmount,
    fromCurrency,
    toCurrency,
    exchangeRate
  ) {
    this.hideLoading(); // Oculta o carregamento antes de exibir o resultado.

    // Formata os valores para moeda local.
    const formattedOriginalAmount = originalAmount.toLocaleString("pt-BR", {
      style: "currency",
      currency: fromCurrency,
    });
    const formattedConvertedAmount = convertedAmount.toLocaleString("pt-BR", {
      style: "currency",
      currency: toCurrency,
    });

    // Formata a taxa de câmbio para duas casas decimais.
    const formattedExchangeRate = exchangeRate.toFixed(4);

    this.resultDiv.classList.remove("error");
    this.resultDiv.classList.add("success");
    this.resultDiv.style.display = "block";
    this.resultDiv.innerHTML = `
            <p class="result-text">${formattedOriginalAmount} = ${formattedConvertedAmount}</p>
            <p class="result-details">1 ${fromCurrency} = ${formattedExchangeRate} ${toCurrency}</p>
        `;
  }

  /**
   * Exibe uma mensagem de erro na interface do usuário.
   * @param {string} message - A mensagem de erro a ser exibida.
   */
  displayError(message) {
    this.hideLoading(); // Oculta o carregamento em caso de erro.
    this.resultDiv.classList.remove("success");
    this.resultDiv.classList.add("error");
    this.resultDiv.style.display = "block";
    this.resultDiv.innerHTML = `
            <p class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</p>
        `;
  }
}

// Inicializa o conversor de moedas quando o DOM estiver completamente carregado.
// Garante que todos os elementos HTML estejam disponíveis antes de tentar acessá-los.
document.addEventListener("DOMContentLoaded", () => {
  new CurrencyConverter();
});
