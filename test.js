import pymongo
from src.config import Config
import src.dpo_agent.prompts as prompts
from datetime import datetime, timedelta, date
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.prompts import PromptTemplate
from src import logger,mongo_client
import re

today = date.today()

azure_openai_embedding_model = "text-embedding-3-small"
azure_openai_embedding_deployment = "text-embedding-3-small"
azure_openai_embedding_model_version = "2023-05-15"

az_openai_endpoint = Config.AZ_OPENAI_ENDPOINT
az_openai_api_version = Config.AZ_OPENAI_API_VERSION
az_openai_api_key = Config.AZ_OPENAI_API_KEY

openai_embeddings = AzureOpenAIEmbeddings(
    deployment=azure_openai_embedding_deployment,
    model=azure_openai_embedding_model,
    chunk_size=1,
    openai_api_key=az_openai_api_key,
    openai_api_version=az_openai_api_version,
    azure_endpoint=az_openai_endpoint,
)

gpt_41_client = AzureChatOpenAI(
    azure_endpoint=az_openai_endpoint,
    openai_api_version=az_openai_api_version,
    openai_api_key=az_openai_api_key,
    model="gpt-4.1",
)


client_db = mongo_client["dpo_agent"]
reg_watch_col = client_db["regwatch_retrieved"]
gazette_col = client_db["gazettes_retrieved"]
bills_col = client_db["bills_retrieved"]

canvas_col = client_db["canvas"]


def normalize(text):
    return re.sub(r"\W+", "", str(text)).lower()


def generate_reg_watch_report(
    start_datetime, end_datetime, jurisdiction=None, chunk_size=15
):
    if isinstance(jurisdiction, list) and len(jurisdiction) > 1:
        for single_jurisdiction in jurisdiction:
            _generate_single_reg_watch_report(start_datetime, end_datetime, single_jurisdiction, chunk_size)
        return
    
    _generate_single_reg_watch_report(start_datetime, end_datetime, jurisdiction, chunk_size)


