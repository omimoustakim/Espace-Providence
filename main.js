/* ============================================================
   RESTAURANT ESPACE PROVIDENCE — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ===== PANIER & COMMANDE =====
  const panier = {}; // { "Nom (Prix)": { name, price, qty } }

  // Popup choix prix
  const prixOverlay  = document.getElementById('prixOverlay');
  const prixPopupNom = document.getElementById('prixPopupNom');
  const prixChoices  = document.getElementById('prixChoices');
  document.getElementById('prixAnnuler').addEventListener('click', () => {
    prixOverlay.classList.remove('open');
  });
  prixOverlay.addEventListener('click', (e) => {
    if (e.target === prixOverlay) prixOverlay.classList.remove('open');
  });

  function ajouterAuPanier(nom, prix) {
    const key = `${nom} (${prix})`;
    if (panier[key]) {
      panier[key].qty++;
    } else {
      panier[key] = { name: nom, price: prix, qty: 1 };
    }
    updatePanierBar();
    syncAddButtons();
  }

  function updatePanierBar() {
    const total = Object.values(panier).reduce((s, v) => s + v.qty, 0);
    const panierBar    = document.getElementById('panierBar');
    const panierCount  = document.getElementById('panierCount');
    const panierPreview = document.getElementById('panierPreview');

    if (total === 0) {
      panierBar.classList.remove('visible');
      return;
    }
    panierBar.classList.add('visible');
    panierCount.textContent = total + (total > 1 ? ' articles' : ' article');
    panierPreview.textContent = Object.values(panier).map(v => v.name).join(', ');
  }

  function updateRecapForm() {
    const recapList = document.getElementById('recapList');
    if (!recapList) return;
    recapList.innerHTML = '';
    Object.entries(panier).forEach(([key, data]) => {
      const line = document.createElement('div');
      line.className = 'recap-line';
      line.innerHTML = `
        <div class="recap-name-block">
          <span class="recap-name">${data.name}</span>
          <span class="recap-price">${data.price}</span>
        </div>
        <div class="recap-qty-ctrl">
          <button class="recap-btn" data-action="minus" data-key="${key}">−</button>
          <span class="recap-qty">x${data.qty}</span>
          <button class="recap-btn" data-action="plus" data-key="${key}">+</button>
        </div>`;
      recapList.appendChild(line);
    });

    recapList.querySelectorAll('.recap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (btn.dataset.action === 'plus') {
          panier[key].qty++;
        } else {
          panier[key].qty--;
          if (panier[key].qty <= 0) delete panier[key];
        }
        updateRecapForm();
        updatePanierBar();
        syncAddButtons();
      });
    });
  }

  function syncAddButtons() {
    document.querySelectorAll('.btn-add').forEach(btn => {
      const nom = btn.closest('.menu-item').dataset.name;
      const inPanier = Object.values(panier).some(v => v.name === nom);
      btn.classList.toggle('added', inPanier);
    });
  }

  // Clic sur "+" d'un plat
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const item  = btn.closest('.menu-item');
      const nom   = item.dataset.name;
      const price = item.dataset.price;

      // Prix double ? (contient " – ")
      if (price.includes('–')) {
        const parts = price.split('–').map(p => p.trim());
        prixPopupNom.textContent = nom;
        prixChoices.innerHTML = '';
        parts.forEach(p => {
          const b = document.createElement('button');
          b.className = 'prix-choice-btn';
          b.textContent = p;
          b.addEventListener('click', () => {
            ajouterAuPanier(nom, p);
            prixOverlay.classList.remove('open');
            // Feedback visuel
            btn.textContent = '✓';
            setTimeout(() => { btn.textContent = '+'; }, 700);
          });
          prixChoices.appendChild(b);
        });
        prixOverlay.classList.add('open');
      } else {
        // Prix unique → ajout direct
        ajouterAuPanier(nom, price);
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '+'; }, 700);
      }
    });
  });

  // Vider le panier
  document.getElementById('panierVider').addEventListener('click', () => {
    Object.keys(panier).forEach(k => delete panier[k]);
    updatePanierBar();
    syncAddButtons();
  });

  // "Commander" → scroll vers formulaire + remplir récap
  document.getElementById('panierCommander').addEventListener('click', () => {
    updateRecapForm();
    const section = document.getElementById('livraison');
    const navHeight = navbar.offsetHeight;
    const top = section.getBoundingClientRect().top + window.scrollY - navHeight - 20;
    window.scrollTo({ top, behavior: 'smooth' });
    // Highlight le formulaire
    const form = document.getElementById('livraisonForm');
    form.style.transition = 'box-shadow 0.4s ease';
    form.style.boxShadow = '0 0 0 3px var(--gold)';
    setTimeout(() => { form.style.boxShadow = ''; }, 1800);
  });

  // ===== COMMANDE LIVRAISON WHATSAPP =====
  const livraisonForm = document.getElementById('livraisonForm');
  if (livraisonForm) {
    livraisonForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nom     = document.getElementById('liv-nom').value.trim();
      const tel     = document.getElementById('liv-tel').value.trim();
      const adresse = document.getElementById('liv-adresse').value.trim();

      const lignesCommande = Object.values(panier)
        .map(d => `  • x${d.qty} ${d.name} — ${d.price}`)
        .join('\n');

      if (!lignesCommande) {
        alert('Veuillez ajouter des plats depuis le menu avant de commander.');
        return;
      }

      const message =
        `🛵 *Nouvelle commande - Livraison*\n\n` +
        `👤 *Nom :* ${nom}\n` +
        `📞 *Téléphone :* ${tel}\n` +
        `📍 *Adresse :* ${adresse}\n\n` +
        `🍽️ *Commande :*\n${lignesCommande}\n\n` +
        `_Envoyé depuis le site Espace Providence_`;

      window.open(`https://wa.me/22891393541?text=${encodeURIComponent(message)}`, '_blank');
    });
  }


  // ===== NAVBAR SCROLL =====
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });


  // ===== HAMBURGER MENU =====
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });


  // ===== TABS MENU =====
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      tab.classList.add('active');
      const activeContent = document.getElementById('tab-' + target);
      if (activeContent) activeContent.classList.add('active');
    });
  });


  // ===== SCROLL REVEAL =====
  const revealElements = document.querySelectorAll(
    '.menu-item, .jour-card, .contact-card, .strip-item, .menu-category'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, entry.target.dataset.delay || 0);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.dataset.delay = (i % 8) * 60;
    observer.observe(el);
  });


  // ===== SMOOTH SCROLL pour ancres =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  // ===== HIGHLIGHT JOUR ACTUEL =====
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const today = jours[new Date().getDay()];

  document.querySelectorAll('.jour-card').forEach(card => {
    const jourEl = card.querySelector('.jour');
    if (jourEl && jourEl.textContent.trim() === today) {
      card.classList.add('highlight');
    }
  });


  // ===== YEAR FOOTER =====
  const copyEl = document.querySelector('.footer-copy');
  if (copyEl) {
    copyEl.innerHTML = copyEl.innerHTML.replace('2025', new Date().getFullYear());
  }

});
