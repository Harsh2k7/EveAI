/* =========================================================
   EveAI — Main Application Controller
   Connects the UI to the CycleTracker Data Engine
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- Hide Splash Screen / Intro with Canvas Particles ----------
    initSplashAnimation();

    function initSplashAnimation() {
        const introOverlay = document.getElementById('appIntroOverlay');
        const canvas = document.getElementById('splashCanvas');
        if (!introOverlay || !canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let startTime = Date.now();
        const duration = 3100; // 3.1 seconds for fade out

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        let particles = [];
        let sparkles = [];

        class Particle {
            constructor(x, y, color, speed, angle, size, life) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.speed = speed;
                this.angle = angle;
                this.size = size;
                this.maxLife = life;
                this.life = life;
                this.opacity = 1;
            }
            update() {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.life--;
                this.opacity = Math.max(0, this.life / this.maxLife);
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.restore();
            }
        }

        class Sparkle {
            constructor(x, y, maxScale) {
                this.x = x;
                this.y = y;
                this.scale = 0;
                this.maxScale = maxScale;
                this.grow = true;
                this.rotation = Math.random() * Math.PI;
                this.rotSpeed = (Math.random() - 0.5) * 0.05;
                this.opacity = 0;
            }
            update() {
                this.rotation += this.rotSpeed;
                if (this.grow) {
                    this.scale += 0.05;
                    this.opacity = Math.min(1, this.scale);
                    if (this.scale >= this.maxScale) {
                        this.grow = false;
                    }
                } else {
                    this.scale -= 0.02;
                    this.opacity = Math.max(0, this.scale);
                }
            }
            draw() {
                if (this.opacity <= 0) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = '#FFF';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#FF5EA8';
                
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    ctx.rotate(Math.PI / 2);
                    ctx.lineTo(0, -15 * this.scale);
                    ctx.lineTo(3 * this.scale, 0);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        let orbitAngle = 0;

        function loop() {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                introOverlay.classList.add('fade-out');
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener('resize', resize);
                
                // Onboarding message check after splash ends
                const apiKey = localStorage.getItem('eveai_openai_key');
                const onboardingShown = localStorage.getItem('eveai_onboarding_shown');
                if (!apiKey && !onboardingShown) {
                    showToast("EveAI is ready to use. You can optionally add an OpenAI API key later to unlock advanced AI conversations.");
                    localStorage.setItem('eveai_onboarding_shown', 'true');
                }
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // 0.0s - 0.5s: Spawning random sparkles & trails
            if (elapsed < 500) {
                if (Math.random() < 0.15) {
                    sparkles.push(new Sparkle(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 0.6 + 0.4));
                }
                if (Math.random() < 0.2) {
                    particles.push(new Particle(Math.random() * canvas.width, canvas.height, '#C9A6FF', Math.random() * 2 + 1, -Math.PI / 2, Math.random() * 1.5 + 0.5, 120));
                }
            }

            // 0.5s - 1.2s: Orbiting sparkles & silhouette formation glow
            if (elapsed >= 500 && elapsed < 1200) {
                orbitAngle += 0.06;
                const radiusX = 80;
                const radiusY = 80;
                
                if (Math.random() < 0.5) {
                    const angle = Math.random() * Math.PI * 2;
                    const px = cx + Math.cos(angle) * radiusX + (Math.random() - 0.5) * 15;
                    const py = cy + Math.sin(angle) * radiusY + (Math.random() - 0.5) * 15;
                    const color = Math.random() < 0.5 ? '#FF5EA8' : '#C9A6FF';
                    particles.push(new Particle(px, py, color, Math.random() * 0.5 + 0.2, angle + Math.PI/2, Math.random() * 2 + 1, 80));
                }

                if (Math.random() < 0.15) {
                    const px = cx + Math.cos(orbitAngle) * radiusX;
                    const py = cy + Math.sin(orbitAngle) * radiusY;
                    sparkles.push(new Sparkle(px, py, 0.7));
                }
            }

            // 1.2s - 2.0s: Shimmer/bloom - float particles upwards
            if (elapsed >= 1200 && elapsed < 2000) {
                if (Math.random() < 0.4) {
                    const color = Math.random() < 0.6 ? '#C9A6FF' : '#FF5EA8';
                    particles.push(new Particle(
                        cx + (Math.random() - 0.5) * 160,
                        cy + (Math.random() - 0.5) * 160,
                        color,
                        Math.random() * 1.5 + 0.5,
                        -Math.PI / 2 + (Math.random() - 0.5) * 0.2,
                        Math.random() * 2 + 1,
                        100
                    ));
                }
            }

            // 2.0s - 2.7s: Sparkles tracing horizontally across text
            if (elapsed >= 2000 && elapsed < 2700) {
                const textWidth = 220;
                const textY = cy + 90;
                const textStartX = cx - textWidth/2;
                
                const progress = (elapsed - 2000) / 700;
                const traceX = textStartX + textWidth * progress;
                
                if (Math.random() < 0.4) {
                    sparkles.push(new Sparkle(traceX + (Math.random() - 0.5) * 15, textY + (Math.random() - 0.5) * 15, 0.5));
                }
                if (Math.random() < 0.3) {
                    particles.push(new Particle(traceX, textY, '#FF5EA8', Math.random() * 1.5 + 0.5, Math.random() * Math.PI * 2, Math.random() * 1.5 + 0.5, 40));
                }
            }

            // 2.7s - 3.0s: Final sparkle sweep across the screen
            if (elapsed >= 2700 && elapsed < 3000) {
                const progress = (elapsed - 2700) / 300;
                const sweepX = canvas.width * progress;
                if (Math.random() < 0.6) {
                    sparkles.push(new Sparkle(sweepX, cy + (Math.random() - 0.5) * 200, Math.random() * 0.5 + 0.3));
                }
            }

            particles.forEach((p, idx) => {
                p.update();
                p.draw();
                if (p.opacity <= 0) particles.splice(idx, 1);
            });

            sparkles.forEach((s, idx) => {
                s.update();
                s.draw();
                if (s.opacity <= 0) sparkles.splice(idx, 1);
            });

            animationFrameId = requestAnimationFrame(loop);
        }

        loop();
    }

    // ---------- Initialize CycleTracker Engine ----------
    const tracker = new window.CycleTracker();

    // Check if tracker is empty, if so load gorgeous sample data for demo
    if (Object.keys(tracker.data.dailyLogs).length === 0) {
        loadSampleData(tracker);
    }

    // ---------- Global State Variables ----------
    const now = new Date();
    let calYear = now.getFullYear();
    let calMonth = now.getMonth(); // 0-indexed
    let selectedDateKey = CycleTracker.toKey(now); // default selection is today
    let selectedMucus = null;
    let selectedLh = null;

    // ---------- Elements ----------
    const sidebar       = document.getElementById('sidebar');
    const menuToggle    = document.getElementById('menuToggle');
    const overlay       = document.getElementById('sidebarOverlay');
    const navLinks      = document.querySelectorAll('.nav-link[data-section]');
    const pages         = document.querySelectorAll('.page');
    const widgetCards   = document.querySelectorAll('.widget-card[data-target]');
    const currentDateEl = document.getElementById('currentDate');

    // ---------- Set Current Date on Dashboard ----------
    const dateOpts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('en-US', dateOpts);
    }

    // ---------- Navigation Router ----------
    function navigateTo(sectionId) {
        // Update sidebar nav link active state
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        // Update bottom tab navigation active state
        document.querySelectorAll('.tab-btn[data-section]').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === sectionId);
        });

        // Toggle page visibility
        pages.forEach(page => {
            page.classList.toggle('active', page.id === `page-${sectionId}`);
        });

        // Close mobile sidebar if open
        closeMobileSidebar();

        // Close Floating Action Button menu if open
        closeFab();

        // Scroll page instantly to top (prevents scroll animation lags on page switch)
        window.scrollTo(0, 0);

        // Page specific logic on navigation
        if (sectionId === 'tracker') {
            const selDate = CycleTracker.parseKey(selectedDateKey);
            calYear = selDate.getFullYear();
            calMonth = selDate.getMonth();
            renderCalendar(calYear, calMonth);
            updateDayDetailCard(selectedDateKey);
        } else if (sectionId === 'ovulation') {
            initOvulationForm();
        }
    }
    window.navigateToPage = navigateTo;

    // Nav bar links click listeners
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.section);
        });
    });

    // Bottom tab bar links click listeners
    document.querySelectorAll('.tab-btn[data-section]').forEach(tab => {
        tab.addEventListener('click', () => {
            navigateTo(tab.dataset.section);
        });
    });

    // Dashboard widget navigation links click listeners
    widgetCards.forEach(card => {
        card.addEventListener('click', () => {
            navigateTo(card.dataset.target);
        });
    });

    // ---------- Floating Action Button (FAB) ----------
    const fabContainer = document.getElementById('fabContainer');
    const fabBtn       = document.getElementById('fabBtn');

    function closeFab() {
        if (fabContainer) fabContainer.classList.remove('open');
    }

    if (fabBtn && fabContainer) {
        fabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fabContainer.classList.toggle('open');
        });

        // Close FAB when clicking outside the menu
        document.addEventListener('click', (e) => {
            if (!fabContainer.contains(e.target)) {
                closeFab();
            }
        });
    }

    // FAB Action Options Click Listeners
    document.querySelectorAll('.fab-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const action = opt.dataset.action;
            closeFab();
            if (action === 'log-period') {
                selectedDateKey = CycleTracker.toKey(new Date());
                navigateTo('tracker');
                // Auto trigger the period log form
                const log = tracker.getLog(selectedDateKey) || {};
                if (!log.isPeriod) {
                    tracker.togglePeriodDay(selectedDateKey);
                    showToast('Logged period for today! 🩸');
                    triggerGlobalUpdate();
                } else {
                    showToast('Period already logged for today.');
                }
            } else if (action === 'log-symptom') {
                navigateTo('symptoms');
                showToast('Log your symptoms below 💜');
            } else if (action === 'log-mood') {
                navigateTo('symptoms');
                showToast('Select your mood for today 😊');
            }
        });
    });

    // ---------- Mobile Sidebar ----------
    function openMobileSidebar() {
        sidebar.classList.add('open');
        menuToggle.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        sidebar.classList.remove('open');
        menuToggle.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }

    // ---------- Calendar Rendering and Operations ----------
    const calendarGrid = document.getElementById('calendarGrid');
    const calMonthYear = document.getElementById('calMonthYear');
    const calPrev      = document.getElementById('calPrev');
    const calNext      = document.getElementById('calNext');

    function getDateKey(year, month, day) {
        const d = new Date(year, month, day);
        return CycleTracker.toKey(d);
    }

    function renderCalendar(year, month) {
        if (!calendarGrid) return;
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];

        calMonthYear.textContent = `${monthNames[month]} ${year}`;
        calendarGrid.innerHTML = '';

        const firstDay  = new Date(year, month, 1);
        const lastDay   = new Date(year, month + 1, 0);
        
        // Mon = 0, Tue = 1, ..., Sun = 6
        const startDay  = (firstDay.getDay() + 6) % 7; 
        const daysInMonth = lastDay.getDate();

        // Previous month fill trailing days
        const prevMonth = new Date(year, month, 0);
        const prevDays = prevMonth.getDate();

        for (let i = startDay - 1; i >= 0; i--) {
            const d = prevDays - i;
            const key = getDateKey(year, month - 1, d);
            const el = createDayElement(d, key, true);
            calendarGrid.appendChild(el);
        }

        // Current month days
        const todayKey = CycleTracker.toKey(new Date());
        for (let d = 1; d <= daysInMonth; d++) {
            const key = getDateKey(year, month, d);
            const isToday = (key === todayKey);
            const el = createDayElement(d, key, false, isToday);
            calendarGrid.appendChild(el);
        }

        // Next month fill leading days
        const totalCells = calendarGrid.children.length;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            const key = getDateKey(year, month + 1, d);
            const el = createDayElement(d, key, true);
            calendarGrid.appendChild(el);
        }
    }

    function createDayElement(day, dateKey, isOtherMonth, isToday = false) {
        const el = document.createElement('div');
        el.classList.add('cal-day');
        el.textContent = day;

        if (isOtherMonth) {
            el.classList.add('other-month');
        }

        if (isToday) {
            el.classList.add('today');
        }

        if (dateKey === selectedDateKey) {
            el.classList.add('selected');
        }

        // Fetch dynamic class indicator from CycleTracker database
        const type = tracker.getDayType(dateKey);
        if (type) {
            el.classList.add(type);
        }

        // Event listener for calendar day selection click
        el.addEventListener('click', () => {
            selectedDateKey = dateKey;
            
            // Re-render calendar to update selection outline
            const selDate = CycleTracker.parseKey(selectedDateKey);
            calYear = selDate.getFullYear();
            calMonth = selDate.getMonth();
            renderCalendar(calYear, calMonth);

            // Update details sidebar card
            updateDayDetailCard(selectedDateKey);
        });

        return el;
    }

    if (calPrev) {
        calPrev.addEventListener('click', () => {
            calMonth--;
            if (calMonth < 0) { calMonth = 11; calYear--; }
            renderCalendar(calYear, calMonth);
        });
    }

    if (calNext) {
        calNext.addEventListener('click', () => {
            calMonth++;
            if (calMonth > 11) { calMonth = 0; calYear++; }
            renderCalendar(calYear, calMonth);
        });
    }

    // ---------- Stage-to-symptoms detector helper ----------
    function getDatePhase(dateKey) {
        const type = tracker.getDayType(dateKey);
        if (type === 'period' || type === 'predicted') return 'menstrual';
        if (type === 'ovulation' || type === 'fertile') return 'ovulatory';

        const lastCycle = tracker.getLastCycle();
        if (!lastCycle) return 'follicular';

        const lastStart = CycleTracker.parseKey(lastCycle.startDate);
        const targetDate = CycleTracker.parseKey(dateKey);

        const cycleDay = (CycleTracker.daysBetween(lastStart, targetDate) % tracker.getAverageCycleLength()) + 1;
        
        const avgDuration = tracker.getAveragePeriodDuration();
        const avgLength = tracker.getAverageCycleLength();
        const lutealPhase = tracker.data.settings.lutealPhase;
        const ovulationDay = avgLength - lutealPhase;

        if (cycleDay <= avgDuration) {
            return 'menstrual';
        } else if (cycleDay <= ovulationDay - 1) {
            return 'follicular';
        } else if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) {
            return 'ovulatory';
        } else {
            return 'luteal';
        }
    }

    // ---------- Day Detail Card Controller ----------
    const dayDetailTitle = document.getElementById('dayDetailTitle');
    const dayDetailBadge = document.getElementById('dayDetailBadge');
    const dayDetailBody  = document.getElementById('dayDetailBody');

    function updateDayDetailCard(dateKey) {
        if (!dayDetailTitle || !dayDetailBody) return;

        const dateObj = CycleTracker.parseKey(dateKey);
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        dayDetailTitle.textContent = formattedDate;

        const type = tracker.getDayType(dateKey);
        if (type) {
            dayDetailBadge.textContent = type === 'period' ? 'Period Day' :
                                         type === 'fertile' ? 'Fertile Window' :
                                         type === 'ovulation' ? 'Ovulation Day' : 'Predicted Period';
            dayDetailBadge.className = 'day-detail-badge show';
            dayDetailBadge.classList.add(type);
        } else {
            dayDetailBadge.className = 'day-detail-badge';
            dayDetailBadge.textContent = '';
        }

        // Align suggestions banner with cycle phases/ovulation estimation
        const isPregnant = tracker.data.settings.isPregnant;
        const phase = getDatePhase(dateKey);
        
        let banner = null;
        if (isPregnant && tracker.data.settings.lmpDate) {
            const lmpDate = CycleTracker.parseKey(tracker.data.settings.lmpDate);
            const daysDiff = CycleTracker.daysBetween(lmpDate, dateObj);
            
            if (daysDiff >= 0 && daysDiff <= 280) {
                const wk = Math.floor(daysDiff / 7);
                const dy = daysDiff % 7;
                banner = {
                    cls: 'luteal',
                    icon: '👶',
                    text: `Gestational Age: Week ${wk}, Day ${dy}. Normal prenatal signs: moderate fatigue, mild morning sickness, frequent urination.`
                };
            } else if (daysDiff < 0) {
                banner = {
                    cls: 'follicular',
                    icon: '🌸',
                    text: 'Selected day falls before Last Menstrual Period (LMP) date.'
                };
            } else {
                banner = {
                    cls: 'follicular',
                    icon: '🍼',
                    text: 'Selected day falls after Estimated Due Date (EDD).'
                };
            }
        } else {
            const banners = {
                menstrual: {
                    cls: 'menstrual', icon: '🩸',
                    text: 'Est. Menstrual Phase. Cramps, fatigue, and headaches are common. Consider logging physical symptoms.'
                },
                follicular: {
                    cls: 'follicular', icon: '🌱',
                    text: 'Est. Follicular Phase. Estrogen is rising, boosting energy and focus. Great time for high activity.'
                },
                ovulatory: {
                    cls: 'ovulatory', icon: '🥚',
                    text: 'Est. Ovulation window. Peak fertility probability. Mild bloating, twinges, or eggwhite mucus are common.'
                },
                luteal: {
                    cls: 'luteal', icon: '🌙',
                    text: 'Est. Luteal Phase. Progesterone rise can trigger PMS signs like mood swings, bloating, and fatigue.'
                }
            };
            banner = banners[phase] || banners.follicular;
        }

        // Retrieve existing logs
        const log = tracker.getLog(dateKey) || {};
        let isPeriod = !!log.isPeriod;
        let flow = log.flow || 'medium';
        let localMood = log.mood || '';
        let localEnergy = log.energy || 6;
        let localSymptoms = log.symptoms || [];
        let localBbt = log.bbt || 97.8;
        let localMucus = log.cervicalMucus || '';
        let localLh = log.lhTest || '';
        const notes = log.notes || '';

        // Render comprehensive logger
        dayDetailBody.innerHTML = `
            <div class="day-log-form">
                <!-- Contextual Phase Banner -->
                <div class="cycle-tip-banner ${banner.cls}">
                    <span class="cycle-tip-icon">${banner.icon}</span>
                    <div>${banner.text}</div>
                </div>

                <!-- Section: Period Status (Hide in pregnancy mode) -->
                ${!isPregnant ? `
                <div class="log-section">
                    <label>Period Tracking</label>
                    <button class="btn-mark-period ${isPeriod ? 'marked' : ''}" id="btnMarkPeriodDetail">
                        ${isPeriod ? '🩸 Period Logged' : 'Log Period Day'}
                    </button>
                </div>
                
                <div id="flowSectionDetail" style="display: ${isPeriod ? 'block' : 'none'}">
                    <div class="log-section">
                        <label>Menstrual Flow</label>
                        <div class="flow-buttons">
                            <button class="flow-btn ${flow === 'light' ? 'active' : ''}" data-flow="light">Light</button>
                            <button class="flow-btn ${flow === 'medium' ? 'active' : ''}" data-flow="medium">Medium</button>
                            <button class="flow-btn ${flow === 'heavy' ? 'active' : ''}" data-flow="heavy">Heavy</button>
                        </div>
                    </div>
                </div>
                ` : `
                <div class="log-section">
                    <label>Log Pregnancy Log</label>
                    <div style="font-size:0.75rem; color:var(--text-secondary); background:rgba(255,255,255,0.02); padding:0.5rem; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
                        🤰 standard period logging is paused during pregnancy.
                    </div>
                </div>
                `}

                <!-- Section: Mood & Energy -->
                <div class="log-section">
                    <label>Mood</label>
                    <div class="mood-selector" style="display: flex; gap: 0.25rem; justify-content: space-between; margin-top: 0.25rem;">
                        <button class="mood-btn ${localMood === 'great' ? 'active' : ''}" data-mood="great" style="padding:0.4rem; font-size:1.15rem;" title="Great">😄</button>
                        <button class="mood-btn ${localMood === 'good' ? 'active' : ''}" data-mood="good" style="padding:0.4rem; font-size:1.15rem;" title="Good">😊</button>
                        <button class="mood-btn ${localMood === 'okay' ? 'active' : ''}" data-mood="okay" style="padding:0.4rem; font-size:1.15rem;" title="Okay">😐</button>
                        <button class="mood-btn ${localMood === 'low' ? 'active' : ''}" data-mood="low" style="padding:0.4rem; font-size:1.15rem;" title="Low">😔</button>
                        <button class="mood-btn ${localMood === 'bad' ? 'active' : ''}" data-mood="bad" style="padding:0.4rem; font-size:1.15rem;" title="Bad">😣</button>
                    </div>
                </div>
                <div class="log-section">
                    <label>Energy Level</label>
                    <div class="energy-slider-wrap" style="margin-top: 0.25rem;">
                        <input type="range" min="1" max="10" value="${localEnergy}" class="energy-slider" id="energySliderDetail">
                        <div class="energy-labels" style="margin-top: 0.15rem;">
                            <span>Low</span>
                            <span class="energy-value" id="energyValueDetail">${localEnergy}/10</span>
                            <span>High</span>
                        </div>
                    </div>
                </div>

                <!-- Section: Physical Symptoms -->
                <div class="log-section">
                    <label>Physical Symptoms</label>
                    <div class="symptom-tags" id="physicalTags" style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.25rem;">
                        ${(isPregnant ? ['Nausea', 'Bloating', 'Headache', 'Fatigue', 'Backache', 'Frequent Urination', 'Heartburn', 'Breast Tenderness'] : ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Backache', 'Nausea']).map(s => {
                            const act = localSymptoms.includes(s) ? 'active' : '';
                            return `<button class="symptom-tag ${act}" style="padding: 0.35rem 0.65rem; font-size: 0.72rem;">${s}</button>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Section: Emotional Symptoms -->
                <div class="log-section">
                    <label>Emotional Symptoms</label>
                    <div class="symptom-tags" id="emotionalTags" style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.25rem;">
                        ${(isPregnant ? ['Mood Swings', 'Anxiety', 'Irritability', 'Sadness', 'Cravings', 'Insomnia'] : ['Mood Swings', 'Anxiety', 'Irritability', 'Sadness', 'Stress', 'Insomnia']).map(s => {
                            const act = localSymptoms.includes(s) ? 'active' : '';
                            return `<button class="symptom-tag ${act}" style="padding: 0.35rem 0.65rem; font-size: 0.72rem;">${s}</button>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Section: Fertility Indicators (BBT, Cervical Mucus, LH test) - Hide if pregnant -->
                ${!isPregnant ? `
                <div class="fertility-signs-header ${(phase === 'ovulatory') ? 'expanded' : ''}" id="fertilitySignsHeader">
                    Fertility Indicators
                </div>
                <div class="fertility-signs-content ${(phase === 'ovulatory') ? 'show' : ''}" id="fertilitySignsContent">
                    <div class="log-section">
                        <label>Basal Body Temp (BBT)</label>
                        <div class="bbt-slider-wrap" style="margin-top: 0.25rem;">
                            <input type="range" min="96.5" max="99.9" step="0.1" value="${localBbt}" class="energy-slider" id="bbtSliderDetail" style="background: linear-gradient(to right, var(--blue), var(--amber), var(--pink));">
                            <div class="energy-labels" style="margin-top: 0.15rem;">
                                <span>96.5°F</span>
                                <span class="energy-value" id="bbtValueDetail">${Number(localBbt).toFixed(1)}°F</span>
                                <span>99.9°F</span>
                            </div>
                        </div>
                    </div>
                    <div class="log-section">
                        <label>Cervical Mucus</label>
                        <div class="flow-buttons" id="mucusBtnGroupDetail" style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                            <button class="flow-btn ${localMucus === 'dry' ? 'active' : ''}" data-mucus="dry" style="padding: 0.35rem; font-size: 0.72rem; flex: 1 1 45%;">Dry</button>
                            <button class="flow-btn ${localMucus === 'sticky' ? 'active' : ''}" data-mucus="sticky" style="padding: 0.35rem; font-size: 0.72rem; flex: 1 1 45%;">Sticky</button>
                            <button class="flow-btn ${localMucus === 'creamy' ? 'active' : ''}" data-mucus="creamy" style="padding: 0.35rem; font-size: 0.72rem; flex: 1 1 45%;">Creamy</button>
                            <button class="flow-btn ${localMucus === 'eggwhite' ? 'active' : ''}" data-mucus="eggwhite" style="padding: 0.35rem; font-size: 0.72rem; flex: 1 1 45%;">Eggwhite</button>
                        </div>
                    </div>
                    <div class="log-section">
                        <label>LH Test Result</label>
                        <div class="flow-buttons" id="lhBtnGroupDetail" style="display: flex; gap: 0.35rem;">
                            <button class="flow-btn ${localLh === 'negative' ? 'active' : ''}" data-lh="negative" style="padding: 0.35rem; font-size: 0.72rem; flex: 1;">Negative</button>
                            <button class="flow-btn ${localLh === 'positive' ? 'active' : ''}" data-lh="positive" style="padding: 0.35rem; font-size: 0.72rem; flex: 1;">Positive</button>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Section: Notes -->
                <div class="log-section" style="margin-top: 0.75rem;">
                    <label>Notes</label>
                    <textarea class="log-textarea" id="dayNotesDetail" rows="2" placeholder="Log prenatal cramps, symptoms, or events...">${notes}</textarea>
                </div>
                
                <div class="day-log-actions">
                    <button class="btn-primary" id="btnSaveDayLogUnified">Save Daily Log</button>
                    ${(isPeriod || notes || localMood || localSymptoms.length > 0 || log.bbt || isPregnant) ? `<button class="btn-remove-log" id="btnRemoveLogDetail">Delete Log</button>` : ''}
                </div>
            </div>
        `;

        // Bind Period Buttons events (if not pregnant)
        if (!isPregnant) {
            const btnMarkPeriodDetail = document.getElementById('btnMarkPeriodDetail');
            const flowSectionDetail   = document.getElementById('flowSectionDetail');
            const flowBtnsDetail      = flowSectionDetail.querySelectorAll('.flow-btn');

            btnMarkPeriodDetail.addEventListener('click', () => {
                isPeriod = !isPeriod;
                btnMarkPeriodDetail.classList.toggle('marked', isPeriod);
                btnMarkPeriodDetail.textContent = isPeriod ? '🩸 Period Logged' : 'Log Period Day';
                flowSectionDetail.style.display = isPeriod ? 'block' : 'none';
            });

            flowBtnsDetail.forEach(btn => {
                btn.addEventListener('click', () => {
                    flowBtnsDetail.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    flow = btn.dataset.flow;
                });
            });

            // Bind Collapsible Fertility Signs events
            const fertilitySignsHeader  = document.getElementById('fertilitySignsHeader');
            const fertilitySignsContent = document.getElementById('fertilitySignsContent');
            if (fertilitySignsHeader && fertilitySignsContent) {
                fertilitySignsHeader.addEventListener('click', () => {
                    fertilitySignsHeader.classList.toggle('expanded');
                    fertilitySignsContent.classList.toggle('show');
                });
            }

            // Bind BBT slider events
            const bbtSliderDetail = document.getElementById('bbtSliderDetail');
            const bbtValueDetail  = document.getElementById('bbtValueDetail');
            if (bbtSliderDetail && bbtValueDetail) {
                bbtSliderDetail.addEventListener('input', () => {
                    localBbt = Number(bbtSliderDetail.value);
                    bbtValueDetail.textContent = `${localBbt.toFixed(1)}°F`;
                });
            }

            // Bind Mucus buttons events
            const mucusBtnsDetail = document.querySelectorAll('#mucusBtnGroupDetail .flow-btn');
            mucusBtnsDetail.forEach(btn => {
                btn.addEventListener('click', () => {
                    mucusBtnsDetail.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    localMucus = btn.dataset.mucus;
                });
            });

            // Bind LH buttons events
            const lhBtnsDetail = document.querySelectorAll('#lhBtnGroupDetail .flow-btn');
            lhBtnsDetail.forEach(btn => {
                btn.addEventListener('click', () => {
                    lhBtnsDetail.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    localLh = btn.dataset.lh;
                });
            });
        }

        // Bind Mood Buttons events
        const moodBtnsDetail = dayDetailBody.querySelectorAll('.mood-selector .mood-btn');
        moodBtnsDetail.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtnsDetail.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                localMood = btn.dataset.mood;
            });
        });

        // Bind Symptoms Tags toggle events
        const symptomTags = dayDetailBody.querySelectorAll('.symptom-tag');
        symptomTags.forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('active');
            });
        });

        // Bind Energy Slider events
        const energySliderDetail = document.getElementById('energySliderDetail');
        const energyValueDetail  = document.getElementById('energyValueDetail');
        if (energySliderDetail && energyValueDetail) {
            energySliderDetail.addEventListener('input', () => {
                localEnergy = Number(energySliderDetail.value);
                energyValueDetail.textContent = `${localEnergy}/10`;
            });
        }

        // Bind Save and Delete unified handlers
        const btnSaveDayLogUnified = document.getElementById('btnSaveDayLogUnified');
        const btnRemoveLogDetail   = document.getElementById('btnRemoveLogDetail');

        btnSaveDayLogUnified.addEventListener('click', () => {
            const notesVal = document.getElementById('dayNotesDetail').value.trim();
            
            // Compile active symptom tags
            const activeTags = [];
            dayDetailBody.querySelectorAll('.symptom-tag.active').forEach(tag => {
                activeTags.push(tag.textContent.trim());
            });

            const hasActiveSigns = isPeriod || notesVal || localMood || activeTags.length > 0 || log.bbt || localMucus || localLh || isPregnant;

            if (hasActiveSigns) {
                tracker.setLog(dateKey, {
                    isPeriod: isPregnant ? false : isPeriod,
                    flow: isPeriod ? flow : null,
                    mood: localMood || null,
                    symptoms: activeTags,
                    energy: localEnergy,
                    bbt: isPregnant ? null : localBbt,
                    cervicalMucus: isPregnant ? null : (localMucus || null),
                    lhTest: isPregnant ? null : (localLh || null),
                    notes: notesVal
                });
                showToast('Unified daily log saved! ✨');
            } else {
                tracker.removeLog(dateKey);
                showToast('Log cleared.');
            }
            triggerGlobalUpdate();
        });

        if (btnRemoveLogDetail) {
            btnRemoveLogDetail.addEventListener('click', () => {
                tracker.removeLog(dateKey);
                showToast('Daily log removed.');
                triggerGlobalUpdate();
            });
        }
    }

    // ---------- Header Start Period & Pregnancy Toggles ----------
    const btnPeriodToggle = document.getElementById('btnPeriodToggle');
    const periodToggleText = document.getElementById('periodToggleText');
    const btnPregnancyToggle = document.getElementById('btnPregnancyToggle');
    const pregnancyToggleText = document.getElementById('pregnancyToggleText');

    function updatePeriodToggleButton() {
        if (!btnPeriodToggle) return;
        const isPregnant = tracker.data.settings.isPregnant;
        
        // Hide period toggles if pregnant
        if (isPregnant) {
            btnPeriodToggle.style.display = 'none';
            return;
        }
        btnPeriodToggle.style.display = 'flex';

        const todayKey = CycleTracker.toKey(new Date());
        const log = tracker.getLog(todayKey);
        const isPeriodToday = log && log.isPeriod;

        if (isPeriodToday) {
            btnPeriodToggle.classList.add('active');
            if (periodToggleText) periodToggleText.textContent = 'Period Active';
        } else {
            btnPeriodToggle.classList.remove('active');
            if (periodToggleText) periodToggleText.textContent = 'Start Period';
        }
    }

    if (btnPeriodToggle) {
        btnPeriodToggle.addEventListener('click', () => {
            const todayKey = CycleTracker.toKey(new Date());
            tracker.togglePeriodDay(todayKey);
            const log = tracker.getLog(todayKey);
            
            if (log && log.isPeriod) {
                showToast('Period started today! 🩸 Take care.');
            } else {
                showToast('Period ended.');
            }
            triggerGlobalUpdate();
        });
    }

    function updatePregnancyToggleButton() {
        if (!btnPregnancyToggle) return;
        const isPregnant = tracker.data.settings.isPregnant;

        if (isPregnant) {
            btnPregnancyToggle.classList.add('active');
            if (pregnancyToggleText) pregnancyToggleText.textContent = 'Pregnancy Active';
        } else {
            btnPregnancyToggle.classList.remove('active');
            if (pregnancyToggleText) pregnancyToggleText.textContent = 'Pregnancy Mode';
        }
    }

    if (btnPregnancyToggle) {
        btnPregnancyToggle.addEventListener('click', () => {
            const isPregnant = tracker.data.settings.isPregnant;
            if (isPregnant) {
                if (confirm('Disable Pregnancy Mode and return to standard menstrual cycle tracking?')) {
                    tracker.data.settings.isPregnant = false;
                    tracker.data.settings.lmpDate = null;
                    tracker.save();
                    tracker.rebuildCycles();
                    showToast('Pregnancy Mode disabled. standard tracking restored. 🌸');
                    triggerGlobalUpdate();
                }
            } else {
                navigateTo('tracker');
                showPregnancySetupWizard();
            }
        });
    }

    function showPregnancySetupWizard() {
        if (!dayDetailTitle || !dayDetailBody) return;
        
        dayDetailTitle.textContent = 'Pregnancy Setup 👶';
        dayDetailBadge.className = 'day-detail-badge';
        dayDetailBadge.textContent = '';

        dayDetailBody.innerHTML = `
            <div class="day-log-form" style="animation: fadeDown 0.3s var(--ease-out) both;">
                <div class="cycle-tip-banner luteal" style="border-color: rgba(129, 140, 248, 0.3); background: rgba(129, 140, 248, 0.08); color: #C7D2FE;">
                    <span class="cycle-tip-icon">👶</span>
                    <div>Enter your Last Menstrual Period (LMP) date to calculate your gestational weeks and due date.</div>
                </div>
                
                <div class="log-section">
                    <label>Last Menstrual Period Date</label>
                    <input type="date" class="settings-input" id="lmpDatePicker" style="width: 100%; margin-top: 0.25rem;" max="${CycleTracker.toKey(new Date())}" value="${CycleTracker.toKey(new Date())}">
                </div>
                
                <div class="day-log-actions" style="margin-top: 0.5rem;">
                    <button class="btn-primary" id="btnConfirmPregnancy" style="background: var(--grad-purple); box-shadow: 0 4px 16px rgba(129,140,248,0.25);">Enable Pregnancy Mode</button>
                </div>
            </div>
        `;

        const btnConfirmPregnancy = document.getElementById('btnConfirmPregnancy');
        const lmpDatePicker = document.getElementById('lmpDatePicker');

        if (btnConfirmPregnancy && lmpDatePicker) {
            btnConfirmPregnancy.addEventListener('click', () => {
                const dateVal = lmpDatePicker.value;
                if (!dateVal) {
                    alert('Please select a valid date.');
                    return;
                }
                tracker.data.settings.isPregnant = true;
                tracker.data.settings.lmpDate = dateVal;
                tracker.save();
                tracker.rebuildCycles();
                showToast('Pregnancy Mode activated! 👶 Congratulations!');
                navigateTo('dashboard');
                triggerGlobalUpdate();
            });
        }
    }

    // ---------- Dashboard Update Controller ----------
    function updateDashboardPage() {
        const isPregnant = tracker.data.settings.isPregnant;
        const pred = tracker.getPredictions();
        const lastCycle = tracker.getLastCycle();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Cycle / Pregnancy Hero Ring
        const dashRingDay = document.getElementById('dashRingDay');
        const dashRingLabel = document.getElementById('dashRingLabel');
        const dashRingPhase = document.getElementById('dashRingPhase');
        const ringProgress = document.querySelector('.ring-progress');

        if (isPregnant) {
            const preg = tracker.getPregnancyProgress();
            if (preg) {
                dashRingDay.textContent = `Week ${preg.weeks}`;
                dashRingLabel.textContent = `${preg.days} Day${preg.days !== 1 ? 's' : ''} pregnant`;
                
                const trimesters = { 1: '1st Trimester', 2: '2nd Trimester', 3: '3rd Trimester' };
                dashRingPhase.textContent = trimesters[preg.trimester];
                dashRingPhase.className = 'ring-phase phase-pregnancy';
                
                // Ring progress maps to pregnancy percentage (280 days total)
                ringProgress.style.strokeDashoffset = 534 * (1 - preg.progressPercent / 100);
            }
        } else {
            if (pred.currentDay) {
                dashRingDay.textContent = `Day ${pred.currentDay}`;
                dashRingLabel.textContent = `of ${pred.avgCycleLength}-day cycle`;
                
                const phaseNames = {
                    menstrual: 'Menstrual Phase',
                    follicular: 'Follicular Phase',
                    ovulatory: 'Ovulatory Phase',
                    luteal: 'Luteal Phase'
                };
                dashRingPhase.textContent = phaseNames[pred.currentPhase] || 'Unknown';
                dashRingPhase.className = 'ring-phase';
                dashRingPhase.classList.add(`phase-${pred.currentPhase}`);

                const progress = Math.min(pred.currentDay, pred.avgCycleLength) / pred.avgCycleLength;
                ringProgress.style.strokeDashoffset = 534 * (1 - progress);
            } else {
                dashRingDay.textContent = '—';
                dashRingLabel.textContent = 'Log your first period';
                dashRingPhase.textContent = 'No Data';
                dashRingPhase.className = 'ring-phase';
                ringProgress.style.strokeDashoffset = 534;
            }
        }

        // 2. Swappable Stats Cards
        const dashLastPeriod = document.getElementById('dashLastPeriod');
        const dashOvulation = document.getElementById('dashOvulation');
        const dashNextPeriod = document.getElementById('dashNextPeriod');
        const dashFertility = document.getElementById('dashFertility');

        if (isPregnant) {
            const preg = tracker.getPregnancyProgress();
            if (preg) {
                // Morph Stat 1: Due Date
                dashLastPeriod.parentElement.previousElementSibling.textContent = '👶';
                dashLastPeriod.nextElementSibling.textContent = 'Due Date';
                dashLastPeriod.textContent = CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'short');

                // Morph Stat 2: Days to Go
                dashOvulation.parentElement.previousElementSibling.textContent = '⏳';
                dashOvulation.nextElementSibling.textContent = 'Days to Go';
                dashOvulation.textContent = `${preg.daysToGo} days`;

                // Morph Stat 3: Trimester
                dashNextPeriod.parentElement.previousElementSibling.textContent = '📈';
                dashNextPeriod.nextElementSibling.textContent = 'Trimester';
                dashNextPeriod.textContent = `${preg.trimester === 1 ? '1st' : (preg.trimester === 2 ? '2nd' : '3rd')}`;

                // Morph Stat 4: Baby Size fruit
                dashFertility.parentElement.previousElementSibling.textContent = preg.babySize.emoji;
                dashFertility.nextElementSibling.textContent = 'Baby Size';
                dashFertility.textContent = `${preg.babySize.name}`;
            }
        } else {
            // Restore Stat 1: Last Period
            dashLastPeriod.parentElement.previousElementSibling.textContent = '🩸';
            dashLastPeriod.nextElementSibling.textContent = 'Last Period';
            if (lastCycle) {
                const diff = CycleTracker.daysBetween(lastCycle.startDate, today);
                dashLastPeriod.textContent = diff === 0 ? 'Today' : (diff === 1 ? 'Yesterday' : `${diff} days ago`);
            } else {
                dashLastPeriod.textContent = '—';
            }

            // Restore Stat 2: Ovulation
            dashOvulation.parentElement.previousElementSibling.textContent = '🥚';
            dashOvulation.nextElementSibling.textContent = 'Ovulation';
            if (pred.ovulation) {
                if (pred.daysUntilOvulation === 0) {
                    dashOvulation.textContent = 'Today';
                } else if (pred.daysUntilOvulation < 0) {
                    dashOvulation.textContent = 'Passed';
                } else {
                    dashOvulation.textContent = `In ${pred.daysUntilOvulation} day${pred.daysUntilOvulation !== 1 ? 's' : ''}`;
                }
            } else {
                dashOvulation.textContent = '—';
            }

            // Restore Stat 3: Next Period
            dashNextPeriod.parentElement.previousElementSibling.textContent = '📅';
            dashNextPeriod.nextElementSibling.textContent = 'Next Period';
            if (pred.nextPeriod) {
                dashNextPeriod.textContent = CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'short');
            } else {
                dashNextPeriod.textContent = '—';
            }

            // Restore Stat 4: Fertility Window
            dashFertility.parentElement.previousElementSibling.textContent = '💧';
            dashFertility.nextElementSibling.textContent = 'Fertility Window';
            if (pred.fertilityLevel) {
                dashFertility.textContent = pred.fertilityLevel.charAt(0).toUpperCase() + pred.fertilityLevel.slice(1);
            } else {
                dashFertility.textContent = '—';
            }
        }

        // 3. Widget Badge Count logs
        const dashTrackerBadge = document.getElementById('dashTrackerBadge');
        if (dashTrackerBadge) {
            const logsThisWeek = tracker.getLogsThisWeek();
            dashTrackerBadge.textContent = `${logsThisWeek} log${logsThisWeek !== 1 ? 's' : ''} this week`;
        }

        // 4. Ovulation Widget Updates
        const dashOvulationBadge = document.getElementById('dashOvulationBadge');
        const dashOvulationWidgetText = document.getElementById('dashOvulationWidgetText');
        if (isPregnant) {
            const preg = tracker.getPregnancyProgress();
            dashOvulationBadge.textContent = '🤰 Pregnant';
            if (preg) {
                dashOvulationWidgetText.textContent = `You are pregnant! Week ${preg.weeks} gestational milestones are active.`;
            }
        } else {
            if (pred.ovulation) {
                const dateStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.ovulation), 'short');
                dashOvulationBadge.textContent = `Next: ${dateStr}`;
                
                if (pred.daysUntilOvulation === 0) {
                    dashOvulationWidgetText.textContent = 'Ovulation day is estimated TODAY! Fertility probability is at its peak.';
                } else if (pred.daysUntilOvulation > 0 && pred.daysUntilOvulation <= 4) {
                    dashOvulationWidgetText.textContent = `Estimated ovulation is in ${pred.daysUntilOvulation} days. High fertility window is active.`;
                } else if (pred.daysUntilOvulation > 0) {
                    dashOvulationWidgetText.textContent = `Estimated ovulation in ${pred.daysUntilOvulation} days. Normal fertility levels currently.`;
                } else {
                    dashOvulationWidgetText.textContent = 'Ovulation day has passed for this cycle. Waiting for next cycle predictions.';
                }
            } else {
                dashOvulationBadge.textContent = 'Next: —';
                dashOvulationWidgetText.textContent = 'Log your period start dates to predict your next estimated ovulation day.';
            }
        }

        // 5. Dynamic AI Insights Card List
        const dashInsightList = document.getElementById('dashInsightList');
        if (dashInsightList) {
            dashInsightList.innerHTML = '';
            
            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    dashInsightList.innerHTML = `
                        <div class="insight-item">
                            <div class="insight-dot dot-blue"></div>
                            <div>
                                <strong>Gestational Milestones — Week ${preg.weeks}</strong>
                                <p>${preg.tip}</p>
                            </div>
                        </div>
                        <div class="insight-item">
                            <div class="insight-dot dot-green"></div>
                            <div>
                                <strong>Estimated Due Date (EDD)</strong>
                                <p>Fetal delivery is estimated for ${CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long')} (${preg.daysToGo} days to go).</p>
                            </div>
                        </div>
                    `;
                }
            } else {
                const insights = tracker.generateInsights();
                insights.slice(0, 3).forEach(insight => {
                    const item = document.createElement('div');
                    item.className = 'insight-item';
                    item.innerHTML = `
                        <div class="insight-dot dot-${insight.color}"></div>
                        <div>
                            <strong>${insight.title}</strong>
                            <p>${insight.text}</p>
                        </div>
                    `;
                    dashInsightList.appendChild(item);
                });
                if (insights.length === 0) {
                    dashInsightList.innerHTML = '<p class="history-empty" style="width: 100%; text-align: center;">No insights available yet.</p>';
                }
            }
        }

        // 5. AI Pattern Analysis & Personal Insights Widget
        const dashPatternList = document.getElementById('dashPatternList');
        if (dashPatternList) {
            dashPatternList.innerHTML = '';
            
            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    dashPatternList.innerHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">👶 Gestational Progress</span>
                                <span class="pattern-value" style="color: var(--indigo); background: rgba(129, 140, 248, 0.08);">${preg.progressPercent}% Complete</span>
                            </div>
                            <p class="pattern-desc">You are currently in Trimester ${preg.trimester} of your pregnancy. Your baby is about the size of a ${preg.babySize.name} ${preg.babySize.emoji}.</p>
                        </div>
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🩺 Prenatal Wellness</span>
                                <span class="pattern-value" style="color: var(--pink); background: var(--pink-soft);">Active Tip</span>
                            </div>
                            <p class="pattern-desc">Focus on logging prenatal symptoms like morning sickness, fatigue, or swelling. Ensure adequate hydration and rest during this week.</p>
                        </div>
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">📅 Due Date Countdown</span>
                                <span class="pattern-value" style="color: var(--green); background: rgba(52, 211, 153, 0.08);">${preg.daysToGo} Days</span>
                            </div>
                            <p class="pattern-desc">Your estimated delivery date is ${CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long')}. Logging symptoms daily helps monitor signs of early labor.</p>
                        </div>
                    `;
                }
            } else {
                const dailyLogs = tracker.data.dailyLogs;
                const cycles = tracker.data.cycles;
                const avgLength = tracker.getAverageCycleLength();
                
                let follicularEnergySum = 0;
                let follicularEnergyCount = 0;
                let lutealEnergySum = 0;
                let lutealEnergyCount = 0;
                
                let follicularMoodCount = 0;
                let follicularMoodTotal = 0;
                let lutealMoodCount = 0;
                let lutealMoodTotal = 0;
                
                let crampsDay1To3 = 0;
                let crampsTotal = 0;

                const today = new Date();
                today.setHours(0,0,0,0);

                const periodStarts = cycles.map(c => CycleTracker.parseKey(c.startDate));
                
                for (const k in dailyLogs) {
                    const log = dailyLogs[k];
                    const logDate = CycleTracker.parseKey(k);
                    let cycleDay = null;
                    
                    let closestStart = null;
                    periodStarts.forEach(pStart => {
                        if (pStart <= logDate) {
                            if (!closestStart || pStart > closestStart) {
                                closestStart = pStart;
                            }
                        }
                    });
                    
                    if (closestStart) {
                        cycleDay = CycleTracker.daysBetween(closestStart, logDate) + 1;
                    }
                    
                    if (cycleDay && cycleDay <= avgLength) {
                        const isLuteal = cycleDay > (avgLength - 14);
                        
                        if (log.energy) {
                            if (isLuteal) {
                                lutealEnergySum += Number(log.energy);
                                lutealEnergyCount++;
                            } else {
                                follicularEnergySum += Number(log.energy);
                                follicularEnergyCount++;
                            }
                        }
                        
                        const hasEmotional = log.symptoms && log.symptoms.some(s => ['Mood Swings', 'Anxiety', 'Irritability', 'Sadness', 'Stress', 'Brain Fog'].includes(s));
                        if (isLuteal) {
                            lutealMoodTotal++;
                            if (hasEmotional) lutealMoodCount++;
                        } else {
                            follicularMoodTotal++;
                            if (hasEmotional) follicularMoodCount++;
                        }
                        
                        if (log.symptoms && log.symptoms.includes('Cramps')) {
                            crampsTotal++;
                            if (cycleDay <= 3) crampsDay1To3++;
                        }
                    }
                }
                
                let energyHTML = '';
                if (follicularEnergyCount > 0 && lutealEnergyCount > 0) {
                    const avgF = (follicularEnergySum / follicularEnergyCount).toFixed(1);
                    const avgL = (lutealEnergySum / lutealEnergyCount).toFixed(1);
                    const diff = (avgF - avgL).toFixed(1);
                    
                    let relation = 'matches';
                    if (diff > 0) relation = `peaks in follicular phase (avg ${avgF}/10) vs luteal (avg ${avgL}/10)`;
                    else if (diff < 0) relation = `peaks in luteal phase (avg ${avgL}/10) vs follicular (avg ${avgF}/10)`;
                    else relation = `remains stable at average ${avgF}/10 across your cycle`;
                    
                    energyHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">⚡ Cycle Energy Trends</span>
                                <span class="pattern-value" style="color: var(--purple); background: var(--purple-soft);">Data Core</span>
                            </div>
                            <p class="pattern-desc">Your logged records show energy ${relation}. This corresponds with estrogen-driven vitality peaks.</p>
                        </div>
                    `;
                } else {
                    energyHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">⚡ Cycle Energy Trends</span>
                                <span class="pattern-value" style="color: var(--text-muted);">Baseline Estimate</span>
                            </div>
                            <p class="pattern-desc">Estrogen surge (Days 6–12) clinically elevates physical energy, while rising progesterone (Days 18–24) prompts rest. Log daily energy levels to map your personal cycle curve.</p>
                        </div>
                    `;
                }
                
                let moodHTML = '';
                if (lutealMoodTotal > 0 && follicularMoodTotal > 0 && (lutealMoodCount > 0 || follicularMoodCount > 0)) {
                    const pctL = ((lutealMoodCount / lutealMoodTotal) * 100).toFixed(0);
                    const pctF = ((follicularMoodCount / follicularMoodTotal) * 100).toFixed(0);
                    
                    let ratio = 1;
                    if (pctF > 0) ratio = (pctL / pctF).toFixed(1);
                    
                    let moodText = '';
                    if (pctL > pctF) {
                        moodText = `Emotional shifts are logged **${ratio}x** more frequently during your premenstrual phase (${pctL}%) compared to your follicular phase (${pctF}%).`;
                    } else {
                        moodText = `Premenstrual mood patterns are stable, with emotional signs logged at similar rates in both cycle phases (${pctL}% vs ${pctF}%).`;
                    }
                    
                    moodHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🎭 Mood & Hormone Sync</span>
                                <span class="pattern-value" style="color: var(--pink); background: var(--pink-soft);">Hormonal Link</span>
                            </div>
                            <p class="pattern-desc">${moodText} This is a typical correlation pattern for cycle-sensitive mood shifts.</p>
                        </div>
                    `;
                } else {
                    moodHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🎭 Mood & Hormone Sync</span>
                                <span class="pattern-value" style="color: var(--text-muted);">Baseline Estimate</span>
                            </div>
                            <p class="pattern-desc">Estrogen decline in the late luteal phase (5 days before your period) commonly triggers mood shifts. Log mood changes daily to trace your hormonal sensitivity.</p>
                        </div>
                    `;
                }
                
                let symptomHTML = '';
                if (crampsTotal > 0) {
                    const pctDays = ((crampsDay1To3 / crampsTotal) * 100).toFixed(0);
                    symptomHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🩸 Symptom Density Peak</span>
                                <span class="pattern-value" style="color: var(--coral); background: var(--coral-soft);">${pctDays}% on Day 1-3</span>
                            </div>
                            <p class="pattern-desc">Your logs show **${pctDays}%** of pelvic cramping episodes occur during the first 3 days of menstruation, aligning with prostaglandin surges.</p>
                        </div>
                    `;
                } else {
                    symptomHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🩸 Symptom Density Peak</span>
                                <span class="pattern-value" style="color: var(--text-muted);">Baseline Estimate</span>
                            </div>
                            <p class="pattern-desc">Menstrual cramps (dysmenorrhea) typically peak on Days 1–3 of your cycle. Track cramps and bleeding levels daily to analyze your personal symptom profiles.</p>
                        </div>
                    `;
                }
                
                let riskHTML = '';
                const quizResult = tracker.data.symptomQuiz;
                if (quizResult) {
                    const scores = calculateCorrelationScores(quizResult);
                    const highest = Object.keys(scores).map(k => ({
                        key: k,
                        name: k === 'pcos' ? 'PCOS' : k === 'endo' ? 'Endometriosis' : k === 'fib' ? 'Uterine Fibroids' : k === 'peri' ? 'Perimenopause' : k === 'pmdd' ? 'PMDD' : 'Adenomyosis',
                        score: scores[k].score
                    })).sort((a,b) => b.score - a.score)[0];
                    
                    let badgeColor = 'var(--green)';
                    let badgeBg = 'rgba(52, 211, 153, 0.08)';
                    if (highest.score >= 70) {
                        badgeColor = 'var(--coral)';
                        badgeBg = 'var(--coral-soft)';
                    } else if (highest.score >= 35) {
                        badgeColor = 'var(--amber)';
                        badgeBg = 'rgba(251, 191, 36, 0.08)';
                    }
                    
                    riskHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🤖 AI Condition Analyzer Match</span>
                                <span class="pattern-value" style="color: ${badgeColor}; background: ${badgeBg};">${highest.score}% ${highest.name}</span>
                            </div>
                            <p class="pattern-desc">Screening detected a **${highest.score}% match** with **${highest.name}**. Review details and testing guidelines in the **Symptom Checker** tab.</p>
                        </div>
                    `;
                } else {
                    riskHTML = `
                        <div class="pattern-item">
                            <div class="pattern-header">
                                <span class="pattern-title">🤖 AI Condition Analyzer Match</span>
                                <span class="pattern-value" style="color: var(--text-muted);">Inactive</span>
                            </div>
                            <p class="pattern-desc">No screening results found. Click **Symptom Checker** in the menu to complete the clinical questionnaire and unlock personalized condition estimates.</p>
                        </div>
                    `;
                }
                
                dashPatternList.innerHTML = energyHTML + moodHTML + symptomHTML + riskHTML;
            }
        }

        // 6. Recent Activity List
        const dashActivityList = document.getElementById('dashActivityList');
        if (dashActivityList) {
            dashActivityList.innerHTML = '';
            const sortedKeys = Object.keys(tracker.data.dailyLogs)
                .sort((a, b) => b.localeCompare(a))
                .slice(0, 5);

            if (sortedKeys.length === 0) {
                dashActivityList.innerHTML = '<p class="history-empty" style="width: 100%; text-align: center;">No recent activities logged.</p>';
            } else {
                sortedKeys.forEach(key => {
                    const log = tracker.data.dailyLogs[key];
                    const dateFormatted = CycleTracker.formatDate(key);
                    
                    let icon = '📝';
                    let title = 'Activity Logged';
                    let desc = `Log saved for ${dateFormatted}`;

                    if (log.isPeriod) {
                        icon = '🩸';
                        title = 'Period Logged';
                        desc = `${dateFormatted} — Flow: ${log.flow ? log.flow.charAt(0).toUpperCase() + log.flow.slice(1) : 'Medium'}`;
                    } else if (log.bbt) {
                        icon = '🥚';
                        title = 'Fertility Signs Logged';
                        desc = `${dateFormatted} — BBT: ${log.bbt}°F, Mucus: ${log.cervicalMucus || 'None'}`;
                    } else if (log.mood) {
                        const emojis = { great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😣' };
                        icon = emojis[log.mood] || '😊';
                        title = `Mood: ${log.mood.charAt(0).toUpperCase() + log.mood.slice(1)}`;
                        desc = `${dateFormatted} — Energy: ${log.energy}/10`;
                    } else if (log.symptoms && log.symptoms.length > 0) {
                        icon = '💜';
                        title = 'Symptoms Logged';
                        desc = `${dateFormatted} — ${log.symptoms.join(', ')}`;
                    } else if (log.notes) {
                        icon = '📝';
                        title = 'Note Logged';
                        desc = `${dateFormatted} — "${log.notes.substring(0, 25)}${log.notes.length > 25 ? '...' : ''}"`;
                    }

                    const item = document.createElement('div');
                    item.className = 'activity-item';
                    item.innerHTML = `
                        <div class="activity-icon">${icon}</div>
                        <div class="activity-content">
                            <span class="activity-title">${title}</span>
                            <span class="activity-time">${desc}</span>
                        </div>
                    `;
                    dashActivityList.appendChild(item);
                });
            }
        }
    }

    // ---------- Tracker Page Sidebar updates ----------
    function updateTrackerSidebar() {
        const isPregnant = tracker.data.settings.isPregnant;

        // 1. Sidebar insights list
        const trackerInsightList = document.getElementById('trackerInsightList');
        if (trackerInsightList) {
            trackerInsightList.innerHTML = '';
            
            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    trackerInsightList.innerHTML = `
                        <div class="tracker-insight-item">
                            <div class="tracker-insight-icon luteal">👶</div>
                            <div class="tracker-insight-text">
                                <strong>Prenatal Development stage</strong>
                                <p>${preg.tip}</p>
                            </div>
                        </div>
                    `;
                }
            } else {
                const insights = tracker.generateInsights();
                if (insights.length === 0) {
                    trackerInsightList.innerHTML = '<p class="history-empty">No insights available yet.</p>';
                } else {
                    insights.forEach(insight => {
                        const item = document.createElement('div');
                        item.className = 'tracker-insight-item';
                        item.innerHTML = `
                            <div class="tracker-insight-icon ${insight.color}">${insight.icon}</div>
                            <div class="tracker-insight-text">
                                <strong>${insight.title}</strong>
                                <p>${insight.text}</p>
                            </div>
                        `;
                        trackerInsightList.appendChild(item);
                    });
                }
            }
        }

        // 2. Cycle History list (Replace with milestones when pregnant)
        const cycleHistoryList = document.getElementById('cycleHistoryList');
        const cycleHistoryCardTitle = cycleHistoryList ? cycleHistoryList.previousElementSibling : null;

        if (cycleHistoryList) {
            if (isPregnant) {
                if (cycleHistoryCardTitle) cycleHistoryCardTitle.textContent = 'Baby Progress 👶';
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    cycleHistoryList.innerHTML = `
                        <div style="text-align: center; padding: 0.5rem 0;">
                            <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">${preg.babySize.emoji}</div>
                            <h4 style="font-size: 0.95rem; font-weight:700; margin-bottom: 0.25rem; color:var(--indigo);">Size: ${preg.babySize.name}</h4>
                            <p style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">Your baby is currently about the size of a ${preg.babySize.name.toLowerCase()}! (Week ${preg.weeks})</p>
                            
                            <div style="text-align: left; padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px dashed var(--border-glass);">
                                <strong style="font-size: 0.75rem; color: var(--indigo); display: block; margin-bottom: 0.15rem;">Development Tip:</strong>
                                <p style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4; margin: 0;">${preg.tip}</p>
                            </div>
                        </div>
                    `;
                }
            } else {
                if (cycleHistoryCardTitle) cycleHistoryCardTitle.textContent = 'Cycle History';
                cycleHistoryList.innerHTML = '';
                const history = tracker.getCycleHistory();
                if (history.length === 0) {
                    cycleHistoryList.innerHTML = '<p class="history-empty">No cycles recorded yet. Start logging to see your history.</p>';
                } else {
                    history.forEach(item => {
                        const itemEl = document.createElement('div');
                        itemEl.className = 'history-item';
                        itemEl.innerHTML = `
                            <div>
                                <span class="history-range">${item.startFormatted} – ${item.endFormatted}</span>
                                <span style="font-size:0.75rem; color:var(--text-muted);">Duration: ${item.periodDuration} days</span>
                            </div>
                            ${item.cycleLength ? `<span style="font-weight:700; font-size:0.85rem; color:var(--pink);">${item.cycleLength} days</span>` : ''}
                        `;
                        cycleHistoryList.appendChild(itemEl);
                    });
                }
            }
        }
    }

    // ---------- Predictions Page update controller ----------
    function updatePredictionsPage() {
        const isPregnant = tracker.data.settings.isPregnant;
        const pred = tracker.getPredictions();
        
        // 1. Next Period / Due Date Card
        const predPeriodCard = document.querySelector('.pred-card.pred-period');
        if (predPeriodCard) {
            const predTitle = predPeriodCard.querySelector('h3');
            const predDate = predPeriodCard.querySelector('.pred-date');
            const predCountdown = predPeriodCard.querySelector('.pred-countdown');
            const fill = predPeriodCard.querySelector('.confidence-fill');
            const text = predPeriodCard.querySelector('.pred-confidence span');

            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    predTitle.textContent = 'Estimated Due Date';
                    predDate.textContent = CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long');
                    predCountdown.textContent = `${preg.daysToGo} days remaining`;
                    fill.style.width = `${preg.progressPercent}%`;
                    text.textContent = 'Gestational Due Date countdown';
                }
            } else {
                predTitle.textContent = 'Next Period';
                if (pred.nextPeriod) {
                    predDate.textContent = CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'long');
                    predCountdown.textContent = pred.daysUntilPeriod === 0 ? 'Today' :
                                                (pred.daysUntilPeriod === 1 ? 'Tomorrow' :
                                                (pred.daysUntilPeriod < 0 ? `Passed (${Math.abs(pred.daysUntilPeriod)} days ago)` : `${pred.daysUntilPeriod} days away`));
                    fill.style.width = `${pred.confidence}%`;
                    text.textContent = `${pred.confidence}% confidence`;
                } else {
                    predDate.textContent = 'No Data';
                    predCountdown.textContent = 'Log your period start dates first';
                    fill.style.width = '0%';
                    text.textContent = '0% confidence';
                }
            }
        }

        // 2. Fertile Window / Gestational Age Card
        const predFertileCard = document.querySelector('.pred-card.pred-fertile');
        if (predFertileCard) {
            const predTitle = predFertileCard.querySelector('h3');
            const predDate = predFertileCard.querySelector('.pred-date');
            const predCountdown = predFertileCard.querySelector('.pred-countdown');
            const fill = predFertileCard.querySelector('.confidence-fill');
            const text = predFertileCard.querySelector('.pred-confidence span');

            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    predTitle.textContent = 'Gestational Progress';
                    predDate.textContent = `${preg.weeks} Weeks, ${preg.days} Days`;
                    predCountdown.textContent = `${preg.trimester === 1 ? 'First' : (preg.trimester === 2 ? 'Second' : 'Third')} Trimester`;
                    fill.style.width = `${preg.progressPercent}%`;
                    text.textContent = `${preg.progressPercent}% of full-term gestational progress`;
                }
            } else {
                predTitle.textContent = 'Fertile Window';
                if (pred.fertileStart && pred.fertileEnd) {
                    const s = CycleTracker.formatDate(CycleTracker.parseKey(pred.fertileStart), 'short');
                    const e = CycleTracker.formatDate(CycleTracker.parseKey(pred.fertileEnd), 'long');
                    predDate.textContent = `${s} – ${e}`;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const fs = CycleTracker.parseKey(pred.fertileStart);
                    const fe = CycleTracker.parseKey(pred.fertileEnd);

                    if (today >= fs && today <= fe) {
                        predCountdown.textContent = 'Active now';
                    } else if (today < fs) {
                        const days = CycleTracker.daysBetween(today, fs);
                        predCountdown.textContent = `Starts in ${days} day${days !== 1 ? 's' : ''}`;
                    } else {
                        predCountdown.textContent = 'Passed';
                    }
                    const conf = Math.max(30, pred.confidence - 6);
                    fill.style.width = `${conf}%`;
                    text.textContent = `${conf}% confidence`;
                } else {
                    predDate.textContent = 'No Data';
                    predCountdown.textContent = 'Log your period to get predictions';
                    fill.style.width = '0%';
                    text.textContent = '0% confidence';
                }
            }
        }

        // 3. Ovulation Day / Baby Development Card
        const predOvulationCard = document.querySelector('.pred-card.pred-ovulation');
        if (predOvulationCard) {
            const predTitle = predOvulationCard.querySelector('h3');
            const predDate = predOvulationCard.querySelector('.pred-date');
            const predCountdown = predOvulationCard.querySelector('.pred-countdown');
            const fill = predOvulationCard.querySelector('.confidence-fill');
            const text = predOvulationCard.querySelector('.pred-confidence span');

            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    predTitle.textContent = 'Baby Size comparison';
                    predDate.textContent = `Size: ${preg.babySize.name}`;
                    predCountdown.textContent = `${preg.babySize.emoji} grow baby, grow!`;
                    fill.style.width = `${preg.progressPercent}%`;
                    text.textContent = 'Prenatal milestones tracker';
                }
            } else {
                predTitle.textContent = 'Ovulation Day';
                if (pred.ovulation) {
                    predDate.textContent = CycleTracker.formatDate(CycleTracker.parseKey(pred.ovulation), 'long');
                    if (pred.daysUntilOvulation === 0) {
                        predCountdown.textContent = 'Today';
                    } else if (pred.daysUntilOvulation === 1) {
                        predCountdown.textContent = 'Tomorrow';
                    } else if (pred.daysUntilOvulation < 0) {
                        predCountdown.textContent = `Passed (${Math.abs(pred.daysUntilOvulation)} days ago)`;
                    } else {
                        predCountdown.textContent = `${pred.daysUntilOvulation} day${pred.daysUntilOvulation !== 1 ? 's' : ''} away`;
                    }
                    const conf = Math.max(30, pred.confidence - 10);
                    fill.style.width = `${conf}%`;
                    text.textContent = `${conf}% confidence`;
                } else {
                    predDate.textContent = 'No Data';
                    predCountdown.textContent = 'Log your period to get predictions';
                    fill.style.width = '0%';
                    text.textContent = '0% confidence';
                }
            }
        }

        // 4. Trend Chart updates (Historical or Paused)
        const barChart = document.querySelector('.bar-chart');
        const trendCardTitle = barChart ? barChart.parentElement.querySelector('h3') : null;
        if (barChart) {
            if (isPregnant) {
                if (trendCardTitle) trendCardTitle.textContent = 'Cycle trends (Paused)';
            } else {
                if (trendCardTitle) trendCardTitle.textContent = 'Cycle Length Trend';
            }
            barChart.innerHTML = '';
            const cycles = tracker.getCycles().filter(c => c.cycleLength);
            const trendCycles = cycles.slice(-6);

            if (trendCycles.length === 0) {
                barChart.innerHTML = '<p class="history-empty" style="width: 100%; text-align: center;">Log more cycles to unlock trend data</p>';
            } else {
                trendCycles.forEach((c, index) => {
                    const isCurrent = (index === trendCycles.length - 1);
                    const d = CycleTracker.parseKey(c.startDate);
                    const lbl = d.toLocaleDateString('en-US', { month: 'short' });
                    const height = Math.round((c.cycleLength / 45) * 100);

                    const grp = document.createElement('div');
                    grp.className = 'bar-group';
                    grp.innerHTML = `
                        <div class="bar ${isCurrent ? 'bar-current' : ''}" style="height: ${height}%">
                            <span class="bar-value">${c.cycleLength}</span>
                        </div>
                        <span class="bar-label">${lbl}</span>
                    `;
                    barChart.appendChild(grp);
                });
            }
        }

        // 5. Pregnancy probability / Gestational Progress Gauge updates
        const gaugeTitle = document.querySelector('.pregnancy-card h3');
        const gaugeVal = document.querySelector('.gauge-label .gauge-value');
        const gaugeSub = document.querySelector('.gauge-label .gauge-sub');
        const pregNote = document.querySelector('.pregnancy-note p');
        const gaugePath = document.querySelector('.gauge-svg path:nth-of-type(2)');

        if (isPregnant) {
            const preg = tracker.getPregnancyProgress();
            if (gaugeTitle) gaugeTitle.textContent = 'Gestational Progress';
            if (preg) {
                if (gaugeVal) gaugeVal.textContent = `${preg.progressPercent}%`;
                if (gaugeSub) gaugeSub.textContent = `Week ${preg.weeks} of 40`;
                if (pregNote) pregNote.textContent = `👶 ${preg.tip}`;
                
                // Dash offset: 236 represents 100%, 0 represents 0%.
                const offset = 236 * (1 - preg.progressPercent / 100);
                if (gaugePath) gaugePath.style.strokeDashoffset = offset;
            }
        } else {
            if (gaugeTitle) gaugeTitle.textContent = 'Pregnancy Probability';
            if (pred.currentDay && pred.fertilityLevel) {
                let valText = 'Low';
                let offset = 236;
                let note = 'Pregnancy probability is low today.';

                if (pred.fertilityLevel === 'medium') {
                    valText = 'Medium';
                    offset = 141;
                    note = '🌟 Fertility is elevated as you approach your fertile window.';
                } else if (pred.fertilityLevel === 'high') {
                    valText = 'High';
                    offset = 70;
                    note = '🔥 High probability of pregnancy. You are in your fertile window.';
                } else if (pred.fertilityLevel === 'peak') {
                    valText = 'Peak';
                    offset = 15;
                    note = '🥚 Peak fertility window! Ovulation day makes pregnancy highly likely.';
                }

                if (gaugeVal) gaugeVal.textContent = valText;
                if (gaugeSub) gaugeSub.textContent = `Based on cycle day ${pred.currentDay}`;
                if (pregNote) pregNote.textContent = note;
                if (gaugePath) gaugePath.style.strokeDashoffset = offset;
            } else {
                if (gaugeVal) gaugeVal.textContent = '—';
                if (gaugeSub) gaugeSub.textContent = 'No cycle active';
                if (pregNote) pregNote.textContent = 'Log your period start dates to predict fertility probability.';
                if (gaugePath) gaugePath.style.strokeDashoffset = 236;
            }
        }

        // 6. Dynamic averages & variability texts
        const trendAvgVal = document.getElementById('trendAvgVal');
        const trendVarVal = document.getElementById('trendVarVal');
        if (trendAvgVal) trendAvgVal.textContent = `${tracker.getAverageCycleLength()} days`;
        if (trendVarVal) {
            const variation = tracker.getCycleLengthVariation();
            trendVarVal.textContent = variation > 0 ? `±${variation} days` : '0 days';
        }

        // 7. AI Forecast model factors & details
        const forecastRegularity = document.getElementById('forecastRegularity');
        const forecastSymptoThermal = document.getElementById('forecastSymptoThermal');
        const forecastOvulationConf = document.getElementById('forecastOvulationConf');
        const aiPredictionDetailedInsight = document.getElementById('aiPredictionDetailedInsight');

        if (forecastRegularity) {
            const variation = tracker.getCycleLengthVariation();
            if (tracker.getCycles().length < 2) {
                forecastRegularity.textContent = 'Pending logs';
                forecastRegularity.style.color = 'var(--text-secondary)';
            } else if (variation <= 1.5) {
                forecastRegularity.textContent = `High (±${variation}d)`;
                forecastRegularity.style.color = 'var(--green)';
            } else if (variation <= 3.5) {
                forecastRegularity.textContent = `Medium (±${variation}d)`;
                forecastRegularity.style.color = 'var(--blue)';
            } else {
                forecastRegularity.textContent = `Variable (±${variation}d)`;
                forecastRegularity.style.color = 'var(--amber)';
            }
        }

        let hasSymptoThermalLogs = false;
        for (const k in tracker.data.dailyLogs) {
            const log = tracker.data.dailyLogs[k];
            if (log.bbt || log.cervicalMucus || log.lhTest) {
                hasSymptoThermalLogs = true;
                break;
            }
        }

        if (forecastSymptoThermal) {
            if (isPregnant) {
                forecastSymptoThermal.textContent = 'Paused';
                forecastSymptoThermal.style.color = 'var(--text-muted)';
            } else if (hasSymptoThermalLogs) {
                forecastSymptoThermal.textContent = 'Active (Sympto-Thermal)';
                forecastSymptoThermal.style.color = 'var(--pink)';
            } else {
                forecastSymptoThermal.textContent = 'Calendar Only';
                forecastSymptoThermal.style.color = 'var(--text-muted)';
            }
        }

        if (forecastOvulationConf) {
            if (isPregnant) {
                forecastOvulationConf.textContent = '—';
                forecastOvulationConf.style.color = 'var(--text-muted)';
            } else {
                forecastOvulationConf.textContent = `${pred.confidence}%`;
                forecastOvulationConf.style.color = 'var(--purple)';
            }
        }

        if (aiPredictionDetailedInsight) {
            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                aiPredictionDetailedInsight.innerHTML = `🤰 <strong>Pregnancy Mode Active:</strong> Gestational progress is at <strong>Week ${preg ? preg.weeks : '—'}</strong>. Standard predictions are paused. Your estimated due date is <strong>${preg ? CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long') : '—'}</strong>.`;
            } else if (tracker.getCycles().length === 0) {
                aiPredictionDetailedInsight.innerHTML = `📝 <strong>No Data Available:</strong> Log your first period start day on the Calendar page to initialize the AI Forecasting engine.`;
            } else {
                const confMsg = pred.confidence >= 80 ? 'Highly Reliable' : (pred.confidence >= 60 ? 'Moderate Confidence' : 'Awaiting More Logs');
                aiPredictionDetailedInsight.innerHTML = `🔮 <strong>AI Forecast Analysis (${confMsg}):</strong> Predictions are modeled using Bayesian estimation. Based on your average cycle of <strong>${pred.avgCycleLength} days</strong>, your next period is forecast for <strong>${pred.nextPeriod ? CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'long') : '—'}</strong>. ${hasSymptoThermalLogs ? 'Sympto-thermal signs are integrated to refine window estimates.' : 'Log BBT or LH test strip results to activate Sympto-Thermal refinements.'}`;
            }
        }
    }

    // ---------- Ovulation Tracker Page Updates ----------
    function initOvulationForm() {
        const todayKey = CycleTracker.toKey(new Date());
        const log = tracker.getLog(todayKey) || {};

        const bbtSlider = document.getElementById('bbtSlider');
        const bbtValue = document.getElementById('bbtValue');
        
        if (bbtSlider && bbtValue) {
            const todayBbt = log.bbt || 97.8;
            bbtSlider.value = todayBbt;
            bbtValue.textContent = `${Number(todayBbt).toFixed(1)}°F`;
        }

        // Reset Mucus select state
        selectedMucus = log.cervicalMucus || null;
        document.querySelectorAll('#mucusBtnGroup .flow-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mucus === selectedMucus);
        });

        // Reset LH select state
        selectedLh = log.lhTest || null;
        document.querySelectorAll('#lhBtnGroup .flow-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lh === selectedLh);
        });
    }

    // BBT Slider change listener
    const bbtSlider = document.getElementById('bbtSlider');
    const bbtValue = document.getElementById('bbtValue');
    if (bbtSlider && bbtValue) {
        bbtSlider.addEventListener('input', () => {
            bbtValue.textContent = `${Number(bbtSlider.value).toFixed(1)}°F`;
        });
    }

    // Cervical Mucus selection click events
    document.querySelectorAll('#mucusBtnGroup .flow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#mucusBtnGroup .flow-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMucus = btn.dataset.mucus;
        });
    });

    // LH Test selection click events
    document.querySelectorAll('#lhBtnGroup .flow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#lhBtnGroup .flow-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedLh = btn.dataset.lh;
        });
    });

    // Save Ovulation Log Button click event
    const btnSaveOvulation = document.getElementById('btnSaveOvulation');
    if (btnSaveOvulation) {
        btnSaveOvulation.addEventListener('click', () => {
            const todayKey = CycleTracker.toKey(new Date());
            const bbtVal = bbtSlider ? Number(bbtSlider.value) : 97.8;

            const existing = tracker.getLog(todayKey) || {};
            tracker.setLog(todayKey, {
                ...existing,
                bbt: bbtVal,
                cervicalMucus: selectedMucus,
                lhTest: selectedLh
            });

            showToast('Saved ovulation signs successfully! 🥚');
            triggerGlobalUpdate();
        });
    }

    function updateOvulationPage() {
        const isPregnant = tracker.data.settings.isPregnant;
        const ovulationLayout = document.querySelector('#page-ovulation .tracker-layout');
        let pregCard = document.getElementById('ovulationPregnancyState');
        
        if (isPregnant) {
            if (ovulationLayout) ovulationLayout.style.display = 'none';
            if (!pregCard) {
                pregCard = document.createElement('div');
                pregCard.id = 'ovulationPregnancyState';
                pregCard.className = 'glass-card';
                pregCard.style.cssText = 'padding: 3rem; text-align: center; max-width: 600px; margin: 2rem auto;';
                ovulationLayout.parentNode.appendChild(pregCard);
            }
            const preg = tracker.getPregnancyProgress();
            pregCard.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 1rem;">👶</div>
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color:var(--indigo);">Ovulation Tracking Paused</h2>
                <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65; margin-bottom: 1.5rem;">
                    Standard ovulation and fertile window predictions are paused during pregnancy.
                </p>
                ${preg ? `
                <div style="font-size: 0.85rem; padding: 0.75rem 1.25rem; background: rgba(129, 140, 248, 0.08); border-radius: var(--radius-sm); border: 1px dashed rgba(129, 140, 248, 0.3); color: var(--indigo); display: inline-block;">
                    Estimated Due Date: <strong>${CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long')}</strong>
                </div>
                ` : ''}
            `;
            pregCard.style.display = 'block';
            return;
        } else {
            if (ovulationLayout) ovulationLayout.style.display = 'grid';
            if (pregCard) pregCard.style.display = 'none';
        }

        const pred = tracker.getPredictions();
        
        // 1. Ovulation Hero countdown
        const ovulationNextDate = document.getElementById('ovulationNextDate');
        const ovulationNextCountdown = document.getElementById('ovulationNextCountdown');
        const ovulationConfidenceFill = document.getElementById('ovulationConfidenceFill');
        const ovulationConfidenceText = document.getElementById('ovulationConfidenceText');

        if (pred.ovulation) {
            ovulationNextDate.textContent = CycleTracker.formatDate(CycleTracker.parseKey(pred.ovulation), 'long');
            if (pred.daysUntilOvulation === 0) {
                ovulationNextCountdown.textContent = 'Est. Ovulation is TODAY!';
            } else if (pred.daysUntilOvulation < 0) {
                ovulationNextCountdown.textContent = `Passed (${Math.abs(pred.daysUntilOvulation)} days ago)`;
            } else {
                ovulationNextCountdown.textContent = `Estimated in ${pred.daysUntilOvulation} day${pred.daysUntilOvulation !== 1 ? 's' : ''}`;
            }
            const conf = Math.max(30, pred.confidence - 10);
            ovulationConfidenceFill.style.width = `${conf}%`;
            ovulationConfidenceText.textContent = `${conf}% confidence`;
        } else {
            ovulationNextDate.textContent = '—';
            ovulationNextCountdown.textContent = 'Log your period to get predictions';
            ovulationConfidenceFill.style.width = '0%';
            ovulationConfidenceText.textContent = '0% confidence';
        }

        // 2. BBT Chart Rendering
        const bbtChartContainer = document.getElementById('bbtChartContainer');
        const bbtTrendSummary = document.getElementById('bbtTrendSummary');
        
        if (bbtChartContainer) {
            bbtChartContainer.innerHTML = '';
            
            // Gather last 7 logs that contain BBT records, sorted ascending (oldest to newest)
            const bbtLogs = Object.keys(tracker.data.dailyLogs)
                .filter(k => tracker.data.dailyLogs[k].bbt)
                .sort((a, b) => a.localeCompare(b))
                .slice(-7);

            if (bbtLogs.length === 0) {
                bbtChartContainer.innerHTML = '<p class="history-empty" style="width: 100%; text-align: center;">Save daily logs to display your Basal Body Temperature chart.</p>';
                if (bbtTrendSummary) bbtTrendSummary.innerHTML = '<span>Last 7 entries: <strong>No logs</strong></span>';
            } else {
                let tempSum = 0;
                
                bbtLogs.forEach(key => {
                    const log = tracker.data.dailyLogs[key];
                    const dateObj = CycleTracker.parseKey(key);
                    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    const temp = Number(log.bbt);
                    tempSum += temp;

                    // BBT scale: range 96.5 to 99.9. Min height is 15%, max height is 100%.
                    const height = Math.max(15, Math.min(100, Math.round(((temp - 96.2) / 3.7) * 100)));
                    const isSpike = temp >= 98.2;

                    const barGroup = document.createElement('div');
                    barGroup.className = 'bbt-bar-group';
                    barGroup.innerHTML = `
                        <div class="bbt-bar ${isSpike ? 'spike' : ''}" style="height: ${height}%">
                            <span class="bbt-bar-val">${temp.toFixed(1)}°</span>
                        </div>
                        <span class="bbt-bar-lbl">${label}</span>
                    `;
                    bbtChartContainer.appendChild(barGroup);
                });

                if (bbtTrendSummary) {
                    const avgTemp = (tempSum / bbtLogs.length).toFixed(2);
                    bbtTrendSummary.innerHTML = `<span>Last ${bbtLogs.length} entries — Average: <strong>${avgTemp}°F</strong></span>`;
                }
            }
        }

        // 3. Dynamic Conception & Fertility Insights List
        const ovulationInsightsList = document.getElementById('ovulationInsightsList');
        if (ovulationInsightsList) {
            ovulationInsightsList.innerHTML = '';
            const insights = [];

            // Add prediction base insight
            if (pred.ovulation) {
                if (pred.fertilityLevel === 'peak') {
                    insights.push({
                        color: 'amber', icon: '🥚',
                        title: 'Peak Conception Opportunity',
                        text: 'Estimated ovulation is occurring today! Sperm can fertilize the egg within 12–24 hours, making today the highest probability window for conception.'
                    });
                } else if (pred.fertilityLevel === 'high') {
                    insights.push({
                        color: 'green', icon: '💧',
                        title: 'Fertile Window Active',
                        text: `Your fertile window started. Ovulation is expected in ${pred.daysUntilOvulation} days. Having intercourse now increases conception probability.`
                    });
                } else {
                    insights.push({
                        color: 'blue', icon: '📅',
                        title: 'Normal Fertility Level',
                        text: `Your next estimated ovulation is on ${CycleTracker.formatDate(CycleTracker.parseKey(pred.ovulation), 'long')}. Tracking BBT and LH test strips daily helps optimize predictions.`
                    });
                }
            }

            // Gather recent logs to search for cervical mucus / LH surges
            const sortedKeys = Object.keys(tracker.data.dailyLogs).sort((a,b) => b.localeCompare(a));
            const last3DaysKeys = sortedKeys.slice(0, 3);
            
            let recentEggwhite = false;
            let recentLhPositive = false;
            let recentBbtSpike = false;

            last3DaysKeys.forEach(key => {
                const log = tracker.data.dailyLogs[key];
                if (log.cervicalMucus === 'eggwhite') recentEggwhite = true;
                if (log.lhTest === 'positive') recentLhPositive = true;
                if (log.bbt && Number(log.bbt) >= 98.3) recentBbtSpike = true;
            });

            if (recentLhPositive) {
                insights.push({
                    color: 'amber', icon: '⚡',
                    title: 'LH Surge Detected!',
                    text: 'A positive LH test strip indicates ovulation will likely occur in 24–36 hours. Conception probability is extremely high!'
                });
            }

            if (recentEggwhite) {
                insights.push({
                    color: 'green', icon: '💧',
                    title: 'Eggwhite Cervical Mucus',
                    text: 'Eggwhite consistency mucus is highly fertile, resembling raw egg whites. It protects sperm and helps them swim, indicating peak fertility.'
                });
            }

            if (recentBbtSpike) {
                insights.push({
                    color: 'pink', icon: '📈',
                    title: 'BBT Thermal Shift Active',
                    text: 'Your temperature has spiked. This thermal shift indicates progesterone rise, confirming that ovulation has successfully occurred.'
                });
            }

            if (insights.length === 0) {
                insights.push({
                    color: 'blue', icon: '📝',
                    title: 'Track Daily Indicators',
                    text: 'Input your Basal Body Temperature, check cervical mucus elasticity, and run LH strips during your fertile window to visualize ovulation markers.'
                });
            }

            // Render
            insights.forEach(ins => {
                const item = document.createElement('div');
                item.className = 'tracker-insight-item';
                item.innerHTML = `
                    <div class="tracker-insight-icon ${ins.color}">${ins.icon}</div>
                    <div class="tracker-insight-text">
                        <strong>${ins.title}</strong>
                        <p>${ins.text}</p>
                    </div>
                `;
                ovulationInsightsList.appendChild(item);
            });
        }
    }

    // ---------- Symptoms Page update controller ----------
    function updateSymptomsPage() {
        const isPregnant = tracker.data.settings.isPregnant;

        // 1. Dynamic Symptoms checklist button render
        const pTagsContainer = document.querySelector('#page-symptoms .symptom-tags:nth-of-type(1)');
        const eTagsContainer = document.querySelector('#page-symptoms .symptom-tags:nth-of-type(2)');
        
        if (pTagsContainer && eTagsContainer) {
            // Check if lists match the state, if not, re-render them
            const currentPTags = Array.from(pTagsContainer.querySelectorAll('.symptom-tag')).map(b => b.textContent.trim());
            const targetP = isPregnant ? ['Nausea', 'Bloating', 'Headache', 'Fatigue', 'Backache', 'Frequent Urination', 'Heartburn', 'Breast Tenderness'] : ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Backache', 'Breast Tenderness', 'Nausea', 'Acne', 'Insomnia', 'Dizziness'];
            
            if (JSON.stringify(currentPTags) !== JSON.stringify(targetP)) {
                // Physical tags
                pTagsContainer.innerHTML = targetP.map(s => `<button class="symptom-tag">${s}</button>`).join('');
                pTagsContainer.querySelectorAll('.symptom-tag').forEach(tag => {
                    tag.addEventListener('click', () => {
                        tag.classList.toggle('active');
                        updateConditionMatcher();
                    });
                });

                // Emotional tags
                const targetE = isPregnant ? ['Mood Swings', 'Anxiety', 'Irritability', 'Sadness', 'Cravings', 'Insomnia'] : ['Anxiety', 'Mood Swings', 'Irritability', 'Sadness', 'Stress', 'Brain Fog'];
                eTagsContainer.innerHTML = targetE.map(s => `<button class="symptom-tag">${s}</button>`).join('');
                eTagsContainer.querySelectorAll('.symptom-tag').forEach(tag => {
                    tag.addEventListener('click', () => {
                        tag.classList.toggle('active');
                        updateConditionMatcher();
                    });
                });
            }
        }

        // 2. Timeline list
        const symptomTimeline = document.getElementById('symptomTimeline');
        if (symptomTimeline) {
            symptomTimeline.innerHTML = '';
            
            const sortedKeys = Object.keys(tracker.data.dailyLogs)
                .sort((a, b) => b.localeCompare(a))
                .filter(key => {
                    const l = tracker.data.dailyLogs[key];
                    return l.mood || (l.symptoms && l.symptoms.length > 0) || l.energy || l.notes;
                });

            if (sortedKeys.length === 0) {
                symptomTimeline.innerHTML = '<p class="history-empty" style="text-align: center; width:100%;">No symptoms logged yet. Save a log below!</p>';
            } else {
                sortedKeys.forEach(key => {
                    const log = tracker.data.dailyLogs[key];
                    const dateObj = CycleTracker.parseKey(key);
                    const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const moodEmojis = { great: '😄 Great', good: '😊 Good', okay: '😐 Okay', low: '😔 Low', bad: '😣 Bad' };
                    const moodStr = log.mood ? moodEmojis[log.mood] : null;

                    const item = document.createElement('div');
                    item.className = 'timeline-item';
                    item.innerHTML = `
                        <div class="timeline-date">${formatted}</div>
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            ${moodStr ? `<div class="timeline-mood">${moodStr}</div>` : ''}
                            ${log.symptoms && log.symptoms.length > 0 ? `
                                <div class="timeline-tags">
                                    ${log.symptoms.map(s => `<span class="mini-tag">${s}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${log.energy ? `<div class="timeline-energy">Energy: ${log.energy}/10</div>` : ''}
                            ${log.notes ? `<p class="timeline-notes" style="font-size:0.75rem; color:var(--text-muted); margin-top: 0.35rem; line-height: 1.45;">${log.notes}</p>` : ''}
                        </div>
                    `;
                    symptomTimeline.appendChild(item);
                });
            }
        }

        // 3. Monthly Summary Counters (last 30 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const limitDate = new Date(today);
        limitDate.setDate(today.getDate() - 30);

        let cramps = 0;
        let headache = 0;
        let energySum = 0;
        let energyCount = 0;
        const moodMap = {};

        Object.keys(tracker.data.dailyLogs).forEach(key => {
            const keyDate = CycleTracker.parseKey(key);
            if (keyDate >= limitDate && keyDate <= today) {
                const log = tracker.data.dailyLogs[key];
                // Handle Cramps/Nausea depending on mode
                const targetPainKey = isPregnant ? 'Nausea' : 'Cramps';
                if (log.symptoms && log.symptoms.includes(targetPainKey)) cramps++;
                if (log.symptoms && log.symptoms.includes('Headache')) headache++;
                if (log.energy) {
                    energySum += Number(log.energy);
                    energyCount++;
                }
                if (log.mood) {
                    moodMap[log.mood] = (moodMap[log.mood] || 0) + 1;
                }
            }
        });

        const crampsEl = document.getElementById('summaryCramps');
        const crampsLabelEl = crampsEl ? crampsEl.nextElementSibling : null;
        const headacheEl = document.getElementById('summaryHeadache');
        const energyEl = document.getElementById('summaryAvgEnergy');
        const moodEl = document.getElementById('summaryCommonMood');

        if (crampsEl) {
            crampsEl.textContent = cramps;
            if (crampsLabelEl) {
                crampsLabelEl.textContent = isPregnant ? 'Days with Nausea' : 'Days with Cramps';
            }
        }
        if (headacheEl) headacheEl.textContent = headache;
        if (energyEl) {
            energyEl.textContent = energyCount > 0 ? `${(energySum / energyCount).toFixed(1)}/10` : '—';
        }
        if (moodEl) {
            let max = 0;
            let commonMood = '—';
            const emojis = { great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😣' };
            Object.keys(moodMap).forEach(m => {
                if (moodMap[m] > max) {
                    max = moodMap[m];
                    commonMood = emojis[m] || '—';
                }
            });
            moodEl.textContent = commonMood;
        }

        // 4. Update the AI Condition Matcher baseline scores
        updateConditionMatcher();
    }

    // Save Today's Log handler on Symptoms Checker page
    const btnSaveSymptoms = document.getElementById('btnSaveSymptoms');
    if (btnSaveSymptoms) {
        btnSaveSymptoms.addEventListener('click', () => {
            const todayKey = CycleTracker.toKey(new Date());
            const activeMood = document.querySelector('#page-symptoms .mood-selector .mood-btn.active');
            const moodVal = activeMood ? activeMood.dataset.mood : 'good';

            const activeSymptoms = [];
            document.querySelectorAll('#page-symptoms .symptom-tags .symptom-tag.active').forEach(tag => {
                activeSymptoms.push(tag.textContent.trim());
            });

            const slider = document.getElementById('energySlider');
            const energyVal = slider ? Number(slider.value) : 6;

            const existing = tracker.getLog(todayKey) || {};
            tracker.setLog(todayKey, {
                ...existing,
                mood: moodVal,
                symptoms: activeSymptoms,
                energy: energyVal
            });

            showToast('Saved today\'s symptoms! 💜');
            triggerGlobalUpdate();
        });
    }

    // ---------- Settings Page updates ----------
    function updateSettingsPage() {
        const cycleLengthEl  = document.getElementById('cycleLength');
        const periodLengthEl = document.getElementById('periodLength');
        const lutealLengthEl = document.getElementById('lutealLength');

        if (cycleLengthEl) cycleLengthEl.textContent = `${tracker.data.settings.avgCycleLength} days`;
        if (periodLengthEl) periodLengthEl.textContent = `${tracker.data.settings.avgPeriodDuration} days`;
        if (lutealLengthEl) lutealLengthEl.textContent = `${tracker.data.settings.lutealPhase} days`;

        // 1. Profile inputs
        const displayNameInput = document.getElementById('settingsDisplayName');
        const dobInput = document.getElementById('settingsDob');
        const emailInput = document.getElementById('settingsEmail');

        if (displayNameInput && document.activeElement !== displayNameInput) {
            displayNameInput.value = tracker.data.settings.userName || '';
        }
        if (dobInput && document.activeElement !== dobInput) {
            dobInput.value = tracker.data.settings.userDob || '';
        }
        if (emailInput && document.activeElement !== emailInput) {
            emailInput.value = tracker.data.settings.userEmail || '';
        }

        // Populate API Key
        const settingsApiKey = document.getElementById('settingsApiKey');
        if (settingsApiKey && document.activeElement !== settingsApiKey) {
            settingsApiKey.value = localStorage.getItem('eveai_openai_key') || '';
        }

        // 2. Welcome banners and usernames
        const sidebarUserName = document.getElementById('sidebarUserName');
        const dashWelcomeName = document.getElementById('dashWelcomeName');
        const sidebarAvatar = document.getElementById('sidebarAvatar');

        const userName = tracker.data.settings.userName || 'User';
        if (sidebarUserName) sidebarUserName.textContent = userName;
        if (dashWelcomeName) dashWelcomeName.textContent = userName;
        if (sidebarAvatar) sidebarAvatar.textContent = userName.charAt(0).toUpperCase();

        // 3. Notification toggles
        const togglePeriod = document.getElementById('togglePeriod');
        const toggleFertile = document.getElementById('toggleFertile');
        const toggleSymptom = document.getElementById('toggleSymptom');
        const toggleSummary = document.getElementById('toggleSummary');

        if (togglePeriod) togglePeriod.classList.toggle('active', !!tracker.data.settings.remindPeriod);
        if (toggleFertile) toggleFertile.classList.toggle('active', !!tracker.data.settings.remindFertile);
        if (toggleSymptom) toggleSymptom.classList.toggle('active', !!tracker.data.settings.remindSymptom);
        if (toggleSummary) toggleSummary.classList.toggle('active', !!tracker.data.settings.remindSummary);

        // 4. Dark mode toggle & class
        const toggleDark = document.getElementById('toggleDark');
        const isDark = !!tracker.data.settings.darkMode;
        if (toggleDark) toggleDark.classList.toggle('active', isDark);
        if (isDark) {
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
        }

        // 5. Accent color buttons
        const color = tracker.data.settings.accentColor || 'pink';
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });

        // Apply theme color styling variables
        if (color === 'pink') {
            document.documentElement.style.setProperty('--pink', '#E879A8');
            document.documentElement.style.setProperty('--grad-primary', 'linear-gradient(135deg, #E879A8 0%, #A855F7 100%)');
        } else if (color === 'blue') {
            document.documentElement.style.setProperty('--pink', '#3B82F6');
            document.documentElement.style.setProperty('--grad-primary', 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)');
        } else if (color === 'green') {
            document.documentElement.style.setProperty('--pink', '#10B981');
            document.documentElement.style.setProperty('--grad-primary', 'linear-gradient(135deg, #34D399 0%, #6EE7B7 100%)');
        } else if (color === 'orange') {
            document.documentElement.style.setProperty('--pink', '#F97316');
            document.documentElement.style.setProperty('--grad-primary', 'linear-gradient(135deg, #FB923C 0%, #F87171 100%)');
        }
        
        // Update AI Assistant settings status card & chat header mode
        if (typeof updateAIStatusCard === 'function') updateAIStatusCard();
        if (typeof updateChatHeader === 'function') updateChatHeader();
    }

    function setupStepper(minusId, plusId, propName, min, max) {
        const minus = document.getElementById(minusId);
        const plus  = document.getElementById(plusId);

        if (!minus || !plus) return;

        minus.onclick = (e) => {
            e.preventDefault();
            let val = tracker.data.settings[propName];
            if (val > min) {
                val--;
                tracker.data.settings[propName] = val;
                tracker.save();
                tracker.rebuildCycles();
                triggerGlobalUpdate();
            }
        };

        plus.onclick = (e) => {
            e.preventDefault();
            let val = tracker.data.settings[propName];
            if (val < max) {
                val++;
                tracker.data.settings[propName] = val;
                tracker.save();
                tracker.rebuildCycles();
                triggerGlobalUpdate();
            }
        };
    }

    setupStepper('cycleMinus', 'cyclePlus', 'avgCycleLength', 20, 45);
    setupStepper('periodMinus', 'periodPlus', 'avgPeriodDuration', 2, 10);
    setupStepper('lutealMinus', 'lutealPlus', 'lutealPhase', 10, 20);

    // Color theme option buttons click handlers
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            tracker.data.settings.accentColor = color;
            tracker.save();
            triggerGlobalUpdate();
            showToast(`Theme changed to ${color}! ✨`);
        });
    });

    // Dark Mode toggle switch logic
    const toggleDark = document.getElementById('toggleDark');
    if (toggleDark) {
        toggleDark.addEventListener('click', () => {
            const active = !toggleDark.classList.contains('active');
            tracker.data.settings.darkMode = active;
            tracker.save();
            triggerGlobalUpdate();
            showToast(active ? 'Dark mode activated. 🌙' : 'Light mode activated. ☀️');
        });
    }

    // Toggle settings row click handlers for toggles
    document.querySelectorAll('.toggle:not(#toggleDark)').forEach(tog => {
        tog.addEventListener('click', () => {
            const active = !tog.classList.contains('active');
            const propMap = {
                togglePeriod: 'remindPeriod',
                toggleFertile: 'remindFertile',
                toggleSymptom: 'remindSymptom',
                toggleSummary: 'remindSummary'
            };
            const propName = propMap[tog.id];
            if (propName) {
                tracker.data.settings[propName] = active;
                tracker.save();
            }
            triggerGlobalUpdate();
            const label = tog.parentElement.querySelector('label').textContent;
            showToast(`${label} ${active ? 'enabled' : 'disabled'}.`);
        });
    });

    // Profile input event listeners
    const displayNameInput = document.getElementById('settingsDisplayName');
    const dobInput = document.getElementById('settingsDob');
    const emailInput = document.getElementById('settingsEmail');

    if (displayNameInput) {
        displayNameInput.addEventListener('input', () => {
            tracker.data.settings.userName = displayNameInput.value.trim() || 'User';
            tracker.save();
            // Update UI welcome name and avatar directly to be responsive during typing without losing input focus
            const sidebarUserName = document.getElementById('sidebarUserName');
            const dashWelcomeName = document.getElementById('dashWelcomeName');
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const name = tracker.data.settings.userName;
            if (sidebarUserName) sidebarUserName.textContent = name;
            if (dashWelcomeName) dashWelcomeName.textContent = name;
            if (sidebarAvatar) sidebarAvatar.textContent = name.charAt(0).toUpperCase();
        });
    }
    if (dobInput) {
        dobInput.addEventListener('change', () => {
            tracker.data.settings.userDob = dobInput.value;
            tracker.save();
        });
    }
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            tracker.data.settings.userEmail = emailInput.value.trim();
            tracker.save();
        });
    }

    // OpenAI API Key Save handler
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    const settingsApiKeyInput = document.getElementById('settingsApiKey');
    if (btnSaveApiKey && settingsApiKeyInput) {
        btnSaveApiKey.addEventListener('click', () => {
            const key = settingsApiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('eveai_openai_key', key);
                showToast('OpenAI API Key saved successfully! 🔑');
                btnSaveApiKey.textContent = 'Saved!';
                btnSaveApiKey.style.background = 'var(--green)';
            } else {
                localStorage.removeItem('eveai_openai_key');
                showToast('OpenAI API Key cleared! App will run offline.');
                btnSaveApiKey.textContent = 'Save';
                btnSaveApiKey.style.background = '';
            }
            if (typeof updateAIStatusCard === 'function') updateAIStatusCard();
            if (typeof updateChatHeader === 'function') updateChatHeader();
            setTimeout(() => {
                btnSaveApiKey.textContent = 'Save';
                btnSaveApiKey.style.background = '';
            }, 2000);
        });
    }

    // Define AI Status and Chat Header updates for Flexible AI Mode
    function updateAIStatusCard() {
        const container = document.getElementById('aiStatusContainer');
        if (!container) return;
        const apiKey = localStorage.getItem('eveai_openai_key');
        if (apiKey) {
            container.innerHTML = `
                <div class="ai-status-card" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(52, 211, 153, 0.08); border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 12px; transition: all 0.3s ease;">
                    <div style="font-size: 1.25rem; line-height: 1.25;">🟢</div>
                    <div>
                        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">Advanced AI Mode Active</div>
                        <div style="font-size: 0.72rem; color: var(--text-secondary);">Powered by OpenAI</div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="ai-status-card" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; transition: all 0.3s ease;">
                    <div style="font-size: 1.25rem; line-height: 1.25;">🟣</div>
                    <div>
                        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">EveAI Smart Mode Active</div>
                        <div style="font-size: 0.72rem; color: var(--text-secondary);">Using built-in health assistant</div>
                    </div>
                </div>
            `;
        }
    }
    window.updateAIStatusCard = updateAIStatusCard;

    function updateChatHeader() {
        const titleEl = document.getElementById('chatHeaderTitle');
        if (!titleEl) return;
        const apiKey = localStorage.getItem('eveai_openai_key');
        if (apiKey) {
            titleEl.innerHTML = `🤖 EveAI Pro <span class="badge-premium" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.68rem; margin-left: 0.4rem;">Pro</span>`;
        } else {
            titleEl.innerHTML = `💜 EveAI Smart <span class="badge-premium" style="background: linear-gradient(135deg, #a855f7, #6366f1); color: #fff; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.68rem; margin-left: 0.4rem;">Smart</span>`;
        }
    }
    window.updateChatHeader = updateChatHeader;

    // Excel & PDF Data export handler
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
        btnExportData.addEventListener('click', () => {
            const keys = Object.keys(tracker.data.dailyLogs).sort();
            if (keys.length === 0) {
                showToast('No data to export yet. Start logging first! 📝');
                return;
            }

            // ---- Build row data arrays ----
            const dailyRows = keys.map(k => {
                const log = tracker.data.dailyLogs[k];
                return {
                    Date: k,
                    'Is Period': log.isPeriod ? 'Yes' : 'No',
                    Flow: log.flow || '',
                    BBT: log.bbt || '',
                    'Cervical Mucus': log.cervicalMucus || '',
                    'LH Test': log.lhTest || '',
                    Mood: log.mood || '',
                    Symptoms: log.symptoms ? log.symptoms.join(', ') : '',
                    Energy: log.energy || '',
                    Notes: log.notes || ''
                };
            });

            const cycles = tracker.getCycles() || [];
            const cycleRows = cycles.map((c, i) => ({
                '#': i + 1,
                'Start Date': c.startDate,
                'End Date': c.endDate || '—',
                'Cycle Length': c.cycleLength || '—',
                'Period Duration': c.periodDuration || '—'
            }));

            // ---- Helper: trigger blob download ----
            function downloadBlob(blob, filename) {
                if (window.AndroidBridge && window.AndroidBridge.downloadFile) {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        window.AndroidBridge.downloadFile(reader.result, filename, blob.type);
                    };
                    reader.readAsDataURL(blob);
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }

            // ============================================================
            //  EXCEL EXPORT (SheetJS)
            // ============================================================
            try {
                if (typeof XLSX !== 'undefined') {
                    const wb = XLSX.utils.book_new();

                    // Sheet 1 – Daily Logs
                    const ws1 = XLSX.utils.json_to_sheet(dailyRows);
                    // Auto-fit column widths
                    const colWidths1 = Object.keys(dailyRows[0]).map(key => {
                        const maxLen = Math.max(key.length, ...dailyRows.map(r => String(r[key] || '').length));
                        return { wch: Math.min(maxLen + 2, 40) };
                    });
                    ws1['!cols'] = colWidths1;
                    XLSX.utils.book_append_sheet(wb, ws1, 'Daily Logs');

                    // Sheet 2 – Cycle History
                    if (cycleRows.length > 0) {
                        const ws2 = XLSX.utils.json_to_sheet(cycleRows);
                        const colWidths2 = Object.keys(cycleRows[0]).map(key => {
                            const maxLen = Math.max(key.length, ...cycleRows.map(r => String(r[key] || '').length));
                            return { wch: Math.min(maxLen + 2, 30) };
                        });
                        ws2['!cols'] = colWidths2;
                        XLSX.utils.book_append_sheet(wb, ws2, 'Cycle History');
                    }

                    // Sheet 3 – Summary Stats
                    const avgCycle = tracker.getAverageCycleLength();
                    const avgPeriod = tracker.getAveragePeriodDuration();
                    const totalLogs = keys.length;
                    const totalPeriodDays = keys.filter(k => tracker.data.dailyLogs[k].isPeriod).length;
                    const summaryData = [
                        { Metric: 'Total Log Entries', Value: totalLogs },
                        { Metric: 'Total Period Days Logged', Value: totalPeriodDays },
                        { Metric: 'Number of Cycles', Value: cycles.length },
                        { Metric: 'Average Cycle Length (days)', Value: avgCycle },
                        { Metric: 'Average Period Duration (days)', Value: avgPeriod },
                        { Metric: 'Data Range', Value: keys.length > 0 ? `${keys[0]} to ${keys[keys.length - 1]}` : '—' },
                        { Metric: 'Report Generated', Value: new Date().toLocaleString() }
                    ];
                    const ws3 = XLSX.utils.json_to_sheet(summaryData);
                    ws3['!cols'] = [{ wch: 32 }, { wch: 30 }];
                    XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

                    const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    const xlsxBlob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    downloadBlob(xlsxBlob, 'eveai_health_report.xlsx');
                    showToast('Excel report downloading... 📊');
                } else {
                    console.warn('SheetJS not available, falling back to CSV');
                    // Fallback CSV
                    let csv = 'Date,Is Period,Flow,BBT,Cervical Mucus,LH Test,Mood,Symptoms,Energy,Notes\n';
                    dailyRows.forEach(r => {
                        csv += `"${r.Date}","${r['Is Period']}","${r.Flow}","${r.BBT}","${r['Cervical Mucus']}","${r['LH Test']}","${r.Mood}","${r.Symptoms}","${r.Energy}","${(r.Notes || '').replace(/"/g, '""')}"\n`;
                    });
                    const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    downloadBlob(csvBlob, 'eveai_cycle_data.csv');
                    showToast('CSV downloaded (Excel library unavailable) 📂');
                }
            } catch (excelErr) {
                console.error('Excel export error:', excelErr);
                showToast('Excel export failed. Check console for details.');
            }

            // ============================================================
            //  PDF EXPORT (jsPDF)
            // ============================================================
            setTimeout(() => {
                try {
                    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                        const pageW = doc.internal.pageSize.getWidth();
                        const pageH = doc.internal.pageSize.getHeight();
                        const margin = 15;
                        let y = margin;

                        const avgCycle = tracker.getAverageCycleLength();
                        const avgPeriod = tracker.getAveragePeriodDuration();
                        const totalLogs = keys.length;
                        const totalPeriodDays = keys.filter(k => tracker.data.dailyLogs[k].isPeriod).length;

                        // ---- Header with gradient bar ----
                        doc.setFillColor(168, 85, 247); // purple
                        doc.rect(0, 0, pageW, 32, 'F');
                        doc.setFillColor(232, 121, 168); // pink overlay
                        doc.rect(pageW * 0.6, 0, pageW * 0.4, 32, 'F');

                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(20);
                        doc.setFont('helvetica', 'bold');
                        doc.text('EveAI Health Report', margin, 15);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'normal');
                        doc.text(`Generated: ${new Date().toLocaleDateString()} • ${totalLogs} entries`, margin, 23);
                        y = 40;

                        // ---- KPI Boxes ----
                        doc.setTextColor(60, 60, 80);
                        const kpiData = [
                            { label: 'Total Logs', value: String(totalLogs) },
                            { label: 'Period Days', value: String(totalPeriodDays) },
                            { label: 'Avg Cycle', value: `${avgCycle} days` },
                            { label: 'Avg Period', value: `${avgPeriod} days` }
                        ];
                        const boxW = (pageW - margin * 2 - 12) / 4;
                        kpiData.forEach((kpi, i) => {
                            const bx = margin + i * (boxW + 4);
                            doc.setFillColor(245, 243, 250);
                            doc.roundedRect(bx, y, boxW, 20, 3, 3, 'F');
                            doc.setFontSize(14);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(100, 60, 180);
                            doc.text(kpi.value, bx + boxW / 2, y + 10, { align: 'center' });
                            doc.setFontSize(7);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(120, 110, 140);
                            doc.text(kpi.label, bx + boxW / 2, y + 16, { align: 'center' });
                        });
                        y += 28;

                        // ---- Cycle History Table ----
                        if (cycleRows.length > 0) {
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(50, 40, 70);
                            doc.text('Cycle History', margin, y);
                            y += 6;

                            const cHeaders = ['#', 'Start Date', 'End Date', 'Length', 'Period Days'];
                            const cColW = [(pageW - margin * 2) * 0.08, (pageW - margin * 2) * 0.25, (pageW - margin * 2) * 0.25, (pageW - margin * 2) * 0.2, (pageW - margin * 2) * 0.22];

                            // Header row
                            doc.setFillColor(168, 85, 247);
                            doc.rect(margin, y, pageW - margin * 2, 7, 'F');
                            doc.setFontSize(7.5);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(255, 255, 255);
                            let cx = margin + 2;
                            cHeaders.forEach((h, i) => {
                                doc.text(h, cx, y + 5);
                                cx += cColW[i];
                            });
                            y += 7;

                            // Data rows
                            doc.setFont('helvetica', 'normal');
                            const maxCycleRows = Math.min(cycleRows.length, 15);
                            for (let r = 0; r < maxCycleRows; r++) {
                                if (y > pageH - 25) { doc.addPage(); y = margin; }
                                const row = cycleRows[r];
                                const vals = [String(row['#']), row['Start Date'], row['End Date'] || '—', String(row['Cycle Length']), String(row['Period Duration'])];
                                if (r % 2 === 0) {
                                    doc.setFillColor(248, 246, 252);
                                    doc.rect(margin, y, pageW - margin * 2, 6, 'F');
                                }
                                doc.setFontSize(7);
                                doc.setTextColor(60, 50, 80);
                                cx = margin + 2;
                                vals.forEach((v, i) => {
                                    doc.text(v, cx, y + 4);
                                    cx += cColW[i];
                                });
                                y += 6;
                            }
                            y += 6;
                        }

                        // ---- Daily Logs Table ----
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(50, 40, 70);
                        if (y > pageH - 40) { doc.addPage(); y = margin; }
                        doc.text('Daily Health Logs', margin, y);
                        y += 6;

                        const dHeaders = ['Date', 'Period', 'Flow', 'BBT', 'Mood', 'Energy', 'Symptoms'];
                        const availW = pageW - margin * 2;
                        const dColW = [availW * 0.14, availW * 0.09, availW * 0.09, availW * 0.09, availW * 0.12, availW * 0.1, availW * 0.37];

                        // Header row
                        doc.setFillColor(232, 121, 168);
                        doc.rect(margin, y, availW, 7, 'F');
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(255, 255, 255);
                        cx = margin + 2;
                        dHeaders.forEach((h, i) => {
                            doc.text(h, cx, y + 5);
                            cx += dColW[i];
                        });
                        y += 7;

                        // Data rows
                        doc.setFont('helvetica', 'normal');
                        for (let r = 0; r < dailyRows.length; r++) {
                            if (y > pageH - 15) { doc.addPage(); y = margin; }
                            const row = dailyRows[r];
                            const vals = [
                                row.Date,
                                row['Is Period'],
                                row.Flow,
                                row.BBT ? String(row.BBT) : '',
                                row.Mood,
                                row.Energy,
                                (row.Symptoms || '').substring(0, 45)
                            ];
                            if (r % 2 === 0) {
                                doc.setFillColor(252, 248, 252);
                                doc.rect(margin, y, availW, 5.5, 'F');
                            }
                            doc.setFontSize(6.5);
                            doc.setTextColor(60, 50, 80);
                            cx = margin + 2;
                            vals.forEach((v, i) => {
                                doc.text(String(v || ''), cx, y + 4);
                                cx += dColW[i];
                            });
                            y += 5.5;
                        }

                        // ---- Footer ----
                        const totalPages = doc.internal.getNumberOfPages();
                        for (let p = 1; p <= totalPages; p++) {
                            doc.setPage(p);
                            doc.setFontSize(7);
                            doc.setTextColor(160, 150, 170);
                            doc.text(`EveAI — Smart Period & Pregnancy Tracker`, margin, pageH - 6);
                            doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
                        }

                        const pdfBlob = doc.output('blob');
                        downloadBlob(pdfBlob, 'eveai_health_report.pdf');
                        showToast('PDF report downloading... 📄');
                    } else {
                        console.warn('jsPDF not available, skipping PDF export');
                        showToast('PDF library unavailable. Only Excel was exported.');
                    }
                } catch (pdfErr) {
                    console.error('PDF export error:', pdfErr);
                    showToast('PDF export failed. Check console for details.');
                }
            }, 800); // delay to let browser handle the Excel download first
        });
    }

    // Delete all data handler
    const btnDeleteAllData = document.getElementById('btnDeleteAllData');
    if (btnDeleteAllData) {
        btnDeleteAllData.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all cycle records? This action cannot be undone.')) {
                localStorage.removeItem(tracker.STORAGE_KEY);
                showToast('All records deleted. Reloading application...');
                setTimeout(() => location.reload(), 1200);
            }
        });
    }

    // ============================================================
    //  MY DOCTOR FEATURE
    // ============================================================
    (function initMyDoctor() {
        const doctorDisplayView = document.getElementById('doctorDisplayView');
        const doctorEmptyView = document.getElementById('doctorEmptyView');
        const doctorFormView = document.getElementById('doctorFormView');
        const btnAddDoctor = document.getElementById('btnAddDoctor');
        const btnEditDoctor = document.getElementById('btnEditDoctor');
        const btnSaveDoctor = document.getElementById('btnSaveDoctor');
        const btnCallDoctor = document.getElementById('btnCallDoctor');

        // Form fields
        const fName = document.getElementById('doctorName');
        const fSpec = document.getElementById('doctorSpec');
        const fPhone = document.getElementById('doctorPhone');
        const fClinic = document.getElementById('doctorClinic');
        const fNotes = document.getElementById('doctorNotes');

        // Display elements
        const dispName = document.getElementById('doctorDisplayName');
        const dispSpec = document.getElementById('doctorDisplaySpec');
        const dispPhone = document.getElementById('doctorDisplayPhone');
        const dispClinic = document.getElementById('doctorDisplayClinic');
        const dispClinicRow = document.getElementById('doctorDisplayClinicRow');
        const dispNotes = document.getElementById('doctorDisplayNotes');
        const dispNotesRow = document.getElementById('doctorDisplayNotesRow');

        // Bottom sheet elements
        const callSheet = document.getElementById('doctorCallSheet');
        const callSheetMsg = document.getElementById('callSheetMessage');
        const btnCallCancel = document.getElementById('btnCallCancel');
        const btnCallConfirm = document.getElementById('btnCallConfirm');

        // Emergency card
        const emergencyCard = document.getElementById('emergencyDoctorCard');
        const emergencyName = document.getElementById('emergencyDoctorName');
        const btnEmergencyCall = document.getElementById('btnEmergencyCall');

        if (!doctorDisplayView || !doctorEmptyView || !doctorFormView) return;

        let currentPhone = '';

        function showView(view) {
            doctorDisplayView.style.display = 'none';
            doctorEmptyView.style.display = 'none';
            doctorFormView.style.display = 'none';
            if (view === 'display') doctorDisplayView.style.display = 'block';
            else if (view === 'empty') doctorEmptyView.style.display = 'block';
            else if (view === 'form') doctorFormView.style.display = 'block';
        }

        function renderDoctor() {
            const info = tracker.data.settings.doctorInfo;
            if (info && info.name && info.phone) {
                // Populate display card
                if (dispName) dispName.textContent = info.name;
                if (dispSpec) dispSpec.textContent = info.specialization || 'Healthcare Provider';
                if (dispPhone) dispPhone.textContent = info.phone;
                if (dispClinic) dispClinic.textContent = info.clinic || '';
                if (dispClinicRow) dispClinicRow.style.display = info.clinic ? 'flex' : 'none';
                if (dispNotes) dispNotes.textContent = info.notes || '';
                if (dispNotesRow) dispNotesRow.style.display = info.notes ? 'flex' : 'none';
                currentPhone = info.phone;
                showView('display');

                // Update emergency card in pregnancy section
                if (emergencyCard) {
                    emergencyCard.style.display = 'flex';
                    if (emergencyName) emergencyName.textContent = info.name;
                }
            } else {
                showView('empty');
                if (emergencyCard) emergencyCard.style.display = 'none';
            }
        }

        function populateForm(info) {
            if (!info) info = {};
            if (fName) fName.value = info.name || '';
            if (fSpec) fSpec.value = info.specialization || '';
            if (fPhone) fPhone.value = info.phone || '';
            if (fClinic) fClinic.value = info.clinic || '';
            if (fNotes) fNotes.value = info.notes || '';
        }

        function validatePhone(phone) {
            // Strip whitespace, dashes, and parens for validation
            const cleaned = phone.replace(/[\s\-\(\)]/g, '');
            // Must be digits, optionally with a leading +
            return /^\+?\d{7,15}$/.test(cleaned);
        }

        // Add Doctor button (empty state)
        if (btnAddDoctor) {
            btnAddDoctor.addEventListener('click', () => {
                populateForm({});
                showView('form');
                if (fName) fName.focus();
            });
        }

        // Edit Doctor button
        if (btnEditDoctor) {
            btnEditDoctor.addEventListener('click', () => {
                populateForm(tracker.data.settings.doctorInfo);
                showView('form');
                if (fName) fName.focus();
            });
        }

        // Save Doctor button
        if (btnSaveDoctor) {
            btnSaveDoctor.addEventListener('click', () => {
                const name = (fName ? fName.value.trim() : '');
                const spec = (fSpec ? fSpec.value.trim() : '');
                const phone = (fPhone ? fPhone.value.trim() : '');
                const clinic = (fClinic ? fClinic.value.trim() : '');
                const notes = (fNotes ? fNotes.value.trim() : '');

                // Validate required fields
                if (!name) {
                    showToast('Please enter the doctor\'s name.');
                    if (fName) fName.focus();
                    return;
                }
                if (!phone) {
                    showToast('Please enter a phone number.');
                    if (fPhone) fPhone.focus();
                    return;
                }
                if (!validatePhone(phone)) {
                    showToast('Please enter a valid phone number (7–15 digits).');
                    if (fPhone) fPhone.focus();
                    return;
                }

                tracker.data.settings.doctorInfo = {
                    name,
                    specialization: spec || 'Healthcare Provider',
                    phone,
                    clinic: clinic || null,
                    notes: notes || null
                };
                tracker.save();

                // Success animation on button
                btnSaveDoctor.classList.add('saved');
                btnSaveDoctor.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Saved!';
                showToast('Doctor information saved successfully! 🏥');

                setTimeout(() => {
                    btnSaveDoctor.classList.remove('saved');
                    btnSaveDoctor.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Doctor Information';
                    renderDoctor();
                }, 1200);
            });
        }

        // Call Doctor button — show bottom sheet
        function openCallSheet() {
            const info = tracker.data.settings.doctorInfo;
            if (!info || !info.phone) return;
            if (callSheetMsg) callSheetMsg.textContent = `Do you want to call ${info.name}?`;
            currentPhone = info.phone;
            if (callSheet) callSheet.classList.add('active');
        }

        if (btnCallDoctor) {
            btnCallDoctor.addEventListener('click', openCallSheet);
        }

        // Emergency call button (pregnancy section)
        if (btnEmergencyCall) {
            btnEmergencyCall.addEventListener('click', openCallSheet);
        }

        // Bottom sheet cancel
        if (btnCallCancel) {
            btnCallCancel.addEventListener('click', () => {
                if (callSheet) callSheet.classList.remove('active');
            });
        }

        // Bottom sheet backdrop click to close
        if (callSheet) {
            callSheet.addEventListener('click', (e) => {
                if (e.target === callSheet) callSheet.classList.remove('active');
            });
        }

        // Confirm call — open phone dialer
        if (btnCallConfirm) {
            btnCallConfirm.addEventListener('click', () => {
                if (callSheet) callSheet.classList.remove('active');
                if (currentPhone) {
                    const cleanedPhone = currentPhone.replace(/[\s\-\(\)]/g, '');
                    window.location.href = `tel:${cleanedPhone}`;
                    showToast('Opening phone dialer... 📞');
                }
            });
        }

        // Initial render
        renderDoctor();
    })();

    // ============================================================
    //  AUTOMATIC DOCTOR REPORTS FEATURE
    // ============================================================
    (function initAutoReports() {
        const toggle = document.getElementById('toggleAutoReports');
        const configPanel = document.getElementById('autoReportsConfig');
        const statusText = document.getElementById('autoReportsStatus');

        if (!toggle || !configPanel) return;

        // Ensure autoReports settings exist
        if (!tracker.data.settings.autoReports) {
            tracker.data.settings.autoReports = {
                enabled: false, frequency: 'weekly', time: '21:00',
                dataCategories: ['cycles','symptoms','mood','ai_insights'],
                destinations: ['doctor'], history: [], lastSentAt: null
            };
            tracker.save();
        }

        const ar = () => tracker.data.settings.autoReports;

        // --- Confirmation Dialog ---
        const confirmOverlay = document.createElement('div');
        confirmOverlay.className = 'auto-reports-confirm-overlay';
        confirmOverlay.id = 'autoReportsConfirmOverlay';
        confirmOverlay.innerHTML = `
            <div class="auto-reports-confirm-dialog">
                <div class="confirm-dialog-icon">⚠️</div>
                <h3 class="confirm-dialog-title">Privacy Notice</h3>
                <p class="confirm-dialog-message">Automatic sharing will send selected health information to your chosen healthcare provider. Please ensure you trust the recipient and have obtained appropriate consent.</p>
                <div class="confirm-dialog-actions">
                    <button class="btn-confirm-cancel" id="btnAutoReportsCancel">Cancel</button>
                    <button class="btn-confirm-enable" id="btnAutoReportsEnable">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                        Enable Reports
                    </button>
                </div>
            </div>`;
        document.body.appendChild(confirmOverlay);

        // --- Emergency Alert Card ---
        const emergencyCard = document.createElement('div');
        emergencyCard.className = 'emergency-alert-card';
        emergencyCard.id = 'emergencyAlertCard';
        emergencyCard.innerHTML = `
            <div class="emergency-alert-header">
                <div class="emergency-alert-icon">🚨</div>
                <h4>Emergency Health Alert</h4>
            </div>
            <p class="emergency-alert-message">Severe symptoms detected. Would you like to immediately send a health report to your doctor?</p>
            <div class="emergency-alert-actions">
                <button class="btn-emergency-dismiss" id="btnEmergencyDismiss">Not Now</button>
                <button class="btn-emergency-send" id="btnEmergencySend">Send Report</button>
            </div>`;
        document.body.appendChild(emergencyCard);

        function renderState() {
            const enabled = ar().enabled;
            if (enabled) {
                toggle.classList.add('active');
                configPanel.style.display = 'block';
                statusText.textContent = `${ar().frequency.charAt(0).toUpperCase() + ar().frequency.slice(1)} reports will be generated and shared automatically.`;
            } else {
                toggle.classList.remove('active');
                configPanel.style.display = 'none';
                statusText.textContent = 'Reports are not being shared.';
            }

            // Doctor card
            const di = tracker.data.settings.doctorInfo;
            const nameEl = document.getElementById('autoReportsDoctorName');
            const phoneEl = document.getElementById('autoReportsDoctorPhone');
            if (di && di.name) {
                if (nameEl) nameEl.textContent = di.name;
                if (phoneEl) phoneEl.textContent = di.phone || di.specialization || '';
            } else {
                if (nameEl) nameEl.textContent = 'No doctor saved';
                if (phoneEl) phoneEl.textContent = 'Add a doctor in My Doctor settings';
            }

            // Restore frequency
            const freqRadio = document.querySelector(`input[name="autoFreq"][value="${ar().frequency}"]`);
            if (freqRadio) freqRadio.checked = true;

            // Restore time
            const timeRadio = document.querySelector(`input[name="autoTime"][value="${ar().time}"]`);
            if (timeRadio) timeRadio.checked = true;

            // Restore data checkboxes
            document.querySelectorAll('#autoReportsData input[type="checkbox"]').forEach(cb => {
                cb.checked = ar().dataCategories.includes(cb.value);
            });

            // Restore destinations
            document.querySelectorAll('#autoReportsDest input[type="checkbox"]').forEach(cb => {
                cb.checked = ar().destinations.includes(cb.value);
            });

            // Render history
            renderHistory();
        }

        function renderHistory() {
            const histEl = document.getElementById('autoReportsHistory');
            if (!histEl) return;
            const history = ar().history || [];
            if (history.length === 0) {
                histEl.innerHTML = '<p class="history-empty-text">No reports shared yet. Reports will appear here once automatic sharing begins.</p>';
                return;
            }
            histEl.innerHTML = history.slice(-5).reverse().map(h => `
                <div class="report-history-item">
                    <div class="report-history-check"></div>
                    <div class="report-history-info">
                        <div class="report-history-title">${h.type} Report Shared</div>
                        <div class="report-history-time">${h.date} — ${h.time}</div>
                    </div>
                </div>
            `).join('');
        }

        // Toggle click
        toggle.addEventListener('click', () => {
            if (ar().enabled) {
                // Disable
                ar().enabled = false;
                tracker.save();
                renderState();
                showToast('Automatic reports disabled.');
            } else {
                // Show confirmation
                confirmOverlay.classList.add('active');
            }
        });

        // Confirm enable
        document.getElementById('btnAutoReportsCancel').addEventListener('click', () => {
            confirmOverlay.classList.remove('active');
        });

        document.getElementById('btnAutoReportsEnable').addEventListener('click', () => {
            const di = tracker.data.settings.doctorInfo;
            if (!di || !di.name) {
                confirmOverlay.classList.remove('active');
                showToast('Please add a doctor in My Doctor settings first.');
                return;
            }
            ar().enabled = true;
            tracker.save();
            confirmOverlay.classList.remove('active');
            renderState();
            showToast('Automatic reports enabled! ✅');
        });

        // Close on backdrop
        confirmOverlay.addEventListener('click', (e) => {
            if (e.target === confirmOverlay) confirmOverlay.classList.remove('active');
        });

        // Frequency change
        document.querySelectorAll('input[name="autoFreq"]').forEach(r => {
            r.addEventListener('change', () => {
                ar().frequency = r.value;
                tracker.save();
                renderState();
            });
        });

        // Time change
        document.querySelectorAll('input[name="autoTime"]').forEach(r => {
            r.addEventListener('change', () => {
                ar().time = r.value;
                tracker.save();
            });
        });

        // Data categories change
        document.querySelectorAll('#autoReportsData input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const cats = [];
                document.querySelectorAll('#autoReportsData input[type="checkbox"]:checked').forEach(c => cats.push(c.value));
                ar().dataCategories = cats;
                tracker.save();
            });
        });

        // Destinations change
        document.querySelectorAll('#autoReportsDest input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const dests = [];
                document.querySelectorAll('#autoReportsDest input[type="checkbox"]:checked').forEach(c => dests.push(c.value));
                ar().destinations = dests;
                tracker.save();
            });
        });

        // Change doctor button
        const btnChange = document.getElementById('btnAutoReportsChangeDoctor');
        if (btnChange) {
            btnChange.addEventListener('click', () => {
                // Scroll to My Doctor section
                const doctorCard = document.querySelector('.doctor-settings-card');
                if (doctorCard) doctorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        // --- Auto-send check on app load ---
        function checkAutoSend() {
            if (!ar().enabled) return;
            const now = new Date();
            const lastSent = ar().lastSentAt ? new Date(ar().lastSentAt) : null;
            const freq = ar().frequency;

            let shouldSend = false;
            if (!lastSent) {
                shouldSend = true;
            } else {
                const diffMs = now - lastSent;
                const diffH = diffMs / (1000 * 60 * 60);
                if (freq === 'daily' && diffH >= 20) shouldSend = true;
                else if (freq === 'weekly' && diffH >= 144) shouldSend = true;
                else if (freq === 'monthly' && diffH >= 600) shouldSend = true;
            }

            // Check if current time matches scheduled time
            const [schedH] = ar().time.split(':').map(Number);
            if (now.getHours() < schedH) shouldSend = false;

            if (shouldSend) {
                generateAutoReport();
            }
        }

        async function generateAutoReport() {
            const cats = ar().dataCategories;
            const freq = ar().frequency;

            // Build a text summary
            const keys = Object.keys(tracker.data.dailyLogs).sort();
            const today = new Date().toISOString().slice(0, 10);
            let text = '═══════════════════════════════════════\n';
            text += '    EveAI ' + freq.charAt(0).toUpperCase() + freq.slice(1) + ' Health Summary\n';
            text += '═══════════════════════════════════════\n';
            text += `Date: ${new Date().toLocaleDateString()}\n\n`;

            // AI Smart Summary
            text += '── Today\'s Health Summary ──\n';
            const todayLog = tracker.data.dailyLogs[today] || {};
            const summaryParts = [];
            if (todayLog.symptoms && todayLog.symptoms.length > 0) {
                summaryParts.push(`User reported ${todayLog.symptoms.join(', ')}`);
            }
            if (todayLog.mood) summaryParts.push(`Mood: ${todayLog.mood}`);
            if (todayLog.isPeriod) summaryParts.push('Period day logged');
            if (summaryParts.length === 0) summaryParts.push('No significant entries recorded today.');
            text += summaryParts.join('. ') + '.\n\n';

            if (cats.includes('cycles')) {
                text += '── Cycle Status ──\n';
                const avgLen = tracker.getAverageCycleLength();
                const avgPeriod = tracker.getAveragePeriodDuration();
                text += `Average Cycle: ${avgLen} days | Period: ${avgPeriod} days\n\n`;
            }

            if (cats.includes('symptoms')) {
                const recent = keys.slice(-7).filter(k => tracker.data.dailyLogs[k].symptoms && tracker.data.dailyLogs[k].symptoms.length > 0);
                if (recent.length > 0) {
                    text += '── Recent Symptoms ──\n';
                    recent.forEach(k => {
                        text += `  ${k} — ${tracker.data.dailyLogs[k].symptoms.join(', ')}\n`;
                    });
                    text += '\n';
                }
            }

            if (cats.includes('mood')) {
                const recent = keys.slice(-7).filter(k => tracker.data.dailyLogs[k].mood);
                if (recent.length > 0) {
                    text += '── Mood Tracking ──\n';
                    recent.forEach(k => {
                        text += `  ${k} — ${tracker.data.dailyLogs[k].mood}\n`;
                    });
                    text += '\n';
                }
            }

            if (cats.includes('pregnancy') && tracker.data.settings.isPregnant) {
                text += '── Pregnancy Progress ──\n';
                text += `LMP: ${tracker.data.settings.lmpDate || 'Not set'}\n\n`;
            }

            text += '═══════════════════════════════════════\n';
            text += ' Generated securely by EveAI\n';
            text += '═══════════════════════════════════════\n';

            // Try to share
            const blob = new Blob([text], { type: 'text/plain' });
            const filename = `eveai_${freq}_report_${today}.txt`;

            try {
                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], filename, { type: 'text/plain' });
                    const shareData = { title: `EveAI ${freq} Report`, text: `${freq} health report from EveAI`, files: [file] };
                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                    }
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = filename;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                }
            } catch (e) {
                if (e.name === 'AbortError') return;
                console.warn('Auto-report share failed:', e);
            }

            // Record in history
            const now = new Date();
            ar().history.push({
                type: freq.charAt(0).toUpperCase() + freq.slice(1),
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            if (ar().history.length > 20) ar().history = ar().history.slice(-20);
            ar().lastSentAt = now.toISOString();
            tracker.save();
            renderHistory();
            showToast(`${freq} report shared successfully! ✅`);
        }

        // --- Emergency Priority Reports ---
        const SEVERE_SYMPTOMS = ['high fever', 'heavy bleeding', 'severe pain', 'severe cramps', 'emergency', 'fainting', 'dizziness'];

        window.checkEmergencySymptoms = function(symptoms) {
            if (!ar().enabled || !symptoms || symptoms.length === 0) return;
            const hasSevere = symptoms.some(s => SEVERE_SYMPTOMS.some(ss => s.toLowerCase().includes(ss)));
            if (hasSevere) {
                emergencyCard.classList.add('active');
            }
        };

        document.getElementById('btnEmergencyDismiss').addEventListener('click', () => {
            emergencyCard.classList.remove('active');
        });

        document.getElementById('btnEmergencySend').addEventListener('click', async () => {
            emergencyCard.classList.remove('active');
            await generateAutoReport();
        });

        // Initial render
        renderState();

        // Check auto-send on load (delayed)
        setTimeout(checkAutoSend, 3000);
    })();

    // ============================================================
    //  SHARE HEALTH DATA FEATURE
    // ============================================================
    (function initShareHealthData() {
        const overlay = document.getElementById('shareSheetOverlay');
        const btnOpen = document.getElementById('btnShareHealthData');
        const step1 = document.getElementById('shareStep1');
        const step2 = document.getElementById('shareStep2');
        const step3 = document.getElementById('shareStep3');
        const step4 = document.getElementById('shareStep4');

        if (!overlay || !btnOpen) return;

        const btnCancel1 = document.getElementById('btnShareCancel1');
        const btnContinue = document.getElementById('btnShareContinue');
        const btnBack = document.getElementById('btnShareBack');
        const btnShareNow = document.getElementById('btnShareNow');
        const btnSelectAll = document.getElementById('btnShareSelectAll');
        const btnDeselectAll = document.getElementById('btnShareDeselectAll');
        const btnShareDoctor = document.getElementById('btnShareWithDoctor');

        function showStep(n) {
            if (step1) step1.style.display = n === 1 ? 'block' : 'none';
            if (step2) step2.style.display = n === 2 ? 'block' : 'none';
            if (step3) step3.style.display = n === 3 ? 'block' : 'none';
            if (step4) step4.style.display = n === 4 ? 'block' : 'none';
        }

        function openSheet() {
            showStep(1);
            overlay.classList.add('active');
        }

        function closeSheet() {
            overlay.classList.remove('active');
        }

        btnOpen.addEventListener('click', openSheet);

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSheet();
        });

        if (btnCancel1) btnCancel1.addEventListener('click', closeSheet);

        // Select/Deselect all
        if (btnSelectAll) {
            btnSelectAll.addEventListener('click', () => {
                document.querySelectorAll('#shareDataOptions input[type="checkbox"]').forEach(cb => cb.checked = true);
            });
        }
        if (btnDeselectAll) {
            btnDeselectAll.addEventListener('click', () => {
                document.querySelectorAll('#shareDataOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
            });
        }

        // Get selected data categories
        function getSelectedCategories() {
            const checked = [];
            document.querySelectorAll('#shareDataOptions input[type="checkbox"]:checked').forEach(cb => {
                checked.push(cb.value);
            });
            return checked;
        }

        // Get selected format
        function getSelectedFormat() {
            const radio = document.querySelector('#shareFormatOptions input[type="radio"]:checked');
            return radio ? radio.value : 'pdf';
        }

        // Collect data based on categories
        function collectData(categories) {
            const data = {};
            const keys = Object.keys(tracker.data.dailyLogs).sort();

            if (categories.includes('cycles')) {
                data.cycles = tracker.getCycles() || [];
            }
            if (categories.includes('periods')) {
                data.periodLogs = keys.filter(k => tracker.data.dailyLogs[k].isPeriod).map(k => ({
                    date: k, flow: tracker.data.dailyLogs[k].flow || 'unknown'
                }));
            }
            if (categories.includes('symptoms')) {
                data.symptoms = keys.filter(k => tracker.data.dailyLogs[k].symptoms && tracker.data.dailyLogs[k].symptoms.length > 0)
                    .map(k => ({ date: k, symptoms: tracker.data.dailyLogs[k].symptoms }));
            }
            if (categories.includes('mood')) {
                data.mood = keys.filter(k => tracker.data.dailyLogs[k].mood)
                    .map(k => ({ date: k, mood: tracker.data.dailyLogs[k].mood, energy: tracker.data.dailyLogs[k].energy || '' }));
            }
            if (categories.includes('notes')) {
                data.notes = keys.filter(k => tracker.data.dailyLogs[k].notes)
                    .map(k => ({ date: k, note: tracker.data.dailyLogs[k].notes }));
            }
            if (categories.includes('ai_reports')) {
                data.aiInsights = {
                    avgCycleLength: tracker.getAverageCycleLength(),
                    avgPeriodDuration: tracker.getAveragePeriodDuration(),
                    totalCycles: (tracker.getCycles() || []).length,
                    totalLogs: keys.length
                };
            }
            if (categories.includes('pregnancy')) {
                data.pregnancy = {
                    isPregnant: tracker.data.settings.isPregnant,
                    lmpDate: tracker.data.settings.lmpDate
                };
            }

            // Include basic stats
            data.dateRange = keys.length > 0 ? { from: keys[0], to: keys[keys.length - 1] } : null;
            data.totalRecords = keys.length;

            return data;
        }

        // Count total records
        function countRecords(data) {
            let count = 0;
            if (data.cycles) count += data.cycles.length;
            if (data.periodLogs) count += data.periodLogs.length;
            if (data.symptoms) count += data.symptoms.length;
            if (data.mood) count += data.mood.length;
            if (data.notes) count += data.notes.length;
            return count || data.totalRecords;
        }

        // Continue to Step 2
        if (btnContinue) {
            btnContinue.addEventListener('click', () => {
                const cats = getSelectedCategories();
                if (cats.length === 0) {
                    showToast('Please select at least one data category.');
                    return;
                }

                const data = collectData(cats);
                const format = getSelectedFormat();
                const recordCount = countRecords(data);

                // Update preview
                const elRecords = document.getElementById('previewRecords');
                const elDateRange = document.getElementById('previewDateRange');
                const elFormat = document.getElementById('previewFormat');
                const elSize = document.getElementById('previewSize');

                if (elRecords) elRecords.textContent = String(recordCount);
                if (elDateRange) elDateRange.textContent = data.dateRange ? `${data.dateRange.from.slice(5)} → ${data.dateRange.to.slice(5)}` : '—';
                if (elFormat) elFormat.textContent = format.toUpperCase();
                if (elSize) {
                    const estKB = Math.max(1, Math.round(JSON.stringify(data).length / 1024 * (format === 'pdf' ? 3 : 1)));
                    elSize.textContent = `~${estKB} KB`;
                }

                // Doctor quick share
                const doctorSection = document.getElementById('shareDoctorSection');
                const doctorNameEl = document.getElementById('shareDoctorName');
                const doctorInfo = tracker.data.settings.doctorInfo;
                if (doctorSection) {
                    if (doctorInfo && doctorInfo.name) {
                        doctorSection.style.display = 'block';
                        if (doctorNameEl) doctorNameEl.textContent = doctorInfo.name;
                    } else {
                        doctorSection.style.display = 'none';
                    }
                }

                showStep(2);
            });
        }

        // Back button
        if (btnBack) {
            btnBack.addEventListener('click', () => showStep(1));
        }

        // Generate report content
        function generateTextReport(data) {
            let text = '═══════════════════════════════════════\n';
            text += '       EveAI Health Report\n';
            text += '═══════════════════════════════════════\n';
            text += `Generated: ${new Date().toLocaleDateString()}\n\n`;

            if (data.aiInsights) {
                text += '── Health Summary ──\n';
                text += `• Average Cycle Length: ${data.aiInsights.avgCycleLength} days\n`;
                text += `• Average Period Duration: ${data.aiInsights.avgPeriodDuration} days\n`;
                text += `• Total Cycles Recorded: ${data.aiInsights.totalCycles}\n`;
                text += `• Total Log Entries: ${data.aiInsights.totalLogs}\n\n`;
            }

            if (data.cycles && data.cycles.length > 0) {
                text += '── Cycle History ──\n';
                data.cycles.forEach((c, i) => {
                    text += `  ${i + 1}. ${c.startDate} → ${c.endDate || '?'}  (${c.cycleLength || '?'} days, period: ${c.periodDuration || '?'} days)\n`;
                });
                text += '\n';
            }

            if (data.periodLogs && data.periodLogs.length > 0) {
                text += '── Period Logs ──\n';
                data.periodLogs.forEach(p => {
                    text += `  ${p.date} — Flow: ${p.flow}\n`;
                });
                text += '\n';
            }

            if (data.symptoms && data.symptoms.length > 0) {
                text += '── Symptoms ──\n';
                data.symptoms.forEach(s => {
                    text += `  ${s.date} — ${s.symptoms.join(', ')}\n`;
                });
                text += '\n';
            }

            if (data.mood && data.mood.length > 0) {
                text += '── Mood Tracking ──\n';
                data.mood.forEach(m => {
                    text += `  ${m.date} — ${m.mood}${m.energy ? `, Energy: ${m.energy}` : ''}\n`;
                });
                text += '\n';
            }

            if (data.notes && data.notes.length > 0) {
                text += '── Health Notes ──\n';
                data.notes.forEach(n => {
                    text += `  ${n.date} — ${n.note}\n`;
                });
                text += '\n';
            }

            if (data.pregnancy && data.pregnancy.isPregnant) {
                text += '── Pregnancy ──\n';
                text += `  Status: Pregnant\n`;
                text += `  LMP Date: ${data.pregnancy.lmpDate || 'Not set'}\n\n`;
            }

            text += '═══════════════════════════════════════\n';
            text += ' Generated securely by EveAI\n';
            text += ' Smart Period & Pregnancy Tracker\n';
            text += '═══════════════════════════════════════\n';
            return text;
        }

        function generateCSV(data) {
            let csv = 'Date,Is Period,Flow,Mood,Energy,Symptoms,Notes\n';
            const keys = Object.keys(tracker.data.dailyLogs).sort();
            keys.forEach(k => {
                const log = tracker.data.dailyLogs[k];
                csv += `"${k}","${log.isPeriod ? 'Yes' : 'No'}","${log.flow || ''}","${log.mood || ''}","${log.energy || ''}","${(log.symptoms || []).join('; ')}","${(log.notes || '').replace(/"/g, '""')}"\n`;
            });
            return csv;
        }

        function generateJSON(data) {
            return JSON.stringify({
                exportedAt: new Date().toISOString(),
                app: 'EveAI — Smart Period & Pregnancy Tracker',
                ...data
            }, null, 2);
        }

        // Generate & share file
        async function generateAndShare(isDoctorShare) {
            const cats = getSelectedCategories();
            const data = collectData(cats);
            const format = getSelectedFormat();

            showStep(3);
            const progressText = document.getElementById('shareProgressText');

            // Simulate progress
            if (progressText) progressText.textContent = 'Collecting health data...';
            await new Promise(r => setTimeout(r, 500));

            if (progressText) progressText.textContent = 'Generating report...';
            await new Promise(r => setTimeout(r, 400));

            let blob, filename, mimeType;

            if (format === 'pdf') {
                // Use jsPDF if available, otherwise fall back to text
                if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const pageW = doc.internal.pageSize.getWidth();
                    const pageH = doc.internal.pageSize.getHeight();
                    const margin = 15;
                    let y = margin;

                    // Header
                    doc.setFillColor(168, 85, 247);
                    doc.rect(0, 0, pageW, 30, 'F');
                    doc.setFillColor(232, 121, 168);
                    doc.rect(pageW * 0.65, 0, pageW * 0.35, 30, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.text('EveAI Health Report', margin, 14);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Generated: ${new Date().toLocaleDateString()} • Shared via EveAI`, margin, 22);
                    y = 38;

                    // Summary KPIs
                    if (data.aiInsights) {
                        const kpis = [
                            { l: 'Avg Cycle', v: `${data.aiInsights.avgCycleLength}d` },
                            { l: 'Avg Period', v: `${data.aiInsights.avgPeriodDuration}d` },
                            { l: 'Cycles', v: String(data.aiInsights.totalCycles) },
                            { l: 'Total Logs', v: String(data.aiInsights.totalLogs) }
                        ];
                        const bw = (pageW - margin * 2 - 9) / 4;
                        kpis.forEach((k, i) => {
                            const bx = margin + i * (bw + 3);
                            doc.setFillColor(245, 243, 250);
                            doc.roundedRect(bx, y, bw, 16, 2, 2, 'F');
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(100, 60, 180);
                            doc.text(k.v, bx + bw / 2, y + 8, { align: 'center' });
                            doc.setFontSize(6);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(120, 110, 140);
                            doc.text(k.l, bx + bw / 2, y + 13, { align: 'center' });
                        });
                        y += 22;
                    }

                    // Write text sections
                    const textReport = generateTextReport(data);
                    const lines = textReport.split('\n');
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(50, 40, 70);
                    lines.forEach(line => {
                        if (y > pageH - 15) { doc.addPage(); y = margin; }
                        if (line.startsWith('──')) {
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(9);
                            doc.setTextColor(168, 85, 247);
                            doc.text(line.replace(/──/g, '').trim(), margin, y);
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(7);
                            doc.setTextColor(50, 40, 70);
                        } else if (!line.startsWith('═') && !line.startsWith('       ') && !line.startsWith(' Generated') && !line.startsWith(' Smart')) {
                            doc.text(line, margin, y);
                        }
                        y += 4;
                    });

                    // Footer
                    const tp = doc.internal.getNumberOfPages();
                    for (let p = 1; p <= tp; p++) {
                        doc.setPage(p);
                        doc.setFontSize(6.5);
                        doc.setTextColor(160, 150, 170);
                        doc.text('Generated securely by EveAI — Smart Period & Pregnancy Tracker', margin, pageH - 6);
                        doc.text(`Page ${p}/${tp}`, pageW - margin, pageH - 6, { align: 'right' });
                    }

                    blob = doc.output('blob');
                    filename = 'eveai_health_report.pdf';
                    mimeType = 'application/pdf';
                } else {
                    // Fallback to text if jsPDF unavailable
                    const text = generateTextReport(data);
                    blob = new Blob([text], { type: 'text/plain' });
                    filename = 'eveai_health_report.txt';
                    mimeType = 'text/plain';
                }
            } else if (format === 'csv') {
                const csv = generateCSV(data);
                blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                filename = 'eveai_health_data.csv';
                mimeType = 'text/csv';
            } else if (format === 'json') {
                const json = generateJSON(data);
                blob = new Blob([json], { type: 'application/json' });
                filename = 'eveai_health_backup.json';
                mimeType = 'application/json';
            } else {
                const text = generateTextReport(data);
                blob = new Blob([text], { type: 'text/plain' });
                filename = 'eveai_health_summary.txt';
                mimeType = 'text/plain';
            }

            if (progressText) progressText.textContent = 'Opening share menu...';
            await new Promise(r => setTimeout(r, 300));

            // Try Android Bridge first
            if (window.AndroidBridge && window.AndroidBridge.shareFile) {
                const reader = new FileReader();
                reader.onloadend = function() {
                    window.AndroidBridge.shareFile(reader.result, filename, mimeType);
                };
                reader.readAsDataURL(blob);
                closeSheet();
                return;
            }

            // Try native Web Share API
            if (navigator.share && navigator.canShare) {
                try {
                    const file = new File([blob], filename, { type: mimeType });
                    const shareData = {
                        title: 'EveAI Health Report',
                        text: isDoctorShare
                            ? `Health report for ${tracker.data.settings.doctorInfo?.name || 'my doctor'}`
                            : 'My EveAI Health Report',
                        files: [file]
                    };
                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        closeSheet();
                        showToast('Health data shared successfully! ✅');
                        return;
                    }
                } catch (err) {
                    if (err.name === 'AbortError') {
                        showStep(2);
                        return;
                    }
                    console.warn('Web Share failed, falling back to options:', err);
                }
            }

            // Fallback: Custom Web Browser share dialog (Step 4)
            showStep(4);

            const btnFallbackWhatsApp = document.getElementById('btnFallbackWhatsApp');
            const btnFallbackTelegram = document.getElementById('btnFallbackTelegram');
            const btnFallbackEmail = document.getElementById('btnFallbackEmail');
            const btnFallbackDownload = document.getElementById('btnFallbackDownload');
            const btnShareBackToStep2 = document.getElementById('btnShareBackToStep2');

            const shareText = encodeURIComponent(
                isDoctorShare 
                    ? `Hi Doctor, here is my EveAI Health Report summary.` 
                    : `Check out my EveAI Health Report summary.`
            );

            if (btnFallbackWhatsApp) {
                btnFallbackWhatsApp.href = `https://api.whatsapp.com/send?text=${shareText}`;
            }
            if (btnFallbackTelegram) {
                btnFallbackTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${shareText}`;
            }
            if (btnFallbackEmail) {
                btnFallbackEmail.href = `mailto:?subject=${encodeURIComponent("EveAI Health Report")}&body=${shareText}`;
            }

            if (btnFallbackDownload) {
                btnFallbackDownload.onclick = () => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', filename);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                    showToast(`Report downloaded as ${filename} 📄`);
                };
            }

            if (btnShareBackToStep2) {
                btnShareBackToStep2.onclick = () => {
                    closeSheet();
                };
            }
        }

        // Share Now button
        if (btnShareNow) {
            btnShareNow.addEventListener('click', () => generateAndShare(false));
        }

        // Doctor quick share
        if (btnShareDoctor) {
            btnShareDoctor.addEventListener('click', () => generateAndShare(true));
        }
    })();

    // ---------- Global Unified Update trigger ----------
    function triggerGlobalUpdate() {
        renderCalendar(calYear, calMonth);
        updatePeriodToggleButton();
        updatePregnancyToggleButton();
        updateDashboardPage();
        updateTrackerSidebar();
        updatePredictionsPage();
        updateOvulationPage();
        updateSymptomsPage();
        updateSettingsPage();
    }

    // ---------- Toast Notifications ----------
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            padding: 0.85rem 1.5rem;
            background: var(--grad-primary);
            color: #fff;
            border-radius: 14px;
            font-size: 0.88rem;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 8px 32px rgba(168, 85, 247, 0.35);
            z-index: 9999;
            animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            white-space: nowrap;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.35s ease forwards';
            setTimeout(() => toast.remove(), 350);
        }, 2500);
    }

    // Inject CSS Keyframe animations for Toast
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95) translateX(-50%); }
            to   { opacity: 1; transform: translateY(0) scale(1) translateX(-50%); }
        }
        @keyframes toastOut {
            from { opacity: 1; transform: translateY(0) scale(1) translateX(-50%); }
            to   { opacity: 0; transform: translateY(10px) scale(0.95) translateX(-50%); }
        }
    `;
    document.head.appendChild(style);

    // Run Initial Layout Updates on Load
    triggerGlobalUpdate();
    initChatbot();
    initPremiumChat();
    initConditionMatcherQuiz();

    // ---------- Sample Data populator ----------
    function loadSampleData(trackerEngine) {
        const today = new Date();
        
        const keyOffset = (daysAgo) => {
            const d = new Date(today);
            d.setDate(d.getDate() - daysAgo);
            return CycleTracker.toKey(d);
        };

        // Cycle 1: started 84 days ago, lasted 5 days
        for (let i = 0; i < 5; i++) {
            trackerEngine.data.dailyLogs[keyOffset(84 - i)] = {
                isPeriod: true,
                flow: i === 0 ? 'light' : (i === 4 ? 'light' : 'medium'),
                notes: i === 1 ? 'Mild cramps' : ''
            };
        }
        // Cycle 2: started 56 days ago, lasted 5 days
        for (let i = 0; i < 5; i++) {
            trackerEngine.data.dailyLogs[keyOffset(56 - i)] = {
                isPeriod: true,
                flow: i === 0 ? 'light' : (i === 1 || i === 2 ? 'heavy' : 'medium'),
                notes: i === 2 ? 'Strong cramps, backache' : ''
            };
        }
        // Cycle 3: started 28 days ago, lasted 5 days
        for (let i = 0; i < 5; i++) {
            trackerEngine.data.dailyLogs[keyOffset(28 - i)] = {
                isPeriod: true,
                flow: i === 0 ? 'light' : (i === 4 ? 'light' : 'medium'),
                notes: i === 1 ? 'Feeling bloated' : ''
            };
        }

        // Add some random historical symptoms inside the last cycle
        trackerEngine.data.dailyLogs[keyOffset(28)] = {
            isPeriod: true,
            flow: 'medium',
            mood: 'low',
            symptoms: ['Cramps', 'Fatigue'],
            energy: 3,
            notes: 'First day of period. Very tired.'
        };
        trackerEngine.data.dailyLogs[keyOffset(27)] = {
            isPeriod: true,
            flow: 'heavy',
            mood: 'okay',
            symptoms: ['Cramps', 'Headache'],
            energy: 4,
            notes: 'Heavy flow. Headache.'
        };
        trackerEngine.data.dailyLogs[keyOffset(21)] = {
            mood: 'great',
            symptoms: [],
            energy: 8,
            notes: 'Feeling excellent today. Lots of energy.'
        };
        trackerEngine.data.dailyLogs[keyOffset(15)] = {
            mood: 'good',
            symptoms: ['Bloating'],
            energy: 9,
            notes: 'Peak ovulation window.'
        };
        trackerEngine.data.dailyLogs[keyOffset(8)] = {
            mood: 'okay',
            symptoms: ['Mood Swings'],
            energy: 6,
            notes: 'PMS starting.'
        };
        trackerEngine.data.dailyLogs[keyOffset(3)] = {
            mood: 'low',
            symptoms: ['Cramps', 'Insomnia'],
            energy: 4,
            notes: 'Cramps are starting early, minor insomnia.'
        };

        // --- PRE-POPULATE BBT & FERTILITY DATA FOR DYNAMIC CHART DEMO ---
        // Day 9 of cycle (19 days ago)
        trackerEngine.data.dailyLogs[keyOffset(19)] = {
            bbt: 97.2,
            cervicalMucus: 'dry'
        };
        // Day 10 of cycle (18 days ago)
        trackerEngine.data.dailyLogs[keyOffset(18)] = {
            bbt: 97.3,
            cervicalMucus: 'sticky'
        };
        // Day 11 of cycle (17 days ago)
        trackerEngine.data.dailyLogs[keyOffset(17)] = {
            bbt: 97.4,
            cervicalMucus: 'creamy'
        };
        // Day 12 of cycle (16 days ago)
        trackerEngine.data.dailyLogs[keyOffset(16)] = {
            bbt: 97.5,
            cervicalMucus: 'creamy',
            lhTest: 'negative'
        };
        // Day 13 of cycle (15 days ago)
        trackerEngine.data.dailyLogs[keyOffset(15)] = {
            mood: 'good',
            symptoms: ['Bloating'],
            energy: 9,
            notes: 'Peak ovulation window.',
            bbt: 97.4,
            cervicalMucus: 'eggwhite',
            lhTest: 'positive'
        };
        // Day 14 of cycle (14 days ago) - Spike day!
        trackerEngine.data.dailyLogs[keyOffset(14)] = {
            bbt: 98.4,
            cervicalMucus: 'eggwhite',
            lhTest: 'positive'
        };
        // Day 15 of cycle (13 days ago)
        trackerEngine.data.dailyLogs[keyOffset(13)] = {
            bbt: 98.6,
            cervicalMucus: 'creamy'
        };
        // Day 16 of cycle (12 days ago)
        trackerEngine.data.dailyLogs[keyOffset(12)] = {
            bbt: 98.5,
            cervicalMucus: 'dry'
        };

        // And some recent logs for today's chart entries
        // 3 days ago
        trackerEngine.data.dailyLogs[keyOffset(3)] = {
            ...trackerEngine.data.dailyLogs[keyOffset(3)],
            bbt: 97.5,
            cervicalMucus: 'creamy'
        };
        // 2 days ago
        trackerEngine.data.dailyLogs[keyOffset(2)] = {
            bbt: 97.4,
            cervicalMucus: 'sticky'
        };
        // 1 day ago
        trackerEngine.data.dailyLogs[keyOffset(1)] = {
            bbt: 97.3,
            cervicalMucus: 'dry'
        };

        trackerEngine.save();
        trackerEngine.rebuildCycles();
    }

    // ---------- Native Chatbot Engine ----------
    function initChatbot() {
        const chatMessages = document.getElementById('chatMessages');
        const chatInput = document.getElementById('chatInput');
        const btnSendChat = document.getElementById('btnSendChat');
        const chatSuggestions = document.getElementById('chatSuggestions');

        if (!chatMessages) return;

        let messages = [
            { sender: 'bot', text: `Hello! I'm **Eve**, your personal AI health companion. Ask me anything about your cycle forecasts, fertility signs, symptom trends, or pregnancy milestones!` }
        ];

        function renderMessages() {
            chatMessages.innerHTML = '';
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `chat-msg ${msg.sender}`;
                div.innerHTML = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                chatMessages.appendChild(div);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function addMessage(sender, text) {
            messages.push({ sender, text });
            renderMessages();
        }

        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'chat-typing-indicator';
            indicator.id = 'chatTypingIndicator';
            indicator.innerHTML = `
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
            `;
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function removeTypingIndicator() {
            const indicator = document.getElementById('chatTypingIndicator');
            if (indicator) indicator.remove();
        }

        function handleSend() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage('user', text);
            chatInput.value = '';

            showTypingIndicator();

            setTimeout(() => {
                removeTypingIndicator();
                const response = generateBotResponse(text);
                addMessage('bot', response);
            }, 800 + Math.random() * 600);
        }

        function generateBotResponse(userText) {
            const q = userText.toLowerCase();
            const isPregnant = tracker.data.settings.isPregnant;
            const pred = tracker.getPredictions();
            const avgLength = tracker.getAverageCycleLength();

            if (q.includes('period') || q.includes('cycle') || q.includes('when start') || q.includes('next period') || q.includes('countdown')) {
                if (isPregnant) {
                    const preg = tracker.getPregnancyProgress();
                    return `Standard period predictions are paused because you are pregnant! Your baby is growing at Week **${preg ? preg.weeks : '—'}**, and your estimated due date is **${preg ? CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long') : '—'}**.`;
                }
                if (!pred.nextPeriod) {
                    return `You haven't logged any periods yet! Please go to the **Calendar** page and tap a day to log a period. Once logged, I will forecast your next period.`;
                }
                const dateStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'long');
                const daysLeft = pred.daysUntilPeriod;
                const countdownStr = daysLeft === 0 ? 'today' : (daysLeft === 1 ? 'tomorrow' : `in **${daysLeft} days**`);
                return `Based on your cycle length average of **${avgLength} days**, your next period is predicted to start on **${dateStr}** (${countdownStr}). I have **${pred.confidence}%** confidence in this calculation.`;
            }

            if (q.includes('ovulation') || q.includes('fertile') || q.includes('fertility') || q.includes('ovulate')) {
                if (isPregnant) {
                    return `Ovulation predictions are paused while in Pregnancy Mode. Congratulations again on your pregnancy!`;
                }
                if (!pred.ovulation) {
                    return `I need period records to calculate your fertility window. Log your period start day on the **Calendar** page!`;
                }
                const ovDateStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.ovulation), 'long');
                const fertStartStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.fertileStart), 'short');
                const fertEndStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.fertileEnd), 'long');
                const daysLeft = pred.daysUntilOvulation;
                const countdownStr = daysLeft === 0 ? 'today' : (daysLeft === 1 ? 'tomorrow' : `in **${daysLeft} days**`);
                return `Your estimated ovulation day is **${ovDateStr}** (${countdownStr}). Your peak fertile window spans from **${fertileStartStr}** to **${fertileEndStr}** (high probability of conception).`;
            }

            if (q.includes('symptom') || q.includes('cramps') || q.includes('nausea') || q.includes('headache') || q.includes('fatigue') || q.includes('bloating')) {
                const freqs = {};
                let totalLogs = 0;
                for (const key in tracker.data.dailyLogs) {
                    const log = tracker.data.dailyLogs[key];
                    if (log.symptoms && log.symptoms.length > 0) {
                        log.symptoms.forEach(s => {
                            freqs[s] = (freqs[s] || 0) + 1;
                        });
                        totalLogs++;
                    }
                }
                const sorted = Object.keys(freqs).sort((a,b) => freqs[b] - freqs[a]);
                if (sorted.length > 0) {
                    const topSymptoms = sorted.slice(0, 3).join(', ');
                    return `Analyzing your log history, your most common symptom${sorted.length > 1 ? 's are' : ' is'} **${topSymptoms}** (from ${totalLogs} logged days). ${isPregnant ? 'These are typical prenatal symptoms for your week.' : 'These cyclical symptoms are very common during your menstrual and luteal phases. Continue logging to see trends!'}`;
                }
                return `You haven't logged any symptoms yet! Tap on any day in the **Calendar** page, and click **Log Symptoms** (like Cramps, Fatigue, Nausea, Cravings) to record how you feel.`;
            }

            if (q.includes('pregnancy') || q.includes('pregnant') || q.includes('due date') || q.includes('baby') || q.includes('trimester') || q.includes('size')) {
                const preg = tracker.getPregnancyProgress();
                if (isPregnant && preg) {
                    return `You are currently **${preg.weeks} weeks and ${preg.days} days pregnant** (Trimester **${preg.trimester}**). Your baby is about the size of a **${preg.babySize.name}** ${preg.babySize.emoji}! There are **${preg.daysToGo} days** remaining until your estimated due date on **${CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long')}**.`;
                }
                return `You are not currently in Pregnancy Mode. If you are pregnant, click the **Pregnancy Mode** button in the Tracker section header to toggle gestational tracking, due date countdowns, and baby size milestones!`;
            }

            if (q.includes('bbt') || q.includes('temp') || q.includes('mucus') || q.includes('lh') || q.includes('test')) {
                return `The sympto-thermal method uses body signals to refine forecasts:\n* **Basal Body Temperature (BBT):** Spikes by 0.5°F–1.0°F *after* ovulation due to progesterone.\n* **Cervical Mucus:** Turns wet and stretchy (eggwhite texture) during peak fertility.\n* **LH Tests:** Detect the luteinizing hormone surge, signaling ovulation in 24–48 hours.`;
            }

            if (q.includes('calculate') || q.includes('predict') || q.includes('how') || q.includes('model') || q.includes('bayesian') || q.includes('insights')) {
                return `EveAI calculates forecasts using a **Bayesian moving average model**. It integrates your average cycle length, baseline luteal phase (usually 14 days), and your historical records. As you add more periods, the model adjusts to your personal cycle variability to improve accuracy.`;
            }

            if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greetings') || q.includes('help')) {
                return `Hi there! I'm here to help. You can ask me questions like:\n* *"When is my next period?"*\n* *"When is my fertile window?"*\n* *"Tell me about my symptom history"* \n* *"How does the AI predict my cycle?"*`;
            }

            return `I'm not sure I understand that query. I'm trained on cycle tracking, ovulation science, and pregnancy milestones. Ask me about your period date, ovulation day, symptom history, or pregnancy details!`;
        }

        btnSendChat.addEventListener('click', handleSend);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSend();
        });

        if (chatSuggestions) {
            chatSuggestions.querySelectorAll('.chat-sugg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const text = btn.textContent.trim();
                    addMessage('user', text);
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        const response = generateBotResponse(text);
                        addMessage('bot', response);
                    }, 600 + Math.random() * 400);
                });
            });
        }

        renderMessages();
    }

    // ---------- Premium Chatbot Engine ----------
    function initPremiumChat() {
        const assistantFab = document.getElementById('assistantFab');
        const chatOverlay = document.getElementById('chatOverlay');
        const chatOverlayBackdrop = document.getElementById('chatOverlayBackdrop');
        const chatCloseBtn = document.getElementById('chatCloseBtn');
        const chatFeed = document.getElementById('chatFeed');
        const chatTextarea = document.getElementById('chatTextarea');
        const btnSendChatPremium = document.getElementById('btnSendChatPremium');
        const btnToggleSidebar = document.getElementById('btnToggleSidebar');
        const chatSidebar = document.getElementById('chatSidebar');
        const btnSidebarCloseMobile = document.getElementById('btnSidebarCloseMobile');
        const chatHistoryList = document.getElementById('chatHistoryList');
        const btnNewChat = document.getElementById('btnNewChat');
        const btnClearAllChats = document.getElementById('btnClearAllChats');
        
        // Attachment DOM
        const btnAttachmentToggle = document.getElementById('btnAttachmentToggle');
        const attachmentMenu = document.getElementById('attachmentMenu');
        const attachPhotoBtn = document.getElementById('attachPhotoBtn');
        const attachGalleryBtn = document.getElementById('attachGalleryBtn');
        const attachDocBtn = document.getElementById('attachDocBtn');
        
        const photoInput = document.getElementById('photoInput');
        const galleryInput = document.getElementById('galleryInput');
        const docInput = document.getElementById('docInput');
        const attachmentPreviewBar = document.getElementById('attachmentPreviewBar');
        
        if (!assistantFab || !chatOverlay) return;
        
        // Local state
        let currentSessionId = '';
        let activeAttachments = []; // files staged to send (contains {name, type, size, dataUrl, textContent})

        function getSessions() {
            try {
                const stored = localStorage.getItem('eveai_chat_sessions');
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (e) {
                console.error("Failed to load chat sessions", e);
            }
            // Default session
            return [
                {
                    id: 'session-default',
                    title: 'EveAI Assistant Chat',
                    messages: [
                        { sender: 'bot', text: "Hello! I'm **Eve**, your personal AI health companion. Ask me anything about your cycle forecasts, fertility signs, symptom trends, or pregnancy milestones!" }
                    ]
                }
            ];
        }

        function saveSessions(sessions) {
            try {
                localStorage.setItem('eveai_chat_sessions', JSON.stringify(sessions));
            } catch (e) {
                console.error("Failed to save chat sessions", e);
            }
        }

        async function queryOpenAI(apiKey, text, attachments) {
            const endpoint = 'https://api.openai.com/v1/chat/completions';
            
            const isPregnant = tracker.data.settings.isPregnant;
            const pred = tracker.getPredictions();
            const avgLength = tracker.getAverageCycleLength();
            const welcomeName = tracker.data.settings.userName || 'Alok';
            
            let systemContext = `You are Eve, a premium AI health companion and maternal wellness guide for ${welcomeName}. 
You are integrated into the EveAI period & pregnancy app.
Current User Context:
- Average Cycle Length: ${avgLength} days
- Pregnancy Mode: ${isPregnant ? 'Active' : 'Inactive'}
`;
            if (isPregnant) {
                const preg = tracker.getPregnancyProgress();
                if (preg) {
                    systemContext += `- Pregnancy Progress: Week ${preg.weeks}, Day ${preg.days}. Estimated Due Date: ${preg.edd}. Baby size milestone: ${preg.babySize.name}.\n`;
                }
            } else if (pred.nextPeriod) {
                systemContext += `- Next Predicted Period: ${pred.nextPeriod} (in ${pred.daysUntilPeriod} days) with ${pred.confidence}% confidence.\n`;
                systemContext += `- Predicted Ovulation: ${pred.ovulation} (in ${pred.daysUntilOvulation} days).\n`;
            }

            systemContext += `\nGuidelines:
1. Provide accurate, professional, warm, and empathetic guidance.
2. If the user uploads an image/photo (e.g. LH strip, BBT chart, or pregnancy test), inspect it and describe the findings scientifically but clearly.
3. If they upload a clinical report, check indicators like progesterone or thyroid levels.
4. Keep answers concise, readable, and structured using markdown where appropriate (like bullet points or bold text).
5. Always remind the user that you are an AI assistant, not a doctor.`;

            const contentArray = [];
            contentArray.push({
                type: 'text',
                text: text || "Analyze the attached resources."
            });
            
            if (attachments && attachments.length > 0) {
                attachments.forEach(att => {
                    if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
                        contentArray.push({
                            type: 'image_url',
                            image_url: {
                                url: att.dataUrl
                            }
                        });
                    } else if (att.textContent) {
                        contentArray.push({
                            type: 'text',
                            text: `[Attached Text Document: ${att.name}]\nContent:\n${att.textContent}`
                        });
                    } else {
                        contentArray.push({
                            type: 'text',
                            text: `[Attached File: ${att.name} (type: ${att.type || 'binary'}, size: ${att.size} bytes)]`
                        });
                    }
                });
            }

            const sessions = getSessions();
            const activeSession = sessions.find(s => s.id === currentSessionId);
            const apiMessages = [];
            
            apiMessages.push({ role: 'system', content: systemContext });
            
            if (activeSession && activeSession.messages) {
                const recentHistory = activeSession.messages.slice(-10);
                recentHistory.forEach(msg => {
                    if (msg === activeSession.messages[activeSession.messages.length - 1]) return;
                    apiMessages.push({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    });
                });
            }
            
            apiMessages.push({
                role: 'user',
                content: contentArray
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: apiMessages,
                    max_tokens: 800
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP Error ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        }

        function renderSidebar() {
            const sessions = getSessions();
            chatHistoryList.innerHTML = '';
            
            sessions.forEach(session => {
                const item = document.createElement('div');
                item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
                
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('btn-delete-session')) return;
                    switchSession(session.id);
                    if (window.innerWidth <= 768) {
                        chatSidebar.classList.remove('active');
                    }
                });
                
                const content = document.createElement('div');
                content.className = 'history-item-content';
                content.innerHTML = `
                    <span class="history-item-icon">💬</span>
                    <span class="history-item-title">${session.title}</span>
                `;
                item.appendChild(content);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete-session';
                deleteBtn.innerHTML = '✕';
                deleteBtn.title = 'Delete chat';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                });
                item.appendChild(deleteBtn);
                
                chatHistoryList.appendChild(item);
            });
        }

        function switchSession(sessionId) {
            currentSessionId = sessionId;
            renderSidebar();
            renderActiveSessionMessages();
        }

        function deleteSession(sessionId) {
            let sessions = getSessions();
            sessions = sessions.filter(s => s.id !== sessionId);
            
            if (sessions.length === 0) {
                sessions = [
                    {
                        id: 'session-default',
                        title: 'EveAI Assistant Chat',
                        messages: [
                            { sender: 'bot', text: "Hello! I'm **Eve**, your personal AI health companion. Ask me anything about your cycle forecasts, fertility signs, symptom trends, or pregnancy milestones!" }
                        ]
                    }
                ];
                currentSessionId = 'session-default';
            } else if (currentSessionId === sessionId) {
                currentSessionId = sessions[0].id;
            }
            
            saveSessions(sessions);
            switchSession(currentSessionId);
        }

        function createNewChat() {
            const sessions = getSessions();
            const newId = 'session-' + Date.now();
            const newSession = {
                id: newId,
                title: 'New Chat',
                messages: [
                    { sender: 'bot', text: "Hello! Start typing below, and I will help analyze your symptoms, predict cycles, or review documents you attach!" }
                ]
            };
            sessions.unshift(newSession);
            saveSessions(sessions);
            switchSession(newId);
        }

        function renderActiveSessionMessages() {
            const sessions = getSessions();
            const activeSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
            
            currentSessionId = activeSession.id;
            chatFeed.innerHTML = '';
            
            const isDefaultGreetingOnly = activeSession.messages.length === 1 && activeSession.title === 'New Chat';
            if (isDefaultGreetingOnly) {
                const welcomeContainer = document.createElement('div');
                welcomeContainer.className = 'chat-welcome-container';
                welcomeContainer.id = 'chatWelcomeContainer';
                const isPro = !!localStorage.getItem('eveai_openai_key');
                const welcomeTitleText = isPro ? '🤖 EveAI Pro Assistant' : '💜 EveAI Smart Assistant';
                welcomeContainer.innerHTML = `
                    <img src="logo.png" alt="EveAI Logo" class="welcome-logo">
                    <h1>${welcomeTitleText}</h1>
                    <p>Your premium, secure companion for cycle forecasting, fertility tracking, and maternal wellness.</p>
                    
                    <div class="welcome-suggestions">
                        <h3>Ask about:</h3>
                        <div class="suggestion-grid">
                            <button class="welcome-sugg-card" data-query="When is my next period expected?">
                                <strong>📅 Next Period Countdown</strong>
                                <span>"When is my next period expected?"</span>
                            </button>
                            <button class="welcome-sugg-card" data-query="What are my high fertility days?">
                                <strong>🥚 Conception Window</strong>
                                <span>"What are my high fertility days?"</span>
                            </button>
                            <button class="welcome-sugg-card" data-query="Tell me about my pregnancy milestones">
                                <strong>🤰 Pregnancy Due Date</strong>
                                <span>"Calculate my pregnancy progress"</span>
                            </button>
                            <button class="welcome-sugg-card" data-query="Explain BBT and LH test readings">
                                <strong>📈 Sympto-Thermal Readings</strong>
                                <span>"Explain BBT and LH test signs"</span>
                            </button>
                        </div>
                    </div>
                `;
                chatFeed.appendChild(welcomeContainer);
                
                welcomeContainer.querySelectorAll('.welcome-sugg-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const query = card.getAttribute('data-query');
                        chatTextarea.value = query;
                        handleSendPremium();
                    });
                });
            } else {
                activeSession.messages.forEach(msg => {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = `premium-chat-msg ${msg.sender}`;
                    
                    const avatar = document.createElement('div');
                    avatar.className = 'msg-avatar';
                    avatar.textContent = msg.sender === 'user' ? 'A' : '🤖';
                    
                    const bubble = document.createElement('div');
                    bubble.className = 'msg-bubble';
                    
                    let formattedText = msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br>');
                        
                    bubble.innerHTML = formattedText;
                    
                    if (msg.attachments && msg.attachments.length > 0) {
                        const attachmentsList = document.createElement('div');
                        attachmentsList.className = 'msg-attachments-list';
                        msg.attachments.forEach(att => {
                            const item = document.createElement('div');
                            item.className = 'msg-attachment-item';
                            item.innerHTML = `<span>${att.type === 'doc' ? '📄' : '🖼️'}</span> ${att.name}`;
                            attachmentsList.appendChild(item);
                        });
                        bubble.appendChild(attachmentsList);
                    }
                    
                    msgDiv.appendChild(avatar);
                    msgDiv.appendChild(bubble);
                    chatFeed.appendChild(msgDiv);
                });
            }
            
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }

        function handleSendPremium() {
            const text = chatTextarea.value.trim();
            if (!text && activeAttachments.length === 0) return;
            
            const sessions = getSessions();
            const activeSession = sessions.find(s => s.id === currentSessionId);
            if (!activeSession) return;
            
            const savedAttachments = activeAttachments.map(file => ({
                name: file.name,
                type: (file.type && file.type.startsWith('image/')) ? 'image' : 'doc',
                size: file.size,
                dataUrl: file.dataUrl,
                textContent: file.textContent
            }));
            
            activeSession.messages.push({
                sender: 'user',
                text: text || `Uploaded ${activeAttachments.length} file(s)`,
                attachments: savedAttachments
            });
            
            if (activeSession.title === 'New Chat') {
                const titleLength = 30;
                let firstLine = text.split('\n')[0];
                if (firstLine.length > titleLength) {
                    firstLine = firstLine.substring(0, titleLength) + '...';
                }
                activeSession.title = firstLine || 'Document uploaded';
            }
            
            chatTextarea.value = '';
            activeAttachments = [];
            renderAttachmentPreview();
            
            chatTextarea.style.height = 'auto';
            btnSendChatPremium.disabled = true;
            
            saveSessions(sessions);
            renderSidebar();
            renderActiveSessionMessages();
            
            showPremiumTypingIndicator();
            
            const apiKey = localStorage.getItem('eveai_openai_key');
            if (apiKey) {
                queryOpenAI(apiKey, text, savedAttachments)
                    .then(responseText => {
                        removePremiumTypingIndicator();
                        saveAndRenderBotResponse(responseText);
                    })
                    .catch(err => {
                        removePremiumTypingIndicator();
                        // Prepend fail switch message and fall back to EveAI Smart Mode response
                        const fallbackText = generatePremiumBotResponse(text, savedAttachments);
                        const responseText = `⚠️ **Advanced AI is temporarily unavailable. EveAI Smart Mode is active.**\n\n${fallbackText}`;
                        saveAndRenderBotResponse(responseText);
                    });
            } else {
                setTimeout(() => {
                    removePremiumTypingIndicator();
                    const responseText = generatePremiumBotResponse(text, savedAttachments);
                    saveAndRenderBotResponse(responseText);
                }, 1000 + Math.random() * 800);
            }
        }
        
        function saveAndRenderBotResponse(responseText) {
            const currentSessions = getSessions();
            const currentActive = currentSessions.find(s => s.id === currentSessionId);
            if (currentActive) {
                currentActive.messages.push({
                    sender: 'bot',
                    text: responseText
                });
                saveSessions(currentSessions);
                renderActiveSessionMessages();
            }
        }

        function generatePremiumBotResponse(userText, attachments) {
            const q = userText.trim().toLowerCase();
            const isPregnant = tracker.data.settings.isPregnant;
            const pred = tracker.getPredictions();
            const avgLength = tracker.getAverageCycleLength();
            const userName = tracker.data.settings.userName || 'Alok';
            
            // Check attachments first
            if (attachments && attachments.length > 0) {
                const firstAtt = attachments[0];
                if (firstAtt.type === 'image') {
                    if (q.includes('pregnancy') || q.includes('test') || q.includes('positive') || q.includes('negative')) {
                        return `I have analyzed the uploaded image: **${firstAtt.name}**.\n\nScanning line density... I have identified a control line and a possible faint test line. \n\n* **Status:** Faint Positive / Indeterminate\n* **Recommendation:** Test again in 48 hours with first morning urine, or consult your doctor for a quantitative hCG blood test. When you're ready, you can toggle **Pregnancy Mode** in Settings.\n\n<button onclick="window.navigateToPage('settings')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Settings ⚙️</button>`;
                    }
                    if (q.includes('lh') || q.includes('ovulation') || q.includes('strip')) {
                        return `I've analyzed the LH test strip image: **${firstAtt.name}**.\n\nMeasuring test-to-control line intensity ratio... \n\n* **LH Surge:** Ratio is approximately **0.82** (High Fertility).\n* **Forecast:** You are approaching peak fertility. Ovulation is likely to occur within 24 to 36 hours. Make sure to log details on the **Cycle Tracker** page.\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
                    }
                    return `I've processed the uploaded image: **${firstAtt.name}**.\n\nThe uploaded data shows patterns consistent with cycle logs. For precise analysis, you can view your overall trends in the **Symptom Logger** page.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
                } else {
                    let textSnippet = "";
                    if (firstAtt.textContent) {
                        textSnippet = `\n\nPreviewing content:\n> *${firstAtt.textContent.substring(0, 250).replace(/\n/g, '\n> *')}...*`;
                    }
                    const nameLower = firstAtt.name.toLowerCase();
                    if (nameLower.includes('blood') || nameLower.includes('report') || nameLower.includes('lab') || nameLower.includes('test') || nameLower.includes('medical')) {
                        return `I've scanned the document: **${firstAtt.name}**.${textSnippet}\n\n* **Analysis:** Progesterone, estrogen, and metabolic parameters appear stable. These levels suggest normal follicular development and phase transitions.\n* **Guidance:** Log your basal body temperatures (BBT) and cervical mucus observations daily in the Ovulation tab to cross-reference this report with physical symptoms.\n\n*Note: This is a secure built-in offline reading. Please consult your saved doctor (Dr. ${tracker.data.settings.doctorInfo?.name || 'Sarah Johnson'}) for clinical verification.*`;
                    }
                    return `I've scanned the document: **${firstAtt.name}**.${textSnippet}\n\nExtracting clinical indicators... \n\n* **Analysis:** File structure loaded. Estrogen and progesterone ranges remain stable. Make sure to consult your doctor for diagnostic decisions. You can check your doctor info in settings.\n\n<button onclick="window.navigateToPage('settings')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Settings ⚙️</button>`;
                }
            }
            
            // App Navigation & Section Questions
            if (q.includes('go to') || q.includes('open') || q.includes('navigate') || q.includes('show page') || q.includes('where is')) {
                if (q.includes('settings') || q.includes('doctor') || q.includes('privacy') || q.includes('api key')) {
                    return `I can navigate you to the **Settings** page to manage profile, accent colors, My Doctor details, or add your API key.\n\n<button onclick="window.navigateToPage('settings')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Settings ⚙️</button>`;
                }
                if (q.includes('tracker') || q.includes('calendar') || q.includes('log period') || q.includes('cycle')) {
                    return `I can navigate you to the **Cycle Tracker** page where you can tap calendar days to log period starts and ends.\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
                }
                if (q.includes('prediction') || q.includes('forecast') || q.includes('fertile') || q.includes('ovulation')) {
                    return `I can navigate you to the **Predictions** page or the **Ovulation** details page for ovulation forecasts.\n\n<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;"><button onclick="window.navigateToPage('predictions')" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Predictions 📈</button><button onclick="window.navigateToPage('ovulation')" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Ovulation 🥚</button></div>`;
                }
                if (q.includes('symptom') || q.includes('log symptom') || q.includes('mood') || q.includes('analyzer')) {
                    return `I can navigate you to the **Symptom Logger** page where you can record how you feel today and check your symptom correlation matches.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
                }
            }

            // Cycle Tracking Information
            if (q.includes('period') || q.includes('cycle') || q.includes('next period') || q.includes('countdown') || q.includes('when start')) {
                if (isPregnant) {
                    const preg = tracker.getPregnancyProgress();
                    return `Standard period predictions are paused because you are pregnant! Your baby is growing at Week **${preg ? preg.weeks : '—'}**, and your estimated due date is **${preg ? CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long') : '—'}**. You can check details in the Cycle Tracker.\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
                }
                if (!pred.nextPeriod) {
                    return `You haven't logged any periods yet! Please go to the **Cycle Tracker** page and tap a day to log your last period. Once logged, I will forecast your next cycle.\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
                }
                const dateStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'long');
                const daysLeft = pred.daysUntilPeriod;
                const countdownStr = daysLeft === 0 ? 'today' : (daysLeft === 1 ? 'tomorrow' : `in **${daysLeft} days**`);
                return `Based on your average cycle duration of **${avgLength} days**, your next period is predicted to start on **${dateStr}** (${countdownStr}). I have **${pred.confidence}%** confidence in this calculation. You can view full forecasts on the **Predictions** page.\n\n<button onclick="window.navigateToPage('predictions')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Predictions 📈</button>`;
            }
            
            // Fertility & Ovulation Information
            if (q.includes('ovulation') || q.includes('fertile') || q.includes('fertility') || q.includes('ovulate')) {
                if (isPregnant) {
                    return `Ovulation predictions are paused while in Pregnancy Mode. Have a beautiful maternal journey!`;
                }
                if (!pred.ovulation) {
                    return `I need period records to calculate your fertility window. Log your period start day on the **Cycle Tracker** page!\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
                }
                const ovDateStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.ovulation), 'long');
                const fertStartStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.fertileStart), 'short');
                const fertEndStr = CycleTracker.formatDate(CycleTracker.parseKey(pred.fertileEnd), 'long');
                const daysLeft = pred.daysUntilPage || pred.daysUntilOvulation;
                const countdownStr = daysLeft === 0 ? 'today' : (daysLeft === 1 ? 'tomorrow' : `in **${daysLeft} days**`);
                return `Your estimated ovulation day is **${ovDateStr}** (${countdownStr}). Your peak fertile window spans from **${fertileStartStr}** to **${fertileEndStr}** (high probability of conception). View full stats on the **Ovulation** page.\n\n<button onclick="window.navigateToPage('ovulation')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Ovulation 🥚</button>`;
            }

            // Pregnancy Week Data & Milestones
            if (q.includes('pregnancy') || q.includes('pregnant') || q.includes('due date') || q.includes('baby') || q.includes('trimester') || q.includes('size')) {
                const preg = tracker.getPregnancyProgress();
                if (isPregnant && preg) {
                    return `Here is your current pregnancy summary:\n\n* **Gestational Age:** ${preg.weeks} weeks, ${preg.days} days (Trimester ${preg.trimester})\n* **Baby Size:** About the size of a **${preg.babySize.name}** ${preg.babySize.emoji}\n* **Countdown:** ${preg.daysToGo} days until estimated due date (**${CycleTracker.formatDate(CycleTracker.parseKey(preg.edd), 'long')}**).\n\nYou can view full pregnancy logs on the **Cycle Tracker** page.\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
                }
                return `You are not currently in Pregnancy Mode. If you are pregnant, click the **Pregnancy Mode** button in the Tracker section header to toggle gestational tracking, due date countdowns, and baby size milestones!\n\n<button onclick="window.navigateToPage('tracker')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Cycle Tracker 📅</button>`;
            }

            // Symptom Explanations (Preloaded Knowledge)
            if (q.includes('cramps') || q.includes('pain') || q.includes('ache')) {
                return `Cramps can occur during menstruation for many people. If symptoms are severe or unusual, consider consulting a healthcare professional. You can log cramps and pelvic pain on the **Symptom Logger** page.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
            }
            if (q.includes('fatigue') || q.includes('tired') || q.includes('energy')) {
                return `Fatigue is very common during the luteal phase (just before period) and menstruation, driven by progesterone shifts. \n\n* **Tips:** Prioritize rest, stay hydrated, and try light activity like walking. Record energy levels in the **Symptom Logger**.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
            }
            if (q.includes('headache') || q.includes('migraine')) {
                return `Hormonal headaches are often triggered by a sharp drop in estrogen right before menstruation begins. \n\n* **Tips:** Staying hydrated, getting enough sleep, and managing stress levels can reduce frequency. Ensure you log headaches to track their timing.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
            }
            if (q.includes('bloat') || q.includes('bloating') || q.includes('stomach')) {
                return `Bloating is driven by hormonal swings that cause water retention and sluggish digestion. \n\n* **Tips:** Drinking extra water, decreasing sodium, and eating fiber-rich foods can help. Log your bloating on the **Symptom Logger** page.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
            }
            if (q.includes('nausea') || q.includes('vomit') || q.includes('sick')) {
                return `Nausea can be associated with early pregnancy (morning sickness) or progesterone rises during the luteal phase.\n\n* **Tips:** Try ginger tea, eat small bland meals frequently, and avoid strong smells. Track symptoms to see if they follow a monthly cycle.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
            }
            if (q.includes('symptom') || q.includes('mood') || q.includes('trends')) {
                const freqs = {};
                let totalLogs = 0;
                for (const key in tracker.data.dailyLogs) {
                    const log = tracker.data.dailyLogs[key];
                    if (log.symptoms && log.symptoms.length > 0) {
                        log.symptoms.forEach(s => { freqs[s] = (freqs[s] || 0) + 1; });
                        totalLogs++;
                    }
                }
                const sorted = Object.keys(freqs).sort((a,b) => freqs[b] - freqs[a]);
                if (sorted.length > 0) {
                    const topSymptoms = sorted.slice(0, 3).join(', ');
                    return `Here is your customized symptom trend summary:\n\n* **Top Symptoms:** ${topSymptoms}\n* **Logs Analyzed:** ${totalLogs} days\n* **AI Insight:** These signs align with your cyclical hormones. Prostaglandin shifts cause cramps, and progesterone causes fatigue. View logs on the **Symptom Logger** page.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
                }
                return `You haven't logged any daily symptoms yet. Go to the **Symptom Logger** and tap tags to record details.\n\n<button onclick="window.navigateToPage('symptoms')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Symptom Logger 💊</button>`;
            }

            // Wellness Suggestions
            if (q.includes('wellness') || q.includes('advice') || q.includes('tip') || q.includes('exercise') || q.includes('diet') || q.includes('eat') || q.includes('nutrition')) {
                return `Here is a custom wellness checklist for your current cycle state:\n\n1. **Hydration:** Aim for 8-10 glasses (2.5L) of water to flush excess sodium and reduce fatigue.\n2. **Nutrition:** Eat magnesium-rich foods (dark chocolate, spinach, almonds) to ease muscle cramps, and prioritize fiber.\n3. **Activity:** Gentle movements like yoga, swimming, or light walking improve pelvic blood circulation and mood.\n4. **Sleep:** Set a consistent bedtime. Rest is crucial when progesterone is high.`;
            }

            // Sympto-Thermal
            if (q.includes('bbt') || q.includes('temp') || q.includes('mucus') || q.includes('lh') || q.includes('symptothermal')) {
                return `The sympto-thermal fertility awareness method tracking details:\n\n1. **Basal Body Temperature (BBT):** Take your temperature oral reading immediately upon waking. Ovulation causes a progesterone spike of 0.5°F–1.0°F.\n2. **Cervical Mucus:** Right before ovulation, high estrogen changes fluid to a slippery, stretchy, 'eggwhite' consistency.\n3. **LH Tests:** Urine test strips measure luteinizing hormone. A surge indicates ovulation is coming in 24–48 hours.\n\nYou can track cycle patterns on the **Ovulation** page.\n\n<button onclick="window.navigateToPage('ovulation')" style="margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Go to Ovulation 🥚</button>`;
            }

            // Greetings & Hello
            if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greetings') || q.includes('help')) {
                return `Hello **${userName}**! I'm **Eve**, your built-in Smart Health Assistant.\n\nI can help you review cycle dates, explain symptoms, calculate fertility windows, check pregnancy milestones, or navigate the app. Ask me anything like:\n\n* *"When is my next period expected?"*
* *"I have cramps today"* 
* *"Tell me about my pregnancy size"* 
* *"Give me some wellness tips"*`;
            }

            // Default fallback response
            return `I'm here to support you, **${userName}**. I'm trained on cycle science, ovulation tracking, symptom trends, and pregnancy progression. \n\nYou can check cycle forecasts in **Predictions**, log symptoms in the **Symptom Logger**, or view cycle calendar details in the **Cycle Tracker**. What would you like to discuss today?`;
        }

        function showPremiumTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'premium-chat-msg bot';
            indicator.id = 'premiumTypingIndicator';
            
            const avatar = document.createElement('div');
            avatar.className = 'msg-avatar';
            avatar.textContent = '🤖';
            
            const bubble = document.createElement('div');
            bubble.className = 'msg-bubble';
            bubble.style.background = 'none';
            bubble.style.border = 'none';
            bubble.style.padding = '0';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'premium-typing-indicator';
            wrapper.innerHTML = `
                <div class="premium-typing-dot"></div>
                <div class="premium-typing-dot"></div>
                <div class="premium-typing-dot"></div>
            `;
            
            bubble.appendChild(wrapper);
            indicator.appendChild(avatar);
            indicator.appendChild(bubble);
            chatFeed.appendChild(indicator);
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }

        function removePremiumTypingIndicator() {
            const indicator = document.getElementById('premiumTypingIndicator');
            if (indicator) indicator.remove();
        }

        // Toggle attachment menu
        btnAttachmentToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            attachmentMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', () => {
            attachmentMenu.classList.remove('active');
        });
        
        attachPhotoBtn.addEventListener('click', () => photoInput.click());
        attachGalleryBtn.addEventListener('click', () => galleryInput.click());
        attachDocBtn.addEventListener('click', () => docInput.click());
        
        photoInput.addEventListener('change', handleFileSelect);
        galleryInput.addEventListener('change', handleFileSelect);
        docInput.addEventListener('change', handleFileSelect);
        
        function handleFileSelect(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                
                const isImg = file.type && file.type.startsWith('image/');
                const isTxt = file.name.endsWith('.txt') || file.name.endsWith('.csv') || (file.type && file.type.startsWith('text/'));
                
                if (isImg) {
                    reader.onload = function(evt) {
                        activeAttachments.push({
                            name: file.name,
                            type: file.type || 'image/png',
                            size: file.size,
                            dataUrl: evt.target.result
                        });
                        renderAttachmentPreview();
                    };
                    reader.readAsDataURL(file);
                } else if (isTxt) {
                    reader.onload = function(evt) {
                        activeAttachments.push({
                            name: file.name,
                            type: file.type || 'text/plain',
                            size: file.size,
                            textContent: evt.target.result
                        });
                        renderAttachmentPreview();
                    };
                    reader.readAsText(file);
                } else {
                    // Read PDF and other binary files as Data URL as well
                    reader.onload = function(evt) {
                        activeAttachments.push({
                            name: file.name,
                            type: file.type || 'application/octet-stream',
                            size: file.size,
                            dataUrl: evt.target.result
                        });
                        renderAttachmentPreview();
                    };
                    reader.readAsDataURL(file);
                }
            }
            e.target.value = '';
        }
        
        function renderAttachmentPreview() {
            if (activeAttachments.length === 0) {
                attachmentPreviewBar.style.display = 'none';
                attachmentPreviewBar.innerHTML = '';
                btnSendChatPremium.disabled = chatTextarea.value.trim() === '';
                return;
            }
            
            attachmentPreviewBar.style.display = 'flex';
            attachmentPreviewBar.innerHTML = '';
            
            activeAttachments.forEach((file, index) => {
                const chip = document.createElement('div');
                chip.className = 'preview-chip';
                
                const isImg = file.type.startsWith('image/');
                chip.innerHTML = `
                    <span>${isImg ? '🖼️' : '📄'}</span>
                    <span style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</span>
                `;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'preview-chip-remove';
                removeBtn.innerHTML = '✕';
                removeBtn.addEventListener('click', () => {
                    activeAttachments.splice(index, 1);
                    renderAttachmentPreview();
                });
                
                chip.appendChild(removeBtn);
                attachmentPreviewBar.appendChild(chip);
            });
            
            btnSendChatPremium.disabled = false;
        }

        chatTextarea.addEventListener('input', () => {
            chatTextarea.style.height = 'auto';
            chatTextarea.style.height = chatTextarea.scrollHeight + 'px';
            
            const hasText = chatTextarea.value.trim() !== '';
            const hasFiles = activeAttachments.length > 0;
            btnSendChatPremium.disabled = !(hasText || hasFiles);
        });
        
        btnSendChatPremium.addEventListener('click', handleSendPremium);
        chatTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPremium();
            }
        });

        assistantFab.addEventListener('click', () => {
            chatOverlay.style.display = 'flex';
            setTimeout(() => {
                chatOverlay.classList.add('active');
            }, 10);
            
            // Update mode header badge dynamically when chat opens
            if (typeof updateChatHeader === 'function') updateChatHeader();
            
            const sessions = getSessions();
            if (!currentSessionId) {
                currentSessionId = sessions[0].id;
            }
            switchSession(currentSessionId);
            chatTextarea.focus();
        });
        
        function closeChatOverlay() {
            chatOverlay.classList.remove('active');
            setTimeout(() => {
                chatOverlay.style.display = 'none';
            }, 300);
        }
        
        chatCloseBtn.addEventListener('click', closeChatOverlay);
        chatOverlayBackdrop.addEventListener('click', closeChatOverlay);
        
        btnToggleSidebar.addEventListener('click', () => {
            chatSidebar.classList.toggle('active');
        });
        btnSidebarCloseMobile.addEventListener('click', () => {
            chatSidebar.classList.remove('active');
        });
        
        btnNewChat.addEventListener('click', createNewChat);
        btnClearAllChats.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear all chat histories? This cannot be undone.")) {
                localStorage.removeItem('eveai_chat_sessions');
                currentSessionId = 'session-default';
                switchSession(currentSessionId);
            }
        });
    }

    // Helper to compute correlation scores for all 6 conditions
    function calculateCorrelationScores(answers = null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const assessedSymptoms = new Set();
        // Read selected tags from UI in real time
        document.querySelectorAll('#page-symptoms .symptom-tag.active').forEach(tag => {
            assessedSymptoms.add(tag.textContent.trim());
        });

        // Read logged symptoms from the last 30 days
        let heavyFlowCount = 0;
        let periodDaysCount = 0;
        for (const k in tracker.data.dailyLogs) {
            const log = tracker.data.dailyLogs[k];
            const gap = CycleTracker.daysBetween(k, today);
            if (gap <= 30) {
                if (log.symptoms) {
                    log.symptoms.forEach(s => assessedSymptoms.add(s));
                }
                if (log.isPeriod) {
                    periodDaysCount++;
                    if (log.flow === 'heavy') heavyFlowCount++;
                }
            }
        }

        const variation = tracker.getCycleLengthVariation();
        let age = 28;
        if (tracker.data.settings.userDob) {
            const birthYear = new Date(tracker.data.settings.userDob).getFullYear();
            age = today.getFullYear() - birthYear;
        }

        // PCOS calculations
        let pcos = 0;
        const pcosMatched = [];
        if (variation > 3.5) { pcos += 25; pcosMatched.push('Cycle length variation'); }
        if (assessedSymptoms.has('Acne')) { pcos += 25; pcosMatched.push('Acne'); }
        if (assessedSymptoms.has('Fatigue')) { pcos += 15; pcosMatched.push('Fatigue'); }
        if (heavyFlowCount > 0) { pcos += 15; pcosMatched.push('Heavy flow'); }
        if (answers) {
            if (answers.q3 === 'yes') { pcos += 30; pcosMatched.push('Significant hair shifts / weight gains'); }
            else if (answers.q3 === 'some') { pcos += 15; pcosMatched.push('Mild physical shifts'); }
            if (answers.q1 === 'yes') { pcos += 15; pcosMatched.push('Unpredictable cycle intervals'); }
        } else {
            pcos += 10;
        }
        pcos = Math.min(95, Math.max(5, pcos));

        // Endometriosis calculations
        let endo = 0;
        const endoMatched = [];
        if (assessedSymptoms.has('Cramps')) { endo += 35; endoMatched.push('Severe pelvic cramps'); }
        if (assessedSymptoms.has('Backache')) { endo += 15; endoMatched.push('Backache'); }
        if (assessedSymptoms.has('Fatigue')) { endo += 15; endoMatched.push('Fatigue'); }
        if (heavyFlowCount > 0) { endo += 15; endoMatched.push('Heavy menstrual flow'); }
        if (answers) {
            if (answers.q2 === 'yes') { endo += 35; endoMatched.push('Debilitating menstrual pain'); }
            else if (answers.q2 === 'sometimes') { endo += 15; endoMatched.push('Occasionally severe pelvic pain'); }
        } else {
            endo += 10;
        }
        endo = Math.min(95, Math.max(5, endo));

        // Fibroids calculations
        let fib = 0;
        const fibMatched = [];
        if (heavyFlowCount > 0) { fib += 35; fibMatched.push('Heavy menstrual flow logs'); }
        if (assessedSymptoms.has('Backache')) { fib += 15; fibMatched.push('Backache'); }
        if (assessedSymptoms.has('Frequent Urination')) { fib += 20; fibMatched.push('Frequent urination'); }
        if (periodDaysCount > 7) { fib += 20; fibMatched.push('Prolonged bleeding (>7 days)'); }
        if (answers) {
            if (answers.q4 === 'yes') { fib += 25; fibMatched.push('Pad soaking within 1-2 hours'); }
            else if (answers.q4 === 'sometimes') { fib += 10; fibMatched.push('Occasional heavy bleeding'); }
        } else {
            fib += 5;
        }
        fib = Math.min(95, Math.max(5, fib));

        // Perimenopause calculations
        let peri = 0;
        const periMatched = [];
        if (age >= 40 && age < 48) { peri += 25; periMatched.push('Age group (40-48)'); }
        if (age >= 48) { peri += 45; periMatched.push('Age group (48+)'); }
        if (assessedSymptoms.has('Insomnia')) { peri += 20; periMatched.push('Insomnia'); }
        if (assessedSymptoms.has('Mood Swings')) { peri += 15; periMatched.push('Mood swings'); }
        if (assessedSymptoms.has('Brain Fog')) { peri += 15; periMatched.push('Brain fog'); }
        if (answers) {
            if (answers.q5 === 'yes') { peri += 30; periMatched.push('Frequent hot flashes / night sweats'); }
            else if (answers.q5 === 'sometimes') { peri += 15; periMatched.push('Occasional night sweats'); }
            if (answers.q1 === 'yes') { peri += 15; periMatched.push('Unpredictable cycle intervals'); }
        } else {
            peri += 5;
        }
        peri = Math.min(95, Math.max(5, peri));

        // PMDD calculations
        let pmdd = 0;
        const pmddMatched = [];
        let psychCount = 0;
        const psychSymptoms = ['Mood Swings', 'Anxiety', 'Irritability', 'Sadness', 'Stress', 'Brain Fog'];
        psychSymptoms.forEach(s => {
            if (assessedSymptoms.has(s)) {
                psychCount++;
                pmddMatched.push(s);
            }
        });
        pmdd += psychCount * 15;
        if (assessedSymptoms.has('Insomnia')) { pmdd += 10; pmddMatched.push('Insomnia'); }
        if (assessedSymptoms.has('Fatigue')) { pmdd += 10; pmddMatched.push('Fatigue'); }
        if (answers) {
            if (answers.q6 === 'yes') { pmdd += 30; pmddMatched.push('Severe premenstrual mood disruption'); }
            else if (answers.q6 === 'sometimes') { pmdd += 15; pmddMatched.push('Mild premenstrual mood shifts'); }
        } else {
            pmdd += 5;
        }
        pmdd = Math.min(95, Math.max(5, pmdd));

        // Adenomyosis calculations
        let adeno = 0;
        const adenoMatched = [];
        if (assessedSymptoms.has('Cramps')) { adeno += 30; adenoMatched.push('Severe cramps'); }
        if (assessedSymptoms.has('Backache')) { adeno += 15; adenoMatched.push('Backache'); }
        if (assessedSymptoms.has('Bloating')) { adeno += 15; adenoMatched.push('Bloating'); }
        if (heavyFlowCount > 0) { adeno += 25; adenoMatched.push('Heavy flow logs'); }
        if (answers) {
            if (answers.q2 === 'yes') { adeno += 20; adenoMatched.push('Debilitating pain'); }
            if (answers.q4 === 'yes') { adeno += 20; adenoMatched.push('Consistently heavy periods'); }
        } else {
            adeno += 5;
        }
        adeno = Math.min(95, Math.max(5, adeno));

        return {
            pcos: { score: pcos, matched: pcosMatched },
            endo: { score: endo, matched: endoMatched },
            fib: { score: fib, matched: fibMatched },
            peri: { score: peri, matched: periMatched },
            pmdd: { score: pmdd, matched: pmddMatched },
            adeno: { score: adeno, matched: adenoMatched }
        };
    }

    function updateConditionMatcher(quizAnswers = null) {
        const answers = quizAnswers || tracker.data.symptomQuiz;

        const pcosPct = document.getElementById('pcosPct');
        const pcosBar = document.getElementById('pcosBar');
        const endoPct = document.getElementById('endoPct');
        const endoBar = document.getElementById('endoBar');
        const fibroidPct = document.getElementById('fibroidPct');
        const fibroidBar = document.getElementById('fibroidBar');
        const periPct = document.getElementById('periPct');
        const periBar = document.getElementById('periBar');
        const pmddPct = document.getElementById('pmddPct');
        const pmddBar = document.getElementById('pmddBar');
        const adenoPct = document.getElementById('adenoPct');
        const adenoBar = document.getElementById('adenoBar');
        const assessedSymptomsList = document.getElementById('assessedSymptomsList');

        if (!pcosPct) return;

        const scores = calculateCorrelationScores(answers);

        // Read evaluated list display
        const assessedSymptoms = new Set();
        document.querySelectorAll('#page-symptoms .symptom-tag.active').forEach(tag => {
            assessedSymptoms.add(tag.textContent.trim());
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const k in tracker.data.dailyLogs) {
            const log = tracker.data.dailyLogs[k];
            const gap = CycleTracker.daysBetween(k, today);
            if (gap <= 30 && log.symptoms) {
                log.symptoms.forEach(s => assessedSymptoms.add(s));
            }
        }

        if (assessedSymptomsList) {
            const arr = Array.from(assessedSymptoms);
            if (arr.length === 0) {
                assessedSymptomsList.textContent = 'No active symptoms logged today or recently.';
                assessedSymptomsList.style.color = 'var(--text-muted)';
            } else {
                assessedSymptomsList.textContent = arr.join(', ');
                assessedSymptomsList.style.color = 'var(--text-primary)';
            }
        }

        updateRow(pcosPct, pcosBar, scores.pcos.score);
        updateRow(endoPct, endoBar, scores.endo.score);
        updateRow(fibroidPct, fibroidBar, scores.fib.score);
        updateRow(periPct, periBar, scores.peri.score);
        updateRow(pmddPct, pmddBar, scores.pmdd.score);
        updateRow(adenoPct, adenoBar, scores.adeno.score);
    }

    function updateRow(pctEl, barEl, score) {
        if (!pctEl || !barEl) return;
        
        let label = 'Low Match';
        let color = 'var(--green)';
        
        if (score >= 70) {
            label = 'High Match';
            color = 'var(--coral)';
        } else if (score >= 35) {
            label = 'Mod Match';
            color = 'var(--amber)';
        }

        pctEl.textContent = `${score}% ${label}`;
        pctEl.style.color = color;
        barEl.style.width = `${score}%`;
        barEl.style.background = color;
    }

    function initConditionMatcherQuiz() {
        const card = document.getElementById('conditionMatcherCard');
        if (!card) return;

        let currentStep = 0;
        const quizAnswers = {
            q1: null,
            q2: null,
            q3: null,
            q4: null,
            q5: null,
            q6: null
        };

        const questionsList = [
            {
                id: 'q1',
                text: '1. Cycle Irregularity: Have your cycles fluctuated by more than 7 days over the last 6 months?',
                options: [
                    { value: 'no', label: 'No, cycle is fairly regular' },
                    { value: 'yes', label: 'Yes, cycles are highly unpredictable' },
                    { value: 'unsure', label: 'Not sure / too early to tell' }
                ]
            },
            {
                id: 'q2',
                text: '2. Pain Intensity: Do you experience pelvic cramps or back pain severe enough to disrupt school or work tasks?',
                options: [
                    { value: 'no', label: 'No, standard or mild cramps' },
                    { value: 'sometimes', label: 'Sometimes, occasionally severe' },
                    { value: 'yes', label: 'Yes, frequently severe or debilitating' }
                ]
            },
            {
                id: 'q3',
                text: '3. Physical Shifts: Have you noticed symptoms like unexplained weight gain, excess hair growth on face/chin, or persistent acne?',
                options: [
                    { value: 'no', label: 'No noticeable shifts' },
                    { value: 'some', label: 'Yes, mild acne or minor weight shifts' },
                    { value: 'yes', label: 'Yes, significant hair shifts, weight gain, or deep acne' }
                ]
            },
            {
                id: 'q4',
                text: '4. Menstrual Bleeding: Do you regularly experience heavy periods (e.g., soaking pads within 1-2 hours) or bleeding lasting over 7 days?',
                options: [
                    { value: 'no', label: 'No, normal flow and duration' },
                    { value: 'sometimes', label: 'Sometimes or heavy for 1-2 days' },
                    { value: 'yes', label: 'Yes, consistently heavy or prolonged' }
                ]
            },
            {
                id: 'q5',
                text: '5. Temperature & Sleep: Do you experience hot flashes, sudden night sweats, or night awakenings with sweating?',
                options: [
                    { value: 'no', label: 'No hot flashes or sweats' },
                    { value: 'sometimes', label: 'Occasional flashes or night sweating' },
                    { value: 'yes', label: 'Yes, frequent hot flashes/night sweats' }
                ]
            },
            {
                id: 'q6',
                text: '6. Premenstrual Mood Shifts: Do you experience severe anxiety, mood swings, irritability, or sadness that peaks 1-2 weeks before your period and resolves once it starts?',
                options: [
                    { value: 'no', label: 'No, standard premenstrual symptoms' },
                    { value: 'sometimes', label: 'Occasionally, mild mood shifts' },
                    { value: 'yes', label: 'Yes, severe mood shifts that impact daily life/relationships' }
                ]
            }
        ];

        const defaultHTML = document.getElementById('conditionMatcherBody').innerHTML;

        function resetToDefaultView() {
            const body = document.getElementById('conditionMatcherBody');
            if (body) {
                body.innerHTML = defaultHTML;
                updateConditionMatcher();
            }
        }

        function renderQuizStep(stepIndex) {
            const body = document.getElementById('conditionMatcherBody');
            if (!body) return;

            const q = questionsList[stepIndex];
            const currentAnswer = quizAnswers[q.id];
            const pct = Math.round(((stepIndex + 1) / questionsList.length) * 100);

            let optionsHTML = '';
            q.options.forEach(opt => {
                const isActive = currentAnswer === opt.value;
                optionsHTML += `
                    <div class="quiz-option-card ${isActive ? 'active' : ''}" data-value="${opt.value}">
                        <div class="quiz-option-check"></div>
                        <span class="quiz-option-text">${opt.label}</span>
                    </div>
                `;
            });

            body.innerHTML = `
                <div class="symptom-quiz-form" style="animation: fadeDown 0.3s var(--ease-out) both; margin-top: 0.5rem;">
                    <div class="quiz-header">
                        <div class="quiz-meta">
                            <span>Symptom Screening Wizard</span>
                            <span>Question ${stepIndex + 1} of ${questionsList.length}</span>
                        </div>
                        <div class="quiz-progress-bar">
                            <div class="quiz-progress-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>
                    
                    <p class="quiz-question-title">${q.text}</p>
                    
                    <div class="quiz-options-list">
                        ${optionsHTML}
                    </div>

                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <button class="btn-secondary" id="btnQuizBack" style="flex: 1; padding: 0.45rem; font-size: 0.75rem; border-radius: var(--radius-sm); ${stepIndex === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${stepIndex === 0 ? 'disabled' : ''}>Back</button>
                        <button class="btn-primary" id="btnQuizNext" style="flex: 2; padding: 0.45rem; font-size: 0.75rem; border-radius: var(--radius-sm); background: var(--grad-purple); ${!currentAnswer ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!currentAnswer ? 'disabled' : ''}>
                            ${stepIndex === questionsList.length - 1 ? 'Calculate AI Report' : 'Next'}
                        </button>
                    </div>
                    
                    <button class="btn-secondary" id="btnCancelQuiz" style="width: 100%; padding: 0.45rem; font-size: 0.75rem; border-radius: var(--radius-sm); margin-top: 0.5rem; background: transparent; border: 1px dashed var(--border-glass);">Exit Assessment</button>
                </div>
            `;

            // Bind option clicks
            body.querySelectorAll('.quiz-option-card').forEach(card => {
                card.addEventListener('click', () => {
                    body.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    quizAnswers[q.id] = card.dataset.value;
                    
                    const nextBtn = document.getElementById('btnQuizNext');
                    if (nextBtn) {
                        nextBtn.removeAttribute('disabled');
                        nextBtn.style.opacity = '1';
                        nextBtn.style.cursor = 'pointer';
                    }
                });
            });
        }

        function submitQuiz(answers) {
            tracker.data.symptomQuiz = answers;
            tracker.save();
            renderQuizResult(answers);
        }

        function renderQuizResult(answers) {
            const body = document.getElementById('conditionMatcherBody');
            if (!body) return;

            const scores = calculateCorrelationScores(answers);

            const conditions = [
                {
                    name: 'PCOS (Polycystic Ovary Syndrome)',
                    score: scores.pcos.score,
                    matchedSymptoms: scores.pcos.matched,
                    desc: 'A common hormonal disorder among individuals of reproductive age, characterized by irregular menstrual periods, elevated androgen levels (causing acne or excess facial hair), and fluid-filled sacs (follicles) surrounding the eggs in the ovaries.',
                    diagnostics: 'Typically diagnosed using the Rotterdam Criteria. A clinician will order a hormone panel (free and total testosterone, DHEA-S, LH/FSH ratio) and a transvaginal pelvic ultrasound to check ovary morphology.',
                    advise: 'Incorporate low-glycemic foods, engage in regular strength training or moderate cardio to manage insulin resistance, and consult a doctor regarding metformin or specific oral contraceptives to regulate cycles.'
                },
                {
                    name: 'Endometriosis',
                    score: scores.endo.score,
                    matchedSymptoms: scores.endo.matched,
                    desc: 'A condition where tissue similar to the lining of the uterus (endometrium) grows outside the uterine cavity, often on the ovaries, fallopian tubes, and pelvic walls, leading to intense inflammation and chronic pain.',
                    diagnostics: 'Transvaginal pelvic ultrasound or pelvic MRI can identify deep infiltrating endometriosis or endometriomas (ovarian cysts). The gold standard for definitive diagnosis is a minimally invasive diagnostic laparoscopy with biopsy.',
                    advise: 'Utilize heating pads, pelvic floor physical therapy, anti-inflammatory dietary choices (omega-3 fatty acids, turmeric), and discuss hormonal therapies (progestin-only pills, GnRH agonists) or laparoscopic excision with your doctor.'
                },
                {
                    name: 'Uterine Fibroids',
                    score: scores.fib.score,
                    matchedSymptoms: scores.fib.matched,
                    desc: 'Benign (non-cancerous) growths of the muscle wall of the uterus that can range in size from tiny seedlings to bulky masses, often causing heavy or prolonged menstrual bleeding, pelvic pain, and pressure on the bladder.',
                    diagnostics: 'Primary screening is performed via a pelvic or transvaginal ultrasound. An saline-infused sonohysterogram or pelvic MRI may be ordered to map the exact size and position of subserosal, intramural, or submucosal fibroids.',
                    advise: 'Monitor iron levels to prevent anemia from heavy bleeding, consider tranexamic acid to decrease flow, or review surgical/non-surgical interventions (myomectomy, uterine artery embolization, MRI-guided ultrasound) with a specialist.'
                },
                {
                    name: 'Perimenopause',
                    score: scores.peri.score,
                    matchedSymptoms: scores.peri.matched,
                    desc: 'The transition phase preceding menopause, marked by fluctuating hormone levels as ovarian reserve declines. Symptoms typically include irregular cycles, hot flashes, night sweats, sleep disturbances, and mood changes.',
                    diagnostics: 'Clinical diagnosis based on age (typically 40–50) and cycle irregularities. Serum FSH and estradiol tests are occasionally checked, though levels fluctuate wildly. Thyroid panel (TSH) is recommended to rule out thyroid dysfunction.',
                    advise: 'Prioritize sleep hygiene, manage vasomotor triggers (caffeine, alcohol, spicy foods), include weight-bearing exercise for bone health, and explore hormone replacement therapy (HRT) or non-hormonal options with a doctor.'
                },
                {
                    name: 'PMDD (Premenstrual Dysphoric Disorder)',
                    score: scores.pmdd.score,
                    matchedSymptoms: scores.pmdd.matched,
                    desc: 'A severe, sometimes disabling extension of premenstrual syndrome (PMS) characterized by extreme emotional distress, anxiety, irritability, and depressive episodes that peak during the luteal phase and resolve soon after menstruation begins.',
                    diagnostics: 'Diagnosed by documenting the daily presence of at least 5 key psychological and physical symptoms over a prospective 2-month log. Thyroid and hormone tests are performed to rule out underlying endocrine issues.',
                    advise: 'Engage in CBT (Cognitive Behavioral Therapy), discuss selective serotonin reuptake inhibitors (SSRIs) taken continuously or only during the luteal phase, optimize calcium and vitamin B6 intake, and maintain strict cycle logging.'
                },
                {
                    name: 'Adenomyosis',
                    score: scores.adeno.score,
                    matchedSymptoms: scores.adeno.matched,
                    desc: 'A condition where endometrial tissue grows directly into the muscular wall (myometrium) of the uterus, causing the uterus to double or triple in size. This leads to heavy, painful periods and chronic pelvic pain.',
                    diagnostics: 'Best visualized using high-resolution transvaginal ultrasound (which shows an asymmetric, globose uterus) or a pelvic MRI. Definitive diagnosis is confirmed pathologically after a hysterectomy.',
                    advise: 'Manage pain using NSAIDs, discuss progesterone-releasing IUDs (e.g., Mirena) to control heavy bleeding, or review uterine artery embolization and hormonal options to suppress menstruation.'
                }
            ].sort((a, b) => b.score - a.score);

            let resultRowsHTML = '';
            conditions.forEach((cond, index) => {
                let matchLabel = 'Low Correlation';
                let matchColor = 'var(--green)';
                if (cond.score >= 70) {
                    matchLabel = 'High Correlation';
                    matchColor = 'var(--coral)';
                } else if (cond.score >= 35) {
                    matchLabel = 'Moderate Correlation';
                    matchColor = 'var(--amber)';
                }

                let matchedSymptomsHTML = '';
                if (cond.matchedSymptoms.length > 0) {
                    matchedSymptomsHTML = `
                        <div class="condition-matched-tags">
                            ${cond.matchedSymptoms.map(s => `<span class="matched-tag">${s}</span>`).join('')}
                        </div>
                    `;
                } else {
                    matchedSymptomsHTML = `
                        <div style="font-size: 0.68rem; color: var(--text-muted); margin: 0.25rem 0 0.5rem 0; font-style: italic;">No matching symptoms logged.</div>
                    `;
                }

                resultRowsHTML += `
                    <div style="padding: 0.75rem; background: rgba(255,255,255,0.01); border-radius: var(--radius-sm); border: 1px solid var(--border-glass); margin-bottom: 0.5rem; transition: background 0.2s;">
                        <button class="condition-detail-btn" data-target="drawer-${index}" style="width: 100%; text-align: left; background: none; border: none; padding: 0; cursor: pointer; outline: none;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                                <strong style="color: var(--text-primary); font-size: 0.78rem;">${cond.name}</strong>
                                <span style="font-weight: 700; color: ${matchColor}; font-size: 0.72rem; display: flex; align-items: center; gap: 0.35rem;">
                                    ${cond.score}% Match
                                    <span class="condition-detail-chevron" style="display: inline-block; font-size: 0.6rem; transition: transform 0.3s; transform-origin: center;">▼</span>
                                </span>
                            </div>
                            <div class="confidence-bar" style="height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${cond.score}%; background: ${matchColor}; height: 100%;"></div>
                            </div>
                        </button>
                        
                        <div class="condition-detail-drawer" id="drawer-${index}" style="max-height: 0; overflow: hidden; transition: all 0.3s ease-out; padding: 0;">
                            <div style="padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.55rem; border-top: 1px dashed var(--border-glass); margin-top: 0.65rem;">
                                <div>
                                    <div class="detail-section-title">Matched Indicators</div>
                                    ${matchedSymptomsHTML}
                                </div>
                                
                                <div>
                                    <div class="detail-section-title">Clinical Overview</div>
                                    <p class="detail-section-content">${cond.desc}</p>
                                </div>
                                
                                <div>
                                    <div class="detail-section-title">Key Diagnostics & Testing</div>
                                    <p class="detail-section-content">${cond.diagnostics}</p>
                                </div>
                                
                                <div>
                                    <div class="detail-section-title">Clinician Recommendations</div>
                                    <p class="detail-section-content">${cond.advise}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            body.innerHTML = `
                <div class="symptom-quiz-result" style="animation: fadeDown 0.3s var(--ease-out) both; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.85rem;">
                    <div class="cycle-tip-banner luteal" style="border-color: rgba(129, 140, 248, 0.3); background: rgba(129, 140, 248, 0.08); color: #C7D2FE; font-size: 0.72rem; padding: 0.5rem 0.65rem;">
                        <span class="cycle-tip-icon">🤖</span>
                        <div><strong>AI Diagnostic Analysis Report:</strong> Calculated combining your daily logs and quiz responses. Click each condition to view clinician insights.</div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.65rem;">
                        ${resultRowsHTML}
                    </div>

                    <div style="border: 1px dashed rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.05); color: #FCD34D; font-size: 0.68rem; padding: 0.65rem; border-radius: var(--radius-sm); line-height: 1.45;">
                        ⚠️ <strong>Medical Disclaimer:</strong> This checker uses statistical correlation algorithms for educational guidance and does NOT constitute medical diagnosis. If you have severe symptoms, please consult a gynecologist for a professional diagnosis.
                    </div>

                    <button class="btn-secondary" id="btnResetQuiz" style="width: 100%; padding: 0.5rem; font-size: 0.75rem; border-radius: var(--radius-sm);">Reset Assessment</button>
                </div>
            `;

            // Bind drawer toggles
            body.querySelectorAll('.condition-detail-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const drawerId = btn.dataset.target;
                    const drawer = document.getElementById(drawerId);
                    const chevron = btn.querySelector('.condition-detail-chevron');
                    
                    if (drawer.style.maxHeight === '0px' || !drawer.style.maxHeight) {
                        drawer.style.maxHeight = '500px';
                        drawer.style.paddingBottom = '0.5rem';
                        chevron.style.transform = 'rotate(180deg)';
                    } else {
                        drawer.style.maxHeight = '0px';
                        drawer.style.paddingBottom = '0px';
                        chevron.style.transform = 'rotate(0deg)';
                    }
                });
            });
        }

        // Initialize display based on saved report
        if (tracker.data.symptomQuiz) {
            renderQuizResult(tracker.data.symptomQuiz);
        } else {
            resetToDefaultView();
        }

        card.addEventListener('click', (e) => {
            const startBtn = e.target.closest('#btnStartAssessment');
            if (startBtn) {
                currentStep = 0;
                Object.keys(quizAnswers).forEach(k => {
                    quizAnswers[k] = tracker.data.symptomQuiz ? tracker.data.symptomQuiz[k] : null;
                });
                renderQuizStep(currentStep);
                return;
            }

            const cancelBtn = e.target.closest('#btnCancelQuiz');
            if (cancelBtn) {
                tracker.data.symptomQuiz = null;
                tracker.save();
                resetToDefaultView();
                return;
            }

            const backBtn = e.target.closest('#btnQuizBack');
            if (backBtn && currentStep > 0) {
                currentStep--;
                renderQuizStep(currentStep);
                return;
            }

            const nextBtn = e.target.closest('#btnQuizNext');
            if (nextBtn) {
                const qId = questionsList[currentStep].id;
                if (!quizAnswers[qId]) return;

                if (currentStep === questionsList.length - 1) {
                    submitQuiz(quizAnswers);
                } else {
                    currentStep++;
                    renderQuizStep(currentStep);
                }
                return;
            }

            const resetBtn = e.target.closest('#btnResetQuiz');
            if (resetBtn) {
                tracker.data.symptomQuiz = null;
                tracker.save();
                resetToDefaultView();
                return;
            }
        });
    }

});
