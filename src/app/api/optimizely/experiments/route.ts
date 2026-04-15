import { NextResponse } from "next/server";

type OptimizelyProject = {
  id: number;
  name: string;
  platform: string;
  status: string;
};

type OptimizelyExperiment = {
  id: number;
  name: string;
  project_id: number;
  campaign_id?: number;
  status: string;
  type?: string;
  created?: string;
  earliest?: string;
  last_modified?: string;
  metrics?: Array<{
    display_title?: string;
  }>;
  audience_conditions?: string;
  url_targeting?: {
    edit_url?: string;
    conditions?: string;
    activation_type?: string;
  };
};

type OptimizelyAudience = {
  id: number;
  name: string;
};

type ProjectSummary = {
  id: number;
  name: string;
};

type ExperimentSummary = {
  id: number;
  campaignId: number | null;
  projectId: number;
  projectName: string;
  title: string;
  status: string;
  type: string;
  owner: string;
  lastUpdatedAt: string | null;
  url: string;
  targetSummary: string;
  fullTargeting: string;
  audiences: string[];
  daysRunning: number;
  quickMetric: string | null;
};

type OptimizelyChange = {
  created?: string;
  entity?: {
    id?: number;
    type?: string;
  };
  user?: {
    display_name?: string;
    email?: string;
  };
};

type CachedRoutePayload = {
  expiresAt: number;
  data: unknown;
};

declare global {
  var __facadeOptimizelyCache__: CachedRoutePayload | undefined;
}

const API_ROOT = "https://api.optimizely.com/v2";
const OPTIMIZELY_ROUTE_CACHE_TTL_MS = 5 * 60 * 1000;

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: getHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Optimizely request failed for ${path}: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

