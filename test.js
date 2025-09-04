import React, { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import VerticalFlexbox from "@components/atoms/VerticalFlexbox";
import RoundedBox from "@components/atoms/RoundedBox";
import HorizontalFlexbox from "@components/atoms/HorizontalFlexbox";
import { FieldLabel, SecondaryLabel, TextLabel } from "@components/atoms/Fields";
import CircularProgress from "@components/atoms/CircularProgress";
import { Badge, Popover } from '@mui/material';
import useLocalStorage from "@utils/hooks/useLocalStorage";
import BoxButton from "@components/atoms/BoxButton";
import SwitchToggle from "@components/atoms/Switch";
import TuneIcon from '@mui/icons-material/Tune';
import EsgCard from "./EsgCard";
import EsgFilters, { ESG_DEFAULT_ARGS, ESG_DEFAULT_ARGS_STRINGIFIED } from "@components/organisms/ESG/EsgFilters";
import { useFetchEsg } from "@utils/hooks/esg/useEsg";
import LoadingMessage from "@components/atoms/LoadingMessage";

//styles - Using project theme colors instead of hardcoded values
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.pageBg};
`;

const Container = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const StickyTopBar = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  padding: 1.25rem 2.5rem;
  background-color: ${(props) => props.theme.cardBg};
  z-index: 10;
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  backdrop-filter: blur(12px);
  box-shadow: ${(props) => props.theme.moduleShadow};
`;

const TopBarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TopBarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ViewToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.cardBgSecondary};
  border-radius: ${(props) => props.theme.borderRadius};
  border: 1px solid ${(props) => props.theme.borderColor};
`;

const ViewToggleLabel = styled(SecondaryLabel)`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.labelColor};
`;

const ContentArea = styled.div`
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 2rem;
  background-color: ${(props) => props.theme.backgroundPrimary};
`;

const OverallReportContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const DetailedReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const ReportCard = styled(RoundedBox)`
  background: ${(props) => props.theme.cardBg};
  border: 1px solid ${(props) => props.theme.borderColor};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: ${(props) => props.theme.primaryColor};
    box-shadow: 0 8px 25px rgba(31, 117, 255, 0.15);
    transform: translateY(-2px);
    background: ${(props) => props.theme.cardBgFocus};
  }
`;

const ReportCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ReportCardTitle = styled(TextLabel)`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${(props) => props.theme.textColor};
  margin: 0;
`;

const ReportCardMeta = styled(SecondaryLabel)`
  font-size: 0.85rem;
  color: ${(props) => props.theme.labelColorLight};
  margin-bottom: 1rem;
`;

const ReportCardStats = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid ${(props) => props.theme.borderColor};
  align-items: center;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  font-size: 0.7rem;
  color: ${(props) => props.theme.secondaryGrey};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`;

const StatValue = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${(props) => props.theme.textColor};
`;

const CenteredDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: ${(props) => props.theme.labelColorLight};
  padding: 3rem;
`;

const PlaceholderIcon = styled.div`
  font-size: 5rem;
  margin-bottom: 2rem;
  opacity: 0.3;
  color: ${(props) => props.theme.primaryColor};
`;

const PlaceholderText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${(props) => props.theme.textColor};
`;

const PlaceholderSubtext = styled.div`
  font-size: 1.1rem;
  opacity: 0.7;
  max-width: 500px;
  line-height: 1.6;
  color: ${(props) => props.theme.labelColorLight};
`;

const PopoverContainer = styled.div`
  padding: 1.5rem;
  min-width: 350px;
