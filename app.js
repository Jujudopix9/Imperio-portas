/* ============================================================
   IMPÉRIO PORTAS — app.js v2
   ─────────────────────────────────────────────────────────────
   INTEGRAÇÕES DE FORMULÁRIO:
   
   OPÇÃO A — WhatsApp direto (zero backend, zero custo)
     Configure WHATSAPP_NUMBER abaixo com o número completo
     ex: "5511999999999"  (sem +, espaços ou traços)
   
   OPÇÃO B — Formspree (envio por e-mail, grátis até 50/mês)
     1. Acesse https://formspree.io e crie uma conta gratuita
     2. Crie um novo Form e copie o endpoint gerado
        ex: "https://formspree.io/f/xpwzabcd"
     3. Cole em FORMSPREE_ENDPOINT abaixo
     4. Troque USE_WHATSAPP para false
   
   Para usar ambos: deixe USE_WHATSAPP = true e o WhatsApp
   abrirá após o envio do Formspree automaticamente.
   ============================================================ */

const CONFIG = {
  WHATSAPP_NUMBER:    "5511999999999",   // 🔧 TROQUE pelo seu número
  FORMSPREE_ENDPOINT: "",                // 🔧 Cole o endpoint do Formspree aqui
  USE_WHATSAPP:       true,              // true = abre WA direto | false = usa Formspree
  OPEN_WA_AFTER_FORM: false,            // true = abre WA depois do envio Formspree
};

(function () {
  "use strict";

  /* ── 1. HAMBURGER ──────────────────────────────────────── */
  const hamburger  = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const body       = document.body;

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open", isOpen);
      body.style.overflow = isOpen ? "hidden" : "";
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });
    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeMenu();
    });
  }
  function closeMenu() {
    hamburger?.classList.remove("open");
    mobileMenu?.classList.remove("open");
    body.style.overflow = "";
  }

  /* ── 2. HEADER SCROLL EFFECT ───────────────────────────── */
  const header = document.querySelector(".header");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    }, { passive: true });
  }

  /* ── 3. SCROLL REVEAL ──────────────────────────────────── */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -48px 0px" });
    revealEls.forEach(el => observer.observe(el));
  }

  /* ── 4. CONTADOR ANIMADO ───────────────────────────────── */
  function animateCounter(el, target, duration = 1600) {
    let start = null;
    const suffix = el.dataset.suffix || "";
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.floor(ease * target).toLocaleString("pt-BR") + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length && "IntersectionObserver" in window) {
    const cObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target, parseInt(entry.target.dataset.counter));
          cObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cObs.observe(c));
  }

  /* ── 5. TOAST ──────────────────────────────────────────── */
  function showToast(emoji, msg, duration = 4500) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `<span class="toast-icon"></span><p></p>`;
      document.body.appendChild(toast);
    }
    toast.querySelector(".toast-icon").textContent = emoji;
    toast.querySelector("p").textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), duration);
  }

  /* ── 6. HELPER: montar mensagem WhatsApp ───────────────── */
  function buildWAMessage(formEl) {
    const data = new FormData(formEl);
    const lines = [];
    const labels = {
      nome:      "👤 Nome",
      telefone:  "📞 Telefone",
      email:     "✉️ E-mail",
      servico:   "🔧 Serviço",
      cidade:    "📍 Cidade/Bairro",
      mensagem:  "💬 Mensagem",
    };
    for (const [key, val] of data.entries()) {
      if (val.trim()) {
        lines.push(`${labels[key] || key}: ${val}`);
      }
    }
    return encodeURIComponent(
      "Olá! Gostaria de solicitar um orçamento:\n\n" + lines.join("\n")
    );
  }

  /* ── 7. ENVIO — WhatsApp direto ─────────────────────────── */
  function submitViaWhatsApp(formEl) {
    const msg = buildWAMessage(formEl);
    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`;
    window.open(url, "_blank", "noopener");
    return Promise.resolve({ ok: true });
  }

  /* ── 8. ENVIO — Formspree ──────────────────────────────── */
  async function submitViaFormspree(formEl) {
    if (!CONFIG.FORMSPREE_ENDPOINT) {
      console.warn("Formspree: endpoint não configurado em app.js");
      return { ok: false };
    }
    const resp = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
      method: "POST",
      body: new FormData(formEl),
      headers: { Accept: "application/json" },
    });
    return resp;
  }

  /* ── 9. SETUP FORMS ────────────────────────────────────── */
  function setupForm(formEl) {
    if (!formEl) return;
    const box       = formEl.closest(".form-box");
    const successEl = box?.querySelector(".form-success");
    const submitBtn = formEl.querySelector("[type='submit']");

    formEl.addEventListener("submit", async e => {
      e.preventDefault();

      // Validação
      let valid = true;
      formEl.querySelectorAll("[required]").forEach(field => {
        const empty = !field.value.trim();
        field.style.borderColor = empty ? "rgba(220,60,60,0.7)" : "";
        field.style.boxShadow   = empty ? "0 0 0 3px rgba(220,60,60,0.12)" : "";
        if (empty) {
          valid = false;
          field.addEventListener("input", () => {
            field.style.borderColor = "";
            field.style.boxShadow   = "";
          }, { once: true });
        }
      });

      if (!valid) {
        showToast("⚠️", "Preencha todos os campos obrigatórios.");
        return;
      }

      // Estado de loading
      const originalText = submitBtn?.textContent || "Enviar";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando…";
      }

      try {
        let result;

        if (CONFIG.USE_WHATSAPP) {
          // OPÇÃO A: WhatsApp direto
          result = await submitViaWhatsApp(formEl);
        } else {
          // OPÇÃO B: Formspree
          result = await submitViaFormspree(formEl);

          if (!result.ok) {
            throw new Error("Falha no envio.");
          }

          // Abrir WA depois do Formspree (opcional)
          if (CONFIG.OPEN_WA_AFTER_FORM) {
            setTimeout(() => submitViaWhatsApp(formEl), 800);
          }
        }

        // Sucesso
        formEl.reset();
        formEl.style.display = "none";
        if (successEl) successEl.style.display = "block";
        showToast("✅", "Mensagem enviada! Entraremos em contato em breve.");

      } catch (err) {
        showToast("❌", "Erro ao enviar. Tente pelo WhatsApp.");
        console.error(err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  document.querySelectorAll("form").forEach(setupForm);

  /* ── 10. ACTIVE NAV AUTO ───────────────────────────────── */
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-menu a, .mobile-menu a").forEach(a => {
    const h = a.getAttribute("href") || "";
    a.classList.toggle("active", h === page || (page === "" && h === "index.html"));
  });

})();
