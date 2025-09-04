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
import PillButton from "@components/atoms/PillButton";
import StatusBox from "@components/atoms/StatusBox";
import TuneIcon from '@mui/icons-material/Tune';
import EsgCard from "./EsgCard";
import EsgFilters, { ESG_DEFAULT_ARGS, ESG_DEFAULT_ARGS_STRINGIFIED } from "@components/organisms/ESG/EsgFilters";
import { useFetchEsg } from "@utils/hooks/esg/useEsg";
import LoadingMessage from "@components/atoms/LoadingMessage";

// Minimal styled components - only what's absolutely necessary
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.pageBg};
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

// Beautiful toggle container matching project design
const ToggleContainer = styled.div`
  display: flex;
  background-color: ${(props) => props.theme.cardBgSecondary};
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.borderColor};
  padding: 0.25rem;
  box-shadow: ${(props) => props.theme.buttonShadow};
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ active, theme }) =>
        active ? theme.primaryColor : 'transparent'};
  color: ${({ active, theme }) =>
        active ? 'white' : theme.textColor};
  box-shadow: ${({ active, theme }) =>
        active ? theme.buttonShadow : 'none'};

  &:hover {
    background-color: ${({ active, theme }) =>
        active ? theme.primaryColor : theme.hoverColor};
  }

  &:first-child {
    margin-right: 0.25rem;
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

// HealthScore Component - Using atoms
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

// Helper function for priority badge
const getPriorityVariant = (priority: string): 'red' | 'amber' | 'blue' => {
    if (priority === 'high') return 'red';
    if (priority === 'medium') return 'amber';
    return 'blue';
};

// Detailed Reports View - Using atoms only
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
            <VerticalFlexbox style={{
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: theme.labelColorLight,
                padding: '3rem'
            }}>
                <div style={{ fontSize: '5rem', marginBottom: '2rem', opacity: 0.3, color: theme.primaryColor }}>📄</div>
                <TextLabel style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: theme.textColor }}>
                    No Reports Available
                </TextLabel>
                <SecondaryLabel style={{ fontSize: '1.1rem', opacity: 0.7, maxWidth: '500px', lineHeight: 1.6, color: theme.labelColorLight }}>
                    No regulatory reports found for the current period. Please check your filters or try again later.
                </SecondaryLabel>
            </VerticalFlexbox>
        );
    }

    return (
        <HorizontalFlexbox style={{ width: '100%', gap: '2rem' }}>
            <div style={{ width: '350px', flexShrink: 0 }}>
                <TextLabel style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.textColor, marginBottom: '1.5rem' }}>
                    Available Reports
                </TextLabel>
                {availableReports.map((report: GazetteReport) => {
                    const contentPreview = report.content
                        ? report.content.replace(/[#*`-]/g, '').substring(0, 80) + '...'
                        : 'No content available';

                    return (
                        <RoundedBox
                            key={report.id}
                            style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                cursor: 'pointer',
                                border: selectedReport?.id === report.id ? `2px solid ${theme.primaryColor}` : `1px solid ${theme.borderColor}`,
                                backgroundColor: selectedReport?.id === report.id ? theme.hoverColor : theme.cardBg,
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setSelectedReport(report)}
                        >
                            <HorizontalFlexbox style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <TextLabel style={{ fontSize: '0.9rem', fontWeight: '700', color: theme.textColor, margin: '0 0 0.5rem 0', lineHeight: '1.3' }}>
                                    {getReportTitle(report.reportType)}
                                </TextLabel>
                                <StatusBox variant={getPriorityVariant(getPriority(report.reportType))}>
                                    {getReportType(report.reportType)}
                                </StatusBox>
                            </HorizontalFlexbox>

                            <SecondaryLabel style={{ fontSize: '0.75rem', color: theme.labelColor, marginBottom: '0.5rem' }}>
                                {new Date(report.dateAdded).toLocaleDateString()}
                                {report?.jurisdiction && ` • ${report?.jurisdiction}`}
                            </SecondaryLabel>

                            <div style={{
                                fontSize: '0.8rem',
                                color: theme.labelColorLight,
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {contentPreview}
                            </div>
                        </RoundedBox>
                    );
                })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
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
                                <StatusBox variant={getPriorityVariant(getPriority(selectedReport.reportType))}>
                                    {getReportType(selectedReport.reportType)}
                                </StatusBox>
                            </HorizontalFlexbox>
                        </div>

                        <EsgCard
                            key={selectedReport.id}
                            data={[selectedReport]}
                            dataFullWidth={true}
                        />
                    </RoundedBox>
                ) : (
                    <VerticalFlexbox style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        color: theme.labelColorLight,
                        padding: '3rem'
                    }}>
                        <div style={{ fontSize: '5rem', marginBottom: '2rem', opacity: 0.3, color: theme.primaryColor }}>📄</div>
                        <TextLabel style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: theme.textColor }}>
                            Select a Report
                        </TextLabel>
                        <SecondaryLabel style={{ fontSize: '1.1rem', opacity: 0.7, maxWidth: '500px', lineHeight: 1.6, color: theme.labelColorLight }}>
                            Choose a report from the sidebar to view its details.
                        </SecondaryLabel>
                    </VerticalFlexbox>
                )}
            </div>
        </HorizontalFlexbox>
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
            <VerticalFlexbox style={{
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: theme.labelColorLight,
                padding: '3rem'
            }}>
                <div style={{ fontSize: '5rem', marginBottom: '2rem', opacity: 0.3, color: theme.primaryColor }}>📊</div>
                <TextLabel style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: theme.textColor }}>
                    No Overall Report Available
                </TextLabel>
                <SecondaryLabel style={{ fontSize: '1.1rem', opacity: 0.7, maxWidth: '500px', lineHeight: 1.6, color: theme.labelColorLight }}>
                    No overall ESG report found. Please generate a report or try again later.
                </SecondaryLabel>
            </VerticalFlexbox>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
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
        </div>
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
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <StickyTopBar>
                    <HorizontalFlexbox style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <HorizontalFlexbox style={{ alignItems: 'center', gap: '1.5rem' }}>
                            <TextLabel style={{ fontSize: '1.5rem', fontWeight: '800', color: theme.textColor }}>
                                ESG Agent Dashboard
                            </TextLabel>
                            <TextLabel style={{ fontSize: '0.9rem', color: theme.labelColor, fontWeight: '600' }}>
                                {currentDate}
                            </TextLabel>
                        </HorizontalFlexbox>
                        <HorizontalFlexbox style={{ alignItems: 'center', gap: '1rem' }}>
                            <ToggleContainer>
                                <ToggleButton
                                    active={viewMode === 'overall'}
                                    onClick={() => setViewMode('overall')}
                                >
                                    Overall Report
                                </ToggleButton>
                                <ToggleButton
                                    active={viewMode === 'detailed'}
                                    onClick={() => setViewMode('detailed')}
                                >
                                    Detailed Reports
                                </ToggleButton>
                            </ToggleContainer>
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
                        </HorizontalFlexbox>
                    </HorizontalFlexbox>
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
                    <div style={{ padding: '1.5rem', minWidth: '300px', backgroundColor: theme.cardBg }}>
                        <EsgFilters args={argsToPropagate} onChange={handleArgs} handleGenereateReport={handleGenereateReport} />
                    </div>
                </Popover>

                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: viewMode === 'overall' ? 'column' : 'row',
                    padding: viewMode === 'overall' ? '2rem' : '1.5rem',
                    maxWidth: viewMode === 'overall' ? '1200px' : '100%',
                    margin: viewMode === 'overall' ? '0 auto' : '0',
                    width: '100%',
                    overflow: 'auto'
                }}>
                    {fetchEsgMutation.isLoading ? (
                        <VerticalFlexbox style={{ alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                            <SecondaryLabel style={{ color: theme.primaryColor, fontSize: '1.1rem' }}>Fetching ESG data...</SecondaryLabel>
                        </VerticalFlexbox>
                    ) : fetchEsgMutation.isError ? (
                        <VerticalFlexbox style={{ alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                            <SecondaryLabel>Error fetching ESG data</SecondaryLabel>
                        </VerticalFlexbox>
                    ) : fetchEsgMutation.data ? (
                        viewMode === 'overall' ? (
                            <OverallReportView reports={fetchEsgMutation.data.data} />
                        ) : (
                            <DetailedReportsView reports={fetchEsgMutation.data.data} />
                        )
                    ) : (
                        <VerticalFlexbox style={{ alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                            <SecondaryLabel>No ESG data available</SecondaryLabel>
                        </VerticalFlexbox>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default EsgAgent;