`;

const PriorityBadge = styled.span<{ $priority: 'high' | 'medium' | 'low' }>`
  padding: 0.375rem 1rem;
  border-radius: ${(props) => props.theme.borderRadius};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: ${(props: any) => {
        switch (props.$priority) {
            case 'high': return props.theme.redBg;
            case 'medium': return props.theme.orangeBg;
            default: return props.theme.hoverColor;
        }
    }};
  color: ${(props: any) => {
        switch (props.$priority) {
            case 'high': return props.theme.red;
            case 'medium': return props.theme.orange;
            default: return props.theme.primaryColor;
        }
    }};
  border: 1px solid ${(props: any) => {
        switch (props.$priority) {
            case 'high': return props.theme.red;
            case 'medium': return props.theme.orange;
            default: return props.theme.primaryColor;
        }
    }};
`;



//interface 
type Citation = {
    collection: string;
    id: string;
    title: string
};

interface GazetteReport {
    id: string;
    dateAdded: string;
    content: string;
    reportType: string;
    startDate: string;
    endDate: string;
    jurisdiction: string[] | null;
    citation?: Citation[];
    summary?: string;
    regulatorName?: string[] | null;

}

// HealthScore Component - Using project atoms and theme colors
const HealthScore: React.FC<{ score: number }> = ({ score }) => {
    const theme = useTheme();
    return (
        <RoundedBox style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
            <FieldLabel style={{ fontSize: '1rem', fontWeight: '600', color: theme.textColor, marginBottom: '1rem' }}>
                Overall Health Score
            </FieldLabel>
            <CircularProgress width={160} height={160} percent={score} includeCenterLabel={true} />
        </RoundedBox>
    );
};

// Updated components using project atoms
const DetailedReportsView: React.FC<{
    reports: GazetteReport[];
}> = ({ reports }) => {
    const theme = useTheme();

    const getPriority = (type: string) => {
        if (type.includes('critical') || type.includes('fines')) return 'high';
        if (type.includes('bill') || type.includes('gazette')) return 'medium';
        return 'low';
    };

    const getReportType = (type: string) => {
        if (type.includes('critical')) return 'Critical';
        if (type.includes('fines')) return 'Fines';
        if (type.includes('gazette')) return 'Gazette';
        if (type.includes('bill')) return 'Bills';
        if (type.includes("reg")) return "Regulatory";
        return 'Overall';
    };

    const getReportTitle = (reportType: string) => {
        return reportType
            .replace(/_/g, ' ')
            .replace(/report/g, 'Report')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const availableReports = reports.filter((report: GazetteReport) => report && report.content);

    if (availableReports.length === 0) {
        return (
            <PlaceholderContent>
                <PlaceholderIcon>📄</PlaceholderIcon>
                <PlaceholderText>No Reports Available</PlaceholderText>
                <PlaceholderSubtext>No regulatory reports found for the current period. Please check your filters or try again later.</PlaceholderSubtext>
            </PlaceholderContent>
        );
    }

    return (
        <DetailedReportsGrid>
            {availableReports.map((report: GazetteReport) => {
                const contentPreview = report.content
                    ? report.content.replace(/[#*`-]/g, '').substring(0, 200) + '...'
                    : 'No content available';

                return (
                    <ReportCard key={report.id}>
                        <ReportCardHeader>
                            <ReportCardTitle>
                                {getReportTitle(report.reportType)}
                            </ReportCardTitle>
                            <PriorityBadge $priority={getPriority(report.reportType)}>
                                {getReportType(report.reportType)}
                            </PriorityBadge>
                        </ReportCardHeader>

                        <ReportCardMeta>
                            {report.startDate} - {report.endDate}
                            {report?.jurisdiction && ` • ${report?.jurisdiction}`}
                            {report?.regulatorName && ` • ${report?.regulatorName}`}
                        </ReportCardMeta>

                        <div style={{ fontSize: '0.9rem', color: theme.labelColor, lineHeight: '1.6', marginBottom: '1rem' }}>
                            {contentPreview}
                        </div>

                        <ReportCardStats>
                            <StatItem>
                                <StatLabel>Generated</StatLabel>
                                <StatValue>{new Date(report.dateAdded).toLocaleDateString()}</StatValue>
                            </StatItem>
                            {report.citation?.length > 0 && (
                                <StatItem>
                                    <StatLabel>Sources</StatLabel>
                                    <StatValue>{report.citation?.length}</StatValue>
                                </StatItem>
                            )}
                            <StatItem>
                                <StatLabel>Type</StatLabel>
                                <StatValue>{report.reportType.replace('_', ' ')}</StatValue>
                            </StatItem>
                        </ReportCardStats>
                    </ReportCard>
                );
            })}
        </DetailedReportsGrid>
    );
};

