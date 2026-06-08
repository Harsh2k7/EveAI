/* =========================================================
   EveAI — Cycle Tracker Data Engine
   Handles persistence, predictions, and AI insights
   ========================================================= */

class CycleTracker {
    constructor() {
        this.STORAGE_KEY = 'eveai_cycle_data';
        this.data = this.load();
    }

    // ==================== PERSISTENCE ====================

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    dailyLogs: parsed.dailyLogs || {},
                    cycles: parsed.cycles || [],
                    symptomQuiz: parsed.symptomQuiz || null,
                    settings: {
                        ...this.defaultSettings(),
                        ...(parsed.settings || {})
                    },
                    createdAt: parsed.createdAt || new Date().toISOString(),
                };
            }
        } catch (e) {
            console.warn('CycleTracker: Failed to load data', e);
        }
        return {
            dailyLogs: {},
            cycles: [],
            symptomQuiz: null,
            settings: this.defaultSettings(),
            createdAt: new Date().toISOString(),
        };
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('CycleTracker: Failed to save data', e);
        }
    }

    defaultSettings() {
        return {
            avgCycleLength: 28,
            avgPeriodDuration: 5,
            lutealPhase: 14,
            isPregnant: false,
            lmpDate: null,
            userName: 'Alok',
            userDob: '1998-03-15',
            userEmail: 'alok@example.com',
            remindPeriod: true,
            remindFertile: true,
            remindSymptom: false,
            remindSummary: true,
            darkMode: true,
            accentColor: 'pink',
            doctorInfo: null,   // { name, specialization, phone, clinic, notes }
            autoReports: {
                enabled: false,
                frequency: 'weekly',    // daily | weekly | monthly
                time: '21:00',
                dataCategories: ['cycles','symptoms','mood','ai_insights'],
                destinations: ['doctor'],
                history: [],            // [{ type, date, time }]
                lastSentAt: null
            }
        };
    }

    // ==================== DATE HELPERS ====================

    static toKey(date) {
        if (typeof date === 'string') return date;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    static parseKey(key) {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    static daysBetween(dateA, dateB) {
        const a = new Date(dateA);
        const b = new Date(dateB);
        a.setHours(0, 0, 0, 0);
        b.setHours(0, 0, 0, 0);
        return Math.round((b - a) / (1000 * 60 * 60 * 24));
    }

    static addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    static formatDate(date, style = 'short') {
        const d = new Date(date);
        if (style === 'short') {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // ==================== DAILY LOG MANAGEMENT ====================

    getLog(dateKey) {
        return this.data.dailyLogs[dateKey] || null;
    }

    setLog(dateKey, logData) {
        this.data.dailyLogs[dateKey] = {
            ...logData,
            updatedAt: new Date().toISOString(),
        };
        this.save();
        this.rebuildCycles();
    }

    removeLog(dateKey) {
        delete this.data.dailyLogs[dateKey];
        this.save();
        this.rebuildCycles();
    }

    /**
     * Toggle a period day on/off. If the day has a period log, remove it.
     * Otherwise, add a default medium-flow period log.
     */
    togglePeriodDay(dateKey, flow = 'medium') {
        const existing = this.getLog(dateKey);
        if (existing && existing.isPeriod) {
            // Remove period from this day
            if (existing.notes) {
                // Keep the log but remove period flag
                this.data.dailyLogs[dateKey] = { ...existing, isPeriod: false, flow: null };
            } else {
                delete this.data.dailyLogs[dateKey];
            }
        } else {
            // Add period day
            this.data.dailyLogs[dateKey] = {
                ...(existing || {}),
                isPeriod: true,
                flow: flow,
                updatedAt: new Date().toISOString(),
            };
        }
        this.save();
        this.rebuildCycles();
    }

    setFlow(dateKey, flow) {
        const existing = this.getLog(dateKey) || {};
        this.data.dailyLogs[dateKey] = {
            ...existing,
            isPeriod: true,
            flow: flow,
            updatedAt: new Date().toISOString(),
        };
        this.save();
    }

    setNotes(dateKey, notes) {
        const existing = this.getLog(dateKey) || {};
        this.data.dailyLogs[dateKey] = {
            ...existing,
            notes: notes,
            updatedAt: new Date().toISOString(),
        };
        this.save();
    }

    // ==================== CYCLE DETECTION ====================

    /**
     * Scans all daily logs and groups consecutive period days into cycles.
     * A gap of 2+ non-period days separates distinct cycles.
     */
    rebuildCycles() {
        const periodDays = Object.keys(this.data.dailyLogs)
            .filter(key => this.data.dailyLogs[key].isPeriod)
            .sort();

        if (periodDays.length === 0) {
            this.data.cycles = [];
            this.save();
            return;
        }

        const cycles = [];
        let currentCycle = { startDate: periodDays[0], endDate: periodDays[0], days: [periodDays[0]] };

        for (let i = 1; i < periodDays.length; i++) {
            const gap = CycleTracker.daysBetween(periodDays[i - 1], periodDays[i]);
            if (gap <= 2) {
                // Continuation of current period (allow 1-day gaps)
                currentCycle.endDate = periodDays[i];
                currentCycle.days.push(periodDays[i]);
            } else {
                // New period starts
                cycles.push({ ...currentCycle });
                currentCycle = { startDate: periodDays[i], endDate: periodDays[i], days: [periodDays[i]] };
            }
        }
        cycles.push({ ...currentCycle });

        // Calculate cycle lengths (distance between consecutive period starts)
        for (let i = 1; i < cycles.length; i++) {
            cycles[i].cycleLength = CycleTracker.daysBetween(cycles[i - 1].startDate, cycles[i].startDate);
        }

        // Calculate period durations
        cycles.forEach(c => {
            c.periodDuration = CycleTracker.daysBetween(c.startDate, c.endDate) + 1;
        });

        this.data.cycles = cycles;
        this.save();
    }

    // ==================== STATISTICS ====================

    getCycles() {
        return this.data.cycles;
    }

    getLastCycle() {
        return this.data.cycles.length > 0 ? this.data.cycles[this.data.cycles.length - 1] : null;
    }

    getAverageCycleLength() {
        const cycleLengths = this.data.cycles
            .filter(c => c.cycleLength && c.cycleLength >= 18 && c.cycleLength <= 45)
            .map(c => c.cycleLength);

        if (cycleLengths.length === 0) return this.data.settings.avgCycleLength;

        return Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    }

    getAveragePeriodDuration() {
        const durations = this.data.cycles.map(c => c.periodDuration).filter(d => d >= 1 && d <= 12);
        if (durations.length === 0) return this.data.settings.avgPeriodDuration;
        return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10;
    }

    getCycleLengthVariation() {
        const cycleLengths = this.data.cycles
            .filter(c => c.cycleLength && c.cycleLength >= 18 && c.cycleLength <= 45)
            .map(c => c.cycleLength);

        if (cycleLengths.length < 2) return 0;

        const avg = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / cycleLengths.length;
        return Math.round(Math.sqrt(variance) * 10) / 10;
    }

    // ==================== PREDICTIONS ====================

    getPredictions() {
        const lastCycle = this.getLastCycle();
        if (!lastCycle) {
            return {
                nextPeriod: null,
                ovulation: null,
                fertileStart: null,
                fertileEnd: null,
                confidence: 0,
                currentDay: null,
                currentPhase: null,
                daysUntilPeriod: null,
                daysUntilOvulation: null,
            };
        }

        const avgCycleLength = this.getAverageCycleLength();
        const variation = this.getCycleLengthVariation();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastStart = CycleTracker.parseKey(lastCycle.startDate);
        const currentDay = CycleTracker.daysBetween(lastStart, today) + 1;

        // Next period prediction
        const nextPeriodDate = CycleTracker.addDays(lastStart, avgCycleLength);
        const daysUntilPeriod = CycleTracker.daysBetween(today, nextPeriodDate);

        // Ovulation prediction (cycle length - luteal phase)
        const lutealPhase = this.data.settings.lutealPhase;
        const ovulationDay = avgCycleLength - lutealPhase;
        const ovulationDate = CycleTracker.addDays(lastStart, ovulationDay);
        const daysUntilOvulation = CycleTracker.daysBetween(today, ovulationDate);

        // Fertile window (5 days before ovulation to 1 day after)
        const fertileStart = CycleTracker.addDays(ovulationDate, -5);
        const fertileEnd = CycleTracker.addDays(ovulationDate, 1);

        // Confidence based on data quantity and regularity
        const cycleCount = this.data.cycles.filter(c => c.cycleLength).length;
        let confidence = 50; // Base confidence
        if (cycleCount >= 1) confidence = 65;
        if (cycleCount >= 3) confidence = 78;
        if (cycleCount >= 6) confidence = 88;
        if (cycleCount >= 12) confidence = 94;
        // Reduce confidence for irregular cycles
        if (variation > 3) confidence -= 10;
        if (variation > 5) confidence -= 10;
        confidence = Math.max(30, Math.min(98, confidence));

        // Current phase detection
        let currentPhase = 'unknown';
        const avgPeriodDuration = this.getAveragePeriodDuration();
        if (currentDay <= avgPeriodDuration) {
            currentPhase = 'menstrual';
        } else if (currentDay <= ovulationDay - 1) {
            currentPhase = 'follicular';
        } else if (currentDay >= ovulationDay - 1 && currentDay <= ovulationDay + 1) {
            currentPhase = 'ovulatory';
        } else {
            currentPhase = 'luteal';
        }

        // Fertility level
        let fertilityLevel = 'low';
        if (currentDay >= ovulationDay - 5 && currentDay <= ovulationDay + 1) {
            fertilityLevel = 'high';
            if (currentDay >= ovulationDay - 2 && currentDay <= ovulationDay) {
                fertilityLevel = 'peak';
            }
        } else if (currentDay >= ovulationDay - 7 && currentDay <= ovulationDay + 2) {
            fertilityLevel = 'medium';
        }

        return {
            nextPeriod: CycleTracker.toKey(nextPeriodDate),
            ovulation: CycleTracker.toKey(ovulationDate),
            fertileStart: CycleTracker.toKey(fertileStart),
            fertileEnd: CycleTracker.toKey(fertileEnd),
            confidence,
            currentDay,
            currentPhase,
            fertilityLevel,
            daysUntilPeriod,
            daysUntilOvulation,
            avgCycleLength,
            ovulationDay,
        };
    }

    /**
     * Get the type of a calendar day: 'period', 'fertile', 'ovulation', 'predicted', or null
     */
    getDayType(dateKey) {
        const log = this.getLog(dateKey);
        if (log && log.isPeriod) return 'period';

        // Disable future predictions and ovulation markings if in pregnancy mode
        if (this.data.settings.isPregnant) return null;

        const pred = this.getPredictions();
        if (!pred.nextPeriod) return null;

        if (dateKey === pred.ovulation) return 'ovulation';

        if (pred.fertileStart && pred.fertileEnd) {
            if (dateKey >= pred.fertileStart && dateKey <= pred.fertileEnd) return 'fertile';
        }

        // Show predicted period days
        if (pred.nextPeriod) {
            const avgDuration = Math.round(this.getAveragePeriodDuration());
            const predStart = CycleTracker.parseKey(pred.nextPeriod);
            for (let i = 0; i < avgDuration; i++) {
                const day = CycleTracker.toKey(CycleTracker.addDays(predStart, i));
                if (dateKey === day) return 'predicted';
            }
        }

        return null;
    }

    // ==================== PREGNANCY CALCULATIONS ====================

    getPregnancyProgress() {
        if (!this.data.settings.isPregnant || !this.data.settings.lmpDate) {
            return null;
        }

        const lmp = CycleTracker.parseKey(this.data.settings.lmpDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDays = CycleTracker.daysBetween(lmp, today);
        const totalWeeks = Math.floor(totalDays / 7);
        const remainingDays = totalDays % 7;

        const edd = CycleTracker.addDays(lmp, 280);
        const daysToGo = CycleTracker.daysBetween(today, edd);

        let trimester = 1;
        if (totalWeeks >= 14 && totalWeeks <= 27) trimester = 2;
        else if (totalWeeks >= 28) trimester = 3;

        // Fetal size mapping
        const sizes = [
            { week: 4, name: 'Poppy Seed', emoji: '🌱' },
            { week: 5, name: 'Sesame Seed', emoji: '🌱' },
            { week: 6, name: 'Lentil', emoji: '🌱' },
            { week: 7, name: 'Blueberry', emoji: '🫐' },
            { week: 8, name: 'Kidney Bean', emoji: '🫘' },
            { week: 9, name: 'Grape', emoji: '🍇' },
            { week: 10, name: 'Kumquat', emoji: '🍊' },
            { week: 11, name: 'Fig', emoji: '🥯' },
            { week: 12, name: 'Lime', emoji: '🟢' },
            { week: 13, name: 'Pea Pod', emoji: '🫛' },
            { week: 14, name: 'Lemon', emoji: '🍋' },
            { week: 15, name: 'Apple', emoji: '🍎' },
            { week: 16, name: 'Avocado', emoji: '🥑' },
            { week: 17, name: 'Pomegranate', emoji: '🍊' },
            { week: 18, name: 'Artichoke', emoji: '🥬' },
            { week: 19, name: 'Mango', emoji: '🥭' },
            { week: 20, name: 'Banana', emoji: '🍌' },
            { week: 21, name: 'Carrot', emoji: '🥕' },
            { week: 22, name: 'Coconut', emoji: '🥥' },
            { week: 23, name: 'Grapefruit', emoji: '🍊' },
            { week: 24, name: 'Cantaloupe', emoji: '🍈' },
            { week: 25, name: 'Cauliflower', emoji: '🥦' },
            { week: 26, name: 'Lettuce', emoji: '🥬' },
            { week: 27, name: 'Rutabaga', emoji: '🍠' },
            { week: 28, name: 'Eggplant', emoji: '🍆' },
            { week: 29, name: 'Acorn Squash', emoji: '🎃' },
            { week: 30, name: 'Cabbage', emoji: '🥬' },
            { week: 31, name: 'Coconut', emoji: '🥥' },
            { week: 32, name: 'Jicama', emoji: '🥔' },
            { week: 33, name: 'Pineapple', emoji: '🍍' },
            { week: 34, name: 'Cantaloupe', emoji: '🍈' },
            { week: 35, name: 'Honeydew Melon', emoji: '🍈' },
            { week: 36, name: 'Romaine Lettuce', emoji: '🥬' },
            { week: 37, name: 'Swiss Chard', emoji: '🥬' },
            { week: 38, name: 'Leek', emoji: '🧄' },
            { week: 39, name: 'Watermelon', emoji: '🍉' },
            { week: 40, name: 'Pumpkin', emoji: '🎃' }
        ];

        let babySize = { name: 'Poppy Seed', emoji: '🌱' };
        if (totalWeeks >= 4) {
            const index = Math.min(totalWeeks, 40) - 4;
            if (sizes[index]) babySize = sizes[index];
            else babySize = sizes[sizes.length - 1];
        }

        // Gestational stage milestones
        const developmentTips = [
            "Your baby's neural tube is closing. Keep taking folic acid!",
            "Heart is starting to beat! Tiny buds for arms and legs are forming.",
            "Facial features and fingers are developing. The embryo starts twitching.",
            "Major organs are starting to develop. Fetal heartbeat can be detected on ultrasound.",
            "Reflexes are developing. The baby can open and close fists.",
            "Bones are hardening and tooth buds are forming.",
            "Trimester 2 starts! The baby's kidneys are active and making urine.",
            "Baby's hearing is developing. They can hear your voice and heartbeat.",
            "Lungs are starting to make surfactant. The baby is practicing breathing.",
            "Baby is now viable outside the womb. Movement is very active.",
            "Third Trimester starts! Baby is opening eyes and has eyelashes.",
            "Baby is gaining weight rapidly and starting to settle in head-down position.",
            "Lungs and brain are maturing. Space inside is getting tight.",
            "Baby is fully formed and ready to meet you! Rest as much as possible."
        ];

        let tipIndex = Math.min(Math.floor(totalWeeks / 3), developmentTips.length - 1);
        let currentTip = developmentTips[tipIndex] || "Focus on healthy nutrition, adequate rest, and hydration.";

        return {
            totalDays,
            weeks: totalWeeks,
            days: remainingDays,
            edd: CycleTracker.toKey(edd),
            daysToGo,
            trimester,
            babySize,
            tip: currentTip,
            progressPercent: Math.min(100, Math.round((totalDays / 280) * 100))
        };
    }

    // ==================== AI INSIGHTS ====================

    generateInsights() {
        const insights = [];
        const cycles = this.getCycles();
        const pred = this.getPredictions();
        const avgLength = this.getAverageCycleLength();
        const variation = this.getCycleLengthVariation();
        const avgDuration = this.getAveragePeriodDuration();

        if (cycles.length === 0) {
            insights.push({
                type: 'info',
                icon: '📝',
                color: 'blue',
                title: 'Start logging your cycle',
                text: 'Tap on calendar days to mark your period. The more data you log, the smarter predictions become.',
            });
            return insights;
        }

        // Cycle regularity
        if (cycles.length >= 3) {
            if (variation <= 2) {
                insights.push({
                    type: 'positive',
                    icon: '✅',
                    color: 'green',
                    title: 'Your cycle is very regular',
                    text: `Average ${avgLength}-day cycle with only ±${variation} days variation over your last ${cycles.filter(c=>c.cycleLength).length} cycles.`,
                });
            } else if (variation <= 4) {
                insights.push({
                    type: 'info',
                    icon: '📊',
                    color: 'blue',
                    title: 'Your cycle is fairly regular',
                    text: `Average ${avgLength}-day cycle with ±${variation} days variation. This is within the normal range.`,
                });
            } else {
                insights.push({
                    type: 'warning',
                    icon: '⚠️',
                    color: 'amber',
                    title: 'Irregular cycle detected',
                    text: `Your cycle length varies by ±${variation} days. Consider tracking more cycles or consulting a healthcare provider if this is new.`,
                });
            }
        }

        // Current phase insight
        if (pred.currentPhase) {
            const phaseInsights = {
                menstrual: {
                    icon: '🩸', color: 'pink',
                    title: 'You\'re in your menstrual phase',
                    text: 'Rest, hydrate, and consider iron-rich foods. Light exercise like yoga can help with cramps.',
                },
                follicular: {
                    icon: '🌱', color: 'green',
                    title: 'Follicular phase — rising energy',
                    text: 'Estrogen is rising! Great time for high-intensity workouts, creative projects, and social activities.',
                },
                ovulatory: {
                    icon: '✨', color: 'amber',
                    title: 'Ovulation window is here',
                    text: 'Peak fertility period. You may notice increased energy, clearer skin, and higher confidence.',
                },
                luteal: {
                    icon: '🌙', color: 'purple',
                    title: 'Luteal phase — winding down',
                    text: 'Progesterone is rising. Focus on nourishing meals, adequate sleep, and stress management.',
                },
            };
            const phaseInfo = phaseInsights[pred.currentPhase];
            if (phaseInfo) {
                insights.push({ type: 'phase', ...phaseInfo });
            }
        }

        // Fertility insight
        if (pred.fertilityLevel === 'peak') {
            insights.push({
                type: 'fertility',
                icon: '🥚',
                color: 'amber',
                title: 'Peak fertility today',
                text: 'You are in your most fertile days. Ovulation is estimated today or within the next 24 hours.',
            });
        } else if (pred.fertilityLevel === 'high') {
            insights.push({
                type: 'fertility',
                icon: '💧',
                color: 'green',
                title: 'High fertility window',
                text: `Ovulation is expected ${pred.daysUntilOvulation > 0 ? `in ${pred.daysUntilOvulation} day${pred.daysUntilOvulation !== 1 ? 's' : ''}` : 'soon'}. Fertility is elevated.`,
            });
        }

        // Next period countdown
        if (pred.daysUntilPeriod !== null && pred.daysUntilPeriod > 0) {
            insights.push({
                type: 'countdown',
                icon: '📅',
                color: 'pink',
                title: `Next period in ${pred.daysUntilPeriod} day${pred.daysUntilPeriod !== 1 ? 's' : ''}`,
                text: `Predicted to start on ${CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'long')} with ${pred.confidence}% confidence.`,
            });
        } else if (pred.daysUntilPeriod !== null && pred.daysUntilPeriod <= 0) {
            insights.push({
                type: 'alert',
                icon: '🔴',
                color: 'pink',
                title: 'Period expected today or overdue',
                text: `Your period was predicted for ${CycleTracker.formatDate(CycleTracker.parseKey(pred.nextPeriod), 'long')}. Log it when it starts!`,
            });
        }

        // Cycle length trend (getting longer / shorter)
        if (cycles.length >= 4) {
            const recentLengths = cycles.slice(-4).filter(c => c.cycleLength).map(c => c.cycleLength);
            if (recentLengths.length >= 3) {
                const trend = recentLengths[recentLengths.length - 1] - recentLengths[0];
                if (trend >= 3) {
                    insights.push({
                        type: 'trend',
                        icon: '📈',
                        color: 'amber',
                        title: 'Cycles are getting longer',
                        text: `Your cycle length has increased by ${trend} days over the last few cycles. This may be normal but worth monitoring.`,
                    });
                } else if (trend <= -3) {
                    insights.push({
                        type: 'trend',
                        icon: '📉',
                        color: 'amber',
                        title: 'Cycles are getting shorter',
                        text: `Your cycle length has decreased by ${Math.abs(trend)} days recently. Track a few more cycles to confirm the pattern.`,
                    });
                }
            }
        }

        // Data quantity encouragement
        if (cycles.length === 1) {
            insights.push({
                type: 'info',
                icon: '🎯',
                color: 'blue',
                title: 'Great start! Keep logging',
                text: 'Log at least 3 cycles for accurate predictions. Each cycle you track improves forecast precision.',
            });
        } else if (cycles.length === 2) {
            insights.push({
                type: 'info',
                icon: '📊',
                color: 'blue',
                title: 'Predictions improving',
                text: `${cycles.length} cycles logged. One more cycle will unlock advanced pattern analysis and higher confidence predictions.`,
            });
        }

        return insights;
    }

    // ==================== CYCLE HISTORY FOR UI ====================

    getCycleHistory() {
        return this.data.cycles.slice().reverse().map(cycle => ({
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            startFormatted: CycleTracker.formatDate(cycle.startDate),
            endFormatted: CycleTracker.formatDate(cycle.endDate),
            periodDuration: cycle.periodDuration,
            cycleLength: cycle.cycleLength || null,
        }));
    }

    // ==================== PERIOD COUNT FOR CURRENT WEEK ====================

    getLogsThisWeek() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = CycleTracker.addDays(today, -today.getDay());
        let count = 0;
        for (let i = 0; i < 7; i++) {
            const key = CycleTracker.toKey(CycleTracker.addDays(weekStart, i));
            if (this.data.dailyLogs[key]) count++;
        }
        return count;
    }

    // ==================== IMPORT SAMPLE DATA (for first-time demo) ====================

    hasCycleData() {
        return this.data.cycles.length > 0;
    }
}

// Export as global
window.CycleTracker = CycleTracker;
