const Performance = require('../Models/Performance');
const QuizAttempt = require('../Models/QuizAttempt');

const CODING_CATEGORIES = new Set(['C++', 'Java', 'Python']);
const RECENT_ATTEMPT_LIMIT = 15;
const ANALYTICS_HISTORY_LIMIT = 15;

// GET dashboard summary stats for logged-in user
const getStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const aptitudeRecords = await Performance.find({ userId, type: 'aptitude' });
        const codingRecords = await Performance.find({ userId, type: 'coding' });

        const aptitudeAttempts = aptitudeRecords.length;
        const codingAttempts = codingRecords.filter(r => r.codingStatus === 'Solved').length;

        // Avg score across aptitude quizzes
        let avgScore = 0;
        if (aptitudeRecords.length > 0) {
            const totalPct = aptitudeRecords.reduce((sum, r) => {
                if (r.quizTotal && r.quizTotal > 0) {
                    return sum + (r.quizScore / r.quizTotal) * 100;
                }
                return sum;
            }, 0);
            avgScore = Math.round(totalPct / aptitudeRecords.length);
        }

        // Streak: count consecutive days with at least one attempt
        const streak = await calculateStreak(userId);

        res.status(200).json({
            success: true,
            aptitudeAttempts,
            codingAttempts,
            avgScore,
            streak
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching stats', error: err.message });
    }
};

// GET full performance analytics
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        // Last 10 aptitude quiz scores for trend
        const aptitudeHistory = await Performance.find({ userId, type: 'aptitude' })
            .sort({ createdAt: -1 })
            .limit(ANALYTICS_HISTORY_LIMIT)
            .select('quizScore quizTotal category difficulty timeTaken createdAt');

        const scoreTrend = aptitudeHistory.reverse().map(r => ({
            date: r.createdAt.toLocaleDateString('en-IN'),
            score: r.quizTotal > 0 ? Math.round((r.quizScore / r.quizTotal) * 100) : 0,
            category: r.category
        }));

        // Coding stats
        const codingHistory = await Performance.find({ userId, type: 'coding' })
            .sort({ createdAt: -1 })
            .limit(ANALYTICS_HISTORY_LIMIT)
            .populate('codingQuestionId', 'title difficulty')
            .select('codingStatus codingQuestionId createdAt');

        // Category-wise accuracy for aptitude
        const categoryMap = {};
        const allAptitude = await Performance.find({ userId, type: 'aptitude' });
        allAptitude.forEach(r => {
            if (!categoryMap[r.category]) categoryMap[r.category] = { total: 0, correct: 0 };
            categoryMap[r.category].total += r.quizTotal || 0;
            categoryMap[r.category].correct += r.quizScore || 0;
        });

        const categoryAccuracy = Object.entries(categoryMap).map(([name, val]) => ({
            category: name,
            accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
            attempts: val.total
        }));

        res.status(200).json({
            success: true,
            scoreTrend,
            codingHistory,
            categoryAccuracy
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching analytics', error: err.message });
    }
};

// GET aggregated progress metrics for logged-in user
const getProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const attempts = await QuizAttempt.find({ userId })
            .sort({ createdAt: -1 })
            .limit(RECENT_ATTEMPT_LIMIT);

        const totalQuizzes = attempts.length;
        const totalQuestions = attempts.reduce((sum, attempt) => {
            const attemptTotal = Number(attempt.totalQuestions);
            if (Number.isFinite(attemptTotal) && attemptTotal > 0) return sum + attemptTotal;

            const fallbackAnswers = attempt?.answers instanceof Map ? attempt.answers.size : 0;
            if (fallbackAnswers > 0) return sum + fallbackAnswers;

            const fallbackIds = Array.isArray(attempt.questionIds) ? attempt.questionIds.length : 0;
            return sum + fallbackIds;
        }, 0);

        const totalCorrect = attempts.reduce((sum, attempt) => {
            const correct = Number(attempt.correctAnswers);
            if (Number.isFinite(correct) && correct >= 0) return sum + correct;

            const fallbackScore = Number(attempt.score);
            return sum + (Number.isFinite(fallbackScore) && fallbackScore >= 0 ? fallbackScore : 0);
        }, 0);

        const accuracy = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;

        const codingAttempts = attempts.filter((attempt) => {
            if (attempt.module === 'coding') return true;
            return CODING_CATEGORIES.has(String(attempt.category || '').trim());
        });
        const codingSolved = codingAttempts.length;
        const totalCodingQuestions = codingAttempts.reduce((sum, attempt) => {
            const attemptTotal = Number(attempt.totalQuestions);
            if (Number.isFinite(attemptTotal) && attemptTotal > 0) return sum + attemptTotal;

            const fallbackAnswers = attempt?.answers instanceof Map ? attempt.answers.size : 0;
            if (fallbackAnswers > 0) return sum + fallbackAnswers;

            const fallbackIds = Array.isArray(attempt.questionIds) ? attempt.questionIds.length : 0;
            return sum + fallbackIds;
        }, 0);

        const streak = calculateAttemptStreak(attempts);

        res.status(200).json({
            success: true,
            totalQuizzes,
            totalQuestions,
            totalCorrect,
            accuracy,
            codingSolved,
            totalCodingQuestions,
            streak,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching progress', error: err.message });
    }
};

// Helper: count consecutive days with attempts
async function calculateStreak(userId) {
    const records = await Performance.find({ userId }).sort({ createdAt: -1 });
    if (records.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const dateSets = new Set(
        records.map(r => new Date(r.createdAt).toDateString())
    );

    while (dateSets.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
}

function calculateAttemptStreak(attempts = []) {
    if (!attempts.length) return 0;

    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const dateSet = new Set(
        attempts.map((attempt) => new Date(attempt.createdAt).toDateString())
    );

    while (dateSet.has(checkDate.toDateString())) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
}

module.exports = { getStats, getAnalytics, getProgress };
