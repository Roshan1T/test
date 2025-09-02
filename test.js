
import React, { useState } from "react";
import styled, { useTheme } from "styled-components";
import {
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  MapPin,
  ExternalLink
} from "lucide-react";
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Chip from '@components/atoms/Chip';
import RoundedBox from '@components/atoms/RoundedBox';
import HorizontalFlexbox from '@components/atoms/HorizontalFlexbox';
import VerticalFlexbox from '@components/atoms/VerticalFlexbox';
import { GridContainer } from '@components/atoms/Grid';
import { TextLabel, SecondaryLabel, Label } from '@components/atoms/Fields';

// Styled Components (using existing atoms where possible)
const CardContainer = styled.div`
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
`;

const ContentArea = styled.div`
  font-size: 0.9rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
`;

// Custom styled components for specific card elements
const ReportHeaderBox = styled(RoundedBox)`
  padding: 2rem;
  margin-bottom: 2rem;
  border-left: 4px solid ${(props) => props.theme.red};
`;

const ThreatCard = styled(RoundedBox)`
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${(props) => props.theme.primaryColor};
    box-shadow: ${(props) => props.theme.moduleShadow};
  }
`;

const JurisdictionHeader = styled(RoundedBox)`
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.hoverColor};
    border-color: ${(props) => props.theme.primaryColor};
    transform: translateY(-1px);
    box-shadow: ${(props) => props.theme.moduleShadow};
  }
`;

const ThreatSection = styled.div`
  margin-bottom: 2rem;
`;

const ThreatsList = styled.div<{ expanded: boolean }>`
  max-height: ${({ expanded }) => (expanded ? "none" : "0")};
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: ${({ expanded }) => (expanded ? "1" : "0")};
`;

const ThreatHeader = styled(HorizontalFlexbox)`
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ThreatTitle = styled(TextLabel)`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const ThreatSummary = styled.p`
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  margin: 1rem 0;
`;

const ActionsList = styled.ul`
  margin: 1rem 0;
  padding-left: 1.5rem;
  list-style-type: none;

  li {
    position: relative;
    margin: 0.5rem 0;
    line-height: 1.6;
    color: ${(props) => props.theme.textColor};

    &::before {
      content: "→";
      color: ${(props) => props.theme.primaryColor};
      font-weight: bold;
      position: absolute;
      left: -1.25rem;
    }
  }
`;

const FinancialImpact = styled(RoundedBox)`
  background: ${(props) => props.theme.amberBg};
  border: 1px solid ${(props) => props.theme.amber};
  margin-top: 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.orange};
`;

const ComplianceDeadline = styled(RoundedBox)`
  background: ${(props) => props.theme.redBg};
  border: 1px solid ${(props) => props.theme.red};
  margin-top: 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.red};
`;

// Interfaces
interface ThreatData {
  jurisdiction: string;
  threat_title: string;
  threat_summary: string;
  threat_level: string;
  date_issued: string;
  source_type: string;
  reported_by: string;
  why_threat: string;
  financial_impact: string;
  compliance_deadline: string;
  recommended_actions: string[];
  source_document_id: string;
  threat_id: string;
}

interface JurisdictionThreats {
  Critical: ThreatData[];
  High: ThreatData[];
  Medium: ThreatData[];
  Low: ThreatData[];
}

interface CriticalReportData {
  report_id: string;
  client_name: string;
  time_period: {
    start_date: string;
    end_date: string;
  };
  document_counts: {
    regwatch_documents: number;
    gazette_documents: number;
    bills_legislation: number;
    total_documents: number;
  };
  critical_report: string;
  total_threats: number;
  jurisdictions_count: number;
  jurisdictions_analyzed: string[];
  threat_distribution: {
    by_level: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    by_jurisdiction: Record<string, Record<string, number>>;
  };
  threats_by_jurisdiction: Record<string, JurisdictionThreats>;
}

