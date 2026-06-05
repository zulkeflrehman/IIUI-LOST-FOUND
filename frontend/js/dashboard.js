// Dashboard Controller - e-Lost & Found System
const dashboard = {
  activeTab: 'overview',
  activeChatRoomId: null,
  chatPollerInterval: null,

  initialize() {
    this.setupListeners();
  },

  setupListeners() {
    // Sidebar Navigation toggles
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Chat form submit
    const chatForm = document.getElementById('chat-message-form');
    if (chatForm) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input-field');
        const text = input.value.trim();
        if (!text || !this.activeChatRoomId) return;

        try {
          await api.post(`/chats/${this.activeChatRoomId}/message`, {
            senderId: auth.currentUser.id,
            senderName: auth.currentUser.fullName,
            text
          });
          input.value = '';
          this.loadActiveChatMessages(true); // reload instantly
        } catch (err) {
          app.showToast(err.message, 'danger');
        }
      });
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Clear poller if leaving chat messages
    if (tabName !== 'messages') {
      clearInterval(this.chatPollerInterval);
      this.chatPollerInterval = null;
    }

    // Toggle panel displays
    document.querySelectorAll('.dash-content-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    const activePanel = document.getElementById(`dash-${tabName}`);
    if (activePanel) activePanel.classList.add('active');

    // Load data based on tab
    switch (tabName) {
      case 'overview':
        this.loadOverviewData();
        break;
      case 'my-items':
        this.loadMyItems();
        break;
      case 'claims':
        this.loadClaimsReceived();
        break;
      case 'my-claims':
        this.loadClaimsSubmitted();
        break;
      case 'messages':
        this.loadChatSystem();
        break;
    }
  },

  async loadOverviewData() {
    if (!auth.currentUser) return;
    
    try {
      // 1. Fetch metrics
      const userItems = await api.get('/items', { reporterId: auth.currentUser.id });
      const myItemsCount = userItems.filter(i => i.reporterId === auth.currentUser.id).length;
      
      const claimsReceived = await api.get('/item-claims', { userId: auth.currentUser.id });
      const claimsSent = await api.get('/my-claims', { userId: auth.currentUser.id });
      
      document.getElementById('metric-my-items').innerText = myItemsCount;
      document.getElementById('metric-claims-recv').innerText = claimsReceived.length;
      document.getElementById('metric-claims-sent').innerText = claimsSent.length;

      // 2. Fetch notifications
      const notifications = await api.get('/notifications', { userId: auth.currentUser.id });
      const ntfList = document.getElementById('dash-notification-list');
      
      if (notifications.length === 0) {
        ntfList.innerHTML = `<div class="empty-state">No matching alerts yet. Search items on the feed!</div>`;
        return;
      }

      ntfList.innerHTML = notifications.slice(0, 5).map(n => {
        const unreadClass = !n.read ? 'unread' : '';
        let iconHtml = '<i class="fa-solid fa-bell text-info ntf-icon"></i>';
        
        if (n.type === 'match_found') iconHtml = '<i class="fa-solid fa-bolt text-warning ntf-icon animate-pulse"></i>';
        if (n.type === 'claim_approved') iconHtml = '<i class="fa-solid fa-circle-check text-success ntf-icon"></i>';
        if (n.type === 'claim_received') iconHtml = '<i class="fa-solid fa-signature text-info ntf-icon"></i>';

        return `
          <div class="notification-item-card ${unreadClass}" onclick="dashboard.handleNotificationClick('${n.id}', '${n.link}')">
            ${iconHtml}
            <div class="ntf-body">
              <p>${n.message}</p>
              <div class="ntf-meta" style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <span class="time">${new Date(n.createdAt).toLocaleTimeString()} - ${new Date(n.createdAt).toLocaleDateString()}</span>
                <span class="sms-badge" style="background: rgba(0, 242, 254, 0.08); color: var(--accent-cyan); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 4px; padding: 2px 6px; font-size: 10px; display: inline-flex; align-items: center; gap: 4px; font-weight: 500;"><i class="fa-solid fa-mobile-screen-button" style="font-size: 9px;"></i> SMS Sent</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('Failed to load overview analytics:', err);
    }
  },

  async handleNotificationClick(id, link) {
    try {
      // Mark as read
      await api.post('/notifications/read', { userId: auth.currentUser.id });
      app.updateNotificationsCount();
      
      // Redirect
      if (link) {
        if (link.startsWith('dashboard')) {
          const tab = link.split('tab=')[1];
          window.location.hash = '#dashboard';
          setTimeout(() => {
            const btn = document.querySelector(`.dash-tab-btn[data-tab="${tab}"]`);
            if (btn) btn.click();
          }, 100);
        } else if (link.startsWith('items')) {
          const itemId = link.split('id=')[1];
          window.location.hash = `#items?id=${itemId}`;
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  async loadMyItems() {
    const tableBody = document.getElementById('dash-my-items-table');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>`;

    try {
      const myItems = await api.get('/items', { reporterId: auth.currentUser.id });

      // Exclude claimed items from dashboard Reported list to keep active listings clean!
      const activeMyItems = myItems.filter(i => i.status !== 'claimed');

      if (activeMyItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">You have no active reported items.</td></tr>`;
        return;
      }

      tableBody.innerHTML = activeMyItems.map(item => {
        const badgeTypeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
        const badgeStatusClass = item.status === 'claimed' ? 'badge-claimed' : (item.status === 'lost' ? 'badge-lost' : 'badge-found');

        return `
          <tr>
            <td><strong>${item.title}</strong></td>
            <td><span class="badge ${badgeTypeClass}">${item.type.toUpperCase()}</span></td>
            <td>${item.date}</td>
            <td>${item.location}</td>
            <td><span class="badge ${badgeStatusClass}">${item.status.toUpperCase()}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm text-danger" onclick="dashboard.deleteItem('${item.id}')">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Network Error: ${err.message}</td></tr>`;
    }
  },

  async deleteItem(id) {
    if (!confirm('Are you absolutely sure you want to delete this listing? All claims associated will be deleted permanently.')) return;

    try {
      await api.delete(`/items/${id}`, { userId: auth.currentUser.id, role: auth.currentUser.role });
      app.showToast('Listing successfully deleted', 'success');
      this.loadMyItems();
    } catch (err) {
      app.showToast(err.message, 'danger');
    }
  },

  async loadClaimsReceived() {
    const list = document.getElementById('dash-claims-list');
    if (!list) return;

    list.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;

    try {
      const claims = await api.get('/item-claims', { userId: auth.currentUser.id });
      
      const pendingClaims = claims.filter(c => c.status === 'pending');

      if (pendingClaims.length === 0) {
        list.innerHTML = `<div class="empty-state">No pending claims received. Found items will appear here when claimed by others.</div>`;
        return;
      }

      list.innerHTML = pendingClaims.map(c => `
        <div class="glass-card claim-response-card" style="margin-bottom: 20px;">
          <div class="claim-user-bar">
            <div class="claim-user-info">
              <div class="avatar">${c.claimerName.charAt(0).toUpperCase()}</div>
              <div class="claim-user-meta">
                <h4>${c.claimerName}</h4>
                <p>${c.claimerEmail}</p>
              </div>
            </div>
            <span class="badge badge-pulse">PENDING REVIEW</span>
          </div>
          
          <div class="claim-item-ref">
            Claiming Item: <strong>"${c.itemTitle}"</strong>
          </div>
          
          <div class="claim-desc-block">
            <strong>Ownership Proof Description:</strong>
            <p>${c.proofDescription}</p>
          </div>

          ${c.studentCardUrl 
            ? `<div class="claim-id-card-section">
                 <label><i class="fa-solid fa-address-card"></i> Student Card Attachment:</label>
                 <div class="claim-id-card-preview">
                   <a href="${c.studentCardUrl}" target="_blank">
                     <img src="${c.studentCardUrl}" alt="Student ID verification card">
                   </a>
                 </div>
               </div>`
            : ''
          }

          <div class="claim-actions">
            <button class="btn btn-gradient btn-sm" onclick="dashboard.processClaimStatus('${c.id}', 'approved')"><i class="fa-solid fa-check"></i> Approve Claim</button>
            <button class="btn btn-secondary btn-sm text-danger" onclick="dashboard.processClaimStatus('${c.id}', 'rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
          </div>
        </div>
      `).join('');

    } catch (err) {
      list.innerHTML = `<div class="empty-state text-danger">Failed to retrieve claims: ${err.message}</div>`;
    }
  },

  async processClaimStatus(claimId, status) {
    const confirmation = confirm(`Are you sure you want to ${status} this claim request?`);
    if (!confirmation) return;

    try {
      await api.post(`/claims/${claimId}/status`, {
        status,
        userId: auth.currentUser.id,
        role: auth.currentUser.role
      });
      app.showToast(`Claim successfully ${status}!`, 'success');
      this.loadClaimsReceived();
    } catch (err) {
      app.showToast(err.message, 'danger');
    }
  },

  async loadClaimsSubmitted() {
    const tableBody = document.getElementById('dash-my-claims-table');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>`;

    try {
      const claims = await api.get('/my-claims', { userId: auth.currentUser.id });

      if (claims.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">You have not submitted any claim requests yet.</td></tr>`;
        return;
      }

      tableBody.innerHTML = claims.map(c => {
        let statusBadge = '';
        let actionBtn = '';
        
        if (c.status === 'pending') {
          statusBadge = '<span class="badge badge-found">Pending Review</span>';
          actionBtn = '<span class="text-muted">Awaiting finder approval</span>';
        } else if (c.status === 'approved') {
          statusBadge = '<span class="badge badge-claimed">Claim Approved</span>';
          actionBtn = `<button class="btn btn-gradient btn-sm" onclick="dashboard.openCoordinationChat('${c.itemId}', '${c.claimerId}')"><i class="fa-solid fa-comments"></i> Chat Finder</button>`;
        } else {
          statusBadge = '<span class="badge badge-lost">Declined</span>';
          actionBtn = '<span class="text-danger">Proof insufficient</span>';
        }

        return `
          <tr>
            <td><strong>${c.itemTitle}</strong></td>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Network Error: ${err.message}</td></tr>`;
    }
  },

  openCoordinationChat(itemId, claimerId) {
    // Switch to the messages tab - the chat system will load all rooms
    // and we try to auto-select the matching room
    const btn = document.querySelector('.dash-tab-btn[data-tab="messages"]');
    if (btn) btn.click();
    
    // After chat rooms load, try to find and select the correct room
    setTimeout(async () => {
      try {
        const rooms = await api.get('/chats', { userId: auth.currentUser.id });
        const matchingRoom = rooms.find(r => r.itemId === itemId);
        if (matchingRoom) {
          this.selectChatRoom(matchingRoom.roomId || matchingRoom.id);
        }
      } catch (err) {
        console.error('Failed to auto-select chat room:', err);
      }
    }, 500);
  },

  // --- MESSENGER MODULE ---

  async loadChatSystem() {
    const sidebar = document.getElementById('chat-rooms-list');
    if (!sidebar) return;

    sidebar.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;

    try {
      const rooms = await api.get('/chats', { userId: auth.currentUser.id });
      
      if (rooms.length === 0) {
        sidebar.innerHTML = `<div class="empty-state" style="padding: 20px;">No active coordination rooms yet. Coordinate safe pick-ups once claims are approved.</div>`;
        document.getElementById('active-chat-window').style.display = 'flex';
        document.getElementById('chat-window-content').style.display = 'none';
        return;
      }

      sidebar.innerHTML = rooms.map(room => {
        const participantName = auth.currentUser.id === room.claimerId ? room.reporterName : room.claimerName;
        const activeClass = this.activeChatRoomId === room.roomId ? 'active' : '';

        return `
          <div class="chat-room-row ${activeClass}" onclick="dashboard.selectChatRoom('${room.roomId}')">
            <h4>${room.itemTitle}</h4>
            <p><i class="fa-solid fa-circle-user"></i> ${participantName}</p>
          </div>
        `;
      }).join('');

      // Auto-select room if available or preserve active
      if (this.activeChatRoomId) {
        this.selectChatRoom(this.activeChatRoomId);
      } else {
        document.getElementById('active-chat-window').style.display = 'flex';
        document.getElementById('chat-window-content').style.display = 'none';
      }

    } catch (err) {
      sidebar.innerHTML = `<div class="empty-state text-danger">Failed loading chats: ${err.message}</div>`;
    }
  },

  async selectChatRoom(roomId) {
    this.activeChatRoomId = roomId;
    
    // Highlight sidebar row
    document.querySelectorAll('.chat-room-row').forEach(row => {
      row.classList.remove('active');
      // Check if this row's onclick contains the matching roomId
      const onclickAttr = row.getAttribute('onclick') || '';
      if (onclickAttr.includes(roomId)) {
        row.classList.add('active');
      }
    });

    document.getElementById('chat-empty-state').style.display = 'none';
    document.getElementById('chat-window-content').style.display = 'flex';

    await this.loadActiveChatMessages(true);

    // Setup active message polling (every 3 seconds)
    if (this.chatPollerInterval) clearInterval(this.chatPollerInterval);
    this.chatPollerInterval = setInterval(() => this.loadActiveChatMessages(false), 3000);
  },

  async loadActiveChatMessages(shouldScroll = false) {
    if (!this.activeChatRoomId) return;

    try {
      const room = await api.get(`/chats/${this.activeChatRoomId}`);
      
      const participantName = auth.currentUser.id === room.claimerId ? room.reporterName : room.claimerName;
      document.getElementById('chat-room-title').innerText = room.itemTitle;
      document.getElementById('chat-room-participant').innerHTML = `<i class="fa-solid fa-circle-user text-info"></i> Coordinate with: <strong>${participantName}</strong>`;

      // Inject the permanent deletion handover button in chat header!
      const header = document.querySelector('.chat-header');
      if (header) {
        // Remove existing button if present to prevent stacking
        const oldBtn = document.getElementById('btn-chat-complete-handover');
        if (oldBtn) oldBtn.remove();

        const completeBtn = document.createElement('button');
        completeBtn.id = 'btn-chat-complete-handover';
        completeBtn.className = 'btn btn-gradient btn-sm';
        completeBtn.style.marginLeft = 'auto';
        completeBtn.style.marginRight = '15px';
        completeBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Handover Complete & Remove Listing`;
        
        completeBtn.addEventListener('click', async () => {
          if (confirm('Confirm Handover: Have you successfully recovered or returned the item? This will permanently delete the item listing, claims, and close this chat room.')) {
            try {
              await api.delete(`/items/${room.itemId}`, { userId: auth.currentUser.id, role: auth.currentUser.role });
              app.showToast('Item successfully recovered! Active listing has been deleted permanently.', 'success');
              
              // Clear chat room state & switch to overview tab
              dashboard.activeChatRoomId = null;
              if (dashboard.chatPollerInterval) {
                clearInterval(dashboard.chatPollerInterval);
                dashboard.chatPollerInterval = null;
              }
              dashboard.switchTab('overview');
            } catch (err) {
              app.showToast(err.message, 'danger');
            }
          }
        });

        // Insert completeBtn right before the badge
        const badge = header.querySelector('.badge');
        header.insertBefore(completeBtn, badge);
      }

      const msgContainer = document.getElementById('chat-messages-container');
      const currentCount = msgContainer.children.length;
      
      if (room.messages.length === currentCount) return; // avoid redraw if no new messages

      msgContainer.innerHTML = room.messages.map(m => {
        let bubbleClass = 'incoming';
        if (m.senderId === auth.currentUser.id) bubbleClass = 'outgoing';
        if (m.senderId === 'system') bubbleClass = 'system';

        return `
          <div class="message-bubble ${bubbleClass}">
            ${m.senderId !== 'system' ? `<span class="message-sender">${m.senderName}</span>` : ''}
            <span>${m.text}</span>
            <span class="message-time">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        `;
      }).join('');

      if (shouldScroll || room.messages.length > currentCount) {
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }

    } catch (err) {
      console.error('Messenger failed fetching room messages:', err);
    }
  }
};
