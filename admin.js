document.addEventListener('DOMContentLoaded', () => {
    
    // Sections
    const metricsSection = document.getElementById('metricsSection');
    const guestListSection = document.getElementById('guestListSection');
    const settingsSection = document.getElementById('settingsSection');
    
    // Metrics
    const metricTotalGuests = document.getElementById('metricTotalGuests');
    const metricInvitesSent = document.getElementById('metricInvitesSent');
    const metricRSVPs = document.getElementById('metricRSVPs');
    
    const guestTableBody = document.getElementById('guestTableBody');
    const messageTemplateInput = document.getElementById('messageTemplate');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const syncIcon = document.getElementById('syncIcon');

    let parsedData = [];

    // Default message template
    const defaultMessage = "Hi {name},\n\nMr. & Mrs. Chandrasiri and Mr. & Mrs. Jayasinghe cordially invite you to the wedding of Anusha & Tharaka on July 04, 2026.\n\nPlease view your formal invitation here:\n{link}";
    messageTemplateInput.value = defaultMessage;

    window.fetchDataFromSheet = async function() {
        if (!API_URL) {
            alert("Please paste your Google Apps Script Web App URL into config.js first!");
            return;
        }

        syncIcon.classList.add('animate-spin');

        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            
            if (data.error) {
                alert("Error from sheet: " + data.error);
                return;
            }
            
            parsedData = data.map((guest, index) => ({
                id: index + 1,
                name: guest.name.trim(),
                phone: guest.phone ? String(guest.phone).replace(/[^0-9+]/g, '') : '',
                originalPhone: guest.phone,
                status: guest.status || 'Pending',
                sent: guest.sent === true
            }));

            updateMetrics();
            renderTable();
            
            metricsSection.style.display = 'grid';
            guestListSection.style.display = 'block';
            settingsSection.style.display = 'block';
            showToast(`Successfully synced ${parsedData.length} guests.`);
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Failed to fetch data. Make sure the API_URL is correct and deployed as 'Anyone'.");
        } finally {
            syncIcon.classList.remove('animate-spin');
        }
    };

    function renderTable() {
        guestTableBody.innerHTML = '';

        parsedData.forEach((guest, index) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition-colors';
            
            const invitationLink = getInvitationLink(guest.name);
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-slate-900">${guest.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-500">${guest.originalPhone || '<span class="text-rose-400 italic">No number</span>'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select onchange="updateRSVP(${index}, this.value)" class="text-sm rounded-lg border-slate-300 py-1.5 pl-3 pr-8 focus:ring-[#a37c35] focus:border-[#a37c35] ${getStatusColor(guest.status)}">
                        <option value="Pending" ${guest.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Attending" ${guest.status === 'Attending' ? 'selected' : ''}>Attending</option>
                        <option value="Declined" ${guest.status === 'Declined' ? 'selected' : ''}>Declined</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="copyLink('${invitationLink}')" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Copy Link">
                            <i class="ph ph-link text-lg"></i>
                        </button>
                        <button onclick="sendWhatsApp(${index})" class="flex items-center gap-1.5 px-3 py-1.5 ${guest.sent ? 'bg-slate-200 text-slate-600' : 'bg-[#25D366] text-white hover:bg-[#1DA851]'} rounded-lg transition-colors font-medium shadow-sm">
                            <i class="ph-fill ph-whatsapp-logo text-lg"></i>
                            <span>${guest.sent ? 'Resend' : 'Send'}</span>
                        </button>
                    </div>
                </td>
            `;
            guestTableBody.appendChild(tr);
        });
    }

    function getStatusColor(status) {
        if(status === 'Attending') return 'bg-emerald-50 text-emerald-700 font-medium';
        if(status === 'Declined') return 'bg-rose-50 text-rose-700 font-medium';
        return 'bg-slate-50 text-slate-600';
    }

    window.updateRSVP = async function(index, newStatus) {
        const guest = parsedData[index];
        guest.status = newStatus;
        updateMetrics();
        renderTable(); 

        if (API_URL) {
            try {
                // Send update to Google Sheet
                await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'updateRSVP', name: guest.name, status: newStatus })
                });
                showToast("RSVP saved to Google Sheets");
            } catch (e) {
                console.error(e);
            }
        }
    };

    function updateMetrics() {
        metricTotalGuests.textContent = parsedData.length;
        
        const sentCount = parsedData.filter(g => g.sent).length;
        metricInvitesSent.textContent = sentCount;
        
        const attendingCount = parsedData.filter(g => g.status === 'Attending').length;
        metricRSVPs.textContent = attendingCount;
    }

    function getInvitationLink(guestName) {
        // Use SITE_BASE_URL from config.js (GitHub Pages URL)
        const baseUrl = (typeof SITE_BASE_URL !== 'undefined' && SITE_BASE_URL)
            ? SITE_BASE_URL
            : window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');

        const url = new URL(`${baseUrl}/invitation.html`);
        url.searchParams.append('name', guestName);
        return url.toString();
    }

    window.copyLink = function(link) {
        navigator.clipboard.writeText(link).then(() => {
            showToast("Invitation link copied!");
        }).catch(err => {
            prompt("Copy this link:", link);
        });
    };

    window.sendWhatsApp = async function(index) {
        const guest = parsedData[index];
        const link = getInvitationLink(guest.name);
        let message = messageTemplateInput.value;
        
        message = message.replace(/{name}/g, guest.name);
        message = message.replace(/{link}/g, link);
        
        const encodedMessage = encodeURIComponent(message);
        
        let waUrl = guest.phone 
            ? `https://wa.me/${guest.phone}?text=${encodedMessage}` 
            : `https://wa.me/?text=${encodedMessage}`;
        
        window.open(waUrl, '_blank');
        
        // Mark as sent
        if(!guest.sent) {
            guest.sent = true;
            updateMetrics();
            renderTable();

            if (API_URL) {
                try {
                    await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: 'updateSent', name: guest.name })
                    });
                } catch(e) {
                    console.error(e);
                }
            }
        }
    };

    window.exportToCSV = function() {
        if(parsedData.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Name,Phone,RSVP Status,Invite Sent\n";
        
        parsedData.forEach(row => {
            const name = `"${row.name.replace(/"/g, '""')}"`;
            const phone = row.originalPhone || '';
            const status = row.status;
            const sent = row.sent ? "Yes" : "No";
            
            csvContent += `${name},${phone},${status},${sent}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "guest_list_rsvps.csv");
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        showToast("Exported to CSV successfully.");
    };

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
});
