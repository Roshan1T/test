import { SecondaryLabel, TextLabel } from "@components/atoms/Fields";
import HorizontalFlexbox from "@components/atoms/HorizontalFlexbox";
import RoundedBox from "@components/atoms/RoundedBox";
import { ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled, { useTheme } from "styled-components";
import { openModal } from "react-url-modal";

// styling 
const CitationsWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;

const CardContainer = styled.div<{
  $borderColor: string;
  $expanded: boolean;
  $isWeeklySummary: boolean;
}>`
  border-top: ${(props: any) => props.$expanded ? 'none' : `3px solid ${props.$borderColor}`};
  padding: ${(props: any) => (props.$expanded ? "0" : "1.25rem")};
  cursor: ${(props: any) => props.$expanded ? 'default' : 'pointer'};
  transition: all 0.3s ease;
  min-height: ${(props: any) => props.$expanded ? 'auto' : '120px'};
  background: ${(props: any) => props.$expanded ? 'transparent' : '#ffffff'};
  box-shadow: ${(props: any) => props.$expanded ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)'};
  border-radius: ${(props: any) => props.$expanded ? '0' : '8px'};
  border: ${(props: any) => props.$expanded ? 'none' : '1px solid #e2e8f0'};

  ${(props: any) =>
    !props.$expanded &&
    `
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #3b82f6;
    }
  `}
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconBox = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props: any) => (props.$color ? `${props.$color}15` : "#f1f5f9")};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props: any) => props.$color || "#64748b"};
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
`;

const ExpandBtn = styled.button`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
`;

const ContentArea = styled.div`
  font-size: 0.9rem;
  line-height: 1.7;
  color: #374151;
`;

const StyledH1 = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.75rem;
  margin: 0 0 1.5rem 0;
`;

const StyledH2 = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 2rem 0 1rem 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
`;

const StyledH3 = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 1.5rem 0 1rem 0;
`;

const StyledH4 = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 1.25rem 0 0.75rem 0;
`;

const StyledH5 = styled.h5`
  font-size: 1rem;
  font-weight: 600;
  color: #4b5563;
  margin: 1rem 0 0.75rem 0;
`;

const StyledH6 = styled.h6`
  font-size: 0.95rem;
  font-weight: 600;
  color: #4b5563;
  margin: 1rem 0 0.75rem 0;
`;

const StyledP = styled.p`
  line-height: 1.7;
  margin: 1rem 0;
  color: #374151;
`;

const StyledStrong = styled.strong`
  font-weight: 600;
  color: #1e293b;
`;

const StyledEm = styled.em`
  font-style: italic;
`;

const StyledDel = styled.del`
  text-decoration: line-through;
  opacity: 0.7;
`;

const StyledBlockquote = styled.blockquote`
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  border-left: 4px solid #3b82f6;
  background-color: #f8fafc;
  color: #4b5563;
  font-style: italic;
  border-radius: 0 6px 6px 0;
`;

const StyledHr = styled.hr`
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 2rem 0;
`;

const StyledUl = styled.ul`
  margin: 1rem 0;
  padding-left: 1.5rem;
  list-style-type: disc;
`;

const StyledOl = styled.ol`
  margin: 1rem 0;
  padding-left: 1.5rem;
  list-style-type: decimal;
`;

const StyledLi = styled.li`
  margin: 0.5rem 0;
  line-height: 1.6;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StyledTh = styled.th`
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
`;

const StyledTd = styled.td`
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  text-align: left;
  color: #4b5563;
`;

const CitationTitle = styled.span`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.8rem;
  text-align: left;
`;

const CitationButton = styled.button`
  max-width: 350px;
  min-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-content: flex-start;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: #374151;

  &:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const CitationsHeader = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 2rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;


//interface
type Citation = {
  collection: string;
  id: string;
  title: string
};

interface GazetteReport {
  _id: string;
  dateAdded: {
    $date: string;
  };
  content: string;
  reportType: string;
  startDate: string;
  endDate: string;
  jurisdiction: string | null;
  citation?: Citation[];
}


interface CardProps {
  card: CardData;
  data: GazetteReport[];
  expanded: boolean;
  onToggle: () => void;
  dataFullWidth?: boolean;
}
interface CardData {
  id: string;
  title: string;
  content?: string;
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
  isWeeklySummary?: boolean;
}


//utils
const truncateContent = (content: string, maxChars: number = 300) => {
  if (content.length <= maxChars) {
    return content;
  }
  return content.slice(0, maxChars) + "...";
};


//Other components