interface CriticalUpdatesCardProps {
  data: CriticalReportData;
  dataFullWidth?: boolean;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to get threat level icon
const getThreatLevelIcon = (level: string) => {
  switch (level.toLowerCase()) {
    case "critical":
      return <ErrorIcon sx={{ fontSize: 16, color: 'inherit' }} />;
    case "high":
      return <WarningIcon sx={{ fontSize: 16, color: 'inherit' }} />;
    case "medium":
      return <InfoIcon sx={{ fontSize: 16, color: 'inherit' }} />;
    case "low":
      return <TrendingUpIcon sx={{ fontSize: 16, color: 'inherit' }} />;
    default:
      return <InfoIcon sx={{ fontSize: 16, color: 'inherit' }} />;
  }
};

// Main Component
const CriticalUpdatesCard: React.FC<CriticalUpdatesCardProps> = ({
  data,
  dataFullWidth,
}) => {
  const theme = useTheme();
  const [expandedJurisdictions, setExpandedJurisdictions] = useState<
    Record<string, boolean>
  >({});

  const toggleJurisdiction = (jurisdiction: string) => {
    setExpandedJurisdictions((prev) => ({
      ...prev,
      [jurisdiction]: !prev[jurisdiction],
    }));
  };

  const getAllThreatsForJurisdiction = (
    jurisdictionThreats: JurisdictionThreats
  ): ThreatData[] => {
    return [
      ...jurisdictionThreats.Critical,
      ...jurisdictionThreats.High,
      ...jurisdictionThreats.Medium,
      ...jurisdictionThreats.Low,
    ];
  };

  const getJurisdictionThreatCounts = (
    jurisdictionThreats: JurisdictionThreats
  ) => {
    return {
      critical: jurisdictionThreats.Critical.length,
      high: jurisdictionThreats.High.length,
      medium: jurisdictionThreats.Medium.length,
      low: jurisdictionThreats.Low.length,
    };
  };

  return (
    <CardContainer data-full-width={dataFullWidth ? "true" : "false"}>
      <ContentArea>
        {/* Report Header */}
        <ReportHeaderBox>
          <HorizontalFlexbox className="align-center" gap="0.75rem">
            <ErrorIcon sx={{ fontSize: 24, color: theme.red }} />
            <TextLabel size="large" style={{ fontWeight: 700, color: theme.textColor }}>
              Critical Updates Report
            </TextLabel>
          </HorizontalFlexbox>
          <div style={{ color: theme.red, fontWeight: 600, marginTop: '1rem' }}>
            {data.client_name} • {formatDate(data.time_period.start_date)} -{" "}
            {formatDate(data.time_period.end_date)}
          </div>

          <GridContainer cols={4} style={{ marginTop: '1.5rem' }}>
            <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
              <SecondaryLabel size="xsmall" style={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                Total Threats
              </SecondaryLabel>
              <TextLabel size="medium" style={{ fontWeight: 700 }}>
                {data.total_threats}
              </TextLabel>
            </RoundedBox>
            <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
              <SecondaryLabel size="xsmall" style={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                Jurisdictions
              </SecondaryLabel>
              <TextLabel size="medium" style={{ fontWeight: 700 }}>
                {data.jurisdictions_count}
              </TextLabel>
            </RoundedBox>
            <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
              <SecondaryLabel size="xsmall" style={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                Total Documents
              </SecondaryLabel>
              <TextLabel size="medium" style={{ fontWeight: 700 }}>
                {data.document_counts.total_documents}
              </TextLabel>
            </RoundedBox>
            <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
              <SecondaryLabel size="xsmall" style={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                Critical Level
              </SecondaryLabel>
              <TextLabel size="medium" style={{ fontWeight: 700 }}>
                {data.threat_distribution.by_level.critical}
              </TextLabel>
            </RoundedBox>
          </GridContainer>
        </ReportHeaderBox>

        {/* Report Summary */}
        <RoundedBox style={{ padding: '2rem', marginBottom: '2rem' }}>
          <TextLabel size="large" style={{
            fontWeight: 700,
            borderBottom: `2px solid ${theme.borderColor}`,
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
            display: 'block'
          }}>
            Executive Summary
          </TextLabel>
          <div style={{
            lineHeight: 1.8,
            color: theme.textColor,
            whiteSpace: 'pre-wrap'
          }}>
            {data.critical_report}
          </div>
        </RoundedBox>

        {/* Threats by Jurisdiction */}
        <ThreatSection>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: theme.textColor,
              margin: "2.5rem 0 1.5rem 0",
              borderBottom: `2px solid ${theme.borderColor}`,
              paddingBottom: "0.75rem",
            }}
          >
            Threats by Jurisdiction
          </h2>

          {Object.entries(data.threats_by_jurisdiction).map(
            ([jurisdiction, threats]) => {
              const allThreats = getAllThreatsForJurisdiction(threats as JurisdictionThreats);
              const threatCounts = getJurisdictionThreatCounts(threats as JurisdictionThreats);
              const isExpanded = expandedJurisdictions[jurisdiction];

              if (allThreats.length === 0) return null;

              return (
                <div key={jurisdiction}>
                  <JurisdictionHeader
                    onClick={() => toggleJurisdiction(jurisdiction)}
                  >
                    <HorizontalFlexbox className="space-between align-center">
                      <HorizontalFlexbox className="align-center" gap="0.5rem">
                        <MapPin size={20} />
                        <TextLabel size="medium" style={{ fontWeight: 700, margin: 0 }}>
                          {jurisdiction}
                        </TextLabel>
                      </HorizontalFlexbox>

                      <HorizontalFlexbox className="align-center" gap="1rem">
                        <HorizontalFlexbox gap="1rem" className="align-center">
                          {threatCounts.critical > 0 && (
                            <Chip variant="red">
                              {threatCounts.critical} Critical
                            </Chip>
                          )}
                          {threatCounts.high > 0 && (
                            <Chip variant="orange">
                              {threatCounts.high} High
                            </Chip>
                          )}
                          {threatCounts.medium > 0 && (
                            <Chip variant="green">
                              {threatCounts.medium} Medium
                            </Chip>
                          )}
                          {threatCounts.low > 0 && (
                            <Chip variant="blue">
                              {threatCounts.low} Low
                            </Chip>
                          )}
                        </HorizontalFlexbox>

                        {isExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </HorizontalFlexbox>
                    </HorizontalFlexbox>
                  </JurisdictionHeader>

                  <ThreatsList expanded={isExpanded}>
                    {allThreats.map((threat) => (
                      <ThreatCard key={threat.threat_id}>
                        <ThreatHeader>
                          <ThreatTitle>{threat.threat_title}</ThreatTitle>
                          <Chip variant={
                            threat.threat_level.toLowerCase() === 'critical' ? 'red' :
                              threat.threat_level.toLowerCase() === 'high' ? 'orange' :
                                threat.threat_level.toLowerCase() === 'medium' ? 'green' : 'blue'
                          }>
                            {threat.threat_level}
                          </Chip>
                        </ThreatHeader>

                        <HorizontalFlexbox gap="1rem" style={{
                          alignItems: 'center',
                          marginBottom: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <HorizontalFlexbox gap="0.25rem" className="align-center">
                            <CalendarIcon size={14} />
                            <SecondaryLabel size="xsmall">
                              {formatDate(threat.date_issued)}
                            </SecondaryLabel>
                          </HorizontalFlexbox>
                          <HorizontalFlexbox gap="0.25rem" className="align-center">
                            <ExternalLink size={14} />
                            <SecondaryLabel size="xsmall">
                              {threat.source_type}
                            </SecondaryLabel>
                          </HorizontalFlexbox>
                          <SecondaryLabel size="xsmall">
                            ID: {threat.threat_id}
                          </SecondaryLabel>
                        </HorizontalFlexbox>

                        <ThreatSummary>{threat.threat_summary}</ThreatSummary>

                        <RoundedBox style={{
                          margin: "1rem 0",
                          padding: "1rem",
                          background: theme.cardBgSecondary,
                        }}>
                          <strong style={{ color: theme.textColor }}>
                            Why this is a threat:
                          </strong>
                          <p style={{ margin: "0.5rem 0 0 0", color: theme.textColor }}>
                            {threat.why_threat}
                          </p>
                        </RoundedBox>

                        {threat.recommended_actions &&
                          threat.recommended_actions.length > 0 && (
                            <div>
                              <strong style={{ color: theme.textColor }}>
                                Recommended Actions:
                              </strong>
                              <ActionsList>
                                {threat.recommended_actions.map(
                                  (action, index) => (
                                    <li key={index}>{action}</li>
                                  )
                                )}
                              </ActionsList>
                            </div>
                          )}

                        {threat.financial_impact &&
                          threat.financial_impact !== "Not specified" && (
                            <FinancialImpact>
                              <strong>Financial Impact:</strong>{" "}
                              {threat.financial_impact}
                            </FinancialImpact>
                          )}

                        {threat.compliance_deadline &&
                          threat.compliance_deadline !== "Not specified" && (
                            <ComplianceDeadline>
                              <HorizontalFlexbox gap="0.5rem" className="align-center">
                                <CalendarIcon size={16} />
                                <strong>Compliance Deadline:</strong>{" "}
                                {formatDate(threat.compliance_deadline)}
                              </HorizontalFlexbox>
                            </ComplianceDeadline>
                          )}

                        <SecondaryLabel size="xsmall" style={{ marginTop: "1rem" }}>
                          Reported by: {threat.reported_by}
                        </SecondaryLabel>
                      </ThreatCard>
                    ))}
                  </ThreatsList>
                </div>
              );
            }
          )}
        </ThreatSection>
      </ContentArea>
    </CardContainer>
  );
};

export default CriticalUpdatesCard;
