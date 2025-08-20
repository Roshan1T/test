"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  BarChart3,
} from "lucide-react";

// Import REG-1 design system components
import RoundedBox from "../reg1-dashboard-dev/components/atoms/RoundedBox";
import Tabs from "../reg1-dashboard-dev/components/atoms/Tabs";
import CircularProgress from "../reg1-dashboard-dev/components/atoms/CircularProgress";
import PageTitle, {
  PageHeader,
  PageHeaderActions,
} from "../reg1-dashboard-dev/components/atoms/PageTitle";
import {
  FieldLabel,
  TextLabel,
} from "../reg1-dashboard-dev/components/atoms/Fields";
import HorizontalFlexbox from "../reg1-dashboard-dev/components/atoms/HorizontalFlexbox";
import VerticalFlexbox from "../reg1-dashboard-dev/components/atoms/VerticalFlexbox";

// ==============================================
// TYPES & INTERFACES
// ==============================================

interface DashboardData {
  healthScore: number;
  cards: CardData[];
  metrics: {
    activeRequests: number;
    avgResponseTime: string;
    systemUptime: string;
    activeIncidents: number;
    staffTraining: number;
    policyUpdates: number;
    riskLevel: string;
  };
}

interface CardData {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
  isWeeklySummary?: boolean;
}

// ==============================================
// STYLED COMPONENTS
// ==============================================

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.backgroundPrimary};
  font-family: "Inter", sans-serif;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
  align-items: start;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const Card = styled(RoundedBox)<{
  $borderColor: string;
  $expanded: boolean;
  $isWeeklySummary: boolean;
}>`
  border-top: 3px solid ${(props) => props.$borderColor};
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;

  ${(props) =>
    props.$isWeeklySummary &&
    `
    grid-column: 1 / -1;
  `}

  ${(props) =>
    props.$expanded &&
    `
    grid-column: 1 / -1;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  `}

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled(HorizontalFlexbox)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${(props) => `${props.$color}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$color};
`;

const ExpandButton = styled.button`
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }
`;

const Sidebar = styled(VerticalFlexbox)`
  gap: 1rem;
  position: sticky;
  top: 1rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 0.875rem;
  color: #6b7280;
`;

// ==============================================
// DATA FETCHING SIMULATION
// ==============================================

const simulateDataFetch = async (
  timePeriod: string
): Promise<DashboardData> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const baseData: DashboardData = {
    healthScore: 85,
    cards: [
      {
        id: "critical-updates",
        title: "Critical Updates",
        content: `# Critical Security Updates (${timePeriod})

## Recent Alerts
- High-priority security patch available
- System vulnerability detected and resolved
- User access review completed

### Action Items
- Update firewall rules
- Review user permissions
- Implement new security protocols`,
        icon: <AlertTriangle size={20} />,
        borderColor: "#dc2626",
        iconColor: "#dc2626",
      },
      {
        id: "event-tracker",
        title: "Event Tracker",
        content: `# Event Monitoring (${timePeriod})

## System Events
- Login attempts: 1,247
- Failed authentications: 23
- Data access requests: 156

### Performance Metrics
- Response time: 250ms avg
- Uptime: 99.9%
- Error rate: 0.1%`,
        icon: <Activity size={20} />,
        borderColor: "#16a34a",
        iconColor: "#16a34a",
      },
      {
        id: "weekly-summary",
        title: "Weekly Summary",
        content: `# Comprehensive Weekly Report (${timePeriod})

## Executive Summary
This week's data protection activities have shown significant improvement across all key metrics. Our compliance score has increased by 3% compared to last period.

## Key Achievements
- Successfully completed quarterly audit
- Implemented new data encryption protocols
- Trained 45 staff members on GDPR compliance
- Resolved 12 data subject requests within SLA

## Areas for Improvement
- Reduce average response time for data requests
- Enhance monitoring of third-party data processors
- Update privacy impact assessments for new projects