const OverallReportView: React.FC<{
    reports: GazetteReport[];
}> = ({ reports }) => {
    const theme = useTheme();

    // Get the overall/summary report (usually the first one with summary content)
    const overallReport = reports.find(report =>
        report && report.content && (
            report.reportType.toLowerCase().includes('overall') ||
            report.reportType.toLowerCase().includes('summary') ||
            report.summary
        )
    ) || reports[0]; // Fallback to first report

    if (!overallReport) {
        return (
            <PlaceholderContent>
                <PlaceholderIcon>📊</PlaceholderIcon>
                <PlaceholderText>No Overall Report Available</PlaceholderText>
                <PlaceholderSubtext>No overall ESG report found. Please generate a report or try again later.</PlaceholderSubtext>
            </PlaceholderContent>
        );
    }

    return (
        <OverallReportContainer>
            <VerticalFlexbox style={{ gap: '1.5rem' }}>
                <HorizontalFlexbox style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <TextLabel style={{ fontSize: '2rem', fontWeight: '800', color: theme.textColor, margin: '0 0 0.5rem 0' }}>
                            ESG Overall Report
                        </TextLabel>
                        <HorizontalFlexbox style={{ gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <HorizontalFlexbox style={{ alignItems: 'center', gap: '0.5rem' }}>
                                <SecondaryLabel style={{ fontSize: '0.75rem', fontWeight: '600', color: theme.labelColor, textTransform: 'uppercase' }}>
                                    Jurisdiction
                                </SecondaryLabel>
                                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: theme.textColor, padding: '0.375rem 1rem', backgroundColor: theme.cardBgSecondary, borderRadius: theme.borderRadius, border: `1px solid ${theme.borderColor}` }}>
                                    {overallReport?.jurisdiction?.join(", ") || 'Global'}
                                </span>
                            </HorizontalFlexbox>
                            <HorizontalFlexbox style={{ alignItems: 'center', gap: '0.5rem' }}>
                                <SecondaryLabel style={{ fontSize: '0.75rem', fontWeight: '600', color: theme.labelColor, textTransform: 'uppercase' }}>
                                    Updated
                                </SecondaryLabel>
                                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: theme.textColor, padding: '0.375rem 1rem', backgroundColor: theme.cardBgSecondary, borderRadius: theme.borderRadius, border: `1px solid ${theme.borderColor}` }}>
                                    {new Date(overallReport.dateAdded).toLocaleDateString()}
                                </span>
                            </HorizontalFlexbox>
                        </HorizontalFlexbox>
                    </div>
                    <HealthScore score={85} />
                </HorizontalFlexbox>

                <RoundedBox style={{ padding: '2rem' }}>
                    <EsgCard
                        key={overallReport.id}
                        data={[overallReport]}
                        dataFullWidth={true}
                    />
                </RoundedBox>
            </VerticalFlexbox>
        </OverallReportContainer>
    );
};

