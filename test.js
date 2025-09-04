import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import Modal from '@components/atoms/Modal';
import BoxButton from '@components/atoms/BoxButton';
import TextInput, { TextArea } from '@components/atoms/TextInput';
import CustomSelect from '@components/atoms/CustomSelect';
import HorizontalFlexbox from '@components/atoms/HorizontalFlexbox';
import VerticalFlexbox from '@components/atoms/VerticalFlexbox';
import { TextLabel, SecondaryLabel } from '@components/atoms/Fields';
import AddIcon from '@mui/icons-material/Add';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks following exact HZGlobalFilters patterns
import { useJurisdictions } from '@utils/hooks/common/useJurisdictions';
import { useRegulatoryWatchRegulators } from '@utils/hooks/gc/HorizonScanning/useRegulatoryWatch';
import { useHZThemes } from '@utils/hooks/gc/HorizonScanning/useHZThemes';

// Styled Components - following PromptLibraryModal pattern
const Container = styled.div`
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  position: relative;
  height: 100%;

  * {
    font-family: 'Mona sans', sans-serif;
  }
`;

const Sidebar = styled.div`
  border-right: 1px solid ${(props) => props.theme.borderColor};
  padding-right: 1rem;
  background: ${(props) => props.theme.cardBg};
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  padding: 0 1rem;
  position: relative;
  overflow: hidden;
  overflow-y: auto;
`;

const FormContainer = styled.div`
  max-height: 80vh;
  overflow-y: auto;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid ${(props) => props.theme.borderColor};
  padding: 1rem 0;
  margin-top: 1rem;
`;

const FormSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 8px;
  background: ${(props) => props.theme.cardBgSecondary || props.theme.cardBg};
`;

const SidebarSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 8px;
  background: ${(props) => props.theme.cardBgSecondary || props.theme.cardBg};
`;

// Animation variants following PromptLibraryModal
const slideAnimation = {
    initial: {
        opacity: 0,
        x: 20,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        x: -20,
        scale: 0.95,
        transition: {
            duration: 0.2,
        },
    },
};

interface CreateAgentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (agentData: any) => void;
}

