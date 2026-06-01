// Items Management Module - e-Lost & Found System
const items = {
  activeTypeFilter: 'all',

  initialize() {
    this.setupListeners();
    this.loadFeed();
  },

  setupListeners() {
    // Search input typing handler (Debounced)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => this.loadFeed(), 350);
      });
    }

    // Filter selectors
    ['filter-type', 'filter-category', 'filter-location'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.loadFeed());
      }
    });

    // Reset Filters button
    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        const t = document.getElementById('filter-type'); if(t) t.value = '';
        const c = document.getElementById('filter-category'); if(c) c.value = '';
        const l = document.getElementById('filter-location'); if(l) l.value = '';
        const s = document.getElementById('search-input'); if(s) s.value = '';
        this.loadFeed();
      });
    }

    // Feed tab button toggles
    document.querySelectorAll('.feed-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.feed-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTypeFilter = btn.dataset.type;
        this.loadFeed();
      });
    });

    // --- ITEM REPORT FORM FUNCTIONALITY ---

    // Toggle lost/found design highlights
    const lostRadio = document.querySelector('input[name="item-type"][value="lost"]');
    const foundRadio = document.querySelector('input[name="item-type"][value="found"]');
    const labelLost = document.getElementById('label-type-lost');
    const labelFound = document.getElementById('label-type-found');

    if (lostRadio && foundRadio) {
      const updateFormTheme = () => {
        if (lostRadio.checked) {
          labelLost?.classList.add('active');
          labelFound?.classList.remove('active');
        } else {
          labelFound?.classList.add('active');
          labelLost?.classList.remove('active');
        }
      };

      lostRadio.addEventListener('change', updateFormTheme);
      foundRadio.addEventListener('change', updateFormTheme);
    }

    // Image Upload Dropzone preview handling
    const imageDropzone = document.getElementById('image-dropzone');
    const reportImageInput = document.getElementById('report-image');
    const dropzonePreview = document.getElementById('dropzone-preview');
    const previewImg = document.getElementById('preview-img');
    const btnRemovePreview = document.getElementById('btn-remove-preview');

    if (imageDropzone && reportImageInput) {
      imageDropzone.addEventListener('click', () => reportImageInput.click());
      
      reportImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            previewImg.src = event.target.result;
            dropzonePreview.style.display = 'flex';
          };
          reader.readAsDataURL(file);
        }
      });

      if (btnRemovePreview) {
        btnRemovePreview.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent triggering dropzone click
          reportImageInput.value = '';
          previewImg.src = '';
          dropzonePreview.style.display = 'none';
        });
      }
    }

    // --- REAL-TIME DUPLICATE DETECTION TRIGGERS ---
    const reportTitle = document.getElementById('report-title');
    const reportCategory = document.getElementById('report-category');
    const reportLocation = document.getElementById('report-location');

    const triggerDuplicateCheck = async () => {
      const title = reportTitle?.value;
      const category = reportCategory?.value;
      const location = reportLocation?.value;
      const type = document.querySelector('input[name="item-type"]:checked')?.value;

      if (!title || title.trim().length < 4 || !category || !location || !type) {
        document.getElementById('duplicate-warning-box').style.display = 'none';
        return;
      }

      try {
        const matches = await api.post('/items/check-duplicates', { title, category, location, type });
        const box = document.getElementById('duplicate-warning-box');
        const list = document.getElementById('duplicate-warning-items');

        if (matches && matches.length > 0) {
          list.innerHTML = matches.map(m => `
            <div class="warning-item-row">
              <div class="info">
                <h5>${m.item.title} (${m.item.type.toUpperCase()})</h5>
                <span>Reported at: ${m.item.location} | Date: ${m.item.date}</span>
              </div>
              <a href="#items?id=${m.item.id}" class="btn btn-primary btn-sm">Inspect Match</a>
            </div>
          `).join('');
          box.style.display = 'block';
        } else {
          box.style.display = 'none';
        }
      } catch (err) {
        console.error('Duplicate pre-check failure:', err);
      }
    };

    let checkTimeout;
    [reportTitle, reportCategory, reportLocation].forEach(el => {
      el?.addEventListener('change', () => triggerDuplicateCheck());
      el?.addEventListener('input', () => {
        clearTimeout(checkTimeout);
        checkTimeout = setTimeout(triggerDuplicateCheck, 400);
      });
    });

    // Handle Form Report Submission
    const formReport = document.getElementById('form-report-item');
    if (formReport) {
      formReport.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!auth.currentUser) {
          app.showToast('Please login to report a lost or found item', 'danger');
          window.location.hash = '#auth';
          return;
        }

        const formData = new FormData();
        const type = document.querySelector('input[name="item-type"]:checked').value;
        const title = document.getElementById('report-title').value;
        const category = document.getElementById('report-category').value;
        const location = document.getElementById('report-location').value;
        const date = document.getElementById('report-date').value;
        const description = document.getElementById('report-desc').value;
        const imageFile = document.getElementById('report-image').files[0];

        formData.append('type', type);
        formData.append('title', title);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('date', date);
        formData.append('description', description);
        formData.append('reporterId', auth.currentUser.id);
        formData.append('reporterEmail', auth.currentUser.email);
        formData.append('reporterName', auth.currentUser.fullName);
        
        if (imageFile) {
          formData.append('image', imageFile);
        }

        try {
          const btnSubmit = document.getElementById('btn-submit-report');
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

          await api.postMultipart('/items', formData);
          
          app.showToast('Item reported successfully! Real-time matching is scanning...', 'success');
          formReport.reset();
          
          if (document.getElementById('btn-remove-preview')) {
            document.getElementById('btn-remove-preview').click();
          }
          
          window.location.hash = '#home';
        } catch (err) {
          app.showToast(err.message, 'danger');
        } finally {
          const btnSubmit = document.getElementById('btn-submit-report');
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Report`;
        }
      });
    }

    // --- CLAIMS SUBMISSION PROCESS ---
    const claimDropzone = document.getElementById('claim-student-card-dropzone');
    const claimCardInput = document.getElementById('claim-student-card');
    const claimPreviewDiv = document.getElementById('claim-dropzone-preview');
    const claimPreviewImg = document.getElementById('claim-preview-img');
    const btnRemoveClaimPreview = document.getElementById('btn-remove-claim-preview');

    if (claimDropzone && claimCardInput) {
      claimDropzone.addEventListener('click', () => claimCardInput.click());
      
      claimCardInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            claimPreviewImg.src = event.target.result;
            claimPreviewDiv.style.display = 'flex';
          };
          reader.readAsDataURL(file);
        }
      });

      if (btnRemoveClaimPreview) {
        btnRemoveClaimPreview.addEventListener('click', (e) => {
          e.stopPropagation();
          claimCardInput.value = '';
          claimPreviewImg.src = '';
          claimPreviewDiv.style.display = 'none';
        });
      }
    }

    // Claim Modal form submission
    const formSubmitClaim = document.getElementById('form-submit-claim');
    if (formSubmitClaim) {
      formSubmitClaim.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!auth.currentUser) {
          app.showToast('Please login to file a recovery claim', 'danger');
          window.location.hash = '#auth';
          return;
        }

        const itemId = document.getElementById('claim-item-id').value;
        const proofDescription = document.getElementById('claim-proof-desc').value;
        const studentCardFile = document.getElementById('claim-student-card').files[0];

        const formData = new FormData();
        formData.append('claimerId', auth.currentUser.id);
        formData.append('claimerName', auth.currentUser.fullName);
        formData.append('claimerEmail', auth.currentUser.email);
        formData.append('proofDescription', proofDescription);

        if (studentCardFile) {
          formData.append('studentCard', studentCardFile);
        }

        try {
          const btnClaimSubmit = document.getElementById('btn-confirm-claim');
          btnClaimSubmit.disabled = true;
          btnClaimSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

          await api.postMultipart(`/items/${itemId}/claim`, formData);
          
          app.showToast('Claim request filed! Finder will review verification logs.', 'success');
          document.getElementById('modal-claim').style.display = 'none';
          formSubmitClaim.reset();
          
          if (btnRemoveClaimPreview) btnRemoveClaimPreview.click();

          // Refresh item details
          this.loadItemDetail(itemId);
        } catch (err) {
          app.showToast(err.message, 'danger');
        } finally {
          const btnClaimSubmit = document.getElementById('btn-confirm-claim');
          btnClaimSubmit.disabled = false;
          btnClaimSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> File Claim Request`;
        }
      });
    }

    // Claim Modal Closers
    ['btn-close-claim', 'btn-cancel-claim'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        document.getElementById('modal-claim').style.display = 'none';
      });
    });
  },

  async loadFeed() {
    const grid = document.getElementById('items-grid');
    if (!grid) return;

    // Apply smooth loading dim class instead of replacing the whole grid with a spinner immediately
    grid.classList.add('feed-loading');

    const searchQuery = document.getElementById('search-input').value;
    const cat = document.getElementById('filter-category').value;
    const loc = document.getElementById('filter-location').value;
    const typeFilter = document.getElementById('filter-type').value;

    const params = {
      query: searchQuery || undefined,
      category: cat || undefined,
      location: loc || undefined,
      type: typeFilter || (this.activeTypeFilter !== 'all' ? this.activeTypeFilter : undefined)
    };

    try {
      const data = await api.get('/items', params);

      // Remove the loading transition state
      grid.classList.remove('feed-loading');

      if (!data || data.length === 0) {
        grid.innerHTML = `
          <div class="empty-state-container" style="grid-column: 1 / -1; width: 100%;">
            <div class="empty-state" style="padding: 60px 0; text-align: center; width: 100%;">
              <i class="fa-solid fa-radar" style="font-size: 44px; color: var(--text-muted); margin-bottom: 15px; animation: pulse 2s infinite;"></i>
              <p style="color: var(--text-secondary); font-size: 15px;">No listings found matching your search. Create a post to start scanning matches!</p>
            </div>
          </div>
        `;
        return;
      }

      // Render items with staggered animation delays
      grid.innerHTML = data.map((item, index) => this.renderItemCard(item, index)).join('');
    } catch (err) {
      grid.classList.remove('feed-loading');
      grid.innerHTML = `<div class="spinner-container" style="grid-column: 1 / -1;"><p class="text-danger">Failed to connect to campus network: ${err.message}</p></div>`;
    }
  },

  // Map category code names to beautiful display terms and icons
  getCategoryInfo(cat) {
    const map = {
      'id-cards': { label: 'ID Card', icon: 'fa-address-card' },
      'mobiles': { label: 'Electronics & Mobiles', icon: 'fa-laptop' },
      'wallets': { label: 'Wallet / Purse', icon: 'fa-wallet' },
      'books': { label: 'Book / Stationery', icon: 'fa-book-open' },
      'others': { label: 'Others', icon: 'fa-cube' }
    };
    return map[cat] || { label: 'Other', icon: 'fa-cube' };
  },

  renderItemCard(item, index = 0) {
    const catInfo = this.getCategoryInfo(item.category);
    const badgeTypeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
    const badgeStatusClass = item.status === 'claimed' ? 'badge-claimed' : (item.status === 'lost' ? 'badge-lost' : 'badge-found');

    return `
      <div class="item-card glass-card" onclick="window.location.hash = '#items?id=${item.id}'" style="animation-delay: ${index * 0.05}s">
        <div class="card-img-wrapper">
          ${item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.title}" loading="lazy">` 
            : `<div class="img-fallback"><i class="fa-solid ${catInfo.icon}"></i><span>No Image Uploaded</span></div>`
          }
          <span class="badge ${badgeTypeClass} card-badge-type">${item.type.toUpperCase()}</span>
          <span class="badge ${badgeStatusClass} card-badge-status">${item.status.toUpperCase()}</span>
        </div>
        <div class="card-body">
          <div>
            <span class="card-category"><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
            <h3>${item.title}</h3>
            <p class="card-desc">${item.description || 'No description provided.'}</p>
          </div>
          <div class="card-meta">
            <span><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
            <span><i class="fa-solid fa-calendar"></i> ${item.date}</span>
          </div>
        </div>
      </div>
    `;
  },

  async loadItemDetail(id) {
    const wrapper = document.getElementById('detail-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;

    try {
      const item = await api.get(`/items/${id}`);
      const catInfo = this.getCategoryInfo(item.category);
      
      const badgeTypeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
      const badgeStatusClass = item.status === 'claimed' ? 'badge-claimed' : (item.status === 'lost' ? 'badge-lost' : 'badge-found');

      // Check current user conditions
      let claimButtonHtml = '';
      if (item.status === 'claimed') {
        claimButtonHtml = `<button class="btn btn-gradient btn-lg" disabled><i class="fa-solid fa-clipboard-check"></i> Item Recovered</button>`;
      } else if (!auth.currentUser) {
        claimButtonHtml = `<a href="#auth" class="btn btn-gradient btn-lg"><i class="fa-solid fa-right-to-bracket"></i> Login to Claim Item</a>`;
      } else if (auth.currentUser.id === item.reporterId) {
        claimButtonHtml = `<button class="btn btn-secondary btn-lg" disabled><i class="fa-solid fa-user-shield"></i> You reported this item</button>`;
      } else {
        claimButtonHtml = `<button class="btn btn-gradient btn-lg" id="btn-open-claim-form"><i class="fa-solid fa-signature"></i> Claim Belonging</button>`;
      }

      // Fetch dynamic suggestions
      let suggestionsHtml = '';
      try {
        const matches = await api.get(`/items/${id}/matches`);
        if (matches && matches.length > 0) {
          suggestionsHtml = `
            <div class="matches-suggestions-box" style="margin-top: 50px;">
              <h3 style="margin-bottom: 20px; font-size: 22px;"><i class="fa-solid fa-bolt text-gradient"></i> Smart Suggestions</h3>
              <p style="color: var(--text-secondary); font-size: 13px; margin-top: -15px; margin-bottom: 25px;">Our system detected active listings reported nearby with similar specifications. Could one of these be your match?</p>
              <div class="items-grid" style="margin-top: 20px;">
                ${matches.map((m, index) => {
                  const sCatInfo = this.getCategoryInfo(m.item.category);
                  return `
                    <div class="item-card glass-card" onclick="window.location.hash = '#items?id=${m.item.id}'" style="height: 350px; animation-delay: ${index * 0.05}s">
                      <div class="card-img-wrapper" style="height: 150px;">
                        ${m.item.imageUrl 
                          ? `<img src="${m.item.imageUrl}" alt="${m.item.title}" loading="lazy">` 
                          : `<div class="img-fallback"><i class="fa-solid ${sCatInfo.icon}"></i><span>No Image</span></div>`
                        }
                        <span class="badge card-badge-type" style="background: var(--primary-gradient); color: #070b15; border: none; font-weight: 700;">${m.confidence}% MATCH</span>
                      </div>
                      <div class="card-body" style="padding: 15px 20px; height: calc(100% - 150px); display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                          <span class="card-category" style="font-size: 10px; margin-bottom: 2px;"><i class="fa-solid ${sCatInfo.icon}"></i> ${sCatInfo.label}</span>
                          <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">${m.item.title}</h4>
                          <p class="card-desc" style="-webkit-line-clamp: 1; font-size: 12px; margin-bottom: 0; color: var(--text-secondary);">${m.item.description || 'No description.'}</p>
                        </div>
                        <div class="card-meta" style="padding-top: 8px; font-size: 11px; border-top: 1px solid var(--glass-border); color: var(--text-muted);">
                          <span><i class="fa-solid fa-location-dot"></i> ${m.item.location}</span>
                          <span><i class="fa-solid fa-calendar"></i> ${m.item.date}</span>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }
      } catch (matchErr) {
        console.error('Error retrieving matching recommendations:', matchErr);
      }

      wrapper.innerHTML = `
        <a href="#home" class="btn btn-secondary btn-sm margin-top-20" style="margin-bottom: 20px;"><i class="fa-solid fa-arrow-left"></i> Back to feed</a>
        <div class="glass-card" style="padding: 40px; border-radius: 20px;">
          <div class="detail-grid">
            <div class="detail-image-box">
              ${item.imageUrl 
                ? `<img src="${item.imageUrl}" alt="${item.title}">` 
                : `<div class="img-fallback" style="font-size: 80px;"><i class="fa-solid ${catInfo.icon}"></i><span>No Image Uploaded</span></div>`
              }
            </div>
            <div class="detail-info-box">
              <div class="detail-meta-row">
                <span class="badge ${badgeTypeClass}">${item.type.toUpperCase()}</span>
                <span class="badge ${badgeStatusClass}">${item.status.toUpperCase()}</span>
                <span class="card-category" style="margin-bottom: 0;"><i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}</span>
              </div>
              
              <h2>${item.title}</h2>
              <p class="text-muted" style="font-size: 13px;"><i class="fa-solid fa-clock"></i> Reported on: ${new Date(item.createdAt).toLocaleDateString()}</p>
              
              <div class="detail-desc-block">
                <h4>Description</h4>
                <p style="font-size: 14px; white-space: pre-wrap;">${item.description || 'No description provided.'}</p>
              </div>

              <div class="detail-specs-grid">
                <div class="spec-item">
                  <i class="fa-solid fa-location-dot"></i>
                  <div>
                    <span class="label">IIUI Campus Location</span>
                    <span class="value">${item.location}</span>
                  </div>
                </div>
                <div class="spec-item">
                  <i class="fa-solid fa-calendar"></i>
                  <div>
                    <span class="label">Date Lost/Found</span>
                    <span class="value">${item.date}</span>
                  </div>
                </div>
                <div class="spec-item">
                  <i class="fa-solid fa-circle-user"></i>
                  <div>
                    <span class="label">Reported By</span>
                    <span class="value">${item.reporterName}</span>
                  </div>
                </div>
                <div class="spec-item">
                  <i class="fa-solid fa-envelope"></i>
                  <div>
                    <span class="label">Contact Info</span>
                    <span class="value">${item.reporterEmail}</span>
                  </div>
                </div>
              </div>

              <div class="detail-actions-block">
                ${claimButtonHtml}
              </div>
            </div>
          </div>
        </div>
        ${suggestionsHtml}
      `;

      // Set up click handler for the open claim button
      const openClaimBtn = document.getElementById('btn-open-claim-form');
      if (openClaimBtn) {
        openClaimBtn.addEventListener('click', () => {
          document.getElementById('claim-item-id').value = item.id;
          document.getElementById('modal-claim').style.display = 'flex';
        });
      }

    } catch (err) {
      wrapper.innerHTML = `
        <div class="glass-card" style="padding: 40px; text-align: center;">
          <h3 class="text-danger">Item Not Found</h3>
          <p>${err.message}</p>
          <a href="#home" class="btn btn-primary margin-top-20">Back to Home</a>
        </div>
      `;
    }
  }
};