//main component
const EsgAgent: React.FC = () => {
    const [viewMode, setViewMode] = useState<'overall' | 'detailed'>('overall');
    const [argsToPropagate, setArgsToPropagate] = useState(ESG_DEFAULT_ARGS);
    const [currentDate, setCurrentDate] = useState('');
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const fetchEsgMutation = useFetchEsg();

    const handleGenereateReport = () => {
        console.log(argsToPropagate)
        fetchEsgMutation.mutate({
            filter: argsToPropagate
        })
    }

    useEffect(() => {
        fetchEsgMutation.mutate({ filter: argsToPropagate })
        console.log(fetchEsgMutation.data)
    }, [])

    useEffect(() => {
        const date = new Date();
        setCurrentDate(date.toString().slice(0, 16));
    }, []);

    const [args, setArgs] = useLocalStorage(
        'esgFilters',
        ESG_DEFAULT_ARGS,
    );

    const handleCloseFilter = () => {
        setAnchorEl(null);
    };

    const handleArgs = (value: any) => {
        console.log('Changing arg');
        setArgs({ ...args, ...value });
        setArgsToPropagate((prevArgs: any) => ({ ...prevArgs, ...value }));
    };

    const handleViewToggle = (checked: boolean) => {
        setViewMode(checked ? 'detailed' : 'overall');
    };

    return (
        <PageContainer>
            <Container>
                <StickyTopBar>
                    <TopBarContent>
                        <TopBarTitle>
                            <TextLabel style={{ fontSize: '1.5rem', fontWeight: '800', color: theme.textColor }}>
                                ESG Agent Dashboard
                            </TextLabel>
                            <TextLabel style={{ fontSize: '0.9rem', color: theme.labelColor, fontWeight: '600' }}>
                                {currentDate}
                            </TextLabel>
                        </TopBarTitle>
                        <TopBarActions>
                            <ViewToggleContainer>
                                <ViewToggleLabel>Overall Report</ViewToggleLabel>
                                <SwitchToggle
                                    value={viewMode === 'detailed'}
                                    onChange={(e) => handleViewToggle(e.target.checked)}
                                />
                                <ViewToggleLabel>Detailed Reports</ViewToggleLabel>
                            </ViewToggleContainer>

                            <Badge
                                color="primary"
                                badgeContent=""
                                variant="dot"
                                invisible={JSON.stringify(args) == ESG_DEFAULT_ARGS_STRINGIFIED}
                            >
                                <BoxButton
                                    icon={<TuneIcon style={{ fontSize: '1rem' }} />}
                                    onClick={(e: any) => setAnchorEl(e.currentTarget)}
                                >
                                    Filters
                                </BoxButton>
                            </Badge>
                        </TopBarActions>
                    </TopBarContent>
                </StickyTopBar>

                <Popover
                    style={{ zIndex: 20 }}
                    id={'dropdown-popover'}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleCloseFilter}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <PopoverContainer>
                        <EsgFilters args={argsToPropagate} onChange={handleArgs} handleGenereateReport={handleGenereateReport} />
                    </PopoverContainer>
                </Popover>

                <ContentArea>
                    {fetchEsgMutation.isLoading ? (
                        <CenteredDiv>
                            <LoadingMessage>Fetching ESG data...</LoadingMessage>
                        </CenteredDiv>
                    ) : fetchEsgMutation.isError ? (
                        <CenteredDiv>
                            <SecondaryLabel>Error fetching ESG data</SecondaryLabel>
                        </CenteredDiv>
                    ) : fetchEsgMutation.data ? (
                        viewMode === 'overall' ? (
                            <OverallReportView reports={fetchEsgMutation.data.data} />
                        ) : (
                            <DetailedReportsView reports={fetchEsgMutation.data.data} />
                        )
                    ) : (
                        <CenteredDiv>
                            <SecondaryLabel>No ESG data available</SecondaryLabel>
                        </CenteredDiv>
                    )}
                </ContentArea>
            </Container>
        </PageContainer>
    );
};

export default EsgAgent;



























import { SecondaryLabel, TextLabel } from "@components/atoms/Fields";
import HorizontalFlexbox from "@components/atoms/HorizontalFlexbox";
import RoundedBox from "@components/atoms/RoundedBox";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled, { useTheme } from "styled-components";
import { openModal } from "react-url-modal";

// Simplified styling using project atoms where possible
const CitationsWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;

const ContentArea = styled.div`
  font-size: 0.9rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
`;

