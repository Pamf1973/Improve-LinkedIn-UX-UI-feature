const mockJobs = [
    {
        id: 1,
        title: "Senior Product Designer",
        company: "Innovate Corp",
        logo: "https://logo.clearbit.com/innovatecorp.com?size=100&fallback=https://via.placeholder.com/100/0077b5/ffffff?text=I",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
        location: "New York, NY (Hybrid)",
        salary: "$140K - $180K",
        match: 95,
        snippet: "Innovate Corp is searching for a talented Senior Designer to lead our end-to-end UI/UX design for our flagship products.",
        description: "Innovate Corp is searching for a talented Senior Designer to lead our end-to-end UI/UX design for our flagship products. You'll define user flows, create wireframes, and build UI kits.\n\n### Responsibilities\n- Design world-class interfaces for fintech applications.\n- Collaborate with product managers and engineers.\n- Lead design systems across 4 product lines.",
        skills: ["Figma", "Design Systems", "Product Strategy"]
    },
    {
        id: 2,
        title: "Senior UI/UX Designer",
        company: "TikTok",
        logo: "https://logo.clearbit.com/tiktok.com?size=100",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600",
        location: "Los Angeles, CA (Remote)",
        salary: "$120K - $160K",
        match: 92,
        snippet: "Join TikTok's global design team to shape the future of digital entertainment.",
        description: "Join TikTok's global design team to shape the future of digital entertainment. We are looking for high-velocity designers who can iterate quickly and love bold aesthetics.\n\n### What we look for\n- 5+ years of experience in product design.\n- Strong visual design portfolio.\n- Experience with motion design is a plus.",
        skills: ["Motion Design", "Visual Design", "Prototyping"]
    },
    {
        id: 3,
        title: "Staff Product Designer",
        company: "Stripe",
        logo: "https://logo.clearbit.com/stripe.com?size=100",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
        location: "San Francisco, CA (Remote)",
        salary: "$180K - $220K",
        match: 88,
        snippet: "Stripe is looking for a Staff Designer to work on our core financial products.",
        description: "Stripe is looking for a Staff Designer to work on our core financial products. You will be responsible for the end-to-end experience of millions of merchants.\n\n### Impact\n- Simplify complex financial workflows.\n- Set the bar for design quality at Stripe.\n- Mentor other designers in the organization.",
        skills: ["Systems Thinking", "Fintech", "UX Research"]
    },
    {
        id: 4,
        title: "Senior Backend Developer",
        company: "Netflix",
        logo: "https://logo.clearbit.com/netflix.com?size=100",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
        location: "Los Gatos, CA (Hybrid)",
        salary: "$200K - $350K",
        match: 85,
        snippet: "Help us build the next generation of streaming infrastructure at massive scale.",
        description: "Netflix's backend engineers work on some of the most challenging distributed systems problems in the world.\n\n### Tech Stack\n- Java, Spring Boot, AWS.\n- Microservices architecture.\n- Cassandra and Redis.",
        skills: ["Java", "Distributed Systems", "AWS"]
    }
];

class CardStack {
    constructor(container, jobs) {
        this.container = container;
        this.jobs = [...jobs];
        this.totalJobs = jobs.length;
        this.currentIndex = 0;
        this.isModalOpen = false;

        this.init();
    }

    init() {
        this.render();
        this.updateProgress();
        this.initModal();
    }