const Citation = ({ citationIndex, citation }) => {
  return (
    <CitationButton
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

// Main Component
const DpoCard: React.FC<CardProps> = ({ card, data, expanded, onToggle, dataFullWidth }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onToggle && !expanded) { // Only allow toggle if not already expanded in detail view
      onToggle();
    }
  };
  
  let content = (
    data?.find((item) => item.reportType === card.id) ||
    {
      citation: [],
      content: 'This is the placeholder for the title specified.',
      date_added: '',
      end_date: '',
      report_type: card.id,
      start_date: ''
    }
  );
  
  const displayedContent = expanded ? content.content : truncateContent(content.content, 120);
  const theme = useTheme();

  return (
    <CardContainer
      $borderColor={card.borderColor}
      $expanded={expanded}
      $isWeeklySummary={!!card.isWeeklySummary}
      data-full-width={dataFullWidth ? "true" : "false"}
    >
      {!expanded && ( // Only show header with toggle when not in detail view
        <div onClick={handleClick}>
          <CardHeader>
            <CardTitleSection>
              <IconBox $color={card.iconColor}>{card.icon}</IconBox>
              <CardTitle>{card.title}</CardTitle>
            </CardTitleSection>
            <ExpandBtn>
              <ChevronDown size={14} />
            </ExpandBtn>
          </CardHeader>
        </div>
      )}
      
      <ContentArea>
        <div onClick={!expanded ? handleClick : undefined} style={{ cursor: !expanded ? 'pointer' : 'default' }}>
          <Markdown remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <StyledH1 {...props} />,
              h2: (props) => <StyledH2 {...props} />,
              h3: (props) => <StyledH3 {...props} />,
              h4: (props) => <StyledH4 {...props} />,
              h5: (props) => <StyledH5 {...props} />,
              h6: (props) => <StyledH6 {...props} />,

              p: (props) => <StyledP {...props} />,
              strong: (props) => <StyledStrong {...props} />,
              em: (props) => <StyledEm {...props} />,
              del: (props) => <StyledDel {...props} />,

              ul: (props) => <StyledUl {...props} />,
              ol: (props) => <StyledOl {...props} />,
              li: (props) => <StyledLi {...props} />,

              blockquote: (props) => <StyledBlockquote {...props} />,

              hr: () => <StyledHr />,

              table: (props) => <StyledTable {...props} />,
              th: (props) => <StyledTh {...props} />,
              td: (props) => <StyledTd {...props} />,
            }}
          >{displayedContent}</Markdown>
        </div>
        
        {expanded && content?.citation && Object.keys(content?.citation || {}).length > 0 && (
          <div>
            <CitationsHeader>
              Sources & Citations
            </CitationsHeader>
            <CitationsWrapper>
              {Object.entries(content?.citation || {}).map(
                ([index, citation]) => (
                  <Citation
                    key={index}
                    citationIndex={index}
                    citation={citation}
                  />
                ),
              )}
            </CitationsWrapper>
          </div>
        )}
      </ContentArea>
    </CardContainer>
  );
};


export default DpoCard;
























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
import { useMutation } from '@tanstack/react-query';
import TuneIcon from '@mui/icons-material/Tune';
import DpoCard from "@components/organisms/DPO/DpoCard";
import cardData from "@components/organisms/DPO/data";
import DpoFilters, { DPO_DEFAULT_ARGS, DPO_DEFAULT_ARGS_STRINGIFIED } from "@components/organisms/DPO/DpoFilters";
import datas from "@constants/mockDpo";


//styles

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  height: calc(100vh - 80px);
  overflow: hidden;
`;

const ReportSidebar = styled.div`
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
`;

const SidebarTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const SidebarSubtitle = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const ReportsContainer = styled.div`
  flex: 1;
  padding: 1rem;
`;

const ReportListItem = styled.div<{ $isActive: boolean }>`
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${(props: any) => props.$isActive ? '#3b82f6' : '#e2e8f0'};
  background-color: ${(props: any) => props.$isActive ? '#eff6ff' : '#ffffff'};
  box-shadow: ${(props: any) => props.$isActive ? '0 2px 8px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'};

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
`;

const ReportItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ReportItemTitle = styled.div<{ $isActive: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props: any) => props.$isActive ? '#1e40af' : '#1e293b'};
`;

const ReportStatusBadge = styled.span<{ $status: 'available' | 'no-data' }>`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${(props: any) => props.$status === 'available' ? '#dcfce7' : '#fee2e2'};
  color: ${(props: any) => props.$status === 'available' ? '#16a34a' : '#dc2626'};
`;