const SummaryWrapper = styled(RoundedBox)`
  background-color: ${(props) => props.theme.hoverColor};
  border-left: 4px solid ${(props) => props.theme.primaryColor};
  margin-bottom: 2rem;
  box-shadow: ${(props) => props.theme.moduleShadow};
  font-size: 1rem;
  line-height: 1.7;
  color: ${(props) => props.theme.textColor};
  font-weight: 500;

  & > h4 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  & > p {
    margin: 0.75rem 0;
    font-size: 1rem;
    color: ${(props) => props.theme.textColor};
  }
`;

const CitationButton = styled.button`
  max-width: 400px;
  min-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-content: flex-start;
  background: ${(props) => props.theme.cardBgSecondary};
  border: 1px solid ${(props) => props.theme.borderColor};
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: ${(props) => props.theme.borderRadius};
  transition: all 0.3s ease;
  font-size: 0.85rem;
  color: ${(props) => props.theme.textColor};
  display: flex;
  align-items: center;

  &:hover {
    background: ${(props) => props.theme.hoverColor};
    border-color: ${(props) => props.theme.primaryColor};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(31, 117, 255, 0.15);
    color: ${(props) => props.theme.primaryColor};
  }
`;

const CitationTitle = styled.span`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.85rem;
  text-align: left;
  font-weight: 500;
`;

const CitationsHeader = styled(TextLabel)`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.textColor};
  margin: 3rem 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${(props) => props.theme.borderColor};
  letter-spacing: -0.025em;
  display: block;
`;

// Basic markdown styling - using project theme colors
const MarkdownContent = styled.div`
  h1, h2, h3, h4, h5, h6 {
    color: ${(props) => props.theme.textColor};
    font-weight: 600;
    margin: 1.5rem 0 1rem 0;
    line-height: 1.4;
  }
  
  h1 { font-size: 2rem; border-bottom: 3px solid ${(props) => props.theme.primaryColor}; padding-bottom: 1rem; }
  h2 { font-size: 1.75rem; border-bottom: 2px solid ${(props) => props.theme.borderColor}; padding-bottom: 0.75rem; }
  h3 { font-size: 1.5rem; }
  h4 { font-size: 1.25rem; }
  h5 { font-size: 1.125rem; }
  h6 { font-size: 1rem; }

  p {
    line-height: 1.8;
    margin: 1.25rem 0;
    color: ${(props) => props.theme.textColor};
    font-size: 1rem;
  }

  strong {
    font-weight: 700;
    color: ${(props) => props.theme.textColor};
  }

  em {
    font-style: italic;
    color: ${(props) => props.theme.labelColor};
  }

  blockquote {
    margin: 2rem 0;
    padding: 1.5rem 2rem;
    border-left: 4px solid ${(props) => props.theme.primaryColor};
    background: ${(props) => props.theme.cardBgSecondary};
    color: ${(props) => props.theme.labelColor};
    font-style: italic;
    border-radius: 0 ${(props) => props.theme.borderRadius} ${(props) => props.theme.borderRadius} 0;
    box-shadow: ${(props) => props.theme.moduleShadow};
    font-size: 1.05rem;
    line-height: 1.7;
  }

  hr {
    border: none;
    border-top: 2px solid ${(props) => props.theme.borderColor};
    margin: 3rem 0;
    width: 100%;
  }

  ul, ol {
    margin: 1.5rem 0;
    padding-left: 2rem;
    
    li {
      margin: 0.75rem 0;
      line-height: 1.7;
      color: ${(props) => props.theme.textColor};
    }
  }

  ul {
    list-style-type: none;
    
    li {
      position: relative;
      
      &::before {
        content: '•';
        color: ${(props) => props.theme.primaryColor};
        font-weight: bold;
        position: absolute;
        left: -1.5rem;
        font-size: 1.2rem;
      }
    }
  }

  ol {
    list-style-type: decimal;
    
    li::marker {
      color: ${(props) => props.theme.primaryColor};
      font-weight: 600;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
    font-size: 0.95rem;
    background-color: ${(props) => props.theme.cardBg};
    border-radius: ${(props) => props.theme.borderRadius};
    overflow: hidden;
    box-shadow: ${(props) => props.theme.moduleShadow};
  }

  th {
    border: 1px solid ${(props) => props.theme.borderColor};
    background: ${(props) => props.theme.cardBgSecondary};
    padding: 1rem;
    text-align: left;
    font-weight: 700;
    color: ${(props) => props.theme.textColor};
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    border: 1px solid ${(props) => props.theme.borderColor};
    padding: 1rem;
    text-align: left;
    color: ${(props) => props.theme.labelColor};
    line-height: 1.6;
  }
`;

