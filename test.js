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

                                    {formData.firm && (
                                        <div>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                Select Service Category (Optional)
                                            </TextLabel>
                                            <CustomSelect
                                                options={categoryOptions}
                                                placeholder="Select a service category"
                                                value={categoryOptions?.find((opt) => opt.value === formData.serviceCategory)}
                                                onChange={(e) => handleInputChange('serviceCategory', e?.value)}
                                                showBorder
                                            />
                                        </div>
                                    )}

                                    {formData.serviceCategory && serviceOptions.length > 0 && (
                                        <div>
                                            <TextLabel size="small" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                                Select Products/Services (Optional)
                                            </TextLabel>
                                            <CustomSelect
                                                options={serviceOptions}
                                                isMulti
                                                placeholder="Select specific products/services to monitor"
                                                value={serviceOptions?.filter((opt) =>
                                                    formData.services?.includes(opt.value)
                                                )}
                                                onChange={(e) => handleInputChange('services', e?.map((s) => s.value) || [])}
                                                showBorder
                                            />
                                            <SecondaryLabel style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
                                                Select specific products/services to focus monitoring on, or leave empty to monitor all category activities
                                            </SecondaryLabel>
                                        </div>
                                    )}

                                    {formData.firm && categoryOptions.length === 0 && (
                                        <div style={{ padding: '1rem', backgroundColor: theme.cardBgSecondary, borderRadius: '6px', border: `1px solid ${theme.borderColor}` }}>
                                            <SecondaryLabel style={{ fontSize: '0.8rem', color: theme.labelColor }}>
                                                No service categories available. The agent will monitor general firm activities.
                                            </SecondaryLabel>
                                        </div>
                                    )}
                                </VerticalFlexbox>
                            </FormSection>
