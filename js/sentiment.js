// ====================================
// SENTIMENT ANALYSIS MODULE
// ====================================

/**
 * Sentiment analysis using keyword-based classification
 * Positive, Neutral, Negative classification
 */

// Keyword dictionaries
const SENTIMENT_KEYWORDS = {
    positive: [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'outstanding',
        'superb', 'brilliant', 'perfect', 'impressed', 'enjoyable', 'helpful', 'friendly', 'knowledgeable',
        'engaging', 'clear', 'well-organized', 'interesting', 'inspiring', 'motivating', 'supportive',
        'effective', 'productive', 'valuable', 'insightful', 'enlightening', 'well-taught', 'patient',
        'approachable', 'organized', 'thorough', 'comprehensive', 'exemplary', 'commendable', 'praiseworthy',
        'liked', 'loved', 'enjoyed', 'appreciate', 'grateful', 'happy', 'satisfied', 'impressed',
        'friendly', 'helpful', 'excellent', 'best', 'better', 'improve', 'improve', 'improved'
    ],
    negative: [
        'bad', 'poor', 'terrible', 'awful', 'horrible', 'useless', 'boring', 'confusing', 'unclear',
        'disorganized', 'unprepared', 'unfriendly', 'rude', 'unhelpful', 'not helpful', 'frustrating',
        'frustration', 'disappointed', 'disappointing', 'rushed', 'slow', 'outdated', 'irrelevant',
        'difficult', 'hard to understand', 'complicated', 'ineffective', 'unengaging', 'uninteresting',
        'worst', 'worse', 'hate', 'hated', 'dislike', 'disliked', 'annoying', 'irritating',
        'problematic', 'issue', 'issues', 'problem', 'problems', 'concerned', 'concern', 'worried',
        'incomplete', 'lacking', 'insufficient', 'inadequate', 'poorly', 'bad', 'negative'
    ],
    neutral: [
        'okay', 'average', 'fine', 'okay', 'alright', 'decent', 'moderate', 'acceptable',
        'fairly', 'somewhat', 'reasonably', 'fairly', 'not bad', 'could be better', 'satisfactory',
        'normal', 'usual', 'standard', 'typical', 'regular', 'middle', 'neutral', 'mediocre',
        'sufficient', 'adequate', 'fair', 'so-so', 'alright', 'nothing special', 'nothing new',
        'mixed', 'balanced', 'both good and bad', 'positive and negative'
    ]
};

// Positive modifiers for intensification
const INTENSIFIERS = {
    positive: ['very', 'really', 'extremely', 'incredibly', 'absolutely', 'truly', 'quite', 'so', 'too'],
    negative: ['very', 'really', 'extremely', 'incredibly', 'absolutely', 'truly', 'quite', 'so', 'too']
};

// Negation words
const NEGATIONS = ['not', 'no', 'never', 'neither', 'dont', 'don\'t', 'didn\'t', 'didnt', 'isnt', 'isn\'t', 'wont', 'won\'t', 'cannot', 'can\'t'];

/**
 * Clean and tokenize feedback text
 */
const tokenizeFeedback = (text) => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 0);
};

/**
 * Score sentiment based on keywords
 */
const scoreSentiment = (tokens) => {
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i];
        const nextWord = i + 1 < tokens.length ? tokens[i + 1] : null;
        const prevWord = i - 1 >= 0 ? tokens[i - 1] : null;

        // Check for negation (flip sentiment)
        const isNegated = prevWord && NEGATIONS.includes(prevWord);

        // Check for intensifiers
        const isIntensified = prevWord && INTENSIFIERS.positive.includes(prevWord);

        if (SENTIMENT_KEYWORDS.positive.includes(word)) {
            if (isNegated) {
                negativeScore += 2;
            } else {
                positiveScore += isIntensified ? 2 : 1;
            }
        } else if (SENTIMENT_KEYWORDS.negative.includes(word)) {
            if (isNegated) {
                positiveScore += 2;
            } else {
                negativeScore += isIntensified ? 2 : 1;
            }
        } else if (SENTIMENT_KEYWORDS.neutral.includes(word)) {
            neutralScore += 1;
        }
    }

    return { positiveScore, negativeScore, neutralScore };
};

/**
 * Classify sentiment
 */
