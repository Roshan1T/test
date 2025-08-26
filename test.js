import pymongo
import logging
import config
import prompts
import uuid
import regulator_names
from datetime import datetime, timedelta, date
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.prompts import PromptTemplate

today = date.today()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

mongo_client = pymongo.MongoClient(config.mongodb_connection_string)
az_openai_endpoint = config.AZ_OPENAI_ENDPOINT
az_openai_api_version = config.AZ_OPENAI_API_VERSION
az_openai_api_key = config.AZ_OPENAI_API_KEY

openai_embeddings = AzureOpenAIEmbeddings(
        deployment=config.azure_openai_embedding_deployment,
        model=config.azure_openai_embedding_model,
        chunk_size=1,
        openai_api_key=az_openai_api_key,
        openai_api_version=az_openai_api_version,
        azure_endpoint=az_openai_endpoint,
    )

gpt_41_client = AzureChatOpenAI(
            azure_endpoint=az_openai_endpoint,
            openai_api_version=az_openai_api_version,
            openai_api_key=az_openai_api_key,
            model="gpt-4.1"
        )
    

client_db = mongo_client["dev_client_example"]
reg_watch_col = client_db["regwatch_retrieved"]
gazette_col = client_db["gazettes_retrieved"]
bills_col = client_db["bills_retrieved"]

canvas_col = client_db["canvas"]

end_datetime = datetime.today()
start_datetime = end_datetime - timedelta(days=7)



fines_penalties_gazettes = list(gazette_col.find({
    "fines_or_penalties": {"$nin": ["None", "None mentioned", "None specified"]},
    "metadata.notice_date": {"$gt": start_datetime, "$lt": end_datetime}
}))