def _generate_single_reg_watch_report(start_datetime, end_datetime, jurisdiction, chunk_size=15):

    jurisdiction_for_id = jurisdiction[0] if isinstance(jurisdiction, list) else jurisdiction

    if not jurisdiction_for_id:
        jurisdiction_part = "all"
    else:
        jurisdiction_part = normalize(jurisdiction_for_id)

    _id = f"regwatch_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part}"

    existing_report = canvas_col.find_one(
        {"_id": _id, "report_type": "regwatch_report", "jurisdiction": jurisdiction_for_id}
    )
    if existing_report:
        logger.info(
            f"RegWatch report for {jurisdiction_for_id} from {start_datetime} to {end_datetime} already exists. Skipping report generation."
        )
        return

    query_filter = {"news_datetime": {"$gte": start_datetime, "$lte": end_datetime}}
    if jurisdiction_for_id:
        query_filter["regulator_jurisdiction"] = jurisdiction_for_id

    projection = {"url": 0, "_id": 0, "metadata": 0, "retriever_source": 0}

    reg_watch_documents = list(reg_watch_col.find(query_filter, projection))

    logger.info(f"Number of regwatch documents for {jurisdiction_for_id}: {len(reg_watch_documents)}")

    document_chunks = [
        reg_watch_documents[i : i + chunk_size]
        for i in range(0, len(reg_watch_documents), chunk_size)
    ]
    chunk_reports = []
    all_citations = []

    for i, chunk in enumerate(document_chunks):

        reg_watch_prompt_template = PromptTemplate(
            input_variables=["reg_watch_documents", "today"],
            template=prompts.DPO_REGWATCH_SUMMARY_PROMPT,
        )

        reg_watch_chain = reg_watch_prompt_template | gpt_41_client

        try:
            response = reg_watch_chain.invoke(
                {"reg_watch_documents": chunk, "today": today}
            )
            chunk_reports.append(
                {
                    "chunk_number": i + 1,
                    "content": response.content,
                    "document_count": len(chunk),
                }
            )

            all_citations.extend(
                [
                    {
                        "id": doc["unique_id"],
                        "collection": "reg_watch",
                        "title": doc["page_title"],
                    }
                    for doc in chunk
                ]
            )

        except Exception as e:
            logger.exception(f"Error processing chunk {i+1}")
            continue

    reg_watch_report = {
        "_id": _id,
        "date_added": datetime.now(),
        "report_type": "regwatch_report",
        "start_date": start_datetime.strftime("%Y-%m-%d"),
        "end_date": end_datetime.strftime("%Y-%m-%d"),
        "jurisdiction": jurisdiction_for_id,
        "citation": all_citations,
    }

    try:
        if len(chunk_reports) > 1:
            consolidation_prompt_template = PromptTemplate(
                input_variables=["chunk_reports", "today"],
                template=prompts.DPO_CHUNK_CONSOLIDATION_PROMPT,
            )

            consolidation_chain = consolidation_prompt_template | gpt_41_client

            final_response = consolidation_chain.invoke(
                {"chunk_reports": chunk_reports, "today": today}
            )
            reg_watch_report["content"] = final_response.content

        else:
            if len(reg_watch_documents) == 0:
                reg_watch_report["content"] = (
                    "No data present for the given date range."
                )
            else:
                reg_watch_report["content"] = chunk_reports[0]["content"]

        try:
            canvas_col.insert_one(reg_watch_report)
            logger.info(f'Inserted: {reg_watch_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            logger.warning(f"Skipped duplicate URL: {reg_watch_report['_id']}")
        except Exception as e:
            logger.exception(f"Error inserting document: {e}")
    except Exception as e:
        logger.exception(f"Error during chunks summarization: {e}")


def generate_gazette_reports(
    start_datetime, end_datetime, jurisdiction=None, chunk_size=15
):
    if isinstance(jurisdiction, list) and len(jurisdiction) > 1:
        for single_jurisdiction in jurisdiction:
            _generate_single_gazette_report(start_datetime, end_datetime, single_jurisdiction, chunk_size)
        return
    
    _generate_single_gazette_report(start_datetime, end_datetime, jurisdiction, chunk_size)


def _generate_single_gazette_report(start_datetime, end_datetime, jurisdiction, chunk_size=15):

    jurisdiction_for_id = jurisdiction[0] if isinstance(jurisdiction, list) else jurisdiction

    if not jurisdiction_for_id:
        jurisdiction_part = "all"
    else:
        jurisdiction_part = normalize(jurisdiction_for_id)

    _id = f"gazette_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part}"

    existing_report = canvas_col.find_one(
        {"report_type": "gazette_report", "_id": _id, "jurisdiction": jurisdiction_for_id}
    )
    if existing_report:
        logger.info(
            f"Gazette report for {jurisdiction_for_id} from {start_datetime} to {end_datetime} already exists. Skipping report generation."
        )
        return

    query_filter = {
        "metadata.notice_date": {"$gte": start_datetime, "$lte": end_datetime}
    }
    if jurisdiction_for_id:
        query_filter["jurisdiction"] = jurisdiction_for_id

    projection = {"file_path": 0, "_id": 0, "metadata": 0, "retriever_source": 0}

    gazette_documents = list(gazette_col.find(query_filter, projection))

    logger.info(f"Number of gazette documents for {jurisdiction_for_id}: {len(gazette_documents)}")

    document_chunks = [
        gazette_documents[i : i + chunk_size]
        for i in range(0, len(gazette_documents), chunk_size)
    ]

    chunk_reports = []
    all_citations = []

    for i, chunk in enumerate(document_chunks):
        gazette_prompt_template = PromptTemplate(
            input_variables=["gazette_documents", "today"],
            template=prompts.DPO_GAZETTE_SUMMARY_PROMPT,
        )

        gazette_chain = gazette_prompt_template | gpt_41_client

        try:
            response = gazette_chain.invoke(
                {"gazette_documents": chunk, "today": today}
            )
            chunk_reports.append(
                {
                    "chunk_number": i + 1,
                    "content": response.content,
                    "document_count": len(chunk),
                }
            )

            all_citations.extend(
                [
                    {
                        "id": doc["unique_id"],
                        "collection": "gazette",
                        "title": doc["notice_name"],
                    }
                    for doc in chunk
                ]
            )

        except Exception as e:
            logger.exception(f"Error handling chunk {i+1}")
            continue

    gazette_report = {
        "_id": _id,
        "date_added": datetime.now(),
        "report_type": "gazette_report",
        "start_date": start_datetime.strftime("%Y-%m-%d"),
        "end_date": end_datetime.strftime("%Y-%m-%d"),
        "jurisdiction": jurisdiction_for_id,
        "citation": all_citations,
    }

    try:
        if len(chunk_reports) > 1:
            consolidation_prompt_template = PromptTemplate(
                input_variables=["chunk_reports", "today"],
                template=prompts.DPO_CHUNK_CONSOLIDATION_PROMPT,
            )

            consolidation_chain = consolidation_prompt_template | gpt_41_client

            final_response = consolidation_chain.invoke(
                {"chunk_reports": chunk_reports, "today": today}
            )
            gazette_report["content"] = final_response.content
        else:
            if len(gazette_documents) == 0:
                gazette_report["content"] = "No data present for the given date range."
            else:
                gazette_report["content"] = chunk_reports[0]["content"]

        try:
            canvas_col.insert_one(gazette_report)
            logger.info(f'Inserted: {gazette_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            logger.warning(f"Skipped duplicate URL: {gazette_report['_id']}")
        except Exception as e:
            logger.exception(f"Error inserting document: {e}")
    except Exception as e:
        logger.exception(f"Error during chunks summarization: {e}")


def generate_bills_report(
    start_datetime, end_datetime, jurisdiction=None, chunk_size=15
):
    if isinstance(jurisdiction, list) and len(jurisdiction) > 1:
        for single_jurisdiction in jurisdiction:
            _generate_single_bills_report(start_datetime, end_datetime, single_jurisdiction, chunk_size)
        return
    
    _generate_single_bills_report(start_datetime, end_datetime, jurisdiction, chunk_size)


def _generate_single_bills_report(start_datetime, end_datetime, jurisdiction, chunk_size=15):

    jurisdiction_for_id = jurisdiction[0] if isinstance(jurisdiction, list) else jurisdiction

    if not jurisdiction_for_id:
        jurisdiction_part = "all"
    else:
        jurisdiction_part = normalize(jurisdiction_for_id)

    _id = f"bill_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part}"

    existing_report = canvas_col.find_one(
        {"report_type": "bill_report", "_id": _id, "jurisdiction": jurisdiction_for_id}
    )
    if existing_report:
        logger.info(
            f"Bills report for {jurisdiction_for_id} from {start_datetime} to {end_datetime} already exists. Skipping report generation."
        )
        return

    query_filter = {
        "bill_current_status_date": {"$gte": start_datetime, "$lte": end_datetime}
    }
    if jurisdiction_for_id:
        query_filter["jurisdiction"] = jurisdiction_for_id

    projection = {"file_path_url": 0, "metadata": 0, "retriever_source": 0}
    bills_documents = list(bills_col.find(query_filter, projection))
    logger.info(f"Number of bill documents for {jurisdiction_for_id}: {len(bills_documents)}")

    document_chunks = [
        bills_documents[i : i + chunk_size]
        for i in range(0, len(bills_documents), chunk_size)
    ]

    chunk_reports = []
    all_citations = []

    for i, chunk in enumerate(document_chunks):

        bills_prompt_template = PromptTemplate(
            input_variables=["bills_documents", "today"],
            template=prompts.DPO_BILL_SUMMARY_PROMPT,
        )

        bill_chain = bills_prompt_template | gpt_41_client

        try:
            response = bill_chain.invoke({"bills_documents": chunk, "today": today})
            chunk_reports.append(
                {
                    "chunk_number": i + 1,
                    "content": response.content,
                    "document_count": len(chunk),
                }
            )

            all_citations.extend(
                [
                    {"id": doc["_id"], "collection": "bill", "title": doc["bill_name"]}
                    for doc in chunk
                ]
            )

        except Exception as e:
            logger.exception(f"Error processing chunk  :{i+1}: {e}")
            continue

    bill_report = {
        "_id": _id,
        "date_added": datetime.now(),
        "report_type": "bill_report",
        "start_date": start_datetime.strftime("%Y-%m-%d"),
        "end_date": end_datetime.strftime("%Y-%m-%d"),
        "jurisdiction": jurisdiction_for_id,
        "citation": all_citations,
    }

    try:
        if len(chunk_reports) > 1:
            consolidation_prompt_template = PromptTemplate(
                input_variables=["chunk_reports", "today"],
                template=prompts.DPO_CHUNK_CONSOLIDATION_PROMPT,
            )

            consolidation_chain = consolidation_prompt_template | gpt_41_client

            final_response = consolidation_chain.invoke(
                {"chunk_reports": chunk_reports, "today": today}
            )
            bill_report["content"] = final_response.content
        else:
            if len(bills_documents) == 0:
                bill_report["content"] = "No data present for the given date range."
            else:
                bill_report["content"] = chunk_reports[0]["content"]

        try:
            canvas_col.insert_one(bill_report)
            logger.info(f'Inserted: {bill_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            logger.warning(f"Skipped duplicate URL: {bill_report['_id']}")
        except Exception as e:
            logger.exception(f"Error inserting document: {e}")
    except Exception as e:
        logger.exception(f"Error during chunks summarization: {e}")


def generate_fines_and_penalties_regwatch_report(
    start_datetime, end_datetime, jurisdiction=None, chunk_size=15
):
    if isinstance(jurisdiction, list) and len(jurisdiction) > 1:
        for single_jurisdiction in jurisdiction:
            _generate_single_fines_report(start_datetime, end_datetime, single_jurisdiction, chunk_size)
        return
    
    _generate_single_fines_report(start_datetime, end_datetime, jurisdiction, chunk_size)


def _generate_single_fines_report(start_datetime, end_datetime, jurisdiction, chunk_size=15):

    jurisdiction_for_id = jurisdiction[0] if isinstance(jurisdiction, list) else jurisdiction

    if not jurisdiction_for_id:
        jurisdiction_part = "all"
    else:
        jurisdiction_part = normalize(jurisdiction_for_id)

    _id = f"fines_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part}"

    existing_report = canvas_col.find_one(
        {"report_type": "fines_report", "_id": _id, "jurisdiction": jurisdiction_for_id}
    )
    if existing_report:
        logger.info(
            f"Fines report for {jurisdiction_for_id} from {start_datetime} to {end_datetime} already exists. Skipping report generation."
        )
        return

    query_filter = {
        "fines_penalties": {"$ne": []},
        "news_datetime": {"$gte": start_datetime, "$lte": end_datetime},
    }
    if jurisdiction_for_id:
        query_filter["jurisdiction"] = jurisdiction_for_id

    projection = {"url": 0, "_id": 0, "metadata": 0, "retriever_source": 0}

    fines_penalties_reg_watch = list(reg_watch_col.find(query_filter, projection))
    logger.info(f"Number of fines documents for {jurisdiction_for_id}: {len(fines_penalties_reg_watch)}")

    document_chunks = [
        fines_penalties_reg_watch[i : i + chunk_size]
        for i in range(0, len(fines_penalties_reg_watch), chunk_size)
    ]

    chunk_reports = []
    all_citations = []

    for i, chunk in enumerate(document_chunks):

        fines_prompt_template = PromptTemplate(
            input_variables=["fines_penalties_reg_watch", "today"],
            template=prompts.DPO_FINES_PENALTIES_SUMMARY_REPORT,
        )

        fines_chain = fines_prompt_template | gpt_41_client

        try:
            response = fines_chain.invoke(
                {"fines_penalties_reg_watch": chunk, "today": today}
            )
            chunk_reports.append(
                {
                    "chunk_number": i + 1,
                    "content": response.content,
                    "document_count": len(chunk),
                }
            )

            all_citations.extend(
                [
                    {
                        "id": doc["unique_id"],
                        "collection": "fines_penalties",
                        "title": doc["page_title"],
                    }
                    for doc in chunk
                ]
            )
        except Exception as e:
            logger.exception(f"Error processing chunk {i+1} : {e}")
            continue

    fines_report = {
        "_id": _id,
        "date_added": datetime.now(),
        "report_type": "fines_report",
        "start_date": start_datetime.strftime("%Y-%m-%d"),
        "end_date": end_datetime.strftime("%Y-%m-%d"),
        "jurisdiction": jurisdiction_for_id,
        "citation": all_citations,
    }

    try:
        if len(chunk_reports) > 1:
            consolidation_prompt_template = PromptTemplate(
                input_variables=["chunk_reports", "today"],
                template=prompts.DPO_CHUNK_CONSOLIDATION_PROMPT,
            )

            consolidation_chain = consolidation_prompt_template | gpt_41_client

            final_response = consolidation_chain.invoke(
                {"chunk_reports": chunk_reports, "today": today}
            )
            fines_report["content"] = final_response.content
        else:
            if len(fines_penalties_reg_watch) == 0:
                fines_report["content"] = "No data present for the given date range."
            else:
                fines_report["content"] = chunk_reports[0]["content"]

        try:
            canvas_col.insert_one(fines_report)
            logger.info(f'Inserted: {fines_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            logger.warning(f"Skipped duplicate URL: {fines_report['_id']}")
        except Exception as e:
            logger.exception(f"Error inserting document: {e}")
    except Exception as e:
        logger.exception(f"Error during chunks summarization: {e}")


def generate_country_specific_summary(start_datetime, end_datetime, jurisdiction):
    """Generate a country-specific summary that consolidates all 4 report types for a single country"""
    jurisdiction_part = normalize(jurisdiction)
    _id = f"country_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part}"

    existing_report = canvas_col.find_one(
        {"report_type": "country_report", "_id": _id, "jurisdiction": jurisdiction}
    )
    if existing_report:
        logger.info(
            f"Country report for {jurisdiction} from {start_datetime} to {end_datetime} already exists. Skipping report generation."
        )
        return

    report_query_filter = {
        "start_date": start_datetime.strftime("%Y-%m-%d"),
        "end_date": end_datetime.strftime("%Y-%m-%d"),
        "jurisdiction": jurisdiction
    }

    regwatch_report = list(
        canvas_col.find({"report_type": "regwatch_report", **report_query_filter})
    )
    gazette_report = list(
        canvas_col.find({"report_type": "gazette_report", **report_query_filter})
    )
    bill_report = list(
        canvas_col.find({"report_type": "bill_report", **report_query_filter})
    )
    fines_report = list(
        canvas_col.find({"report_type": "fines_report", **report_query_filter})
    )

    country_prompt_template = PromptTemplate(
        input_variables=[
            "jurisdiction",
            "regwatch_report",
            "gazette_report",
            "bill_report",
            "fines_report",
            "today",
        ],
        template=prompts.DPO_COUNTRY_SPECIFIC_SUMMARY,
    )

    country_chain = country_prompt_template | gpt_41_client
    
    try:
        response = country_chain.invoke(
            {
                "jurisdiction": jurisdiction,
                "regwatch_report": regwatch_report,
                "gazette_report": gazette_report,
                "bill_report": bill_report,
                "fines_report": fines_report,
                "today": today,
            }
        )
        
        country_report = {
            "_id": _id,
            "date_added": datetime.now(),
            "content": response.content,
            "report_type": "country_report",
            "start_date": start_datetime.strftime("%Y-%m-%d"),
            "end_date": end_datetime.strftime("%Y-%m-%d"),
            "jurisdiction": jurisdiction,
            "citation": [
                {"id": report["_id"], "collection": "canvas", "type": "regwatch"}
                for report in regwatch_report
            ] + [
                {"id": report["_id"], "collection": "canvas", "type": "gazette"}
                for report in gazette_report
            ] + [
                {"id": report["_id"], "collection": "canvas", "type": "bill"}
                for report in bill_report
            ] + [
                {"id": report["_id"], "collection": "canvas", "type": "fines"}
                for report in fines_report
            ]
        }

        try:
            canvas_col.insert_one(country_report)
            logger.info(f'Inserted country report: {country_report["_id"]}')
        except pymongo.errors.DuplicateKeyError:
            logger.warning(f"Skipped duplicate country report: {country_report['_id']}")
        except Exception as e:
            logger.exception(f"Error inserting country report: {e}")
    except Exception as e:
        logger.exception(f"Error during country report generation: {e}")


def generate_overall_summary(start_datetime, end_datetime, jurisdiction=None):
    if not jurisdiction:
        jurisdiction_part = "all"
        jurisdictions_list = []
    elif isinstance(jurisdiction, list):
        if len(jurisdiction) == 1:
            # Single jurisdiction - use existing logic
            jurisdiction_part = normalize(jurisdiction[0])
            jurisdictions_list = jurisdiction
        else:
            # Multiple jurisdictions - new logic
            jurisdiction_part = "_".join(sorted(normalize(j) for j in jurisdiction))
            jurisdictions_list = jurisdiction
    else:
        # Single jurisdiction as string
        jurisdiction_part = normalize(jurisdiction)
        jurisdictions_list = [jurisdiction]

    _id = f"overall_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part}"

    existing_report = canvas_col.find_one(
        {"report_type": "overall_report", "_id": _id}
    )
    if existing_report:
        logger.info(
            f"Overall report for {jurisdiction} from {start_datetime} to {end_datetime} already exists. Skipping report generation."
        )
        return

    if isinstance(jurisdiction, list) and len(jurisdiction) > 1:
        country_reports = []
        for single_jurisdiction in jurisdiction:
            jurisdiction_part_single = normalize(single_jurisdiction)
            country_report_id = f"country_report_{start_datetime.strftime('%Y%m%d')}_{end_datetime.strftime('%Y%m%d')}_{jurisdiction_part_single}"
            
            country_report = canvas_col.find_one(
                {"report_type": "country_report", "_id": country_report_id, "jurisdiction": single_jurisdiction}
            )
            if country_report:
                country_reports.append(country_report)
            else:
                logger.warning(f"Country report for {single_jurisdiction} not found. Skipping.")

        if not country_reports:
            logger.error("No country reports found for multi-country overall report generation.")
            return

        multi_country_prompt_template = PromptTemplate(
            input_variables=["country_reports", "today"],
            template=prompts.DPO_MULTI_COUNTRY_CONSOLIDATION,
        )

        overall_chain = multi_country_prompt_template | gpt_41_client
        
        try:
            response = overall_chain.invoke(
                {
                    "country_reports": country_reports,
                    "today": today,
                }
            )
            
            overall_report = {
                "_id": _id,
                "date_added": datetime.now(),
                "content": response.content,
                "report_type": "overall_report",
                "start_date": start_datetime.strftime("%Y-%m-%d"),
                "end_date": end_datetime.strftime("%Y-%m-%d"),
                "jurisdiction": jurisdiction,
                "multi_country": True,
                "citation": [
                    {"id": report["_id"], "collection": "canvas", "type": "country_report", "jurisdiction": report["jurisdiction"]}
                    for report in country_reports
                ]
            }

        except Exception as e:
            logger.exception(f"Error during multi-country overall report generation: {e}")
            return

    else:
        report_query_filter = {
            "start_date": start_datetime.strftime("%Y-%m-%d"),
            "end_date": end_datetime.strftime("%Y-%m-%d"),
        }

        if jurisdiction:
            jurisdiction_value = jurisdiction[0] if isinstance(jurisdiction, list) else jurisdiction
            report_query_filter["jurisdiction"] = jurisdiction_value

        regwatch_report = list(
            canvas_col.find({"report_type": "regwatch_report", **report_query_filter})
        )
        gazette_report = list(
            canvas_col.find({"report_type": "gazette_report", **report_query_filter})
        )
        bill_report = list(
            canvas_col.find({"report_type": "bill_report", **report_query_filter})
        )
        fines_report = list(
            canvas_col.find({"report_type": "fines_report", **report_query_filter})
        )

        overall_prompt_template = PromptTemplate(
            input_variables=[
                "regwatch_report",
                "gazette_report",
                "bill_report",
                "fines_report",
                "today",
            ],
            template=prompts.DPO_HIGH_DEFINED_SUMMARY,
        )

        overall_chain = overall_prompt_template | gpt_41_client
        
        try:
            response = overall_chain.invoke(
                {
                    "regwatch_report": regwatch_report,
                    "gazette_report": gazette_report,
                    "bill_report": bill_report,
                    "fines_report": fines_report,
                    "today": today,
                }
            )
            
            overall_report = {
                "_id": _id,
                "date_added": datetime.now(),
                "content": response.content,
                "report_type": "overall_report",
                "start_date": start_datetime.strftime("%Y-%m-%d"),
                "end_date": end_datetime.strftime("%Y-%m-%d"),
                "jurisdiction": jurisdiction,
                "multi_country": False,
            }

        except Exception as e:
            logger.exception(f"Error during single country overall report generation: {e}")
            return

    try:
        canvas_col.insert_one(overall_report)
        logger.info(f'Inserted overall report: {overall_report["_id"]}')
    except pymongo.errors.DuplicateKeyError:
        logger.warning(f"Skipped duplicate overall report: {overall_report['_id']}")
    except Exception as e:
        logger.exception(f"Error inserting overall report: {e}")


def main(days=7, jurisdiction=None):
    end_datetime = datetime.today()
    start_datetime = end_datetime - timedelta(days=days)

    if jurisdiction and not isinstance(jurisdiction, list):
        jurisdiction = [jurisdiction]

    generate_reg_watch_report(start_datetime, end_datetime, jurisdiction)
    generate_bills_report(start_datetime, end_datetime, jurisdiction)
    generate_gazette_reports(start_datetime, end_datetime, jurisdiction)
    generate_fines_and_penalties_regwatch_report(start_datetime, end_datetime, jurisdiction)
    
    if isinstance(jurisdiction, list) and len(jurisdiction) > 1:
        for single_jurisdiction in jurisdiction:
            generate_country_specific_summary(start_datetime, end_datetime, single_jurisdiction)
    
    generate_overall_summary(start_datetime, end_datetime, jurisdiction)


if __name__ == "__main__":
    main()












DPO_REGWATCH_SUMMARY_PROMPT = """
# Role and Objective
You are a highly qualified Data Protection Officer (DPO) who is tasked with generating comprehensive and detailed reports using the regulatory data provided. Your expertise spans global data privacy laws, cybersecurity compliance, cross-border data flows, regulatory enforcement, and privacy-by-design principles.

# Instructions
1. Read and thoroughly analyse the given Regulatory News Documents in the section below.
2. If the section "# Regulatory News" contains "[NO DATA AVAILABLE]" or is empty, do not generate a report. Instead, return only:
"No regulatory news provided for the given date range."
3. Otherwise:
    - Categorize the data based on dates, jurisdictions, and data protection domains (compliance, enforcement, legislative updates, etc.)
    - Generate the report - include report date and date range at the beginning
    - Focus on privacy risks, regulatory developments, enforcement actions, and compliance implications
    - Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided in the reports—do not include assumptions, interpretations beyond the data, or external references.

# Reasoning Steps
1. Understanding the document: Break down each document and assess the regulatory, legal, or policy changes relevant to data protection.
2. Context analysis: Identify related updates in the dataset to understand common patterns or developments.
3. Impact assessment: Evaluate how these regulatory changes may impact data controllers, processors, or organizations managing personal data.
4. Summarization: Generate a high-level summary suitable for senior privacy professionals.

# Focus Areas
- Personal data handling and lawful processing requirements
- International data transfer frameworks and adequacy decisions
- Cybersecurity and data breach reporting obligations
- Enforcement actions and penalties
- Regulatory trends in consent, transparency, and data subject rights
- Emerging risks and data privacy best practices

# Regulatory News
{reg_watch_documents}

# Today's Date
{today}

# Your response
"""


DPO_GAZETTE_SUMMARY_PROMPT = """
# Role and Objective
You are a highly qualified Data Protection Officer (DPO) tasked with producing formal summaries from official government gazettes. These gazettes contain legal instruments, regulatory amendments, and administrative rulings that impact data protection and privacy.

# Instructions
1. Read and thoroughly analyse the Gazette Documents provided below.
2. If the section "# Gazettes" contains "[NO DATA AVAILABLE]" or is empty, return only:
"No gazette data provided for the given date range."
3. Otherwise:
    - Categorize the data by dates, jurisdictions, and relevance to data protection
    - Generate a formal report highlighting key regulatory changes and compliance obligations
    - Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not add assumptions or external interpretations.

# Reasoning Steps
1. Understanding the gazette: Interpret any published data protection law changes or administrative orders.
2. Contextual analysis: Link similar entries to present a broader picture of regulatory change.
3. Compliance impact: Highlight changes requiring policy, technical, or organizational adjustments.
4. Summarization: Generate a structured report that serves privacy officers and legal counsel.

# Focus Areas
- Amendments to data protection regulations
- New obligations for controllers and processors
- Government-led cybersecurity or surveillance policies
- Regulatory deadlines and compliance requirements
- Procedural updates affecting data subjects or businesses

# Gazettes
{gazette_documents}

# Today's Date
{today}

# Your response
"""


DPO_BILL_SUMMARY_PROMPT = """
# Role and Objective
You are a highly qualified Data Protection Officer (DPO) responsible for analyzing data protection-related legislative bills under discussion in national or regional parliaments. Your report must assess legal developments and their potential compliance impacts.

# Instructions
1. Read and thoroughly analyse the Bills in Parliament listed below.
2. If the section "# Bills" contains "[NO DATA AVAILABLE]" or is empty, return only:
"No bills data provided for the given date range."
3. Otherwise:
    - Categorize data by date, jurisdiction, and privacy relevance
    - For each bill, clearly mention its title, sponsors, introduction date, current legislative status, and key privacy provisions
    - Include report date and date range
    - Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not introduce assumptions or external context.

# Reasoning Steps
1. Understanding the bill: Review proposed changes and analyze their scope and privacy impact.
2. Contextual alignment: Group similar bills to identify trends in privacy regulation.
3. Legislative impact: Evaluate potential obligations and organizational risks.
4. Summarization: Present actionable insights to legal and compliance teams.

# Focus Areas
- Data protection and privacy legislative reform
- Expansion or restriction of data subject rights
- Cross-border data transfer and data localization proposals
- Consent, transparency, and legal basis changes
- Regulatory bodies’ powers and oversight mechanisms

# Bills
{bills_documents}

# Today's Date
{today}

# Your response
"""


DPO_FINES_PENALTIES_SUMMARY_REPORT = """
# Role and Objective
You are a highly qualified Data Protection Officer (DPO) specializing in compliance monitoring and enforcement analysis. Your task is to produce detailed reports on fines and penalties related to data protection violations globally.

# Instructions
1. Read and thoroughly analyse the data protection enforcement news provided below.
2. If the section "# Fines News" contains "[NO DATA AVAILABLE]" or is empty, return only:
"No enforcement actions or fines data provided for the given date range."
3. Otherwise:
    - Categorize entries by date, jurisdiction, organization penalized, and type of violation
    - Detail enforcement agency, fine amount, nature of breach, and corrective measures (if available)
    - Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not introduce assumptions or external conclusions.

# Reasoning Steps
1. Understanding the enforcement case: Identify the privacy principle or regulation violated.
2. Contextual linkage: Group similar cases to identify systemic trends.
3. Enforcement pattern: Assess regulators' focus and risk areas for non-compliance.
4. Summarization: Produce an enforcement-focused report to guide internal audits and remediation.

# Focus Areas
- GDPR and equivalent regulation enforcement
- Security breaches and breach notification failures
- Unlawful data processing and consent violations
- Non-cooperation with supervisory authorities
- Trends in regulatory priorities and penalties

# Fines News
{fines_penalties_reg_watch}

# Today's Date
{today}

# Your response
"""

DPO_HIGH_DEFINED_SUMMARY = """
# Role and Objective
You are a senior Data Protection Officer (DPO Supervisor) responsible for consolidating and analyzing expert reports prepared by privacy analysts. Your task is to deliver a high-level executive summary covering all significant developments in data protection and regulatory compliance.

# Instructions
1. Read and thoroughly analyse the provided reports related to regulatory news, gazettes, legislative bills, and enforcement actions.
2. Categorize information by date, jurisdiction, and relevance to data protection compliance.
3. For each bill, include sponsor details, current stage, and organizational impact.
4. Highlight all fines and penalties with case-specific details.
5. If any section contains "[NO DATA AVAILABLE]" or is empty, include: "No data available within the given date range" for that section.
6. Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not include assumptions or external references.

# Reasoning Steps
1. Document comprehension: Analyze all sections to understand the full scope of privacy and regulatory updates.
2. Pattern identification: Detect overlapping trends and align updates across documents.
3. Strategic relevance: Highlight compliance risks, legal exposure, and operational impacts.
4. Executive synthesis: Deliver a cohesive and actionable report for senior stakeholders.

# Focus Areas
- Data protection regulatory trends
- Legislative developments and policy shifts
- Supervisory authority actions and enforcement risks
- Cross-border data transfer frameworks
- Recommendations for compliance strategy and data governance

# Regulatory News Report
{regwatch_report}

# Gazettes Report
{gazette_report}

# Bills in Parliament Report
{bill_report}

# Enforcement Actions Report
{fines_report}

# Today's Date
{today}

# Your response
"""

DPO_CHUNK_CONSOLIDATION_PROMPT = """
# Role and Objective
You are a highly qualified Data Protection Officer (DPO) tasked with consolidating multiple segmented reports into a unified and detailed data protection report. Your report will serve as a comprehensive privacy compliance document for internal stakeholders.

# Instructions
1. Read and thoroughly analyse all the chunk reports provided.
2. If the section "# Chunk Reports" contains "[NO DATA AVAILABLE]" or is empty, return only:
"No data protection updates available for the given date range."
3. Otherwise:
    - Consolidate all insights into a single, coherent report
    - Eliminate duplicate content while preserving distinct insights
    - Maintain logical flow and categorize by jurisdiction and compliance themes
    - Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not introduce interpretations or outside references.

# Reasoning Steps
1. Interpretation: Extract key updates from each chunk
2. Categorization: Classify by regulation type, enforcement, or policy area
3. Consolidation: Merge and prioritize without loss of important detail
4. Summary: Generate a clean, actionable DPO-level report

# Data Protection Focus Areas
- Legal and regulatory updates
- Cross-border transfer frameworks
- Technical and organizational compliance
- Breach notification enforcement
- Consent and data subject rights
- Risk mitigation and privacy operations

# Chunk Reports
{chunk_reports}

# Today's Date
{today}

# Your response should be a full consolidated privacy compliance report.
"""

DPO_COUNTRY_SPECIFIC_SUMMARY = """
# Role and Objective
You are a highly qualified Data Protection Officer (DPO) responsible for generating comprehensive country-specific data protection reports. Your task is to consolidate regulatory news, gazettes, bills, and enforcement actions for a specific jurisdiction into a unified compliance report.

# Instructions
1. Read and thoroughly analyse the provided reports for the specific jurisdiction.
2. Create a structured report with four main sections:
   - Regulatory News Updates
   - Government Gazette Notices
   - Legislative Bills in Parliament
   - Enforcement Actions and Penalties
3. For each section, if data is empty or contains "[NO DATA AVAILABLE]", include: "No data available for this category within the given date range"
4. Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not include assumptions or external references.

# Reasoning Steps
1. Jurisdiction analysis: Focus specifically on the provided country's regulatory landscape
2. Section organization: Structure content by data type while maintaining coherence
3. Risk assessment: Highlight jurisdiction-specific compliance risks and obligations
4. Strategic summary: Provide actionable insights for country-specific operations

# Focus Areas
- Country-specific data protection regulations and amendments
- Local enforcement trends and supervisory authority actions
- Cross-border data transfer implications
- Sector-specific compliance requirements
- Regulatory deadlines and implementation timelines

# Country: {jurisdiction}

# Regulatory News Report
{regwatch_report}

# Gazettes Report
{gazette_report}

# Bills in Parliament Report
{bill_report}

# Enforcement Actions Report
{fines_report}

# Today's Date
{today}

# Your response should be a comprehensive country-specific data protection report.
"""

DPO_MULTI_COUNTRY_CONSOLIDATION = """
# Role and Objective
You are a senior Data Protection Officer (DPO Supervisor) responsible for consolidating multiple country-specific data protection reports into a comprehensive multi-jurisdictional analysis. Your report will serve as a strategic overview for global privacy compliance.

# Instructions
1. Read and thoroughly analyse all the country-specific reports provided.
2. Create a consolidated report that:
   - Provides an executive summary of cross-jurisdictional trends
   - Highlights country-specific developments by jurisdiction
   - Identifies common regulatory patterns and enforcement trends
   - Assesses implications for multi-national operations
3. Maintain country-specific insights while identifying broader regulatory themes
4. Report Style and Data Limitation: Present the output as a formal executive report. Use only the information provided—do not introduce assumptions or external references.

# Reasoning Steps
1. Multi-jurisdictional analysis: Extract key developments from each country report
2. Pattern identification: Identify common trends across jurisdictions
3. Risk assessment: Evaluate compliance implications for global operations
4. Strategic synthesis: Provide actionable insights for multi-national privacy strategy

# Focus Areas
- Global data protection regulatory trends
- Cross-border data transfer frameworks and adequacy decisions
- Multi-jurisdictional enforcement patterns
- Harmonization opportunities and regulatory divergence
- Strategic recommendations for global compliance programs

# Country-Specific Reports
{country_reports}

# Today's Date
{today}

# Your response should be a comprehensive multi-jurisdictional data protection analysis.
"""













from flask import Flask, request, jsonify
from flask_cors import cross_origin
from datetime import datetime, timedelta
import re
from generate_reports import main as generate_reports, normalize, canvas_col

app = Flask(__name__)
dpo = app  # Assuming dpo is your Flask app instance

# Assuming you have these imports and setup from your existing code
# from src import logger
# collection = canvas_col  # Your MongoDB collection

def log(func):
    """Decorator for logging"""
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@dpo.route('/dpo', methods=['POST'])
@cross_origin()
@log
def get_documents():
    data = request.get_json()
    print(data)
    
    days = data.get('days', 7)
    jurisdictions = data.get('jurisdictions', [])
    print(f"Days is : {days}, jurisdictions is :{jurisdictions}")
    
    end_datetime = datetime.today()
    start_datetime = end_datetime - timedelta(days=days)
    
    # Normalize jurisdictions to handle both single and multiple jurisdictions
    if jurisdictions and not isinstance(jurisdictions, list):
        jurisdictions = [jurisdictions]
    
    # Generate reports first to ensure they exist
    try:
        print("Generating reports for given filters...")
        # logger.info(f"Generating reports for given filters : days:{days} and jurisdiction : {jurisdictions}")
        generate_reports(days=days, jurisdiction=jurisdictions)
        
        # Query for the generated reports
        documents = []
        
        # For multiple jurisdictions, we expect:
        # - Country reports for each jurisdiction  
        # - One overall multi-country report
        if isinstance(jurisdictions, list) and len(jurisdictions) > 1:
            # Get country reports for each jurisdiction
            for jurisdiction in jurisdictions:
                jurisdiction_part = normalize(jurisdiction)
                country_query = {
                    "start_date": start_datetime.strftime("%Y-%m-%d"),
                    "end_date": end_datetime.strftime("%Y-%m-%d"),
                    "jurisdiction": jurisdiction,
                    "report_type": "country_report"
                }
                country_docs = list(canvas_col.find(country_query))
                documents.extend(country_docs)
            
            # Get overall multi-country report
            jurisdiction_part = "_".join(sorted(normalize(j) for j in jurisdictions))
            overall_query = {
                "start_date": start_datetime.strftime("%Y-%m-%d"),
                "end_date": end_datetime.strftime("%Y-%m-%d"),
                "report_type": "overall_report",
                "multi_country": True
            }
            overall_docs = list(canvas_col.find(overall_query))
            documents.extend(overall_docs)
            
        else:
            # Single jurisdiction or all jurisdictions - original logic
            query = {
                "start_date": start_datetime.strftime("%Y-%m-%d"),
                "end_date": end_datetime.strftime("%Y-%m-%d")
            }
            
            if jurisdictions:
                jurisdiction_value = jurisdictions[0] if isinstance(jurisdictions, list) else jurisdictions
                query['jurisdiction'] = jurisdiction_value
            else:
                query['jurisdiction'] = None
            
            documents = list(canvas_col.find(query))
        
        return jsonify(success=True, data=documents, total_reports=len(documents))
        
    except Exception as e:
        # logger.exception(f"error processing user request : {e}")
        print(f"Error processing user request: {e}")
        return jsonify(success=False, message="Error while creating report"), 404

if __name__ == '__main__':
    app.run(debug=True)

