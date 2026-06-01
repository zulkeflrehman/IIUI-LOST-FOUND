// Admin Controls Module - e-Lost & Found System
const admin = {
  initialize() {
    // Only load if authorized as admin
    if (auth.currentUser && auth.currentUser.role === 'admin') {
      this.loadDashboardData();
    }
  },

  async loadDashboardData() {
    const statsGrid = document.getElementById('admin-moderation-table');
    if (!statsGrid) return;

    statsGrid.innerHTML = `<tr><td colspan="6" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Fetching reports...</td></tr>`;

    try {
      // 1. Fetch system metrics
      const stats = await api.get('/admin/stats');
      
      document.getElementById('admin-stat-total').innerText = stats.totalItems;
      document.getElementById('admin-stat-lost').innerText = stats.lostCount;
      document.getElementById('admin-stat-found').innerText = stats.foundCount;
      document.getElementById('admin-stat-recovered').innerText = `${stats.recoveryRate}%`;

      // 2. Fetch all reports for queue moderation
      const reports = await api.get('/items');

      if (reports.length === 0) {
        statsGrid.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No items in the moderation queue.</td></tr>`;
        return;
      }

      statsGrid.innerHTML = reports.map(item => {
        const badgeTypeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
        const badgeStatusClass = item.status === 'claimed' ? 'badge-claimed' : (item.status === 'lost' ? 'badge-lost' : 'badge-found');

        return `
          <tr>
            <td><strong>${item.title}</strong></td>
            <td>${item.reporterName} (${item.reporterEmail})</td>
            <td><span class="badge ${badgeTypeClass}">${item.type.toUpperCase()}</span></td>
            <td>${item.location}</td>
            <td><span class="badge ${badgeStatusClass}">${item.status.toUpperCase()}</span></td>
            <td>
              <div style="display: flex; gap: 8px;">
                <a href="#items?id=${item.id}" class="btn btn-secondary btn-sm"><i class="fa-solid fa-eye"></i> View</a>
                <button class="btn btn-secondary btn-sm text-danger" onclick="admin.deleteItemByForce('${item.id}')">
                  <i class="fa-solid fa-trash-can"></i> Force Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      statsGrid.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Network Error: ${err.message}</td></tr>`;
    }
  },

  async deleteItemByForce(id) {
    if (!confirm('ADMIN SECURITY WARNING: Force deleting this item will delete all student records, chatrooms, and claims associated with it. Proceed?')) return;

    try {
      await api.delete(`/items/${id}`, { userId: auth.currentUser.id, role: auth.currentUser.role });
      app.showToast('Listing moderated and removed successfully', 'success');
      this.loadDashboardData(); // reload
    } catch (err) {
      app.showToast(err.message, 'danger');
    }
  }
};