const ReportItemMeta = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.5rem;
`;

const ReportItemStats = styled.div`
  display: flex;
  gap: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const StatLabel = styled.span`
  font-size: 0.625rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
`;

const StatValue = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
`;

const MainContent = styled.div`
  overflow-y: auto;
  background-color: #ffffff;
`;

const ContentHeader = styled.div`
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 5;
`;

const ContentTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const ContentMeta = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetaLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetaValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  padding: 0.25rem 0.75rem;
  background-color: #f1f5f9;
  border-radius: 6px;
`;

const PriorityBadge = styled.span<{ $priority: 'high' | 'medium' | 'low' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: ${(props: any) => {
    switch (props.$priority) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      default: return '#f0f9ff';
    }
  }};
  color: ${(props: any) => {
    switch (props.$priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      default: return '#0369a1';
    }
  }};
`;

const ReportContent = styled.div`
  padding: 2rem;
`;

const StickyTopBar = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  padding: 1rem 2rem;
  background-color: #ffffff;
  z-index: 10;
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(8px);
`;

const TopBarContent = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
`;

const TopBarTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PopoverContainer = styled.div`
  padding: 1.5rem;
  min-width: 300px;
`;

const Container = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #64748b;
  padding: 2rem;
`;

const PlaceholderIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.4;
`;

const PlaceholderText = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
`;

const PlaceholderSubtext = styled.div`
  font-size: 1rem;
  opacity: 0.8;
  max-width: 400px;
`;



//interface 
type Citation = {
    collection: string;
    id: string;
    title: string
};

interface GazetteReport {
    _id: string;
    dateAdded: {
        $date: string;
    };
    content: string;
    reportType: string;
    startDate: string;
    endDate: string;
    jurisdiction: string | null;
    citation?: Citation[];
}

//other components

const ReportListSidebar: React.FC<{
    reports: GazetteReport[];
    selectedReportId: string | null;
    onReportSelect: (reportId: string) => void;
}> = ({ reports, selectedReportId, onReportSelect }) => {
    const reportTypes = cardData.map((card: any) => card.id);
    
    return (
        <ReportSidebar>
            <SidebarHeader>
                <SidebarTitle>Regulatory Intelligence Feed</SidebarTitle>
                <SidebarSubtitle>Latest updates from global regulatory sources</SidebarSubtitle>
            </SidebarHeader>
            
            <ReportsContainer>
                {reportTypes.map((reportType: string) => {
                    const reportData = reports.find((r: GazetteReport) => r.reportType === reportType);
                    const cardInfo = cardData.find((c: any) => c.id === reportType);
                    const isActive = selectedReportId === reportType;
                    const hasData = !!reportData;
                    
                    return (
                        <ReportListItem
                            key={reportType}
                            $isActive={isActive}
                            onClick={() => onReportSelect(reportType)}
                        >
                            <ReportItemHeader>
                                <ReportItemTitle $isActive={isActive}>
                                    {cardInfo?.title || reportType}
                                </ReportItemTitle>
                                <ReportStatusBadge $status={hasData ? 'available' : 'no-data'}>
                                    {hasData ? 'ACTIVE' : 'NO DATA'}
                                </ReportStatusBadge>
                            </ReportItemHeader>
                            
                            <ReportItemMeta>
                                {reportData ? `${reportData.startDate} - ${reportData.endDate}` : 'No data available for selected period'}
                            </ReportItemMeta>
                            
                            {hasData && (
                                <ReportItemStats>
                                    <StatItem>
                                        <StatLabel>Generated</StatLabel>
                                        <StatValue>{new Date(reportData.dateAdded.$date).toLocaleDateString()}</StatValue>
                                    </StatItem>
                                    {reportData.citation && (
                                        <StatItem>
                                            <StatLabel>Sources</StatLabel>
                                            <StatValue>{reportData.citation.length}</StatValue>
                                        </StatItem>
                                    )}
                                </ReportItemStats>
                            )}
                        </ReportListItem>
                    );
                })}
            </ReportsContainer>
        </ReportSidebar>
    );
};

