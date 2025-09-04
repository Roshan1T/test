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
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: ${(props) => props.theme.cardBg};
  border-radius: 50px;
  border: 2px solid ${(props) => props.theme.borderColor};
  box-shadow: ${(props) => props.theme.moduleShadow};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${(props) => props.theme.primaryColor};
    box-shadow: 0 4px 15px rgba(31, 117, 255, 0.15);
  }
`;

const ViewToggleLabel = styled(SecondaryLabel) <{ $active?: boolean }>`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${(props) => props.$active ? props.theme.primaryColor : props.theme.labelColor};
  transition: color 0.3s ease;
  white-space: nowrap;
  user-select: none;
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 60px;
  height: 32px;
  background: ${(props) => props.theme.borderColor};
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &.active {
    background: ${(props) => props.theme.primaryColor};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 28px;
    height: 28px;
    background: ${(props) => props.theme.cardBg};
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &.active::after {
    transform: translateX(28px);
  }
`;

const ContentArea = styled.div`
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 2rem;
  background-color: ${(props) => props.theme.backgroundPrimary};
  display: flex;
  gap: 2rem;
`;

const DetailedViewContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 2rem;
`;

const Sidebar = styled.div`
  width: 350px;
  flex-shrink: 0;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const OverallReportContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const DetailedReportsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const SidebarCard = styled(RoundedBox)`
  background: ${(props) => props.theme.cardBg};
  border: 1px solid ${(props) => props.theme.borderColor};
  margin-bottom: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${(props) => props.theme.primaryColor};
    box-shadow: 0 4px 12px rgba(31, 117, 255, 0.1);
  }
  
  &.active {
    border-color: ${(props) => props.theme.primaryColor};
    background: ${(props) => props.theme.hoverColor};
  }
`;

const SidebarTitle = styled(TextLabel)`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
`;

const SidebarMeta = styled(SecondaryLabel)`
  font-size: 0.75rem;
  color: ${(props) => props.theme.labelColor};
  margin-bottom: 0.5rem;