export const classifySentiment = (feedbackText) => {
    if (!feedbackText || feedbackText.trim().length === 0) {
        return {
            sentiment: 'neutral',
            score: 0,
            confidence: 0,
            details: {
                positive: 0,
                negative: 0,
                neutral: 0
            }
        };
    }

    const tokens = tokenizeFeedback(feedbackText);

    if (tokens.length === 0) {
        return {
            sentiment: 'neutral',
            score: 0,
            confidence: 0,
            details: {
                positive: 0,
                negative: 0,
                neutral: 0
            }
        };
    }

    const { positiveScore, negativeScore, neutralScore } = scoreSentiment(tokens);
    const totalScore = positiveScore + negativeScore + neutralScore;

    // Calculate percentages
    const positivePercentage = totalScore > 0 ? Math.round((positiveScore / totalScore) * 100) : 0;
    const negativePercentage = totalScore > 0 ? Math.round((negativeScore / totalScore) * 100) : 0;
    const neutralPercentage = totalScore > 0 ? Math.round((neutralScore / totalScore) * 100) : 0;

    // Determine sentiment classification
    let sentiment = 'neutral';
    const threshold = 0.3; // 30% threshold

    if (positivePercentage > negativePercentage && positivePercentage > neutralPercentage) {
        sentiment = 'positive';
    } else if (negativePercentage > positivePercentage && negativePercentage > neutralPercentage) {
        sentiment = 'negative';
    } else {
        sentiment = 'neutral';
    }

    // Calculate confidence score (0-100)
    let confidence = Math.max(positivePercentage, negativePercentage, neutralPercentage);

    return {
        sentiment: sentiment,
        score: positiveScore - negativeScore, // Net sentiment score
        confidence: confidence,
        details: {
            positive: positivePercentage,
            negative: negativePercentage,
            neutral: neutralPercentage
        }
    };
};

/**
 * Get sentiment icon
 */
export const getSentimentIcon = (sentiment) => {
    const icons = {
        positive: '😊',
        negative: '😞',
        neutral: '😐'
    };
    return icons[sentiment] || '😐';
};

/**
 * Get sentiment badge color
 */
export const getSentimentColor = (sentiment) => {
    const colors = {
        positive: '#10b981', // green
        negative: '#ef4444', // red
        neutral: '#f59e0b'   // amber
    };
    return colors[sentiment] || '#6366f1';
};

/**
 * Get sentiment badge CSS class
 */
export const getSentimentBadgeClass = (sentiment) => {
    const classes = {
        positive: 'badge-success',
        negative: 'badge-danger',
        neutral: 'badge-warning'
    };
    return classes[sentiment] || 'badge-info';
};

/**
 * Get sentiment display text
 */
export const getSentimentText = (sentiment) => {
    const text = {
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral'
    };
    return text[sentiment] || 'Neutral';
};

/**
 * Analyze multiple feedbacks
 */
export const analyzeMultipleFeedbacks = (feedbackArray) => {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const total = feedbackArray.length;

    feedbackArray.forEach(feedback => {
        const analysis = classifySentiment(feedback);
        if (analysis.sentiment === 'positive') positiveCount++;
        else if (analysis.sentiment === 'negative') negativeCount++;
        else neutralCount++;
    });

    const satisfactionPercentage = total > 0 ? Math.round((positiveCount / total) * 100) : 0;

    return {
        totalFeedbacks: total,
        positiveCount: positiveCount,
        negativeCount: negativeCount,
        neutralCount: neutralCount,
        positivePercentage: total > 0 ? Math.round((positiveCount / total) * 100) : 0,
        negativePercentage: total > 0 ? Math.round((negativeCount / total) * 100) : 0,
        neutralPercentage: total > 0 ? Math.round((neutralCount / total) * 100) : 0,
        satisfactionPercentage: satisfactionPercentage
    };
};

/**
 * Get sentiment statistics for a topic
 */
export const getTopicSentimentStats = (feedbacksByTopic) => {
    const stats = {};

    Object.keys(feedbacksByTopic).forEach(topic => {
        const feedbacks = feedbacksByTopic[topic];
        stats[topic] = analyzeMultipleFeedbacks(feedbacks);
    });

    return stats;
};

console.log('Sentiment analysis module loaded');
