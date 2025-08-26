def get_all_data(document):
    """Extract content as clean text instead of JSON for better vector search."""
    # Remove metadata fields
    excluded_fields = ["_id", "unique_id", "date_added", "report", "total_token_usage", 
                      "file_path", "impact_score", "blob_name", "embedding", "all_data", "metadata"]
    
    doc_copy = copy.deepcopy(document)
    for field in excluded_fields:
        doc_copy.pop(field, None)
    
    # Build readable text from important content fields
    text_parts = []
    
    # Title (most important for search)
    if doc_copy.get("notice_name"):
        text_parts.append(doc_copy["notice_name"])
    
    # Main content
    if doc_copy.get("description"):
        text_parts.append(doc_copy["description"])
    
    # Key information
    content_fields = ["key_points_of_interest", "actors_in_play", "affected_parties", 
                     "outcome_decisions", "industries_affected", "obligations"]
    
    for field in content_fields:
        if field in doc_copy and doc_copy[field]:
            if isinstance(doc_copy[field], list):
                text_parts.extend([str(item) for item in doc_copy[field] if item])
            else:
                text_parts.append(str(doc_copy[field]))
    
    # Context fields
    context_fields = ["notice_type", "jurisdiction", "agency", "department_name"]
    for field in context_fields:
        if doc_copy.get(field) and str(doc_copy[field]).lower() != "none":
            text_parts.append(str(doc_copy[field]))
    
    # Join with spaces and clean up
    all_text = " ".join(text_parts)
    all_text = " ".join(all_text.split())  # Remove extra whitespace
    
    return all_text
