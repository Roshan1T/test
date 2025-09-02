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


const data = {
  "report_id": "personalized_critical_report_20250825_081345",
  "client_name": "TechCorp Global Ltd",
  "time_period": {
    "start_date": "2025-08-18T08:13:45.082527",
    "end_date": "2025-08-25T08:13:45.082527"
  },
  "document_counts": {
    "regwatch_documents": 13,
    "gazette_documents": 16,
    "bills_legislation": 2,
    "total_documents": 31
  },
  "critical_report": "This report summarizes all relevant new developments in data protection, cybersecurity, regulation, and enforcement with potential impact on TechCorp Global Ltd and its subsidiaries, focusing on the United Kingdom, European Union, United States, and Singapore as of August 2025. \n\nUnited Kingdom:\n- [2025-08-20] The Information Commissioner's Office (ICO) is intensifying oversight of police facial recognition technology use, conducting audits of South Wales Police and Gwent Police to assess compliance with data protection laws, especially regarding transparency, discrimination, and privacy safeguards. Although current practices appear compliant, the ICO stresses transparency and governance. TechCorp and its AI subsidiary should ensure their AI offerings, particularly biometric and surveillance tech, maintain high levels of compliance, fairness, and auditability to mitigate risk of scrutiny in similar audits [1][ICO steps up scrutiny of police use of facial recognition technology].\n\nEuropean Union (Netherlands):\n- [2025-08-20] Autoriteit Persoonsgegevens (Dutch DPA) published Woo decisions concerning requests for disclosure of activities in the education sector and an enforcement decision referenced by the Dutch court. Partial non-disclosure and denial of certain requests indicate robust enforcement and regulatory transparency, requiring careful compliance with DPA requests. No direct financial penalty, but demonstrates increasing regulatory oversight [5][Woo decision: Activities AP in education], [6][Woo-besluit: Openbaarmaking handhavingsbesluit].\n\nUnited States:\n- [2025-08-19 to 2025-08-22] The Cybersecurity and Infrastructure Security Agency (CISA) released multiple advisories about critical vulnerabilities in Siemens solutions (Desigo CC, SENTRON Powermanager, Mendix SAML Module) that can result in privilege escalation and remote account hijacking. If TechCorp uses or integrates these or similar products into cloud infrastructure, patching and risk assessment are urgent to avoid exploitation and potential regulatory action [2][Siemens Desigo CC Product Family and SENTRON Powermanager], [3][Siemens Mendix SAML Module], [4][CISA Releases Four Industrial Control Systems Advisories].\n- [2025-08-22] CISA published a draft 'Minimum Elements for a Software Bill of Materials (SBOM)' guide, with an open comment period till October 3, 2025. This positions SBOM requirements as an emerging compliance and procurement standard, relevant for TechCorp's product and vendor risk management functions [9][CISA Issues Draft Software Bill of Materials Guide for Public Comment].\n- [2025-08-21] FTC Chairman Ferguson formally warned leading technology and cloud companies—including Amazon, Microsoft, and Alphabet—against weakening US data security and privacy protocols in response to foreign government pressure. Businesses must not relax security measures due to conflicting requirements of international law. For a multinational company like TechCorp and its subsidiaries, careful balancing of US and other jurisdictional requirements is critical to avoid FTC enforcement [8][FTC Chairman Ferguson Warns Companies Against Censoring or Weakening the Data Security of Americans].\n- [2025-08-22] A US Senator (Markey) questioned the transparency and oversight of SBA's deployment of an AI-powered deregulation tool, flagging regulatory scrutiny over untested government AI impacting regulatory regimes. AI solutions provided by TechCorp to US agencies must pass thorough risk, bias, and explainability checks [10][Ranking Member Markey Decries DOGE “Deregulation Tool” Deployment at SBA].\n- [2025-08-19] Two new bills were introduced: (1) Cybersecurity Hiring Modernization Act—may influence public sector cybersecurity staffing and possibly compliance expectations for contractors, and (2) A bill prohibiting release of taxpayer, patient, or vaccine data to WHO or other foreign authorities—potential effect on cross-border data flows for US health and financial data [11][Cybersecurity Hiring Modernization Act], [12][To direct the Secretary of Health and Human Services and the Secretary of the Treasury...].\n\nSingapore:\n- [2025-08-21] The Cyber Security Agency of Singapore issued a security bulletin pertaining to data protection and cyber crime trends. TechCorp should regularly consult these bulletins to ensure ongoing local compliance and to anticipate risks in APAC markets [13][Security Bulletin 21 Aug 2025].\n\nThreats related to consumer product recalls in Ireland and environmental/agricultural data in the UK are not directly material to TechCorp, unless active in those sectors.\n\nRecommended actions include reviewing impacted software supply chains, strengthening documentation and audit trails for AI and data-driven solutions, and enhanced regulatory horizon scanning across all jurisdictions.",
  "total_threats": 8,
  "jurisdictions_count": 4,
  "jurisdictions_analyzed": [
    "United Kingdom",
    "Singapore",
    "United States",
    "European Union (Netherlands)"
  ],
  "threat_distribution": {
    "by_level": {
      "critical": 1,
      "high": 3,
      "medium": 3,
      "low": 1
    },
    "by_jurisdiction": {
      "United Kingdom": {
        "critical": 0,
        "high": 1,
        "medium": 0,
        "low": 0
      },
      "European Union (Netherlands)": {
        "critical": 0,
        "high": 0,
        "medium": 1,
        "low": 0
      },
      "United States": {
        "critical": 1,
        "high": 2,
        "medium": 1,
        "low": 1
      },
      "Singapore": {
        "critical": 0,
        "high": 0,
        "medium": 1,
        "low": 0
      }
    }
  },
  "threats_by_jurisdiction": {
    "United Kingdom": {
      "Critical": [],
      "High": [
        {
          "jurisdiction": "United Kingdom",
          "threat_title": "ICO Scrutiny on Facial Recognition Technology Compliance",
          "threat_summary": "The ICO is conducting in-depth audits into the use of facial recognition technology by police forces, focusing on data protection compliance, fairness, necessity, and anti-discrimination measures. The audits may extend to other sectors using AI and biometric tools, signaling raised regulatory expectations for governance, transparency, and privacy-by-design.",
          "threat_level": "High",
          "date_issued": "2025-08-20",
          "source_type": "RegWatch",
          "reported_by": "Information Commissioner's Office (ICO)",
          "why_threat": "TechCorp's AI solutions in biometric identification or surveillance must ensure robust safeguards and compliance to avoid scrutiny or regulatory enforcement actions similar to those faced by UK police.",
          "financial_impact": "Not specified",
          "compliance_deadline": "Not specified",
          "recommended_actions": [
            "Audit current and planned facial recognition and biometric AI offerings for compliance with UK data protection standards",
            "Strengthen privacy impact assessments, transparency, and documentation"
          ],
          "source_document_id": "a08c01d2-ab7c-4104-90da-44f3cead1357",
          "threat_id": "UNI-H-001"
        }
      ],
      "Medium": [],
      "Low": []
    },
    "European Union (Netherlands)": {
      "Critical": [],
      "High": [],
      "Medium": [
        {
          "jurisdiction": "European Union (Netherlands)",
          "threat_title": "Dutch DPA Enforcement Decision (Woo request denial)",
          "threat_summary": "Autoriteit Persoonsgegevens received and partially denied requests for disclosure of documentation relating to enforcement in education and court-cited regulatory decisions, signaling increasing transparency and active enforcement posture.",
          "threat_level": "Medium",
          "date_issued": "2025-08-20",
          "source_type": "RegWatch",
          "reported_by": "Data Protection Authority/National Cyber Security Centre",
          "why_threat": "Demonstrates the Dutch DPA's willingness to enforce and publicize judgments; TechCorp must ensure DPA requests are met promptly, and that cross-border subsidiaries maintain similar standards.",
          "financial_impact": "Not specified",
          "compliance_deadline": "Not specified",
          "recommended_actions": [
            "Monitor requests and rulings by the Dutch DPA involving sectors or activities related to TechCorp",
            "Ensure full cooperation with local regulatory disclosure processes"
          ],
          "source_document_id": "76c290ea-b8db-4217-90da-4cef5e85c141",
          "threat_id": "EUR-M-002"
        }
      ],
      "Low": []
    },
    "United States": {
      "Critical": [
        {
          "jurisdiction": "United States",
          "threat_title": "Critical Vulnerabilities in Siemens and Mendix Software",
          "threat_summary": "CISA advisories highlight critical vulnerabilities in Siemens Desigo CC product family, SENTRON Powermanager, and Mendix SAML Module (CVSS 8.7, remotely exploitable), risking privilege escalation and remote account hijacking.",
          "threat_level": "Critical",
          "date_issued": "2025-08-19",
          "source_type": "RegWatch",
          "reported_by": "Cybersecurity and Infrastructure Security Agency (CISA)",
          "why_threat": "If TechCorp or its suppliers use the affected Siemens/Mendix solutions, failure to patch exposes the company to breaches, regulatory enforcement, and contractual liability.",
          "financial_impact": "Not specified",
          "compliance_deadline": "Not specified",
          "recommended_actions": [
            "Conduct immediate inventory for affected Siemens/Mendix products across all platforms and environments",
            "Apply recommended Siemens/CISA mitigations and patch updates",
            "Update risk assessments and communicate with supply chain partners"
          ],
          "source_document_id": "e1da08d8-4e5c-41a5-ae8b-a0d36ea8ebb3",
          "threat_id": "UNI-C-003"
        }
      ],
      "High": [
        {
          "jurisdiction": "United States",
          "threat_title": "FTC Warning on Weakening US Data Security under Foreign Pressure",
          "threat_summary": "FTC warns tech giants (incl. Amazon, Microsoft, Alphabet) that weakening US data security, even to comply with foreign laws, may violate US law and trigger enforcement actions. Companies must avoid relaxing cryptographic or privacy safeguards at the behest of non-US authorities.",
          "threat_level": "High",
          "date_issued": "2025-08-21",
          "source_type": "RegWatch",
          "reported_by": "Federal Trade Commission",
          "why_threat": "As a multinational, TechCorp may face conflicting requirements across jurisdictions—failure to maintain the highest data security for US user data could lead to FTC penalties.",
          "financial_impact": "Not specified",
          "compliance_deadline": "Not specified",
          "recommended_actions": [
            "Establish a cross-jurisdictional legal review process for compliance conflicts",
            "Do not weaken encryption or privacy protections for US citizens in response to foreign law without clear legal analysis and internal escalation"
          ],
          "source_document_id": "43b6a893-90cd-4452-a13b-8bc505620eca",
          "threat_id": "UNI-H-004"
        },
        {
          "jurisdiction": "United States",
          "threat_title": "CISA Proposes New SBOM (Software Bill of Materials) Minimum Requirements",
          "threat_summary": "CISA released a draft guide updating the minimum requirements for Software Bill of Materials (SBOM), adding new fields and clarifying obligations. SBOMs are poised to become a procurement and compliance norm.",
          "threat_level": "High",
          "date_issued": "2025-08-22",
          "source_type": "RegWatch",
          "reported_by": "Cybersecurity and Infrastructure Security Agency",
          "why_threat": "SBOMs will be expected for software used by TechCorp and its enterprise clients; lack of SBOMs will jeopardize contracts and regulatory compliance.",
          "financial_impact": "Not specified",
          "compliance_deadline": "2025-10-03 (public comment period)",
          "recommended_actions": [
            "Begin implementation and documentation of SBOM processes for all software development teams",
            "Engage with the public comment process, and monitor for finalization of requirements"
          ],
          "source_document_id": "5b0c7d3c-cd45-448f-b966-cf647596349b",
          "threat_id": "UNI-H-005"
        }
      ],
      "Medium": [
        {
          "jurisdiction": "United States",
          "threat_title": "Congressional Scrutiny of Federal Government AI Compliance/Oversight",
          "threat_summary": "A US Senator has demanded disclosure of an AI decision tool ('DOGE') deployment within the Small Business Administration, citing regulatory risk from insufficient oversight or effect on established regulations.",
          "threat_level": "Medium",
          "date_issued": "2025-08-22",
          "source_type": "RegWatch",
          "reported_by": "US Senate Committee on Small Businesses and Entrepreneurship",
          "why_threat": "Raises risk of further regulation and scrutiny for vendors offering AI solutions to US public sector clients—TechCorp's offerings must be transparent and auditable.",
          "financial_impact": "Not specified",
          "compliance_deadline": "2025-09-05 (Senate deadline for response)",
          "recommended_actions": [
            "Prepare for heightened transparency and bias-testing requirements for all AI/ML deployments",
            "Implement clear audit trails, explainability, and documentation for all government AI systems"
          ],
          "source_document_id": "4bf19ff7-9246-49e6-b923-a027d8506b6b",
          "threat_id": "UNI-M-006"
        }
      ],
      "Low": [
        {
          "jurisdiction": "United States",
          "threat_title": "Proposed Federal Bills Affecting Cybersecurity Hiring and Data Disclosure",
          "threat_summary": "HR 5000 aims to modernize cybersecurity hiring for competitive service. HR 5006 would prohibit the federal release of sensitive taxpayer/patient/vaccine data to the WHO or foreign governments. These reflect ongoing change in federal data sharing and personnel policy.",
          "threat_level": "Low",
          "date_issued": "2025-08-19",
          "source_type": "Bill",
          "reported_by": "United States Congress",
          "why_threat": "Future passage could affect TechCorp's supply of services or products to US government or healthcare markets. No immediate impact, but signals policy direction.",
          "financial_impact": "Not specified",
          "compliance_deadline": "Not specified",
          "recommended_actions": [
            "Monitor legislative progress",
            "Assess workforce and federal data sharing strategies for future compliance"
          ],
          "source_document_id": "00a5b626-f086-4fdf-81ba-02ad88d3e35e",
          "threat_id": "UNI-L-008"
        }
      ]
    },
    "Singapore": {
      "Critical": [],
      "High": [],
      "Medium": [
        {
          "jurisdiction": "Singapore",
          "threat_title": "Cybersecurity Bulletin on Data Protection and Cyber Crime",
          "threat_summary": "CSA Singapore issued a new security bulletin highlighting current cyber crime and data protection trends. While specific details are not disclosed, such bulletins often contain important threat intelligence and compliance recommendations.",
          "threat_level": "Medium",
          "date_issued": "2025-08-21",
          "source_type": "RegWatch",
          "reported_by": "Cyber Security Agency of Singapore",
          "why_threat": "Regular monitoring of CSA bulletins is essential to stay ahead of emerging risks and compliance obligations in Singapore and APAC market.",
          "financial_impact": "Not specified",
          "compliance_deadline": "Not specified",
          "recommended_actions": [
            "Assign responsibility to review CSA security bulletins and update the executive and engineering teams accordingly",
            "Adapt internal practices to incorporate local regulatory guidance"
          ],
          "source_document_id": "1b4fa34f-f30e-4039-88af-c0d7cbbcce93",
          "threat_id": "SIN-M-007"
        }
      ],
      "Low": []
    }
  }
}

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
  data?: CriticalReportData;
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
  data: reportData = data,
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
    <CardContainer>
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
            {reportData.client_name} • {formatDate(reportData.time_period.start_date)} -{" "}
            {formatDate(reportData.time_period.end_date)}
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
                {reportData.total_threats}
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
                {reportData.jurisdictions_count}
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
                {reportData.document_counts.total_documents}
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
                {reportData.threat_distribution.by_level.critical}
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
            {reportData.critical_report}
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

          {Object.entries(reportData.threats_by_jurisdiction).map(
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

