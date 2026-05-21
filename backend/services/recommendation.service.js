/**
 * Rule-based train recommendations (no ML).
 * Combines user booking history + global popular routes with explainable scores.
 */
const recommendationModel = require('../models/recommendation.model');
const availabilityService = require('./availability.service');
const pricingService = require('./pricing.service');

const SCORE = {
  SAME_ROUTE: 100,
  SAME_OD_PAIR: 65,
  SAME_SOURCE: 40,
  SAME_DESTINATION: 35,
  SAME_CLASS: 20,
  POPULARITY_PER_BOOKING: 3,
  POPULARITY_CAP: 25,
};

const REASONS = {
  REPEAT_ROUTE: 'You have booked this route before',
  FREQUENT_OD: 'Matches your frequent source → destination',
  PREFERRED_SOURCE: 'Departs from a station you often use',
  PREFERRED_DEST: 'Arrives at a destination you often visit',
  PREFERRED_CLASS: 'Matches your preferred train class',
  TRENDING: 'Popular with other travelers',
  NEW_DISCOVERY: 'Recommended based on similar routes',
};

function formatRoute(row) {
  return {
    routeId: row.route_id,
    train: {
      id: row.train_id,
      number: row.train_number,
      name: row.train_name,
      class: row.train_class,
    },
    route: {
      source: row.source_code,
      sourceName: row.source_name,
      destination: row.destination_code,
      destinationName: row.destination_name,
    },
    schedule: {
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
      durationMinutes: row.duration_minutes,
    },
    basePrice: Number(row.base_price),
    globalBookings: Number(row.booking_count || 0),
  };
}

function buildInsights(patterns) {
  if (!patterns.length) {
    return { hasHistory: false, totalTrips: 0 };
  }

  const totalTrips = patterns.reduce((s, p) => s + Number(p.trip_count), 0);
  const top = patterns[0];
  const classCounts = {};
  patterns.forEach((p) => {
    classCounts[p.train_class] = (classCounts[p.train_class] || 0) + Number(p.trip_count);
  });
  const preferredClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const sourceCounts = {};
  const destCounts = {};
  patterns.forEach((p) => {
    sourceCounts[p.source_station_id] = (sourceCounts[p.source_station_id] || 0) + Number(p.trip_count);
    destCounts[p.destination_station_id] =
      (destCounts[p.destination_station_id] || 0) + Number(p.trip_count);
  });

  const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
  const topDestEntry = Object.entries(destCounts).sort((a, b) => b[1] - a[1])[0];
  const frequentSourceId = topSourceEntry ? Number(topSourceEntry[0]) : null;
  const frequentDestId = topDestEntry ? Number(topDestEntry[0]) : null;

  const favSource = patterns.find((p) => p.source_station_id === frequentSourceId);
  const favDest = patterns.find((p) => p.destination_station_id === frequentDestId);

  return {
    hasHistory: true,
    totalTrips,
    favoriteRoute: `${top.source_code} → ${top.destination_code}`,
    favoriteRouteTrips: Number(top.trip_count),
    preferredClass,
    frequentSource: favSource?.source_code,
    frequentDestination: favDest?.destination_code,
    frequentSourceId,
    frequentDestId,
  };
}

/**
 * Score a route against user booking patterns.
 */
function scoreRoute(route, patterns, insights) {
  let score = 0;
  const reasons = [];

  const bookedRouteIds = new Set(patterns.map((p) => p.route_id));
  const odPairs = new Set(
    patterns.map((p) => `${p.source_station_id}-${p.destination_station_id}`)
  );

  if (bookedRouteIds.has(route.route_id)) {
    score += SCORE.SAME_ROUTE;
    const trips = patterns.find((p) => p.route_id === route.route_id)?.trip_count;
    reasons.push({ code: 'REPEAT_ROUTE', message: REASONS.REPEAT_ROUTE, weight: SCORE.SAME_ROUTE, trips: Number(trips) });
  }

  const odKey = `${route.source_station_id}-${route.destination_station_id}`;
  if (odPairs.has(odKey) && !bookedRouteIds.has(route.route_id)) {
    score += SCORE.SAME_OD_PAIR;
    reasons.push({ code: 'FREQUENT_OD', message: REASONS.FREQUENT_OD, weight: SCORE.SAME_OD_PAIR });
  }

  if (insights.frequentSourceId && route.source_station_id === insights.frequentSourceId) {
    score += SCORE.SAME_SOURCE;
    reasons.push({ code: 'PREFERRED_SOURCE', message: REASONS.PREFERRED_SOURCE, weight: SCORE.SAME_SOURCE });
  }

  if (insights.frequentDestId && route.destination_station_id === insights.frequentDestId) {
    score += SCORE.SAME_DESTINATION;
    reasons.push({ code: 'PREFERRED_DEST', message: REASONS.PREFERRED_DEST, weight: SCORE.SAME_DESTINATION });
  }

  if (insights.preferredClass && route.train_class === insights.preferredClass) {
    score += SCORE.SAME_CLASS;
    reasons.push({ code: 'PREFERRED_CLASS', message: REASONS.PREFERRED_CLASS, weight: SCORE.SAME_CLASS });
  }

  const popScore = Math.min(
    SCORE.POPULARITY_CAP,
    Number(route.booking_count || 0) * SCORE.POPULARITY_PER_BOOKING
  );
  if (popScore > 0) {
    score += popScore;
    reasons.push({
      code: 'TRENDING',
      message: REASONS.TRENDING,
      weight: popScore,
      globalBookings: Number(route.booking_count),
    });
  }

  if (!reasons.length) {
    reasons.push({ code: 'NEW_DISCOVERY', message: REASONS.NEW_DISCOVERY, weight: 1 });
    score = 1;
  }

  const confidence = Math.min(99, Math.round((score / 150) * 100));

  return { score, reasons, confidence };
}

