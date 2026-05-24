document.addEventListener('DOMContentLoaded', () => {
    
    // --- Extract Guest Name from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get('name');
    
    // Update the DOM
    const nameDisplay = document.getElementById('guestNameDisplay');
    if (nameDisplay && guestName) {
        // Decode URI component and format
        nameDisplay.textContent = decodeURIComponent(guestName).toUpperCase();
    }

    // --- Countdown Timer Logic ---
    const targetDate = new Date('July 4, 2026 17:30:00').getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            document.getElementById('cd-days').textContent = "00";
            document.getElementById('cd-hours').textContent = "00";
            document.getElementById('cd-minutes').textContent = "00";
            document.getElementById('cd-seconds').textContent = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('cd-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('cd-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('cd-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('cd-seconds').textContent = seconds.toString().padStart(2, '0');
    };

    // Update every second
    setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call

    // --- RSVP Logic via Google Sheets ---
    window.sendRSVP = async function(isAttending) {
        const nameParam = guestName ? decodeURIComponent(guestName) : "Unknown Guest";
        const status = isAttending ? "Attending" : "Declined";
        
        const btnAttending = document.getElementById('btnAttending');
        const btnDeclined = document.getElementById('btnDeclined');
        const rsvpMessage = document.getElementById('rsvpMessage');
        const buttonsContainer = document.getElementById('rsvpButtons');
        
        // Visual feedback
        if(btnAttending) btnAttending.disabled = true;
        if(btnDeclined) btnDeclined.disabled = true;
        
        if (!API_URL) {
            // Fallback to WhatsApp if API is not configured
            const phoneNumber = "94772422456"; 
            let message = isAttending 
                ? `Hi Anusha, ${nameParam} will be attending the wedding! We can't wait!`
                : `Hi Anusha, ${nameParam} unfortunately won't be able to make it to the wedding. Wishing you both the best!`;
            const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
            if(buttonsContainer) buttonsContainer.style.display = 'none';
            if(rsvpMessage) rsvpMessage.classList.remove('hidden');
            return;
        }

        try {
            if(isAttending) {
                btnAttending.textContent = "Sending...";
            } else {
                btnDeclined.textContent = "Sending...";
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'updateRSVP', name: nameParam, status: status })
            });
            
            const result = await response.json();
            if (result.success) {
                if(buttonsContainer) buttonsContainer.style.display = 'none';
                if(rsvpMessage) {
                    rsvpMessage.classList.remove('hidden');
                    rsvpMessage.textContent = "Thank you! Your RSVP has been saved.";
                }
            } else {
                alert("Sorry, there was an error saving your RSVP. Please contact Anusha.");
                if(btnAttending) { btnAttending.disabled = false; btnAttending.textContent = "Attending"; }
                if(btnDeclined) { btnDeclined.disabled = false; btnDeclined.textContent = "Not Attending"; }
            }
        } catch (error) {
            console.error(error);
            alert("Network error. Please try again.");
            if(btnAttending) { btnAttending.disabled = false; btnAttending.textContent = "Attending"; }
            if(btnDeclined) { btnDeclined.disabled = false; btnDeclined.textContent = "Not Attending"; }
        }
    };

    // --- Background Music Logic ---
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    let isMusicPlaying = false;

    window.toggleMusic = function() {
        if (!bgMusic) return;
        if (isMusicPlaying) {
            bgMusic.pause();
            isMusicPlaying = false;
            if (musicToggle) {
                musicToggle.innerHTML = '<i class="ph ph-speaker-slash text-lg"></i>';
                musicToggle.classList.remove('animate-pulse');
            }
        } else {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                if (musicToggle) {
                    musicToggle.innerHTML = '<i class="ph ph-speaker-high text-lg"></i>';
                    musicToggle.classList.add('animate-pulse');
                }
            }).catch(err => console.error("Error playing music:", err));
        }
    };

    // --- Interaction & Reveal Logic ---
    const envelope = document.getElementById('envelope');
    const invitationContent = document.getElementById('invitationContent');
    const revealElements = document.querySelectorAll('.reveal-text');

    envelope.addEventListener('click', () => {
        // Hide envelope
        envelope.classList.add('opening');
        
        // After envelope animation completes, show content
        setTimeout(() => {
            envelope.style.display = 'none';
            invitationContent.classList.remove('hidden');
            // Trigger reflow
            void invitationContent.offsetWidth; 
            invitationContent.classList.add('active');
            
            // Show music button and start playing
            if (musicToggle) {
                musicToggle.classList.remove('hidden');
            }
            if (bgMusic) {
                bgMusic.play().then(() => {
                    isMusicPlaying = true;
                    if (musicToggle) {
                        musicToggle.innerHTML = '<i class="ph ph-speaker-high text-lg"></i>';
                        musicToggle.classList.add('animate-pulse');
                    }
                }).catch(err => {
                    console.log("Autoplay blocked or audio missing:", err);
                    // If blocked/missing, keep button visible but in muted icon state so they can click it manually
                    if (musicToggle) {
                        musicToggle.innerHTML = '<i class="ph ph-speaker-slash text-lg"></i>';
                    }
                });
            }

            // Staggered reveal for text elements
            revealElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('visible');
                }, 300 + (index * 150)); // Base delay + staggered delay
            });

        }, 700); // matches CSS transition duration
    });
});
