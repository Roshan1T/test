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
  /* grid-template-columns: repeat(3, 1fr); */
  gap: 0.5rem;
  flex-wrap: wrap;
`;


const CardContainer = styled(RoundedBox) <{
  $borderColor: string;
  $expanded: boolean;
  $isWeeklySummary: boolean;
}>`
  border-top: ${(props) => props.$expanded ? 'none' : `3px solid ${props.$borderColor}`};
  padding: ${(props) => (props.$expanded ? "0" : "1.25rem")};
  cursor: ${(props) => props.$expanded ? 'default' : 'pointer'};
  transition: all 0.3s ease;
  min-height: ${(props) => props.$expanded ? 'auto' : '120px'};
  background: ${(props) => props.$expanded ? 'transparent' : 'inherit'};
  box-shadow: ${(props) => props.$expanded ? 'none' : 'inherit'};

  ${(props) =>
    !props.$expanded &&
    `
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const CardHeader = styled(HorizontalFlexbox)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitleSection = styled(HorizontalFlexbox)`
  align-items: center;
  gap: 0.5rem;
`;

const IconBox = styled.div<{ $color?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${(props) => (props.$color ? `${props.$color}20` : "#f3f4f6")};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$color || "#6b7280"};
`;

const CardTitle = styled(TextLabel)`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const ExpandBtn = styled.button`
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
`;

const ContentArea = styled.div`
padding: 0 0;
  font-size: 0.9rem;
  line-height: 1.6;
`;




const StyledH1 = styled.h1`
  font-size: 1.5rem;
  border-bottom: 2px solid #ccc;
  padding-bottom: 0.4rem;
  margin-bottom: 1rem;
`;

const StyledH2 = styled.h2`
  font-size: 1.4rem;
  color: #003366;
  margin-top: 2rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.3rem;
`;

const StyledH3 = styled.h3`
  font-size: 1.3rem;
  margin-top: 1.5rem;
  color: #004b6e;
`;

const StyledH4 = styled.h4`
  font-size: 1.1rem;
  margin-top: 1.2rem;
  color: #555;
`;

const StyledH5 = styled.h5`
  font-size: 1rem;
  margin-top: 1rem;
  color: #666;
`;

const StyledH6 = styled.h6`
  font-size: 0.95rem;
  margin-top: 1rem;
  color: #777;
`;

const StyledP = styled.p`
  line-height: 1.7;
  margin: 1rem 0;
`;

const StyledStrong = styled.strong`
  font-weight: bold;
`;

const StyledEm = styled.em`
  font-style: italic;
`;

const StyledDel = styled.del`
  text-decoration: line-through;
`;


const StyledBlockquote = styled.blockquote`
  margin: 1.5rem 0;
  padding-left: 1rem;
  border-left: 4px solid #ccc;
  color: #555;
  font-style: italic;
`;

const StyledHr = styled.hr`
  border: none;
  border-top: 1px solid #ddd;
  margin: 2rem 0;
`;

const StyledUl = styled.ul`
  margin: 1rem 0 1rem 1.5rem;
  list-style-type: disc;
`;

const StyledOl = styled.ol`
  margin: 1rem 0 1rem 1.5rem;
  list-style-type: decimal;
`;

const StyledLi = styled.li`
  margin: 0.5rem 0;
`;


const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
`;

const StyledTh = styled.th`
  border: 1px solid #ccc;
  background-color: #f2f2f2;
  padding: 0.75rem;
  text-align: left;
`;

const StyledTd = styled.td`
  border: 1px solid #ccc;
  padding: 0.75rem;
  text-align: left;
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
  background-color: transparent;
  border: none;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 5rem;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${(props) => props.theme.hoverColor};
  }
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
            <SecondaryLabel style={{ fontWeight: 500, color: theme.primaryColor }} className="ml-1 mt-4">
              Citations
            </SecondaryLabel>
            <CitationsWrapper className="py-2">
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
`;
const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
  height: calc(100vh - 120px);
  overflow: hidden;
`;

const ReportSidebar = styled.div`
  background-color: ${(props: any) => props.theme.cardBg};
  border-right: 1px solid ${(props: any) => props.theme.borderColor};
  overflow-y: auto;
  padding: 1rem 0;
`;

const ReportListItem = styled.div<{ $isActive: boolean }>`
  padding: 0.75rem 1rem;
  margin: 0.25rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${(props: any) => props.$isActive ? props.theme.primaryColor + '15' : 'transparent'};
  border-left: ${(props: any) => props.$isActive ? `3px solid ${props.theme.primaryColor}` : '3px solid transparent'};

  &:hover {
    background-color: ${(props: any) => props.theme.hoverColor};
  }
`;

const ReportItemTitle = styled.div<{ $isActive: boolean }>`
  font-size: 0.9rem;
  font-weight: ${(props: any) => props.$isActive ? '600' : '500'};
  color: ${(props: any) => props.$isActive ? props.theme.primaryColor : props.theme.textColor};
  margin-bottom: 0.25rem;
`;

const ReportItemMeta = styled.div`
  font-size: 0.75rem;
  color: ${(props: any) => props.theme.secondaryTextColor};
  opacity: 0.8;
`;

const MainContent = styled.div`
  overflow-y: auto;
  padding: 1.5rem;
  background-color: ${(props: any) => props.theme.backgroundColor};
`;

const ReportHeader = styled.div`
  margin-bottom: 2rem;
`;

const ReportTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props: any) => props.theme.primaryColor};
  margin-bottom: 0.5rem;
`;

const ReportMeta = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MetaLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(props: any) => props.theme.secondaryTextColor};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetaValue = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props: any) => props.theme.textColor};
`;

const ReportContent = styled.div`
  background-color: ${(props: any) => props.theme.cardBg};
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StickyTopBar = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: ${(props: any) => props.theme.cardBg};
  z-index: 10;
  border-bottom: 1px solid ${(props: any) => props.theme.borderColor};
  backdrop-filter: blur(8px);