`;

const SidebarPreview = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.labelColorLight};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

// Updated components using project atoms - Restored sidebar layout
const DetailedReportsView: React.FC<{
    reports: GazetteReport[];
}> = ({ reports }) => {
    const theme = useTheme();
    const [selectedReport, setSelectedReport] = useState<GazetteReport | null>(null);

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

    // Set first report as selected by default
    React.useEffect(() => {
        if (availableReports.length > 0 && !selectedReport) {
            setSelectedReport(availableReports[0]);
        }
    }, [availableReports, selectedReport]);

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
        <DetailedViewContainer>
            <Sidebar>
                <TextLabel style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.textColor, marginBottom: '1.5rem' }}>
                    Available Reports
                </TextLabel>
                {availableReports.map((report: GazetteReport) => {
                    const contentPreview = report.content
                        ? report.content.replace(/[#*`-]/g, '').substring(0, 80) + '...'
                        : 'No content available';

                    return (
                        <SidebarCard
                            key={report.id}
                            className={selectedReport?.id === report.id ? 'active' : ''}
                            onClick={() => setSelectedReport(report)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <SidebarTitle>
                                    {getReportTitle(report.reportType)}
                                </SidebarTitle>
                                <PriorityBadge $priority={getPriority(report.reportType)} style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}>
                                    {getReportType(report.reportType)}
                                </PriorityBadge>
                            </div>

                            <SidebarMeta>
                                {new Date(report.dateAdded).toLocaleDateString()}
                                {report?.jurisdiction && ` • ${report?.jurisdiction}`}
                            </SidebarMeta>

                            <SidebarPreview>
                                {contentPreview}
                            </SidebarPreview>
                        </SidebarCard>
                    );
                })}
            </Sidebar>

            <MainContent>
                {selectedReport ? (
                    <RoundedBox style={{ padding: '2rem', height: 'fit-content' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <TextLabel style={{ fontSize: '2rem', fontWeight: '700', color: theme.textColor, margin: '0 0 1rem 0' }}>
                                {getReportTitle(selectedReport.reportType)}
                            </TextLabel>
                            <HorizontalFlexbox style={{ gap: '2rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                <HorizontalFlexbox style={{ alignItems: 'center', gap: '0.5rem' }}>
                                    <SecondaryLabel style={{ fontSize: '0.75rem', fontWeight: '600', color: theme.labelColor, textTransform: 'uppercase' }}>
                                        Generated
                                    </SecondaryLabel>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: theme.textColor, padding: '0.375rem 1rem', backgroundColor: theme.cardBgSecondary, borderRadius: theme.borderRadius, border: `1px solid ${theme.borderColor}` }}>
                                        {new Date(selectedReport.dateAdded).toLocaleDateString()}
                                    </span>
                                </HorizontalFlexbox>
                                {selectedReport?.jurisdiction && (
                                    <HorizontalFlexbox style={{ alignItems: 'center', gap: '0.5rem' }}>
                                        <SecondaryLabel style={{ fontSize: '0.75rem', fontWeight: '600', color: theme.labelColor, textTransform: 'uppercase' }}>
                                            Jurisdiction
                                        </SecondaryLabel>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: theme.textColor, padding: '0.375rem 1rem', backgroundColor: theme.cardBgSecondary, borderRadius: theme.borderRadius, border: `1px solid ${theme.borderColor}` }}>
                                            {selectedReport.jurisdiction.join(", ")}
                                        </span>
                                    </HorizontalFlexbox>
                                )}
                                <PriorityBadge $priority={getPriority(selectedReport.reportType)}>
                                    {getReportType(selectedReport.reportType)}
                                </PriorityBadge>
                            </HorizontalFlexbox>
                        </div>

                        <EsgCard
                            key={selectedReport.id}
                            data={[selectedReport]}
                            dataFullWidth={true}
                        />
                    </RoundedBox>
                ) : (
                    <PlaceholderContent>
                        <PlaceholderIcon>📄</PlaceholderIcon>
                        <PlaceholderText>Select a Report</PlaceholderText>
                        <PlaceholderSubtext>Choose a report from the sidebar to view its details.</PlaceholderSubtext>
                    </PlaceholderContent>
                )}
            </MainContent>
        </DetailedViewContainer>
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
                                <ViewToggleLabel $active={viewMode === 'overall'}>Overall Report</ViewToggleLabel>
                                <ToggleSwitch
                                    className={viewMode === 'detailed' ? 'active' : ''}
                                    onClick={() => handleViewToggle(viewMode === 'overall')}
                                />
                                <ViewToggleLabel $active={viewMode === 'detailed'}>Detailed Reports</ViewToggleLabel>
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

                <ContentArea style={{ flexDirection: viewMode === 'overall' ? 'column' : 'row', padding: viewMode === 'overall' ? '2rem' : '1.5rem' }}>
                    {fetchEsgMutation.isLoading ? (
                        <CenteredDiv style={{ width: '100%' }}>
                            <LoadingMessage>Fetching ESG data...</LoadingMessage>
                        </CenteredDiv>
                    ) : fetchEsgMutation.isError ? (
                        <CenteredDiv style={{ width: '100%' }}>
                            <SecondaryLabel>Error fetching ESG data</SecondaryLabel>
                        </CenteredDiv>
                    ) : fetchEsgMutation.data ? (
                        viewMode === 'overall' ? (
                            <OverallReportView reports={fetchEsgMutation.data.data} />
                        ) : (
                            <DetailedReportsView reports={fetchEsgMutation.data.data} />
                        )
                    ) : (
                        <CenteredDiv style={{ width: '100%' }}>
                            <SecondaryLabel>No ESG data available</SecondaryLabel>
                        </CenteredDiv>
                    )}
                </ContentArea>
            </Container>
        </PageContainer>
    );
};

export default EsgAgent;