async function enrichWithAvailability(recommendations, travelDate) {
  if (!travelDate) return recommendations;

  return Promise.all(
    recommendations.map(async (rec) => {
      try {
        const snapshot = await availabilityService.getSnapshot(rec.routeId, travelDate);
        if (!snapshot.found) return rec;
        return {
          ...rec,
          travelDate,
          availability: snapshot.availability,
          pricing: snapshot.pricing,
        };
      } catch {
        return rec;
      }
    })
  );
}

/**
 * Personalized recommendations for authenticated user.
 */
async function getPersonalizedRecommendations(userId, { travelDate, limit = 5 } = {}) {
  const patterns = await recommendationModel.getUserBookingPatterns(userId);
  const insights = buildInsights(patterns);
  const popular = await recommendationModel.getPopularRoutes(limit);

  if (!patterns.length) {
    const popularFormatted = popular.map((row, i) => ({
      rank: i + 1,
      ...formatRoute(row),
      score: Number(row.booking_count) * SCORE.POPULARITY_PER_BOOKING,
      confidence: 50,
      reasons: [{ code: 'TRENDING', message: REASONS.TRENDING, globalBookings: Number(row.booking_count) }],
      type: 'popular',
    }));

    let enriched = await enrichWithAvailability(popularFormatted, travelDate);

    return {
      algorithm: 'rule-based',
      message: 'No booking history yet. Showing popular routes.',
      insights,
      personalized: [],
      popular: enriched,
      suggested: enriched,
    };
  }

  const excludeIds = travelDate
    ? await recommendationModel.getUpcomingBookedRouteIds(userId, travelDate)
    : [];
  const excludeSet = new Set(excludeIds);

  const candidates = await recommendationModel.getActiveRoutes();
  const scored = candidates
    .filter((r) => !excludeSet.has(r.route_id))
    .map((route) => {
      const { score, reasons, confidence } = scoreRoute(route, patterns, insights);
      return {
        rank: 0,
        ...formatRoute(route),
        score,
        confidence,
        reasons,
        type: 'personalized',
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const popularFormatted = popular
    .filter((p) => !scored.some((s) => s.routeId === p.route_id))
    .slice(0, Math.max(3, limit - scored.length))
    .map((row, i) => ({
      rank: i + 1,
      ...formatRoute(row),
      score: Number(row.booking_count) * SCORE.POPULARITY_PER_BOOKING,
      confidence: 40,
      reasons: [{ code: 'TRENDING', message: REASONS.TRENDING }],
      type: 'popular',
    }));

  let suggested = await enrichWithAvailability([...scored, ...popularFormatted], travelDate);

  return {
    algorithm: 'rule-based',
    description:
      'Scores routes using your booking history (repeat routes, stations, class) and global popularity.',
    insights,
    personalized: suggested.filter((r) => r.type === 'personalized'),
    popular: suggested.filter((r) => r.type === 'popular'),
    suggested: suggested.slice(0, limit + 3),
  };
}

/**
 * Public popular routes (no auth).
 */
async function getPopularRecommendations({ travelDate, limit = 5 } = {}) {
  const popular = await recommendationModel.getPopularRoutes(limit);
  const formatted = popular.map((row, i) => ({
    rank: i + 1,
    ...formatRoute(row),
    score: Number(row.booking_count) * SCORE.POPULARITY_PER_BOOKING,
    confidence: 60,
    reasons: [{ code: 'TRENDING', message: REASONS.TRENDING, globalBookings: Number(row.booking_count) }],
    type: 'popular',
  }));

  const enriched = await enrichWithAvailability(formatted, travelDate);

  return {
    algorithm: 'rule-based',
    message: 'Trending routes by confirmed bookings',
    insights: { hasHistory: false },
    suggested: enriched,
    popular: enriched,
    personalized: [],
  };
}

module.exports = {
  getPersonalizedRecommendations,
  getPopularRecommendations,
  scoreRoute,
  buildInsights,
};