    updateProgress() {
        const progressBar = document.getElementById('stack-progress');
        const percentage = (this.currentIndex / this.totalJobs) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    initModal() {
        const modal = document.getElementById('details-modal');
        const closeBtn = document.querySelector('.close-modal');
        const overlay = document.querySelector('.modal-overlay');

        const closeModal = () => {
            modal.classList.remove('active');
            this.isModalOpen = false;
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }

    openDetails(job) {
        const modal = document.getElementById('details-modal');
        const body = document.getElementById('modal-body');

        body.innerHTML = `
            <div class="company-logo-wrapper" style="margin-bottom: 1rem;">
                <img src="${job.logo}" class="company-logo" alt="${job.company}">
            </div>
            <h1 class="job-title" style="font-size: 1.8rem; margin-bottom: 0.5rem;">${job.title}</h1>
            <div class="company-name" style="font-size: 1.1rem; margin-bottom: 1rem;">${job.company}</div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="location-tag"><i class="fas fa-map-marker-alt"></i> ${job.location}</div>
                <div class="salary-tag" style="color: var(--success);">${job.salary}</div>
            </div>

            <div class="details-section-title">Match Analysis</div>
            <div style="background: var(--glass); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid var(--glass-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span>Skills Match</span>
                    <span style="color: var(--success); font-weight: 700;">${job.match}%</span>
                </div>
                <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                    <div style="width: ${job.match}%; height: 100%; background: var(--success); border-radius: 3px;"></div>
                </div>
            </div>

            <div class="details-section-title">Job Description</div>
            <div class="details-full-text">
                ${job.description.replace(/\n\n/g, '<br><br>').replace(/### (.*)/g, '<h3 class="details-section-title">$1</h3>')}
            </div>

            <div class="details-section-title">Required Skills</div>
            <div class="skills-tags" style="margin-top: 0.5rem;">
                ${job.skills.map(skill => `<span class="skill-tag" style="font-size: 0.9rem; padding: 0.5rem 1rem;">${skill}</span>`).join('')}
            </div>
        `;

        modal.classList.add('active');
        this.isModalOpen = true;
    }

    render() {
        this.container.innerHTML = '';
        if (this.currentIndex >= this.jobs.length) {
            this.container.innerHTML = `
                <div class="stack-placeholder">
                    <h2>You're all caught up!</h2>
                    <p style="margin: 1rem 0;">You've reviewed all the top matches for today.</p>
                    <button class="retry-btn" onclick="location.reload()">Refresh Stack</button>
                </div>
            `;
            this.updateProgress();
            return;
        }

        // Render top 3 cards for stack visual
        for (let i = Math.min(this.currentIndex + 2, this.jobs.length - 1); i >= this.currentIndex; i--) {
            this.createCard(this.jobs[i], i === this.currentIndex);
        }
    }

    createCard(job, isTop) {
        const card = document.createElement('div');
        card.className = 'job-card';

        const indexInStack = this.jobs.indexOf(job) - this.currentIndex;
        card.style.zIndex = 100 - indexInStack;

        const scale = 1 - indexInStack * 0.05;
        const translateY = indexInStack * 15;

        if (!isTop) {
            card.style.transform = `translateY(${translateY}px) scale(${scale})`;
            card.style.opacity = 1 - indexInStack * 0.3;
        }

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${job.image}" class="card-image" alt="Office">
                <div class="match-badge">
                    ${job.match}%
                    <span>Match</span>
                </div>
                <div class="card-metadata-overlay">
                    <div class="salary-tag">${job.salary}</div>
                    <div class="location-tag"><i class="fas fa-map-marker-alt"></i> ${job.location}</div>
                </div>
            </div>
            <div class="card-body" onclick="this.parentElement.dispatchEvent(new CustomEvent('card-tap'))">
                <div class="company-logo-wrapper">
                    <img src="${job.logo}" class="company-logo" alt="${job.company}">
                </div>
                <h2 class="job-title">${job.title}</h2>
                <div class="company-name">${job.company}</div>
                <p class="job-snippet">${job.snippet}</p>
                <div class="skills-tags">
                    ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;

        this.container.appendChild(card);

        if (isTop) {
            this.makeDraggable(card, job);
            this.topCard = card;

            card.addEventListener('card-tap', () => {
                if (!this.swipeStarted) {
                    this.openDetails(job);
                }
            });
        }
    }

    makeDraggable(card, job) {
        let isDragging = false;
        let startX, startY, currentX, currentY;
        const threshold = 100;
        this.swipeStarted = false;

        const onStart = (e) => {
            if (this.isModalOpen) return;
            isDragging = true;
            this.swipeStarted = false;
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            card.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            const dx = currentX - startX;
            const dy = currentY - startY;

            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                this.swipeStarted = true;
            }

            const rotation = dx / 15;
            card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`;

            this.updateOverlay(dx, dy);
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            const dx = (currentX || startX) - startX;
            const dy = (currentY || startY) - startY;

            this.hideOverlay();

            if (Math.abs(dx) > threshold) {
                this.swipe(dx > 0 ? 'right' : 'left');
            } else if (dy > threshold) {
                this.swipe('down');
            } else {
                card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                card.style.transform = '';
                setTimeout(() => { this.swipeStarted = false; }, 100);
            }
        };

        card.addEventListener('mousedown', onStart);
        card.addEventListener('touchstart', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    }

    updateOverlay(dx, dy) {
        const overlay = document.getElementById('status-overlay');
        const icon = document.getElementById('status-icon');
        const text = document.getElementById('status-text');

        let show = false;
        let opacity = 0;

        if (dx > 50) {
            overlay.style.backgroundColor = 'rgba(5, 174, 96, 0.6)';
            icon.className = 'fas fa-heart';
            text.innerText = 'Save';
            show = true;
            opacity = Math.min(dx / 150, 1);
        } else if (dx < -50) {
            overlay.style.backgroundColor = 'rgba(231, 76, 60, 0.6)';
            icon.className = 'fas fa-times';
            text.innerText = 'Skip';
            show = true;
            opacity = Math.min(Math.abs(dx) / 150, 1);
        } else if (dy > 50) {
            overlay.style.backgroundColor = 'rgba(155, 89, 182, 0.6)';
            icon.className = 'fas fa-archive';
            text.innerText = 'Archive';
            show = true;
            opacity = Math.min(dy / 150, 1);
        }

        overlay.style.opacity = show ? opacity : 0;
        overlay.style.transform = `translate(-50%, -50%) scale(${show ? 0.8 + opacity * 0.4 : 0.8})`;
    }

    hideOverlay() {
        const overlay = document.getElementById('status-overlay');
        overlay.style.opacity = 0;
        overlay.style.transform = `translate(-50%, -50%) scale(0.8)`;
    }

    swipe(direction) {
        const card = this.topCard;
        if (!card) return;

        let transform = '';
        if (direction === 'right') transform = 'translate(150%, 0) rotate(20deg)';
        if (direction === 'left') transform = 'translate(-150%, 0) rotate(-20deg)';
        if (direction === 'down') transform = 'translate(0, 150%)';

        card.style.transition = 'transform 0.5s ease-in, opacity 0.5s';
        card.style.transform = transform;
        card.style.opacity = '0';

        // Haptic feedback simulation
        if (window.navigator.vibrate) {
            window.navigator.vibrate(20);
        }

        setTimeout(() => {
            this.currentIndex++;
            this.render();
            this.updateProgress();
        }, 300);
    }
}

// Initialize Stack
document.addEventListener('DOMContentLoaded', () => {
    const stackContainer = document.getElementById('card-stack');
    const stack = new CardStack(stackContainer, mockJobs);

    // Button Bindings
    document.getElementById('btn-left').addEventListener('click', () => stack.swipe('left'));
    document.getElementById('btn-right').addEventListener('click', () => stack.swipe('right'));
    document.getElementById('btn-down').addEventListener('click', () => stack.swipe('down'));

    // Space/Arrow Key Bindings
    document.addEventListener('keydown', (e) => {
        if (stack.isModalOpen) return;
        if (e.key === 'ArrowRight') stack.swipe('right');
        if (e.key === 'ArrowLeft') stack.swipe('left');
        if (e.key === 'ArrowDown') stack.swipe('down');
    });
});