## Upcoming Priorities
- Q3 compliance review preparation
- Implementation of new consent management system
- Staff refresher training on data handling procedures`,
        icon: <Shield size={20} />,
        borderColor: "#0ea5e9",
        iconColor: "#0ea5e9",
        isWeeklySummary: true,
      },
      {
        id: "news-updates",
        title: "Regulatory News",
        content: `# Latest Regulatory Updates (${timePeriod})

## New Regulations
- GDPR amendment proposals published
- Data localization requirements updated
- Cross-border transfer guidelines revised

### Impact Assessment
- Review current data flows
- Update privacy notices
- Assess vendor compliance`,
        icon: <TrendingUp size={20} />,
        borderColor: "#8b5cf6",
        iconColor: "#8b5cf6",
      },
      {
        id: "fines-penalties",
        title: "Fines & Penalties",
        content: `# Regulatory Enforcement (${timePeriod})

## Recent Fines
- Company X: €2.1M for GDPR violations
- Organization Y: $850K for data breach

### Prevention Measures
- Enhanced security protocols
- Regular compliance audits
- Staff training programs`,
        icon: <AlertTriangle size={20} />,
        borderColor: "#f97316",
        iconColor: "#f97316",
      },
      {
        id: "compliance-metrics",
        title: "Compliance Metrics",
        content: `# Compliance Dashboard (${timePeriod})

## Key Metrics
- Overall compliance: 94%
- Data requests processed: 23
- Privacy assessments: 8
- Training completion: 98%

