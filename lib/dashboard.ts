import { NICHE_CATEGORIES } from "@/constants/niches";
import prisma from "@/lib/prisma";
import { Plan, SubscriptionStatus } from "@prisma/client";

interface TrendPoint {
  date: string;
  avg: number;
  count: number;
}

interface DashboardShop {
  id: string;
  name: string;
  city: string;
  niche: string;
  slug: string;
  qrCodeUrl: string;
  isActive: boolean;
  googleReviewUrl: string;
}

interface DashboardMetrics {
  totalReviewsThisMonth: number;
  publicReviewsThisMonth: number;
  privateReviewsThisMonth: number;
  averageRatingThisMonth: number;
  ratingTrend: TrendPoint[];
}

interface NegativeReview {
  id: string;
  rating1: number;
  rating2: number;
  rating3: number;
  rating4: number;
  averageRating: number;
  customerPhone: string | null;
  createdAt: string;
}

interface PublicReview {
  id: string;
  averageRating: number;
  generatedReview: string | null;
  createdAt: string;
}

interface SubscriptionSnapshot {
  status: SubscriptionStatus;
  plan: Plan | null;
  trialEndsAt: string | null;
  daysLeft: number | null;
}

export interface DashboardData {
  shop: DashboardShop | null;
  metrics: DashboardMetrics;
  recentNegativeReviews: NegativeReview[];
  recentPositiveReviews: PublicReview[];
  subscription: SubscriptionSnapshot;
  ownerName: string;
  googleConnected: boolean;
  autoReplyEnabled: boolean;
}

function toWeekBucket(date: Date): string {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export async function getDashboardData(ownerId: string): Promise<DashboardData> {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      googleAccessToken: true,
      autoReplyEnabled: true,
      shops: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          city: true,
          niche: true,
          slug: true,
          qrCodeUrl: true,
          isActive: true,
          googleReviewUrl: true,
        },
      },
    },
  });

  if (!owner) {
    throw new Error("owner_not_found");
  }

  const now = new Date();
  const daysLeft =
    owner.subscriptionStatus === "TRIAL" && owner.trialEndsAt
      ? Math.ceil((owner.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const subscription: SubscriptionSnapshot = {
    status: owner.subscriptionStatus,
    plan: owner.subscriptionPlan,
    trialEndsAt: owner.trialEndsAt ? owner.trialEndsAt.toISOString() : null,
    daysLeft,
  };

  const googleConnected = !!owner.googleAccessToken;
  const autoReplyEnabled = owner.autoReplyEnabled;

  const shop = owner.shops[0] ?? null;
  if (!shop) {
    return {
      ownerName: owner.name,
      shop: null,
      subscription,
      recentNegativeReviews: [],
      recentPositiveReviews: [],
      googleConnected,
      autoReplyEnabled,
      metrics: {
        totalReviewsThisMonth: 0,
        publicReviewsThisMonth: 0,
        privateReviewsThisMonth: 0,
        averageRatingThisMonth: 0,
        ratingTrend: [],
      },
    };
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start30d = new Date(now);
  start30d.setDate(now.getDate() - 30);

  const [monthlyReviews, trendReviews, recentNegativeReviews, recentPositiveReviews] = await Promise.all([
    prisma.review.findMany({
      where: { shopId: shop.id, createdAt: { gte: startOfMonth } },
      select: { averageRating: true, isPublic: true },
    }),
    prisma.review.findMany({
      where: { shopId: shop.id, createdAt: { gte: start30d } },
      select: { createdAt: true, averageRating: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.review.findMany({
      where: { shopId: shop.id, isPublic: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        rating1: true,
        rating2: true,
        rating3: true,
        rating4: true,
        averageRating: true,
        customerPhone: true,
        createdAt: true,
      },
    }),
    prisma.review.findMany({
      where: { shopId: shop.id, isPublic: true, generatedReview: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        averageRating: true,
        generatedReview: true,
        createdAt: true,
      },
    }),
  ]);

  const totals = monthlyReviews.reduce(
    (acc, review) => {
      acc.total += 1;
      acc.sum += review.averageRating;
      if (review.isPublic) acc.public += 1;
      else acc.private += 1;
      return acc;
    },
    { total: 0, public: 0, private: 0, sum: 0 },
  );

  const trendMap = new Map<string, { sum: number; count: number }>();
  for (const review of trendReviews) {
    const bucket = toWeekBucket(review.createdAt);
    const current = trendMap.get(bucket) ?? { sum: 0, count: 0 };
    current.sum += review.averageRating;
    current.count += 1;
    trendMap.set(bucket, current);
  }

  const ratingTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      count: value.count,
      avg: Number((value.sum / value.count).toFixed(2)),
    }));

  return {
    ownerName: owner.name,
    googleConnected,
    autoReplyEnabled,
    shop: {
      ...shop,
      qrCodeUrl: shop.qrCodeUrl || "",
      googleReviewUrl: shop.googleReviewUrl || "",
    },
    subscription,
    metrics: {
      totalReviewsThisMonth: totals.total,
      publicReviewsThisMonth: totals.public,
      privateReviewsThisMonth: totals.private,
      averageRatingThisMonth: totals.total ? Number((totals.sum / totals.total).toFixed(2)) : 0,
      ratingTrend,
    },
    recentNegativeReviews: recentNegativeReviews.map((review) => ({
      id: review.id,
      rating1: review.rating1,
      rating2: review.rating2,
      rating3: review.rating3,
      rating4: review.rating4,
      averageRating: review.averageRating,
      customerPhone: review.customerPhone,
      createdAt: review.createdAt.toISOString(),
    })),
    recentPositiveReviews: recentPositiveReviews.map((review) => ({
      id: review.id,
      averageRating: review.averageRating,
      generatedReview: review.generatedReview,
      createdAt: review.createdAt.toISOString(),
    })),
  };
}
