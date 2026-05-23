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

    // --- RSVP Logic via WhatsApp ---
    window.sendRSVP = function(isAttending) {
        // We use Anusha's number by default for RSVPs
        const phoneNumber = "94772422456"; 
        const nameParam = guestName ? decodeURIComponent(guestName) : "A Guest";
        
        let message = "";
        if (isAttending) {
            message = `Hi Anusha, ${nameParam} will be attending the wedding! We can't wait!`;
        } else {
            message = `Hi Anusha, ${nameParam} unfortunately won't be able to make it to the wedding. Wishing you both the best!`;
        }
        
        const encodedMessage = encodeURIComponent(message);
        const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        window.open(waUrl, '_blank');
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
            
            // Staggered reveal for text elements
            revealElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('visible');
                }, 300 + (index * 150)); // Base delay + staggered delay
            });

        }, 700); // matches CSS transition duration
    });
});