### Trending Up
- Response time improvements
- Staff awareness scores
- System security ratings`,
        icon: <BarChart3 size={20} />,
        borderColor: "#06b6d4",
        iconColor: "#06b6d4",
      },
    ],
    metrics: {
      activeRequests: Math.floor(Math.random() * 20) + 10,
      avgResponseTime: `${(Math.random() * 2 + 3).toFixed(1)}h`,
      systemUptime: `${(99.5 + Math.random() * 0.4).toFixed(1)}%`,
      activeIncidents: Math.floor(Math.random() * 3),
      staffTraining: Math.floor(Math.random() * 10) + 90,
      policyUpdates: Math.floor(Math.random() * 5) + 1,
      riskLevel: ["Low", "Medium", "Low", "Low"][Math.floor(Math.random() * 4)],
    },
  };

  const timePeriodAdjustments: Record<string, number> = {
    "1day": 5,
    "7days": 0,
    "14days": -2,
    "1month": -5,
    "3months": -8,
  };

  baseData.healthScore += timePeriodAdjustments[timePeriod] || 0;
  return baseData;
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const truncateContent = (content: string, maxLines: number = 3): string => {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length <= maxLines) return content;
  return lines.slice(0, maxLines).join("\n") + "\n\n...";
};

// ==============================================
// COMPONENTS
// ==============================================

const TimePeriodSelector: React.FC<{
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  loading: boolean;
}> = ({ activeFilter, onFilterChange, loading }) => {
  const timePeriods = [
    { id: "1day", label: "24 Hours" },
    { id: "7days", label: "7 Days" },
    { id: "14days", label: "14 Days" },
    { id: "1month", label: "1 Month" },
    { id: "3months", label: "Quarter" },
  ];

  return (
    <VerticalFlexbox style={{ alignItems: "center", gap: "0.75rem" }}>
      <FieldLabel style={{ fontSize: "0.875rem", margin: 0 }}>
        {loading ? "Loading..." : "Time Period"}
      </FieldLabel>
      <Tabs
        activeTab={activeFilter}
        setActiveTab={(value) =>
          typeof value === "string" && onFilterChange(value)
        }
        data={timePeriods}
        variant="primary"
      />
    </VerticalFlexbox>
  );
};

const DashboardCard: React.FC<{
  card: CardData;
  expanded: boolean;
  onToggle: () => void;
}> = ({ card, expanded, onToggle }) => {
  const displayContent = expanded
    ? card.content
    : truncateContent(card.content);

  return (
    <Card
      $borderColor={card.borderColor}
      $expanded={expanded}
      $isWeeklySummary={!!card.isWeeklySummary}
      onClick={onToggle}
    >
      <CardHeader>
        <HorizontalFlexbox style={{ alignItems: "center", gap: "0.75rem" }}>
          <IconWrapper $color={card.iconColor}>{card.icon}</IconWrapper>
          <TextLabel
            style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0 }}
          >
            {card.title}
          </TextLabel>
        </HorizontalFlexbox>
        <ExpandButton>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </ExpandButton>
      </CardHeader>
      <div style={{ fontSize: "0.875rem", lineHeight: "1.6" }}>
        <ReactMarkdown>{displayContent}</ReactMarkdown>
      </div>
    </Card>
  );
};

const HealthScoreCard: React.FC<{ score: number }> = ({ score }) => (
  <RoundedBox style={{ padding: "1.5rem", textAlign: "center" }}>
    <FieldLabel
      style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}
    >
      Health Score
    </FieldLabel>
    <CircularProgress
      width={160}
      height={160}
      percent={score}
      includeCenterLabel={true}
    />
    <p
      style={{
        fontSize: "0.8rem",
        color: "#6b7280",
        marginTop: "1rem",
        margin: 0,
      }}
    >
      {score >= 80
        ? "Excellent compliance status"
        : score >= 60
        ? "Good with improvements needed"
        : "Requires immediate attention"}
    </p>
  </RoundedBox>
);

const MetricsCard: React.FC<{ metrics: DashboardData["metrics"] }> = ({
  metrics,
}) => (
  <RoundedBox style={{ padding: "1rem" }}>
    <FieldLabel
      style={{
        fontSize: "1rem",
        fontWeight: "600",
        marginBottom: "1rem",
        textAlign: "center",
      }}
    >
      Key Metrics
    </FieldLabel>
    <VerticalFlexbox style={{ gap: "0.75rem" }}>
      {Object.entries(metrics).map(([key, value]) => (
        <HorizontalFlexbox
          key={key}
          style={{ justifyContent: "space-between", padding: "0.25rem 0" }}
        >
          <FieldLabel
            style={{
              fontSize: "0.8rem",
              margin: 0,
              textTransform: "capitalize",
            }}
          >
            {key.replace(/([A-Z])/g, " $1").trim()}
          </FieldLabel>
          <TextLabel
            style={{ fontSize: "0.8rem", fontWeight: "600", margin: 0 }}
          >
            {value}
          </TextLabel>
        </HorizontalFlexbox>
      ))}
    </VerticalFlexbox>
  </RoundedBox>
);

// ==============================================
// MAIN COMPONENT
// ==============================================

const CompleteDashboardWithReg1: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const newData = await simulateDataFetch(selectedPeriod);
        setData(newData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setExpandedCard(null);
  };

  const handleCardToggle = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  if (loading || !data) {
    return (
      <PageContainer>
        <Container>
          <LoadingSpinner>Loading dashboard data...</LoadingSpinner>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <PageHeader>
          <PageTitle
            title="DPO Agent Dashboard"
            subTitle="Data Protection Officer Analytics & Monitoring"
          />
          <PageHeaderActions>
            <TimePeriodSelector
              activeFilter={selectedPeriod}
              onFilterChange={handlePeriodChange}
              loading={loading}
            />
          </PageHeaderActions>
        </PageHeader>

        <DashboardGrid>
          <CardsGrid>
            {data.cards.map((card) => (
              <DashboardCard
                key={card.id}
                card={card}
                expanded={expandedCard === card.id}
                onToggle={() => handleCardToggle(card.id)}
              />
            ))}
          </CardsGrid>

          <Sidebar>
            <HealthScoreCard score={data.healthScore} />
            <MetricsCard metrics={data.metrics} />
          </Sidebar>
        </DashboardGrid>
      </Container>
    </PageContainer>
  );
};

export default CompleteDashboardWithReg1;
