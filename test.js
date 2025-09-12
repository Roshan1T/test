 <FormSection>
                                <TextLabel size="medium" style={{ marginBottom: '1rem', display: 'block', color: theme.primaryColor }}>
                                    Firm & Services
                                </TextLabel>
                                <VerticalFlexbox gap="1rem">
                                    <div>
                                        <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                            Select Firm *
                                        </TextLabel>
                                        <CustomSelect
                                            options={firmOptions}
                                            placeholder="Select a firm"
                                            value={firmOptions?.find((opt) => opt.value === formData.firm)}
                                            onChange={(e) => handleInputChange('firm', e?.value)}
                                            showBorder
                                            isLoading={loadingFirms}
                                        />
                                        {errors.firm && (
                                            <SecondaryLabel style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                {errors.firm}
                                            </SecondaryLabel>
                                        )}
                                    </div>

                                    {formData.firm && serviceOptions.length > 0 && (
                                        <div>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                Select Services (Optional)
                                            </TextLabel>
                                            <CustomSelect
                                                options={serviceOptions}
                                                isMulti
                                                placeholder="Select services to monitor"
                                                value={formData.services?.map(
                                                    (s) => serviceOptions?.find((opt) => opt.value === s),
                                                )}
                                                onChange={(e) => handleInputChange('services', e?.map((s) => s.value) || [])}
                                                showBorder
                                            />
                                            <SecondaryLabel style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
                                                Select specific services to focus monitoring on, or leave empty to monitor all firm activities
                                            </SecondaryLabel>
                                        </div>
                                    )}

                                    {formData.firm && serviceOptions.length === 0 && selectedFirmData && (
                                        <div style={{ padding: '1rem', backgroundColor: theme.cardBgSecondary, borderRadius: '6px', border: `1px solid ${theme.borderColor}` }}>
                                            <SecondaryLabel style={{ fontSize: '0.8rem', color: theme.labelColor }}>
                                                No services configured for this firm. The agent will monitor general firm activities.
                                            </SecondaryLabel>
                                        </div>
                                    )}
                                </VerticalFlexbox>
                            </FormSection>