//interface
type Citation = {
    collection: string;
    id: string;
    title: string
};

interface GazetteReport {
    id: string;
    dateAdded: string;
    content: string;
    reportType: string;
    startDate: string;
    endDate: string;
    jurisdiction: string[] | null;
    citation?: Citation[];
    summary?: string;
    regulatorName?: string[] | null;

}


interface CardProps {
    data: GazetteReport[];
}


//Other components
const Citation = ({ citationIndex, citation, ...props }) => {
    return (
        <CitationButton
            {...props}
            onClick={() => {
                if (citation?.collection === 'reg_watch')
                    openModal({
                        name: 'HzRegWatchModal',
                        params: { itemId: citation.id },
                    });
                else if (citation?.collection === 'gazette')
                    openModal({
                        name: 'HzGazetteModal',
                        params: { uniqueId: citation.id },
                    });
                else if (citation?.collection === 'bill')
                    openModal({ name: 'HzBillModal', params: { id: citation.id } });
                else if (citation?.collection === 'committee_hearing')
                    openModal({
                        name: 'HzCommitteeHearingInfoModal',
                        params: { itemId: citation.id },
                    });
                else if (citation?.collection == 'web-search')
                    window.open(citation?.url, '_blank');
                else if (citation?.collection === 'case_law')
                    openModal({
                        name: 'HzCaseLawModal',
                        params: { itemId: citation.id },
                    });
                else if (citation?.collection === 'news_feed')
                    openModal({
                        name: 'HzArticleModal',
                        params: { itemId: citation.id },
                    });
                else if (citation?.collection === 'fines_penalties')
                    openModal({
                        name: 'HzFinesModal',
                        params: { itemId: citation.id },
                    });
            }}
            style={{ justifyContent: 'flex-start' }}
        >
            <CitationTitle>
                {`[${citationIndex}] `}
                {citation?.title}
            </CitationTitle>
        </CitationButton>
    );
};



// Main Component - Using project atoms and simplified styling
const EsgCard: React.FC<CardProps> = ({ data }) => {
    let content = data?.[0] || {
        citation: [],
        content: 'No content available.',
        dateAdded: { $date: new Date().toISOString() },
        endDate: '',
        reportType: 'unknown',
        startDate: '',
        _id: '',
        jurisdiction: null
    };

    return (
        <RoundedBox style={{ padding: '0', background: 'transparent', border: 'none' }}>
            <ContentArea>
                {content?.summary && (
                    <SummaryWrapper>
                        <MarkdownContent>
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {content?.summary}
                            </Markdown>
                        </MarkdownContent>
                    </SummaryWrapper>
                )}

                <MarkdownContent>
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {content.content}
                    </Markdown>
                </MarkdownContent>

                {content?.citation && content.citation.length > 0 && (
                    <div>
                        <CitationsHeader>
                            Citations
                        </CitationsHeader>
                        <CitationsWrapper>
                            {content.citation.map((citation, index) => (
                                <Citation
                                    key={index}
                                    citationIndex={index + 1}
                                    citation={citation}
                                />
                            ))}
                        </CitationsWrapper>
                    </div>
                )}
            </ContentArea>
        </RoundedBox>
    );
};


export default EsgCard;