const CreateAgentForm: React.FC<CreateAgentFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const theme = useTheme();

    // Form state - following exact HZGlobalFilters patterns
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        jurisdiction: [], // Array of jurisdiction labels like HZGlobalFilters
        regulator: [], // Array of regulator values like HZGlobalFilters
        industryCategories: [], // Array like HZGlobalFilters industryCategories
        qualitativeThemes: [], // Array like HZGlobalFilters qualitativeThemes
        model: null,
        keywords: '',
        priority: null,
    });

    const [errors, setErrors] = useState({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Data loading hooks following exact HZGlobalFilters patterns
    const { data: jurisdictions = [] } = useJurisdictions();
    const { data: regulators = [] } = useRegulatoryWatchRegulators({
        jurisdiction: formData.jurisdiction, // Pass jurisdiction array directly like HZGlobalFilters
    });
    const { data: catThemes = [] } = useHZThemes(); // industryCategories
    const { data: qualitativeThemes = [] } = useHZThemes({
        optionType: 'qualitative_themes', // qualitativeThemes like HZGlobalFilters
    });

    // AI Model options (simplified based on existing patterns)
    const aiModelOptions = [
        { label: 'GPT-4', value: 'gpt-4' },
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
        { label: 'Claude-3', value: 'claude-3' },
        { label: 'Gemini Pro', value: 'gemini-pro' },
    ];

    // Priority options
    const priorityOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
    ];

    // Transform data exactly like HZGlobalFilters
    // Jurisdictions are used directly (already have label/value format)
    const jurisdictionOptions = jurisdictions || [];

    // Regulators are used directly (already have label/value format)  
    const regulatorOptions = regulators || [];

    // Industry categories (catThemes) are used directly
    const industryOptions = catThemes || [];

    // Qualitative themes are used directly
    const themeOptions = qualitativeThemes || [];

    // Reset regulator when jurisdiction changes (following HZGlobalFilters pattern)
    useEffect(() => {
        if (formData.jurisdiction && formData.jurisdiction.length > 0) {
            setFormData(prev => ({ ...prev, regulator: [] }));
        }
    }, [formData.jurisdiction]);

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Agent name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.jurisdiction || formData.jurisdiction.length === 0) {
            newErrors.jurisdiction = 'Jurisdiction is required';
        }

        if (!formData.model) {
            newErrors.model = 'AI Model is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit(formData);
            onClose();
            // Reset form
            setFormData({
                name: '',
                description: '',
                jurisdiction: [],
                regulator: [],
                industryCategories: [],
                qualitativeThemes: [],
                model: null,
                keywords: '',
                priority: null,
            });
            setErrors({});
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New AI Monitoring Agent">
            <Container>
                {/* Sidebar - Agent Summary & Quick Actions */}
                <Sidebar>
                    <SidebarSection>
                        <TextLabel size="medium" style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
                            Agent Overview
                        </TextLabel>
                        <VerticalFlexbox gap="0.5rem">
                            <HorizontalFlexbox className="space-between">
                                <SecondaryLabel size="small">Name:</SecondaryLabel>
                                <TextLabel size="small">{formData.name || 'Untitled Agent'}</TextLabel>
                            </HorizontalFlexbox>
                            <HorizontalFlexbox className="space-between">
                                <SecondaryLabel size="small">Jurisdictions:</SecondaryLabel>
                                <TextLabel size="small">{formData.jurisdiction.length || 0}</TextLabel>
                            </HorizontalFlexbox>
                            <HorizontalFlexbox className="space-between">
                                <SecondaryLabel size="small">Industries:</SecondaryLabel>
                                <TextLabel size="small">{formData.industryCategories.length || 0}</TextLabel>
                            </HorizontalFlexbox>
                            <HorizontalFlexbox className="space-between">
                                <SecondaryLabel size="small">Model:</SecondaryLabel>
                                <TextLabel size="small">{formData.model?.label || 'Not selected'}</TextLabel>
                            </HorizontalFlexbox>
                        </VerticalFlexbox>
                    </SidebarSection>

                    <SidebarSection>
                        <TextLabel size="medium" style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
                            Quick Actions
                        </TextLabel>
                        <VerticalFlexbox gap="0.5rem">
                            <BoxButton
                                variant={showAdvanced ? 'solid' : 'outline'}
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                icon={<AddIcon style={{ fontSize: '1rem' }} />}
                            >
                                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                            </BoxButton>
                        </VerticalFlexbox>
                    </SidebarSection>
                </Sidebar>

                {/* Main Content - Form */}
                <MainContent>
                    <FormContainer>
                        <VerticalFlexbox gap="1.5rem">
                            {/* Basic Information */}
                            <FormSection>
                                <TextLabel size="medium" style={{ marginBottom: '1rem', display: 'block', color: theme.primaryColor }}>
                                    Basic Information
                                </TextLabel>
                                <VerticalFlexbox gap="1rem">
                                    <TextInput
                                        title="Agent Name *"
                                        placeholder="Enter a descriptive name for your monitoring agent"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        error={errors.name}
                                    />

                                    <TextArea
                                        title="Description"
                                        placeholder="Describe what this agent will monitor and its purpose"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={3}
                                    />
                                </VerticalFlexbox>
                            </FormSection>

                            {/* Monitoring Scope */}
                            <FormSection>
                                <TextLabel size="medium" style={{ marginBottom: '1rem', display: 'block', color: theme.primaryColor }}>
                                    Monitoring Scope
                                </TextLabel>
                                <VerticalFlexbox gap="1rem">
                                    <HorizontalFlexbox gap="1rem">
                                        <div style={{ flex: 1 }}>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                Jurisdictions *
                                            </TextLabel>
                                            <CustomSelect
                                                options={jurisdictionOptions}
                                                isMulti
                                                placeholder="Select Jurisdictions"
                                                value={formData.jurisdiction?.map(
                                                    (j) => jurisdictionOptions?.find((opt) => opt.label === j),
                                                )}
                                                onChange={(e) => handleInputChange('jurisdiction', e.map((j) => j.label))}
                                                showBorder
                                            />
                                            {errors.jurisdiction && (
                                                <SecondaryLabel style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                    {errors.jurisdiction}
                                                </SecondaryLabel>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                Regulators
                                            </TextLabel>
                                            {formData.jurisdiction?.length > 0 ? (
                                                <CustomSelect
                                                    options={regulatorOptions}
                                                    isMulti
                                                    placeholder="Select Regulators"
                                                    value={formData.regulator?.map(
                                                        (r) => regulatorOptions?.find((opt) => opt.value === r),
                                                    )}
                                                    onChange={(e) => handleInputChange('regulator', e.map((r) => r.value))}
                                                    showBorder
                                                />
                                            ) : (
                                                <CustomSelect
                                                    value={[]}
                                                    onChange={() => { }}
                                                    options={[]}
                                                    placeholder="Select jurisdiction first"
                                                    isDisabled={true}
                                                    isMulti
                                                    showBorder
                                                />
                                            )}
                                        </div>
                                    </HorizontalFlexbox>

                                    <div>
                                        <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                            Industry Categories
                                        </TextLabel>
                                        <CustomSelect
                                            options={industryOptions}
                                            isMulti
                                            placeholder="Select Industry"
                                            value={formData.industryCategories?.map(
                                                (j) => industryOptions?.find((opt) => opt.value === j),
                                            )}
                                            onChange={(e) => handleInputChange('industryCategories', e.map((j) => j.value))}
                                            showBorder
                                        />
                                    </div>

                                    <div>
                                        <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                            Themes
                                        </TextLabel>
                                        <CustomSelect
                                            options={themeOptions}
                                            isMulti
                                            placeholder="Select Themes"
                                            value={formData.qualitativeThemes?.map(
                                                (j) => themeOptions?.find((opt) => opt.value === j),
                                            )}
                                            onChange={(e) => handleInputChange('qualitativeThemes', e.map((j) => j.value))}
                                            showBorder
                                        />
                                    </div>
                                </VerticalFlexbox>
                            </FormSection>

                            {/* AI Configuration */}
                            <FormSection>
                                <TextLabel size="medium" style={{ marginBottom: '1rem', display: 'block', color: theme.primaryColor }}>
                                    AI Configuration
                                </TextLabel>
                                <VerticalFlexbox gap="1rem">
                                    <HorizontalFlexbox gap="1rem">
                                        <div style={{ flex: 1 }}>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                AI Model *
                                            </TextLabel>
                                            <CustomSelect
                                                value={formData.model}
                                                onChange={(option) => handleInputChange('model', option)}
                                                options={aiModelOptions}
                                                placeholder="Select AI model"
                                                showBorder
                                            />
                                            {errors.model && (
                                                <SecondaryLabel style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                    {errors.model}
                                                </SecondaryLabel>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                Priority
                                            </TextLabel>
                                            <CustomSelect
                                                value={formData.priority}
                                                onChange={(option) => handleInputChange('priority', option)}
                                                options={priorityOptions}
                                                placeholder="Select priority"
                                                showBorder
                                            />
                                        </div>
                                    </HorizontalFlexbox>

                                    <AnimatePresence>
                                        {showAdvanced && (
                                            <motion.div
                                                variants={slideAnimation}
                                                initial="initial"
                                                animate="animate"
                                                exit="exit"
                                            >
                                                <TextInput
                                                    title="Keywords"
                                                    placeholder="Enter keywords separated by commas"
                                                    value={formData.keywords}
                                                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                                                    description="Keywords to focus monitoring on (optional)"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </VerticalFlexbox>
                            </FormSection>
                        </VerticalFlexbox>

                        {/* Action Buttons */}
                        <ButtonsWrapper>
                            <BoxButton variant="outline" onClick={onClose}>
                                Cancel
                            </BoxButton>
                            <BoxButton variant="solid" onClick={handleSubmit}>
                                Create Agent
                            </BoxButton>
                        </ButtonsWrapper>
                    </FormContainer>
                </MainContent>
            </Container>
        </Modal>
    );
};

export default CreateAgentForm;





import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Plus, Bot, Globe, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import RoundedBox from '@components/atoms/RoundedBox';
import HorizontalFlexbox from '@components/atoms/HorizontalFlexbox';
import VerticalFlexbox from '@components/atoms/VerticalFlexbox';
import { GridContainer } from '@components/atoms/Grid';
import { TextLabel, SecondaryLabel } from '@components/atoms/Fields';
import Chip from '@components/atoms/Chip';
import BoxButton from '@components/atoms/BoxButton';
import { useToggle } from '@utils/hooks/common/useToggle';
import CreateAgentForm from '@components/organisms/MonitoringAgent/CreateAgentForm';

// Types
interface MonitoringAgent {
    id: number;
    name: string;
    aiModel: string;
    jurisdiction: string;
    regulator: string;
    industries: string[];
    status: 'active' | 'inactive' | 'monitoring' | 'error';
    lastActive: string;
    threatsDetected: number;
    description?: string;
}

// Mock data
const mockAgents: MonitoringAgent[] = [
    {
        id: 1,
        name: 'Financial Compliance Monitor',
        aiModel: 'GPT-4 Turbo',
        jurisdiction: 'United Kingdom',
        regulator: 'Financial Conduct Authority (FCA)',
        industries: ['Banking', 'Investment Services', 'Insurance'],
        status: 'active',
        lastActive: '2 minutes ago',
        threatsDetected: 15,
        description: 'Monitors FCA regulations and compliance requirements for financial services'
    },
    {
        id: 2,
        name: 'GDPR Privacy Guardian',
        aiModel: 'Claude 3',
        jurisdiction: 'European Union',
        regulator: 'Data Protection Authority',
        industries: ['Technology', 'Healthcare', 'Retail'],
        status: 'monitoring',
        lastActive: '1 hour ago',
        threatsDetected: 8,
        description: 'Tracks GDPR compliance and data protection requirements across EU jurisdictions'
    },
    {
        id: 3,
        name: 'Healthcare Safety Monitor',
        aiModel: 'GPT-4',
        jurisdiction: 'United States',
        regulator: 'Food and Drug Administration (FDA)',
        industries: ['Pharmaceuticals', 'Medical Devices', 'Healthcare'],
        status: 'active',
        lastActive: '30 minutes ago',
        threatsDetected: 23,
        description: 'Monitors FDA guidelines and healthcare safety regulations'
    },
    {
        id: 4,
        name: 'Environmental Compliance Tracker',
        aiModel: 'Gemini Pro',
        jurisdiction: 'Canada',
        regulator: 'Environment and Climate Change Canada',
        industries: ['Manufacturing', 'Energy', 'Mining'],
        status: 'inactive',
        lastActive: '2 days ago',
        threatsDetected: 3,
        description: 'Tracks environmental regulations and climate compliance requirements'
    }
];

// Styled Components
const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const AgentCard = styled(RoundedBox)`
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.borderColor};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: ${props => props.theme.primaryColor};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StatusIndicator = styled.div<{ status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
        switch (props.status) {
            case 'active': return '#22c55e';
            case 'monitoring': return '#f59e0b';
            case 'inactive': return '#6b7280';
            case 'error': return '#ef4444';
            default: return '#6b7280';
        }
    }};
`;

const IndustryChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AddAgentCard = styled(RoundedBox)`
  padding: 2rem;
  border: 2px dashed ${props => props.theme.borderColor};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.primaryColor};
    background-color: ${props => props.theme.primaryColor}05;
  }
`;

// Helper functions
const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'green';
        case 'monitoring': return 'amber';
        case 'inactive': return 'grey';
        case 'error': return 'red';
        default: return 'grey';
    }
};

const formatLastActive = (lastActive: string) => {
    return `Last active: ${lastActive}`;
};

// Agent Card Component
const AgentCardComponent: React.FC<{ agent: MonitoringAgent }> = ({ agent }) => {
    const theme = useTheme();

    return (
        <AgentCard>
            <VerticalFlexbox className="gap-3">
                {/* Header with status */}
                <HorizontalFlexbox className="align-center space-between">
                    <HorizontalFlexbox className="align-center gap-2">
                        <Bot size={20} color={theme.primaryColor} />
                        <TextLabel size="medium" style={{ fontWeight: 600 }}>
                            {agent.name}
                        </TextLabel>
                    </HorizontalFlexbox>
                    <HorizontalFlexbox className="align-center gap-2">
                        <StatusIndicator status={agent.status} />
                        <Chip variant={getStatusColor(agent.status)} size="small">
                            {agent.status}
                        </Chip>
                    </HorizontalFlexbox>
                </HorizontalFlexbox>

                {/* Description */}
                {agent.description && (
                    <SecondaryLabel size="small" style={{ lineHeight: 1.4 }}>
                        {agent.description}
                    </SecondaryLabel>
                )}

                {/* AI Model and Threats */}
                <GridContainer cols={2} className="gap-3">
                    <RoundedBox style={{ background: theme.cardBgSecondary, padding: '0.75rem' }}>
                        <SecondaryLabel size="xsmall" style={{ textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            AI Model
                        </SecondaryLabel>
                        <TextLabel size="small" style={{ fontWeight: 600 }}>
                            {agent.aiModel}
                        </TextLabel>
                    </RoundedBox>

                    <RoundedBox style={{ background: theme.cardBgSecondary, padding: '0.75rem' }}>
                        <SecondaryLabel size="xsmall" style={{ textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Threats Detected
                        </SecondaryLabel>
                        <HorizontalFlexbox className="align-center gap-1">
                            <TextLabel size="small" style={{ fontWeight: 600 }}>
                                {agent.threatsDetected}
                            </TextLabel>
                            {agent.threatsDetected > 0 && <AlertTriangle size={14} color={theme.warningColor} />}
                        </HorizontalFlexbox>
                    </RoundedBox>
                </GridContainer>

                {/* Jurisdiction and Regulator */}
                <VerticalFlexbox className="gap-2">
                    <HorizontalFlexbox className="align-center gap-2">
                        <Globe size={16} color={theme.textColorSecondary} />
                        <SecondaryLabel size="small">Jurisdiction:</SecondaryLabel>
                        <TextLabel size="small">{agent.jurisdiction}</TextLabel>
                    </HorizontalFlexbox>

                    <HorizontalFlexbox className="align-center gap-2">
                        <Building size={16} color={theme.textColorSecondary} />
                        <SecondaryLabel size="small">Regulator:</SecondaryLabel>
                        <TextLabel size="small">{agent.regulator}</TextLabel>
                    </HorizontalFlexbox>
                </VerticalFlexbox>

                {/* Industries */}
                <VerticalFlexbox className="gap-1">
                    <SecondaryLabel size="small">Industries:</SecondaryLabel>
                    <IndustryChips>
                        {agent.industries.map((industry, index) => (
                            <Chip key={index} variant="primary" size="small">
                                {industry}
                            </Chip>
                        ))}
                    </IndustryChips>
                </VerticalFlexbox>

                {/* Footer */}
                <HorizontalFlexbox className="align-center space-between" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme.borderColor}` }}>
                    <SecondaryLabel size="xsmall">
                        {formatLastActive(agent.lastActive)}
                    </SecondaryLabel>
                    <HorizontalFlexbox className="align-center gap-1">
                        <CheckCircle size={12} color={theme.successColor} />
                        <SecondaryLabel size="xsmall">Operational</SecondaryLabel>
                    </HorizontalFlexbox>
                </HorizontalFlexbox>
            </VerticalFlexbox>
        </AgentCard>
    );
};

// Main Component
const MonitoringAgentDashboard: React.FC = () => {
    const [agents, setAgents] = useState<MonitoringAgent[]>(mockAgents);
    const [showAddModal, toggleAddModal] = useToggle(false);
    const theme = useTheme();

    const handleAddAgent = (newAgent: Partial<MonitoringAgent>) => {
        const agent: MonitoringAgent = {
            id: Math.max(...agents.map(a => a.id)) + 1,
            name: newAgent.name || '',
            aiModel: newAgent.aiModel || '',
            jurisdiction: newAgent.jurisdiction || '',
            regulator: newAgent.regulator || '',
            industries: newAgent.industries || [],
            status: 'active',
            lastActive: 'Just now',
            threatsDetected: 0,
            description: newAgent.description
        };
        setAgents(prev => [...prev, agent]);
    };

    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalThreats = agents.reduce((sum, a) => sum + a.threatsDetected, 0);

    return (
        <Container>
            {/* Header Section */}
            <Header>
                <HorizontalFlexbox className="align-center space-between mb-4">
                    <VerticalFlexbox>
                        <TextLabel size="large" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                            Monitoring Agent Dashboard
                        </TextLabel>
                        <SecondaryLabel>
                            Manage your AI-powered regulatory monitoring agents
                        </SecondaryLabel>
                    </VerticalFlexbox>

                    <BoxButton
                        variant="solid"
                        icon={<Plus size={16} />}
                        onClick={toggleAddModal}
                    >
                        Add Agent
                    </BoxButton>
                </HorizontalFlexbox>

                {/* Stats */}
                <GridContainer cols={3} className="gap-4 mb-6">
                    <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
                        <SecondaryLabel size="xsmall" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Active Agents
                        </SecondaryLabel>
                        <TextLabel size="large" style={{ fontWeight: 700, color: theme.successColor }}>
                            {activeAgents} / {agents.length}
                        </TextLabel>
                    </RoundedBox>

                    <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
                        <SecondaryLabel size="xsmall" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Total Threats Detected
                        </SecondaryLabel>
                        <TextLabel size="large" style={{ fontWeight: 700, color: theme.warningColor }}>
                            {totalThreats}
                        </TextLabel>
                    </RoundedBox>

                    <RoundedBox style={{ background: theme.cardBgSecondary, padding: '1rem' }}>
                        <SecondaryLabel size="xsmall" style={{ textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Coverage
                        </SecondaryLabel>
                        <TextLabel size="large" style={{ fontWeight: 700, color: theme.primaryColor }}>
                            {[...new Set(agents.map(a => a.jurisdiction))].length} Jurisdictions
                        </TextLabel>
                    </RoundedBox>
                </GridContainer>
            </Header>

            {/* Agents Grid */}
            <GridContainer cols={3} className="gap-6">
                {agents.map(agent => (
                    <AgentCardComponent key={agent.id} agent={agent} />
                ))}

                {/* Add Agent Card */}
                <AddAgentCard onClick={toggleAddModal}>
                    <Plus size={32} color={theme.textColorSecondary} style={{ marginBottom: '1rem' }} />
                    <TextLabel style={{ color: theme.textColorSecondary, textAlign: 'center' }}>
                        Add New Agent
                    </TextLabel>
                    <SecondaryLabel size="small" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        Deploy a new monitoring agent to track regulatory changes
                    </SecondaryLabel>
                </AddAgentCard>
            </GridContainer>

            {/* Create Agent Form */}
            <CreateAgentForm
                isOpen={showAddModal}
                onClose={toggleAddModal}
                onSubmit={handleAddAgent}
            />
        </Container>
    );
};

export default MonitoringAgentDashboard;