async function fetchAllPages<T>(path: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const pagedPath = `${path}${path.includes("?") ? "&" : "?"}per_page=${perPage}&page=${page}`;
    const response = await fetch(`${API_ROOT}${pagedPath}`, {
      headers: getHeaders(token),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Optimizely request failed for ${pagedPath}: ${response.status} ${body}`);
    }

    const pageItems = (await response.json()) as T[];
    if (!pageItems.length) {
      break;
    }

    results.push(...pageItems);

    if (pageItems.length < perPage) {
      break;
    }

    page += 1;
  }

  return results;
}

function getAudienceIds(conditions?: string) {
  if (!conditions || conditions === "everyone") {
    return [];
  }

  const matches = [...conditions.matchAll(/"audience_id"\s*:\s*(\d+)/g)];
  return [...new Set(matches.map((match) => Number(match[1])))];
}

function getDaysRunning(experiment: OptimizelyExperiment) {
  const start = experiment.earliest ?? experiment.created;
  if (!start) {
    return 0;
  }

  const startedAt = new Date(start).getTime();
  const diffMs = Date.now() - startedAt;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function normalizeStatus(status: string) {
  if (status === "campaign_paused") {
    return "paused";
  }

  return status;
}

function normalizeType(type?: string) {
  switch (type) {
    case "a/b":
      return "A/B Test";
    case "multivariate":
      return "Multivariate";
    case "personalization":
      return "Personalization";
    case "multiarmed_bandit":
      return "Multi-armed Bandit";
    case "feature":
      return "Feature";
    default:
      return type ?? "Unknown";
  }
}

function summarizeTargeting(experiment: OptimizelyExperiment) {
  const conditions = experiment.url_targeting?.conditions;
  const editUrl = experiment.url_targeting?.edit_url;
  const activationType = experiment.url_targeting?.activation_type;

  if (!conditions && editUrl) {
    return `Targets ${editUrl}`;
  }

  if (!conditions) {
    return "No URL targeting";
  }

  const values = [...conditions.matchAll(/"value"\s*:\s*"([^"]+)"/g)].map((match) => match[1]);

  if (!values.length && activationType) {
    return `URL targeting (${activationType})`;
  }

  const preview = values.slice(0, 2).join(" or ");
  const suffix = values.length > 2 ? ` +${values.length - 2} more` : "";

  if (activationType) {
    return `${activationType}: ${preview}${suffix}`;
  }

  return preview || "URL targeting configured";
}

function formatFullTargeting(experiment: OptimizelyExperiment) {
  const activationType = experiment.url_targeting?.activation_type;
  const editUrl = experiment.url_targeting?.edit_url;
  const conditions = experiment.url_targeting?.conditions;

  const lines = [
    activationType ? `Activation type: ${activationType}` : null,
    editUrl ? `Edit URL: ${editUrl}` : null,
    conditions ? `Rules: ${conditions}` : "Rules: No URL targeting configured",
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

async function fetchRecentContributorsForProject(
  projectId: number,
  experimentIds: number[],
  token: string,
) {
  const pendingExperimentIds = new Set(experimentIds);
  const contributorMap = new Map<number, { owner: string; lastUpdatedAt: string | null }>();
  let page = 1;
  const perPage = 100;
  const maxPages = 10;

  while (pendingExperimentIds.size && page <= maxPages) {
    const changes = await fetchJson<OptimizelyChange[]>(
      `/changes?project_id=${projectId}&entity_type=experiment&per_page=${perPage}&page=${page}`,
      token,
    );

    if (!changes.length) {
      break;
    }

    for (const change of changes) {
      const experimentId = change.entity?.id;
      if (!experimentId || !pendingExperimentIds.has(experimentId)) {
        continue;
      }

      const owner = change.user?.display_name ?? change.user?.email ?? "Unavailable";
      contributorMap.set(experimentId, {
        owner,
        lastUpdatedAt: change.created ?? null,
      });
      pendingExperimentIds.delete(experimentId);
    }

    if (changes.length < perPage) {
      break;
    }

    page += 1;
  }

  return contributorMap;
}

export async function GET() {
  const token = process.env.OPTIMIZELY_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        source: "optimizely-web-experimentation",
        ready: false,
        message: "Missing Optimizely API token in the local env file.",
        projects: [],
        owners: [],
        campaigns: [],
      },
      { status: 200 },
    );
  }

  try {
    const cached = globalThis.__facadeOptimizelyCache__;
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const projects = await fetchJson<OptimizelyProject[]>("/projects", token);
    const activeWebProjects = projects.filter(
      (project) => project.platform === "web" && project.status === "active",
    );

    const experimentsByProject = await Promise.all(
      activeWebProjects.map(async (project) => {
        const experiments = await fetchAllPages<OptimizelyExperiment>(
          `/experiments?project_id=${project.id}`,
          token,
        );

        return { project, experiments };
      }),
    );

    const candidateExperiments = experimentsByProject.flatMap(({ project, experiments }) =>
      experiments
        .filter((experiment) => {
          const normalizedStatus = normalizeStatus(experiment.status);
          return (
            normalizedStatus === "running" ||
            normalizedStatus === "paused" ||
            normalizedStatus === "not_started"
          );
        })
        .map((experiment) => ({ project, experiment })),
    );

    const audienceIds = [
      ...new Set(
        candidateExperiments.flatMap(({ experiment }) =>
          getAudienceIds(experiment.audience_conditions),
        ),
      ),
    ];

    const audienceNameMap = new Map<number, string>();

    await Promise.all(
      audienceIds.map(async (audienceId) => {
        const audience = await fetchJson<OptimizelyAudience>(`/audiences/${audienceId}`, token);
        audienceNameMap.set(audience.id, audience.name);
      }),
    );

    const contributorsByProject = new Map<
      number,
      Map<number, { owner: string; lastUpdatedAt: string | null }>
    >();

    await Promise.all(
      experimentsByProject.map(async ({ project, experiments }) => {
        const candidateIds = experiments
          .filter((experiment) => {
            const normalizedStatus = normalizeStatus(experiment.status);
            return (
              normalizedStatus === "running" ||
              normalizedStatus === "paused" ||
              normalizedStatus === "not_started"
            );
          })
          .map((experiment) => experiment.id);

        if (!candidateIds.length) {
          return;
        }

        const contributorMap = await fetchRecentContributorsForProject(project.id, candidateIds, token);
        contributorsByProject.set(project.id, contributorMap);
      }),
    );

    const normalizedExperiments: ExperimentSummary[] = candidateExperiments.map(
      ({ project, experiment }) => {
        const contributor =
          contributorsByProject.get(project.id)?.get(experiment.id) ?? null;
        const audiences = getAudienceIds(experiment.audience_conditions)
          .map((audienceId) => audienceNameMap.get(audienceId))
          .filter((audienceName): audienceName is string => Boolean(audienceName));

        return {
          id: experiment.id,
          campaignId: experiment.campaign_id ?? null,
          projectId: project.id,
          projectName: project.name,
          title: experiment.name,
          status: normalizeStatus(experiment.status),
          type: normalizeType(experiment.type),
          owner: contributor?.owner ?? "Unavailable",
          lastUpdatedAt: contributor?.lastUpdatedAt ?? experiment.last_modified ?? null,
          url: experiment.url_targeting?.edit_url ?? "No URL targeting",
          targetSummary: summarizeTargeting(experiment),
          fullTargeting: formatFullTargeting(experiment),
          audiences:
            experiment.audience_conditions === "everyone"
              ? ["Everyone"]
              : audiences.length
                ? audiences
                : ["No audience targeting"],
          daysRunning: getDaysRunning(experiment),
          quickMetric: experiment.metrics?.[0]?.display_title ?? null,
        };
      },
    );

    const activeExperimentProjectIds = [
      ...new Set(normalizedExperiments.map((experiment) => experiment.projectId)),
    ];

    const projectSummaries: ProjectSummary[] = activeWebProjects
      .filter((project) => activeExperimentProjectIds.includes(project.id))
      .map((project) => ({
        id: project.id,
        name: project.name,
      }));

    const owners = [...new Set(normalizedExperiments.map((experiment) => experiment.owner))];

    const payload = {
      source: "optimizely-web-experimentation",
      ready: true,
      message: "",
      projects: projectSummaries,
      owners,
      counts: {
        projects: projectSummaries.length,
        running: normalizedExperiments.filter((experiment) => experiment.status === "running").length,
        paused: normalizedExperiments.filter((experiment) => experiment.status === "paused").length,
        notStarted: normalizedExperiments.filter((experiment) => experiment.status === "not_started").length,
      },
      campaigns: normalizedExperiments,
    };

    globalThis.__facadeOptimizelyCache__ = {
      expiresAt: Date.now() + OPTIMIZELY_ROUTE_CACHE_TTL_MS,
      data: payload,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Optimizely error";

    return NextResponse.json(
      {
        source: "optimizely-web-experimentation",
        ready: false,
        message,
        projects: [],
        owners: [],
        campaigns: [],
      },
      { status: 500 },
    );
  }
}