const ReportDetailsView: React.FC<{
    reportData: GazetteReport | null;
    reportType: string | null;
}> = ({ reportData, reportType }) => {
    if (!reportType) {
        return (
            <PlaceholderContent>
                <PlaceholderIcon>📊</PlaceholderIcon>
                <PlaceholderText>Welcome to Regulatory Intelligence</PlaceholderText>
                <PlaceholderSubtext>Select a report from the sidebar to access detailed regulatory analysis and compliance insights</PlaceholderSubtext>
            </PlaceholderContent>
        );
    }

    const cardInfo = cardData.find((c: any) => c.id === reportType);
    
    if (!reportData) {
        return (
            <PlaceholderContent>
                <PlaceholderIcon>📄</PlaceholderIcon>
                <PlaceholderText>No Data Available</PlaceholderText>
                <PlaceholderSubtext>This report has no data for the selected period. Please check back later or adjust your filters.</PlaceholderSubtext>
            </PlaceholderContent>
        );
    }

    // Determine priority based on report type
    const getPriority = (type: string) => {
        if (type.includes('critical') || type.includes('fines')) return 'high';
        if (type.includes('bill') || type.includes('gazette')) return 'medium';
        return 'low';
    };

    return (
        <>
            <ContentHeader>
                <ContentTitle>{cardInfo?.title || reportType}</ContentTitle>
                <ContentMeta>
                    <MetaItem>
                        <MetaLabel>Report ID</MetaLabel>
                        <MetaValue>REG-2025-001</MetaValue>
                    </MetaItem>
                    <MetaItem>
                        <MetaLabel>Jurisdiction</MetaLabel>
                        <MetaValue>{reportData.jurisdiction || 'Global'}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                        <MetaLabel>Priority</MetaLabel>
                        <PriorityBadge $priority={getPriority(reportData.reportType)}>
                            {getPriority(reportData.reportType)} Priority
                        </PriorityBadge>
                    </MetaItem>
                    <MetaItem>
                        <MetaLabel>Status</MetaLabel>
                        <MetaValue>Active</MetaValue>
                    </MetaItem>
                    <MetaItem>
                        <MetaLabel>Last Updated</MetaLabel>
                        <MetaValue>{new Date(reportData.dateAdded.$date).toLocaleDateString()}</MetaValue>
                    </MetaItem>
                </ContentMeta>
            </ContentHeader>
            
            <ReportContent>
                <DpoCard
                    key={reportData._id}
                    data={[reportData]}
                    card={cardInfo!}
                    expanded={true}
                    onToggle={() => {}}
                    dataFullWidth={true}
                />
            </ReportContent>
        </>
    );
};





// const fetchDataWithPost = async (filter) => {
//     const response = await fetch('http://127.0.0.1:5000/documents', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(filter),
//     });

//     if (!response.ok) {
//         throw new Error('Error fetching data');
//     }

//     return response.json();
// };



//main component

const DpoAgent: React.FC = () => {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [argsToPropagate, setArgsToPropagate] = useState(DPO_DEFAULT_ARGS);
    const [currentDate, setCurrentDate] = useState('');
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        const date = new Date();
        setCurrentDate(date.toString().slice(0, 16));
        
        // Select first report by default
        if (!selectedReportId && cardData.length > 0) {
            setSelectedReportId(cardData[0].id);
        }
    }, [selectedReportId]);
    
    const [args, setArgs] = useLocalStorage(
        'dpoFilters',
        DPO_DEFAULT_ARGS,
    );

    const handleCloseFilter = () => {
        setAnchorEl(null);
    };

    const handleReportSelect = (reportId: string) => {
        setSelectedReportId(reportId);
    };

    const handleArgs = (value: any) => {
        console.log('Changing arg');
        setArgs({ ...args, ...value });
        setArgsToPropagate((prevArgs: any) => ({ ...prevArgs, ...value }));
    };

    const selectedReport = datas.find((report: GazetteReport) => report.reportType === selectedReportId);

    return (
        <PageContainer>
            <Container>
                <StickyTopBar>
                    <TopBarContent>
                        <TopBarTitle>
                            <TextLabel style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                                DPO Agent Dashboard
                            </TextLabel>
                            <TextLabel style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                {currentDate}
                            </TextLabel>
                        </TopBarTitle>
                        <TopBarActions>
                            <Badge
                                color="primary"
                                badgeContent=""
                                variant="dot"
                                invisible={JSON.stringify(args) == DPO_DEFAULT_ARGS_STRINGIFIED}
                            >
                                <BoxButton
                                    icon={<TuneIcon style={{ fontSize: '0.9rem' }} />}
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
                        <DpoFilters args={argsToPropagate} onChange={handleArgs} />
                    </PopoverContainer>
                </Popover>

                <DashboardGrid>
                    <ReportListSidebar
                        reports={datas}
                        selectedReportId={selectedReportId}
                        onReportSelect={handleReportSelect}
                    />
                    
                    <MainContent>
                        <ReportDetailsView
                            reportData={selectedReport || null}
                            reportType={selectedReportId}
                        />
                    </MainContent>
                </DashboardGrid>
            </Container>
        </PageContainer>
    );
};




export default DpoAgent;