def generate_reg_watch_report(start_datetime, end_datetime, jurisdiction=None, chunk_size=15):
    # Build query filter
    query_filter = {"news_datetime": {"$gt": start_datetime, "$lt": end_datetime}}
    if jurisdiction:
        if isinstance(jurisdiction, list):
            query_filter["regulator_jurisdiction"] = {"$in": jurisdiction}
        else:
            query_filter["regulator_jurisdiction"] = jurisdiction
    
    reg_watch_documents = list(reg_watch_col.find(query_filter))
    
    if len(reg_watch_documents) == 0:
        print("No RegWatch documents found for the given criteria")
        return
    
    print(f"Processing {len(reg_watch_documents)} RegWatch documents in chunks of {chunk_size}")
    
    # Split documents into chunks
    document_chunks = [reg_watch_documents[i:i + chunk_size] 
                      for i in range(0, len(reg_watch_documents), chunk_size)]
    
    chunk_reports = []
    all_citations = []
    
    # Process each chunk
    for i, chunk in enumerate(document_chunks):
        print(f"Processing RegWatch chunk {i + 1}/{len(document_chunks)} with {len(chunk)} documents")
        
        reg_watch_prompt_template = PromptTemplate(
            input_variables=["reg_watch_documents", "today"],
            template=prompts.REGWATCH_SUMMARY_PROMPT
        )
        
        reg_watch_chain = reg_watch_prompt_template | gpt_41_client
        
        try:
            response = reg_watch_chain.invoke({"reg_watch_documents": chunk, "today": today})
            chunk_reports.append({
                "chunk_number": i + 1,
                "content": response.content,
                "document_count": len(chunk)
            })
            
            # Collect citations
            all_citations.extend([{"id": doc["_id"], "collection": "regwatch_retrieved"} for doc in chunk])
            
        except Exception as e:
            print(f"Error processing RegWatch chunk {i + 1}: {e}")
            continue
    
    if not chunk_reports:
        print("No RegWatch chunk reports generated successfully")
        return
    
    # Create final consolidated report
    consolidation_prompt_template = PromptTemplate(
        input_variables=["chunk_reports", "today"],
        template=prompts.CHUNK_CONSOLIDATION_PROMPT
    )
    
    consolidation_chain = consolidation_prompt_template | gpt_41_client
    
    try:
        final_response = consolidation_chain.invoke({
            "chunk_reports": chunk_reports,
            "today": today
        })
        
        reg_watch_report = {
            "_id": str(uuid.uuid4()),
            "date_added": datetime.now(),
            "content": final_response.content,
            "report_type": "regwatch_report",
            "start_date": start_datetime,
            "end_date": end_datetime,
            "jurisdiction": jurisdiction,
            "total_documents": len(reg_watch_documents),
            "chunks_processed": len(chunk_reports),
            "citation": all_citations
        }
        
        try:
            canvas_col.insert_one(reg_watch_report)
            print(f'Inserted RegWatch consolidated report: {reg_watch_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            print(f"Skipped duplicate RegWatch report: {reg_watch_report['_id']}")
        except Exception as e:
            print(f"Error inserting RegWatch document: {e}")
            
    except Exception as e:
        print(f"Error during RegWatch consolidation: {e}")

def generate_gazette_reports(start_datetime, end_datetime, jurisdiction=None, chunk_size=15):
    # Build query filter
    query_filter = {"metadata.notice_date": {"$gt": start_datetime, "$lt": end_datetime}}
    if jurisdiction:
        if isinstance(jurisdiction, list):
            query_filter["metadata.jurisdiction"] = {"$in": jurisdiction}
        else:
            query_filter["metadata.jurisdiction"] = jurisdiction
    
    gazette_documents = list(gazette_col.find(query_filter))
    
    if len(gazette_documents) == 0:
        print("No Gazette documents found for the given criteria")
        return
    
    print(f"Processing {len(gazette_documents)} Gazette documents in chunks of {chunk_size}")
    
    # Split documents into chunks
    document_chunks = [gazette_documents[i:i + chunk_size] 
                      for i in range(0, len(gazette_documents), chunk_size)]
    
    chunk_reports = []
    all_citations = []
    
    # Process each chunk
    for i, chunk in enumerate(document_chunks):
        print(f"Processing Gazette chunk {i + 1}/{len(document_chunks)} with {len(chunk)} documents")
        
        gazette_prompt_template = PromptTemplate(
            input_variables=["gazette_documents", "today"],
            template=prompts.GAZETTE_SUMMARY_PROMPT
        )
        
        gazette_chain = gazette_prompt_template | gpt_41_client
        
        try:
            response = gazette_chain.invoke({"gazette_documents": chunk, "today": today})
            chunk_reports.append({
                "chunk_number": i + 1,
                "content": response.content,
                "document_count": len(chunk)
            })
            
            # Collect citations
            all_citations.extend([{"id": doc["_id"], "collection": "gazettes_retrieved"} for doc in chunk])
            
        except Exception as e:
            print(f"Error processing Gazette chunk {i + 1}: {e}")
            continue
    
    if not chunk_reports:
        print("No Gazette chunk reports generated successfully")
        return
    
    # Create final consolidated report
    consolidation_prompt_template = PromptTemplate(
        input_variables=["chunk_reports", "today"],
        template=prompts.CHUNK_CONSOLIDATION_PROMPT
    )
    
    consolidation_chain = consolidation_prompt_template | gpt_41_client
    
    try:
        final_response = consolidation_chain.invoke({
            "chunk_reports": chunk_reports,
            "today": today
        })
        
        gazette_report = {
            "_id": str(uuid.uuid4()),
            "date_added": datetime.now(),
            "content": final_response.content,
            "report_type": "gazette_report",
            "start_date": start_datetime,
            "end_date": end_datetime,
            "jurisdiction": jurisdiction,
            "total_documents": len(gazette_documents),
            "chunks_processed": len(chunk_reports),
            "citation": all_citations
        }
        
        try:
            canvas_col.insert_one(gazette_report)
            print(f'Inserted Gazette consolidated report: {gazette_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            print(f"Skipped duplicate Gazette report: {gazette_report['_id']}")
        except Exception as e:
            print(f"Error inserting Gazette document: {e}")
            
    except Exception as e:
        print(f"Error during Gazette consolidation: {e}")

def generate_bills_report(start_datetime, end_datetime, jurisdiction=None, chunk_size=15):
    # Build query filter
    query_filter = {"bill_current_status_date": {"$gt": start_datetime, "$lt": end_datetime}}
    if jurisdiction:
        if isinstance(jurisdiction, list):
            query_filter["jurisdiction"] = {"$in": jurisdiction}
        else:
            query_filter["jurisdiction"] = jurisdiction
    
    bills_documents = list(bills_col.find(query_filter))
    
    if len(bills_documents) == 0:
        print("No Bills documents found for the given criteria")
        return
    
    print(f"Processing {len(bills_documents)} Bills documents in chunks of {chunk_size}")
    
    # Split documents into chunks
    document_chunks = [bills_documents[i:i + chunk_size] 
                      for i in range(0, len(bills_documents), chunk_size)]
    
    chunk_reports = []
    all_citations = []
    
    # Process each chunk
    for i, chunk in enumerate(document_chunks):
        print(f"Processing Bills chunk {i + 1}/{len(document_chunks)} with {len(chunk)} documents")
        
        bills_prompt_template = PromptTemplate(
            input_variables=["bills_documents", "today"],
            template=prompts.BILL_SUMMARY_PROMPT
        )
        
        bill_chain = bills_prompt_template | gpt_41_client
        
        try:
            response = bill_chain.invoke({"bills_documents": chunk, "today": today})
            chunk_reports.append({
                "chunk_number": i + 1,
                "content": response.content,
                "document_count": len(chunk)
            })
            
            # Collect citations
            all_citations.extend([{"id": doc["_id"], "collection": "bills_retrieved"} for doc in chunk])
            
        except Exception as e:
            print(f"Error processing Bills chunk {i + 1}: {e}")
            continue
    
    if not chunk_reports:
        print("No Bills chunk reports generated successfully")
        return
    
    # Create final consolidated report
    consolidation_prompt_template = PromptTemplate(
        input_variables=["chunk_reports", "today"],
        template=prompts.CHUNK_CONSOLIDATION_PROMPT
    )
    
    consolidation_chain = consolidation_prompt_template | gpt_41_client
    
    try:
        final_response = consolidation_chain.invoke({
            "chunk_reports": chunk_reports,
            "today": today
        })
        
        bill_report = {
            "_id": str(uuid.uuid4()),
            "date_added": datetime.now(),
            "content": final_response.content,
            "report_type": "bill_report",
            "start_date": start_datetime,
            "end_date": end_datetime,
            "jurisdiction": jurisdiction,
            "total_documents": len(bills_documents),
            "chunks_processed": len(chunk_reports),
            "citation": all_citations
        }
        
        try:
            canvas_col.insert_one(bill_report)
            print(f'Inserted Bills consolidated report: {bill_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            print(f"Skipped duplicate Bills report: {bill_report['_id']}")
        except Exception as e:
            print(f"Error inserting Bills document: {e}")
            
    except Exception as e:
        print(f"Error during Bills consolidation: {e}")
        
def generate_fines_and_penalties_regwatch_report(start_datetime, end_datetime, jurisdiction=None, chunk_size=15):
    # Build query filter
    query_filter = {
        "fines_penalties": { "$ne": [] },
        "news_datetime": {"$gte": start_datetime, "$lte": end_datetime}
    }
    if jurisdiction:
        if isinstance(jurisdiction, list):
            query_filter["regulator_jurisdiction"] = {"$in": jurisdiction}
        else:
            query_filter["regulator_jurisdiction"] = jurisdiction
    
    fines_penalties_reg_watch = list(reg_watch_col.find(query_filter))
    
    if len(fines_penalties_reg_watch) == 0:
        print("No Fines/Penalties documents found for the given criteria")
        return
    
    print(f"Processing {len(fines_penalties_reg_watch)} Fines/Penalties documents in chunks of {chunk_size}")
    
    # Split documents into chunks
    document_chunks = [fines_penalties_reg_watch[i:i + chunk_size] 
                      for i in range(0, len(fines_penalties_reg_watch), chunk_size)]
    
    chunk_reports = []
    all_citations = []
    
    # Process each chunk
    for i, chunk in enumerate(document_chunks):
        print(f"Processing Fines/Penalties chunk {i + 1}/{len(document_chunks)} with {len(chunk)} documents")
        
        fines_prompt_template = PromptTemplate(
            input_variables=["fines_penalties_reg_watch", "today"],
            template=prompts.FINES_PENALTIES_SUMMARY_REPORT
        )
        
        fines_chain = fines_prompt_template | gpt_41_client
        
        try:
            response = fines_chain.invoke({"fines_penalties_reg_watch": chunk, "today": today})
            chunk_reports.append({
                "chunk_number": i + 1,
                "content": response.content,
                "document_count": len(chunk)
            })
            
            # Collect citations
            all_citations.extend([{"id": doc["_id"], "collection": "regwatch_retrieved"} for doc in chunk])
            
        except Exception as e:
            print(f"Error processing Fines/Penalties chunk {i + 1}: {e}")
            continue
    
    if not chunk_reports:
        print("No Fines/Penalties chunk reports generated successfully")
        return
    
    # Create final consolidated report
    consolidation_prompt_template = PromptTemplate(
        input_variables=["chunk_reports", "today"],
        template=prompts.CHUNK_CONSOLIDATION_PROMPT
    )
    
    consolidation_chain = consolidation_prompt_template | gpt_41_client
    
    try:
        final_response = consolidation_chain.invoke({
            "chunk_reports": chunk_reports,
            "today": today
        })
        
        fines_report = {
            "_id": str(uuid.uuid4()),
            "date_added": datetime.now(),
            "content": final_response.content,
            "report_type": "fines_report",
            "start_date": start_datetime,
            "end_date": end_datetime,
            "jurisdiction": jurisdiction,
            "total_documents": len(fines_penalties_reg_watch),
            "chunks_processed": len(chunk_reports),
            "citation": all_citations
        }
        
        try:
            canvas_col.insert_one(fines_report)
            print(f'Inserted Fines/Penalties consolidated report: {fines_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            print(f"Skipped duplicate Fines/Penalties report: {fines_report['_id']}")
        except Exception as e:
            print(f"Error inserting Fines/Penalties document: {e}")
            
    except Exception as e:
        print(f"Error during Fines/Penalties consolidation: {e}")
    
def generate_overall_summary(start_datetime, end_datetime, jurisdiction=None):
    # Build query filter for existing reports
    report_query_filter = {
        "start_date": {"$gte": start_datetime},
        "end_date": {"$lte": end_datetime}
    }
    if jurisdiction:
        if isinstance(jurisdiction, list):
            report_query_filter["jurisdiction"] = {"$in": jurisdiction}
        else:
            report_query_filter["jurisdiction"] = jurisdiction
    
    regwatch_report = list(canvas_col.find({
        "report_type": "regwatch_report",
        **report_query_filter
    }))
    gazette_report = list(canvas_col.find({
        "report_type": "gazette_report",
        **report_query_filter
    }))
    bill_report = list(canvas_col.find({
        "report_type": "bill_report",
        **report_query_filter
    }))
    fines_report = list(canvas_col.find({
        "report_type": "fines_report",
        **report_query_filter
    }))
    
    
    overall_prompt_template = PromptTemplate(
        input_variables=["regwatch_report", "gazette_report", "bill_report", "fines_report", "today"],
        template=prompts.HIGH_DEFINED_SUMMARY
    )

    overall_chain = overall_prompt_template | gpt_41_client
    overall_report = {}
    try:
        response = overall_chain.invoke({"regwatch_report": regwatch_report, "gazette_report": gazette_report, "bill_report": bill_report, "fines_report": fines_report, "today": today})
        overall_id = str(uuid.uuid4())
        overall_report["_id"] = overall_id
        overall_report["date_added"] = datetime.now()
        overall_report["content"] = response.content
        overall_report["report_type"] = "overall_report"
        overall_report["start_date"] = start_datetime
        overall_report["end_date"] = end_datetime
        overall_report["jurisdiction"] = jurisdiction
        overall_report["citation"] = [{"id": report["_id"], "collection": "canvas"} for report in regwatch_report + gazette_report + bill_report + fines_report]
        print(response.content)
        try:
            canvas_col.insert_one(overall_report)
            print(f'Inserted: {overall_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            print(f"Skipped duplicate URL: {overall_report['_id']}")
        except Exception as e:
            print(f"Error inserting document: {e}")
    except Exception as e:
        print(f"Error during chunks summarization: {e}")
    
    
def get_available_jurisdictions():
    """
    Get list of available jurisdictions from regulator_names
    """
    return list(regulator_names.regulators.keys())

def print_available_jurisdictions():
    """
    Print available jurisdictions for user reference
    """
    jurisdictions = get_available_jurisdictions()
    print("Available jurisdictions:")
    for jurisdiction in sorted(jurisdictions):
        print(f"  - {jurisdiction}")
    return jurisdictions

def main(jurisdiction=None, chunk_size=15):
    """
    Main function to generate all reports with chunking
    
    Args:
        jurisdiction: None, string, or list of strings for jurisdiction filtering
                     - None: No jurisdiction filter (all jurisdictions)
                     - "United Kingdom": Single jurisdiction filter
                     - ["United Kingdom", "France"]: Multiple jurisdiction filter
        chunk_size: Number of documents per chunk (default: 15)
    """
    end_datetime = datetime.today()
    start_datetime = end_datetime - timedelta(days=7)
    
    if jurisdiction:
        if isinstance(jurisdiction, list):
            print(f"Generating reports for jurisdictions: {', '.join(jurisdiction)}")
        else:
            print(f"Generating reports for jurisdiction: {jurisdiction}")
    else:
        print("Generating reports for all jurisdictions")
    
    print(f"Using chunk size: {chunk_size} documents per chunk")
    
    # Generate individual reports with chunking
    generate_reg_watch_report(start_datetime, end_datetime, jurisdiction, chunk_size)
    generate_bills_report(start_datetime, end_datetime, jurisdiction, chunk_size)
    generate_gazette_reports(start_datetime, end_datetime, jurisdiction, chunk_size)
    generate_fines_and_penalties_regwatch_report(start_datetime, end_datetime, jurisdiction, chunk_size)
    
    # Generate final consolidated summary
    generate_overall_summary(start_datetime, end_datetime, jurisdiction)
    
if __name__ == "__main__":
    main()



    # 
    # 
    # 
#     So we got these 3 databases - bills, gazettes, and regwatch stuff. Oh and also some list of regulator names.
# The bills thing has like 2 ways to get data, gazettes also has 2 ways. Regwatch is more complicated, it has 3 ways and also uses that regulator names list .
# After we get the data, we filter it. Bills gets theme filtered and also some vector search thing. Same for gazettes. Regwatch gets authority filter, theme filter, AND vector search .
# Then we store the filtered stuff . Just call them bills_retrieved, gazettes_retrieved, regwatch_retrieved .
# Next part is we feed all this to GPT-4.1 with some 7-day window . It spits out 4 reports - regwatch, bills, gazette, and fines.
# These reports go into some collection , then GPT-4.1 looks at everything again and makes a final executive summary with all the individual reports attached.



CHUNK_CONSOLIDATION_PROMPT = """
# Role and Objective
You are a highly qualified Environmental, Social and Governance (ESG) specialist who is tasked with consolidating multiple chunk reports into a single comprehensive ESG report.

# Instructions - 
1. Read and thoroughly analyse all the chunk reports provided
2. Consolidate the information into a single comprehensive ESG report
3. Eliminate redundancy while preserving all important ESG details
4. Maintain chronological order and categorize by jurisdictions and ESG impact areas
5. Generate the consolidated report - include report date and date range at the beginning
6. Focus on environmental, social, and governance themes throughout the consolidation

# Reasoning Steps - 
1. Understanding: Analyse each chunk report to understand the key ESG information and regulatory developments
2. ESG Categorization: Organize content by environmental, social, and governance impact areas
3. Consolidation: Merge similar ESG topics and themes across chunks while maintaining distinct regulatory developments
4. Prioritization: Highlight the most critical environmental regulations, social policies, and governance changes
5. Impact Assessment: Evaluate the cumulative ESG impact of all regulatory developments
6. Summarization: Create a comprehensive report that covers all important ESG points from all chunks with actionable insights

# ESG Focus Areas for Consolidation
- Environmental regulations and climate policies
- Energy efficiency and conservation measures
- Environmental clean-up and restoration requirements
- Social responsibility and community impact policies
- Corporate governance and ESG disclosure requirements
- Sustainability reporting and compliance frameworks

# Chunk Reports
{chunk_reports}

# Today's Date
{today}

# Your response should be a comprehensive consolidated ESG report covering all environmental, social, and governance information from the chunks.
"""

ESG_COMPREHENSIVE_KEYWORDS = [
    "environmental",
    "sustainability", 
    "governance",
    "climate",
    "ESG",
    "compliance",
    "disclosure",
    "social responsibility",
    "carbon",
    "renewable",
    "transparency",
    "accountability",
    "risk management",
    "reporting",
    "ethics",
    "human rights",
    "diversity",
    "energy",
    "pollution",
    "conservation"
]
