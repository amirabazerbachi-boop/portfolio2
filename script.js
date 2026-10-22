document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Chuva binária decorativa: fluxo vertical de 0 e 1 em rosa e dourado.
  // O canvas fica atrás do conteúdo e não interfere nos cliques.
  function iniciarChuvaBinaria() {
    const canvas = document.getElementById("binary-rain");
    if (!canvas || typeof canvas.getContext !== "function") return;

    let contexto;
    try {
      contexto = canvas.getContext("2d", { alpha: true });
    } catch (erro) {
      console.warn("Não foi possível iniciar a cascata binária.", erro);
      return;
    }
    if (!contexto) return;

    // A chuva binária permanece em movimento contínuo, mesmo quando o sistema
    // está configurado para reduzir animações; esse é um efeito principal do layout.
    let tamanhoFonte = window.innerWidth < 600 ? 14 : 17;
    let largura = 0;
    let altura = 0;
    let escala = 1;
    let gotas = [];
    let quadro = 0;
    let framePendente = false;

    function redimensionar() {
      tamanhoFonte = window.innerWidth < 600 ? 14 : 17;
      escala = Math.min(window.devicePixelRatio || 1, 1.5);
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(largura * escala));
      canvas.height = Math.max(1, Math.floor(altura * escala));
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;
      contexto.setTransform(escala, 0, 0, escala, 0, 0);
      gotas = Array.from(
        { length: Math.ceil(largura / tamanhoFonte) },
        (_, coluna) => Math.random() * (altura / tamanhoFonte) - (coluna % 5) * 2
      );
      desenhar(true);
    }

    function desenhar(estatico = false) {
      contexto.clearRect(0, 0, largura, altura);
      contexto.font = `500 ${tamanhoFonte}px monospace`;
      contexto.textAlign = "center";
      contexto.textBaseline = "middle";

      for (let coluna = 0; coluna < gotas.length; coluna += 1) {
        // Mantém bastante espaço negativo para que o efeito continue elegante.
        if (coluna % 3 !== 0 && coluna % 5 !== 0) continue;

        const x = coluna * tamanhoFonte + tamanhoFonte / 2;
        const cabeca = gotas[coluna] * tamanhoFonte;
        const trilha = 5 + (coluna % 5);
        const dourado = coluna % 4 === 0;

        for (let passo = trilha; passo >= 0; passo -= 1) {
          const y = cabeca - passo * tamanhoFonte;
          if (y < -tamanhoFonte || y > altura + tamanhoFonte) continue;

          const bit = Math.random() > 0.5 ? "1" : "0";
          const alpha = passo === 0 ? 0.92 : 0.34 / (passo * 0.42 + 0.7);
          contexto.fillStyle = passo === 0
            ? (dourado ? `rgba(250, 228, 201, ${alpha})` : `rgba(192, 184, 131, ${alpha})`)
            : (dourado
              ? `rgba(192, 184, 131, ${alpha * 0.82})`
              : `rgba(187, 71, 131, ${alpha * 0.82})`);

          if (passo === 0) {
            contexto.shadowColor = dourado ? "rgba(192, 184, 131, .45)" : "rgba(187, 71, 131, .42)";
            contexto.shadowBlur = 5;
          } else {
            contexto.shadowBlur = 0;
          }
          contexto.fillText(bit, x, y);
        }
        contexto.shadowBlur = 0;

        if (!estatico) {
          gotas[coluna] += 0.28 + (coluna % 4) * 0.055;
          if (gotas[coluna] * tamanhoFonte > altura + tamanhoFonte * (trilha + 2)) {
            gotas[coluna] = -Math.random() * 12;
          }
        }
      }
    }

    function animar() {
      framePendente = false;
      if (document.hidden) return;
      quadro += 1;
      // Desenha em cerca de 24 fps, suficiente para um movimento fluido e leve.
      if (quadro % 2 === 0) desenhar(false);
      framePendente = true;
      window.requestAnimationFrame(animar);
    }

    function retomarAnimacao() {
      if (document.hidden || framePendente) return;
      framePendente = true;
      window.requestAnimationFrame(animar);
    }

    redimensionar();
    retomarAnimacao();
    document.addEventListener("visibilitychange", retomarAnimacao);
    window.addEventListener("resize", redimensionar, { passive: true });
  }

  iniciarChuvaBinaria();

  // Menu responsivo.
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");

  function fecharMenu() {
    if (!nav || !burger) return;
    nav.classList.remove("aberto");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
  }

  burger?.addEventListener("click", () => {
    if (!nav) return;
    const aberto = nav.classList.toggle("aberto");
    burger.setAttribute("aria-expanded", String(aberto));
    burger.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });

  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", fecharMenu);
  });

  document.addEventListener("click", evento => {
    if (!nav || !burger || !nav.classList.contains("aberto")) return;
    if (!nav.contains(evento.target) && !burger.contains(evento.target)) fecharMenu();
  });

  // Barra de leitura, botão voltar ao topo e navegação ativa.
  const barraProgresso = document.querySelector("#progresso-leitura span");
  const voltarTopo = document.querySelector("#voltar-topo");
  let scrollAgendado = false;

  function atualizarScroll() {
    const maximo = document.documentElement.scrollHeight - window.innerHeight;
    const progresso = maximo > 0 ? window.scrollY / maximo : 0;
    if (barraProgresso) barraProgresso.style.transform = `scaleX(${Math.min(1, Math.max(0, progresso))})`;
    voltarTopo?.classList.toggle("visivel", window.scrollY > 550);
    scrollAgendado = false;
  }

  window.addEventListener("scroll", () => {
    if (scrollAgendado) return;
    scrollAgendado = true;
    window.requestAnimationFrame(atualizarScroll);
  }, { passive: true });
  window.addEventListener("resize", atualizarScroll, { passive: true });
  atualizarScroll();

  voltarTopo?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const sectionLinks = Array.from(document.querySelectorAll('.nav a[href*="#"]'));
  if ("IntersectionObserver" in window && sections.length && sectionLinks.length) {
    const observerNav = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(link => {
          const alvo = new URL(link.href, window.location.href);
          const ativo = alvo.pathname === window.location.pathname && alvo.hash === `#${entry.target.id}`;
          link.classList.toggle("ativo", ativo);
          if (ativo) link.setAttribute("aria-current", "location");
          else if (link.getAttribute("aria-current") === "location") link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });
    sections.forEach(section => observerNav.observe(section));
  }

  // Animações de entrada quando cada área aparece na tela.
  const elementosEntrada = document.querySelectorAll(
    ".secao-cabecalho, .sobre-texto, .sobre-lateral, #projetos .card, #habilidades .hab, .timeline-legenda, .timeline-final, .contato-cabecalho, .contato-form, .contato-info"
  );

  elementosEntrada.forEach((elemento, indice) => {
    elemento.classList.add("entrada-scroll");
    elemento.style.setProperty("--delay-scroll", `${(indice % 3) * 90}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elementosEntrada.forEach(elemento => elemento.classList.add("entrada-visivel"));
  } else {
    const observerEntrada = new IntersectionObserver((entradas, observer) => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("entrada-visivel");
        observer.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    elementosEntrada.forEach(elemento => observerEntrada.observe(elemento));
  }

  // Modal dos cards estáticos da linha do tempo.
  const timeline = document.querySelector("#timeline-cards");
  const cards = timeline ? Array.from(timeline.querySelectorAll(".evento")) : [];
  const contador = document.querySelector("#contador-cards");
  const modal = document.querySelector("#modal-timeline");
  const modalImagem = document.querySelector("#modal-imagem");
  const carrosselAnterior = document.querySelector("#carrossel-anterior");
  const carrosselProximo = document.querySelector("#carrossel-proximo");
  const carrosselContador = document.querySelector("#carrossel-contador");
  const carrosselPontos = document.querySelector("#carrossel-pontos");
  const modalData = document.querySelector("#modal-data");
  const modalTitulo = document.querySelector("#modal-titulo");
  const modalLegenda = document.querySelector("#modal-legenda");
  const modalDescricao = document.querySelector("#modal-descricao");
  const modalAprendizado = document.querySelector("#modal-aprendizado-texto");
  const modalNumero = document.querySelector("#modal-numero");
  const modalPosicao = document.querySelector("#modal-posicao");
  const botaoFechar = modal?.querySelector(".modal-fechar");

  let indiceAtual = 0;
  let indiceImagem = 0;
  let imagensAtuais = [];
  let ultimoFoco = null;

  if (contador) contador.textContent = String(cards.length);

  function mostrarImagem(indiceImagemSolicitado) {
    if (!modalImagem || !imagensAtuais.length) return;
    indiceImagem = (indiceImagemSolicitado + imagensAtuais.length) % imagensAtuais.length;
    const imagem = imagensAtuais[indiceImagem];
    modalImagem.onerror = () => {
      modalImagem.onerror = null;
      modalImagem.alt = "Não foi possível carregar esta imagem. Confira o caminho no atributo data-imagens.";
    };
    modalImagem.src = imagem.src;
    modalImagem.alt = imagem.alt || "Imagem do projeto";
    if (carrosselContador) carrosselContador.textContent = `${String(indiceImagem + 1).padStart(2, "0")} / ${String(imagensAtuais.length).padStart(2, "0")}`;
    if (carrosselPontos) {
      carrosselPontos.querySelectorAll("button").forEach((ponto, i) => {
        ponto.classList.toggle("ativo", i === indiceImagem);
        ponto.setAttribute("aria-current", i === indiceImagem ? "true" : "false");
      });
    }
    const haMaisDeUma = imagensAtuais.length > 1;
    if (carrosselAnterior) carrosselAnterior.hidden = !haMaisDeUma;
    if (carrosselProximo) carrosselProximo.hidden = !haMaisDeUma;
    if (carrosselPontos) carrosselPontos.hidden = !haMaisDeUma;
  }

  function prepararCarrossel(card) {
    const imagemCard = card.querySelector(".evento-capa img");
    const capa = imagemCard ? (imagemCard.currentSrc || imagemCard.src) : "";
    const caminhosExtras = (card.dataset.imagens || "")
      .split(/[|\n;]/)
      .map(caminho => caminho.trim())
      .filter(Boolean);
    const caminhos = [...new Set([...(capa ? [capa] : []), ...caminhosExtras])];
    imagensAtuais = caminhos.map((src, i) => ({
      src,
      alt: i === 0 ? (imagemCard?.alt || card.dataset.titulo || "Capa do projeto") : `${card.dataset.titulo || "Projeto"} — imagem ${i + 1}`
    }));
    indiceImagem = 0;
    if (carrosselPontos) {
      carrosselPontos.replaceChildren();
      imagensAtuais.forEach((imagem, i) => {
        const ponto = document.createElement("button");
        ponto.type = "button";
        ponto.className = "carrossel-ponto";
        ponto.setAttribute("aria-label", `Mostrar imagem ${i + 1}`);
        ponto.addEventListener("click", () => mostrarImagem(i));
        carrosselPontos.appendChild(ponto);
      });
    }
    mostrarImagem(0);
  }

  function preencherModal(indice) {
    const card = cards[indice];
    if (!card || !modal) return;

    prepararCarrossel(card);
    if (modalData) modalData.textContent = card.dataset.data || "";
    if (modalTitulo) modalTitulo.textContent = card.dataset.titulo || "";
    if (modalLegenda) modalLegenda.textContent = card.dataset.legenda || "";
    if (modalDescricao) modalDescricao.textContent = card.dataset.descricao || "Adicione aqui uma descrição sobre este projeto no atributo data-descricao do card.";
    if (modalAprendizado) modalAprendizado.textContent = card.dataset.aprendizado || "";

    const numero = String(indice + 1).padStart(2, "0");
    if (modalNumero) modalNumero.textContent = `${numero} / ${cards.length}`;
    if (modalPosicao) modalPosicao.textContent = `${numero} de ${cards.length}`;

    const conteudo = modal.querySelector(".modal-conteudo");
    if (conteudo) conteudo.scrollTop = 0;
  }

  function abrirModal(indice) {
    if (!modal || !cards[indice]) return;
    indiceAtual = indice;
    ultimoFoco = document.activeElement;
    preencherModal(indiceAtual);
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-ativo");
    botaoFechar?.focus();
  }

  function fecharModal() {
    if (!modal) return;
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-ativo");
    if (ultimoFoco && typeof ultimoFoco.focus === "function") ultimoFoco.focus();
  }

  cards.forEach((card, indice) => {
    card.addEventListener("click", () => abrirModal(indice));
  });

  carrosselAnterior?.addEventListener("click", () => mostrarImagem(indiceImagem - 1));
  carrosselProximo?.addEventListener("click", () => mostrarImagem(indiceImagem + 1));

  botaoFechar?.addEventListener("click", fecharModal);
  modal?.addEventListener("click", evento => {
    if (evento.target === modal) fecharModal();
  });


  document.addEventListener("keydown", evento => {
    if (!modal?.classList.contains("aberto")) return;
    if (evento.key === "Escape") fecharModal();
    // As setas controlam somente as imagens do card aberto.
    // Nunca mudam para outro card/projeto.
    if (evento.key === "ArrowLeft" && imagensAtuais.length > 1) mostrarImagem(indiceImagem - 1);
    if (evento.key === "ArrowRight" && imagensAtuais.length > 1) mostrarImagem(indiceImagem + 1);
  });

  // Faz o fundo de vidro refletir discretamente a posição do ponteiro.
  document.addEventListener("pointermove", evento => {
    if (evento.pointerType === "touch") return;
    const elemento = evento.target instanceof Element ? evento.target.closest(".vidro") : null;
    if (!elemento) return;
    const rect = elemento.getBoundingClientRect();
    elemento.style.setProperty("--mx", `${evento.clientX - rect.left}px`);
    elemento.style.setProperty("--my", `${evento.clientY - rect.top}px`);
  }, { passive: true });

  // Barras animadas e conteúdo que já usa a classe visível.
  const elementosObservados = document.querySelectorAll(".barra, .hab, .card");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elementosObservados.forEach(elemento => elemento.classList.add("visivel"));
  } else {
    const observerHabilidades = new IntersectionObserver((entradas, observer) => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("visivel");
        observer.unobserve(entrada.target);
      });
    }, { threshold: 0.12 });
    elementosObservados.forEach(elemento => observerHabilidades.observe(elemento));
  }

  // Atualiza automaticamente o ano do rodapé.
  document.querySelectorAll(".ano").forEach(elemento => {
    elemento.textContent = String(new Date().getFullYear());
  });

  // Formulário abre o aplicativo de e-mail, sem fingir que a mensagem foi enviada.
  const form = document.getElementById("form-contato");
  form?.addEventListener("submit", evento => {
    evento.preventDefault();
    if (!form.reportValidity()) return;

    const dados = new FormData(form);
    const para = form.dataset.email || "amirabazerbachi@gmail.com";
    const nome = String(dados.get("nome") || "").trim();
    const email = String(dados.get("email") || "").trim();
    const mensagem = String(dados.get("mensagem") || "").trim();
    const corpo = `Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`;
    const assunto = `Contato pelo portfólio — ${nome}`;
    const url = `mailto:${para}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    const status = document.getElementById("status-form");

    if (status) status.textContent = `Abrindo seu aplicativo de e-mail. Se não abrir, escreva para ${para}.`;
    window.location.href = url;
  });

  if (timeline && cards.length !== 18) {
    console.warn(`A linha do tempo encontrou ${cards.length} cards; eram esperados 18.`);
  }
});