`;

const PopoverContainer = styled.div`
  padding: 1rem;
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
  color: ${(props: any) => props.theme.secondaryTextColor};
`;

const PlaceholderIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const PlaceholderText = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const PlaceholderSubtext = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
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
            <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
                <TextLabel style={{ fontSize: '1rem', fontWeight: '600' }}>Reports</TextLabel>
            </div>
            {reportTypes.map((reportType: string) => {
                const reportData = reports.find((r: GazetteReport) => r.reportType === reportType);
                const cardInfo = cardData.find((c: any) => c.id === reportType);
                const isActive = selectedReportId === reportType;
                
                return (
                    <ReportListItem
                        key={reportType}
                        $isActive={isActive}
                        onClick={() => onReportSelect(reportType)}
                    >
                        <ReportItemTitle $isActive={isActive}>
                            {cardInfo?.title || reportType}
                        </ReportItemTitle>
                        <ReportItemMeta>
                            {reportData ? `${reportData.startDate} - ${reportData.endDate}` : 'No data available'}
                        </ReportItemMeta>
                    </ReportListItem>
                );
            })}
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
                <PlaceholderText>Select a Report</PlaceholderText>
                <PlaceholderSubtext>Choose a report from the sidebar to view its details</PlaceholderSubtext>
            </PlaceholderContent>
        );
    }

    const cardInfo = cardData.find((c: any) => c.id === reportType);
    
    if (!reportData) {
        return (
            <PlaceholderContent>
                <PlaceholderIcon>📄</PlaceholderIcon>
                <PlaceholderText>No Data Available</PlaceholderText>
                <PlaceholderSubtext>This report has no data for the selected period</PlaceholderSubtext>
            </PlaceholderContent>
        );
    }

    return (
        <div>
            <ReportHeader>
                <ReportTitle>{cardInfo?.title || reportType}</ReportTitle>
                <ReportMeta>
                    <MetaItem>
                        <MetaLabel>Report Type</MetaLabel>
                        <MetaValue>{reportData.reportType}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                        <MetaLabel>Date Range</MetaLabel>
                        <MetaValue>{reportData.startDate} - {reportData.endDate}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                        <MetaLabel>Generated</MetaLabel>
                        <MetaValue>{new Date(reportData.dateAdded.$date).toLocaleDateString()}</MetaValue>
                    </MetaItem>
                    {reportData.citation && (
                        <MetaItem>
                            <MetaLabel>Citations</MetaLabel>
                            <MetaValue>{reportData.citation.length} sources</MetaValue>
                        </MetaItem>
                    )}
                </ReportMeta>
            </ReportHeader>
            
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
        </div>
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
                    <HorizontalFlexbox className="align-center pl-4 gap-2">
                        <TextLabel size="large" style={{ color: theme.primaryColor }}>
                            DPO Agent Dashboard
                        </TextLabel>
                        <TextLabel>{currentDate}</TextLabel>
                    </HorizontalFlexbox>
                    <HorizontalFlexbox className="px-4 mt-2 gap-2 align-center">
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
                    </HorizontalFlexbox>
                </StickyTopBar>
                
                <Popover
                    style={{ zIndex: 2 }}
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







