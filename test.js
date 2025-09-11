
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime, date, timedelta

from api.common.response import Response
from api.common.logger import log
from api.common.auth import authenticate_request
from api.dpo_agent.services.dpo_agent_service import DpoAgentService
from api.dpo_agent.services.dpo_agent_history_service import (
    DpoAgentHistoryService, DpoAgentReportsService, DpoAgentCriticalLevelsService
)

# Create Blueprint
dpo_agent_bp = Blueprint("dpo_agent", __name__)


@dpo_agent_bp.route("/dpo_agent/test", methods=["GET"])
def test_dpo_agent_api():
    """Test endpoint for DPO Agent API"""
    return jsonify({"message": "Successfully Connected to DPO Agent API"})


# DPO Agent CRUD Operations
@dpo_agent_bp.route('/dpo_agent', methods=['POST'])
@authenticate_request
@log
def create_dpo_agent():
    """Create a new DPO Agent"""
    try:
        # Get request data
        data = request.get_json() or {}
        
        # Set defaults for missing fields
        data.setdefault('answer_word_cap', 1000)
        data.setdefault('role_of_users', [])
        data.setdefault('update_frequency', 7)
        data.setdefault('ai_model', 'gpt-4')
        data.setdefault('theme', [])
        data.setdefault('users', [])
        data.setdefault('status', 'active')
        data.setdefault('client_profile', {})
        data.setdefault('jurisdictions', [])
        data.setdefault('industries', [])
        data.setdefault('regulations', [])
        data.setdefault('regulators', [])
        
        # Basic validation
        if not data.get('name'):
            return jsonify({"success": False, "message": "Name is required"}), 400
        
        # Create DPO Agent
        agent = DpoAgentService.create_dpo_agent(data)
        
        # Filter documents and create history entry immediately after agent creation
        try:
            from api.dpo_agent.services.document_filter_service import DocumentFilterService
            
            # Set default date range (last 7 days)
            from_date = data.get('from_date', date.today() - timedelta(days=7))
            to_date = data.get('to_date', date.today())
            
            # Parse dates if they are strings
            if isinstance(from_date, str):
                from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
            if isinstance(to_date, str):
                to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
            
            # Filter documents using themes (same as reference files use data_protection theme)
            agent_themes = data.get('theme', ['data_protection'])  # Default to data_protection like reference files
            
            filtered_uuids = DocumentFilterService.filter_and_store_documents(
                agent_themes=agent_themes,
                start_date=datetime.combine(from_date, datetime.min.time()),
                end_date=datetime.combine(to_date, datetime.max.time()),
                jurisdictions=data.get('jurisdictions', []),
                regulators=data.get('regulators', []),
                regulations=data.get('regulations', [])
            )
            
            # Create history entry with filtered document UUIDs
            history_data = {
                'dpo_agent_id': agent['id'],
                'name': data.get('name'),
                'industry': data.get('industries', []),
                'theme': agent_themes,
                'role_of_users': data.get('role_of_users', []),
                'regulator': data.get('regulators', []),
                'regulation': data.get('regulations', []),
                'jurisdiction': data.get('jurisdictions', []),
                'from_date': from_date,
                'to_date': to_date,
                'ai_model': data.get('ai_model', 'gpt-4'),
                'answer_word_cap': data.get('answer_word_cap', 1000),
                # Store filtered document UUIDs
                'bills_retrieved': filtered_uuids.get('bills_uuids', []),
                'gazette_retrieved': filtered_uuids.get('gazette_uuids', []),
                'regwatch_retrieved': filtered_uuids.get('regwatch_uuids', []),
                # Set all status fields to pending
                'status_check_overall_report': {'status': 'pending'},
                'status_check_jurisdiction_report': {'status': 'pending'},
                'status_check_critical_report': {'status': 'pending'},
                'status_check_critical_level': {'status': 'pending'},
                'execution_status': 'pending'
            }
            
            # Create history entry
            history = DpoAgentHistoryService.create_history(history_data)
            
            return jsonify({
                "success": True,
                "message": "DPO Agent created successfully with document filtering and history",
                "data": {
                    "agent": agent,
                    "history": history,
                    "filtered_documents": {
                        "bills_count": len(filtered_uuids.get('bills_uuids', [])),
                        "gazette_count": len(filtered_uuids.get('gazette_uuids', [])),
                        "regwatch_count": len(filtered_uuids.get('regwatch_uuids', []))
                    }
                }
            })
            
        except Exception as filter_error:
            # If filtering fails, still return the agent
            return jsonify({
                "success": True,
                "message": "DPO Agent created successfully, but document filtering failed",
                "data": agent,
                "error": f"Document filtering error: {str(filter_error)}"
            })
        
        return jsonify({
            "success": True,
            "message": "DPO Agent created successfully",
            "data": agent
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error creating DPO Agent: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/<int:agent_id>', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent(agent_id):
    """Get DPO Agent by ID with relationships"""
    try:
        agent = DpoAgentService.get_dpo_agent_by_id(agent_id)
        
        if not agent:
            return jsonify({"success": False, "message": "DPO Agent not found"}), 404
        
        # Get relationships
        relationships = DpoAgentService.get_agent_relationships(agent_id)
        
        agent_data = agent.copy()
        agent_data.update(relationships)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent retrieved successfully",
            "data": agent_data
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent', methods=['GET'])
@authenticate_request
@log
def get_dpo_agents():
    """Get DPO Agents with filters and pagination"""
    try:
        # Get query parameters with defaults
        filters = {
            'page': int(request.args.get('page', 1)),
            'per_page': int(request.args.get('per_page', 10)),
            'search': request.args.get('search', ''),
            'status': request.args.get('status'),
            'theme': request.args.getlist('theme'),
            'user_id': int(request.args.get('user_id')) if request.args.get('user_id') else None,
            'jurisdiction_id': int(request.args.get('jurisdiction_id')) if request.args.get('jurisdiction_id') else None,
            'industry_id': int(request.args.get('industry_id')) if request.args.get('industry_id') else None,
            'sort_by': request.args.get('sort_by', 'created_at'),
            'sort_order': request.args.get('sort_order', 'desc')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Get agents
        result = DpoAgentService.get_dpo_agents(filters)
        
        return jsonify({
            "success": True,
            "message": "DPO Agents retrieved successfully",
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agents: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/<int:agent_id>', methods=['PUT'])
@authenticate_request
@log
def update_dpo_agent(agent_id):
    """Update DPO Agent"""
    try:
        # Get request data
        data = request.get_json() or {}
        
        # Update agent
        agent = DpoAgentService.update_dpo_agent(agent_id, data)
        
        if not agent:
            return jsonify({"success": False, "message": "DPO Agent not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "DPO Agent updated successfully",
            "data": agent
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error updating DPO Agent: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/<int:agent_id>', methods=['DELETE'])
@authenticate_request
@log
def delete_dpo_agent(agent_id):
    """Delete DPO Agent"""
    try:
        success = DpoAgentService.delete_dpo_agent(agent_id)
        
        if not success:
            return jsonify({"success": False, "message": "DPO Agent not found"}), 404
        
        return jsonify({"success": True, "message": "DPO Agent deleted successfully"})
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error deleting DPO Agent: {str(e)}"
        }), 500


# DPO Agent Execution
@dpo_agent_bp.route('/dpo_agent/<int:agent_id>/execute', methods=['POST'])
@authenticate_request
@log
def execute_dpo_agent(agent_id):
    """Execute DPO Agent pipeline"""
    try:
        # Get request data
        data = request.get_json() or {}
        
        # Get agent to check update_frequency
        agent = DpoAgentService.get_dpo_agent_by_id(agent_id)
        if not agent:
            return jsonify({"success": False, "message": "DPO Agent not found"}), 404
        
        # Use agent's update_frequency for default date range
        update_frequency = agent.get('update_frequency', 7)  # Default to 7 if not set
        
        # Set defaults based on agent's update_frequency
        execution_data = {
            'dpo_agent_id': agent_id,
            'from_date': date.today() - timedelta(days=update_frequency),
            'to_date': date.today(),
            'override_jurisdictions': data.get('override_jurisdictions', []),
            'override_regulators': data.get('override_regulators', []),
            'override_regulations': data.get('override_regulations', [])
        }
        
        # Parse dates if provided (overrides agent's update_frequency)
        if data.get('from_date'):
            execution_data['from_date'] = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
        if data.get('to_date'):
            execution_data['to_date'] = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
        
        # Execute agent
        history = DpoAgentService.execute_dpo_agent(agent_id, execution_data)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent execution started",
            "data": history
        })
        
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error executing DPO Agent: {str(e)}"
        }), 500


# Individual Report Generation Endpoints
@dpo_agent_bp.route('/dpo_agent/<int:agent_id>/execute/overall', methods=['POST'])
@authenticate_request
@log
def execute_overall_report(agent_id):
    """Execute only overall report generation for a specific agent"""
    try:
        result = DpoAgentService.execute_overall_report(agent_id)
        
        if "error" in result:
            return jsonify({
                "success": False,
                "message": result["message"],
                "error": result["error"]
            }), 500
        
        return jsonify({
            "success": True,
            "message": result["message"],
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error executing overall report: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/<int:agent_id>/execute/jurisdiction', methods=['POST'])
@authenticate_request
@log
def execute_jurisdiction_report(agent_id):
    """Execute only jurisdiction report generation for a specific agent"""
    try:
        result = DpoAgentService.execute_jurisdiction_report(agent_id)
        
        if "error" in result:
            return jsonify({
                "success": False,
                "message": result["message"],
                "error": result["error"]
            }), 500
        
        return jsonify({
            "success": True,
            "message": result["message"],
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error executing jurisdiction report: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/<int:agent_id>/execute/critical', methods=['POST'])
@authenticate_request
@log
def execute_critical_report(agent_id):
    """Execute only critical report generation for a specific agent"""
    try:
        result = DpoAgentService.execute_critical_report(agent_id)
        
        if "error" in result:
            return jsonify({
                "success": False,
                "message": result["message"],
                "error": result["error"]
            }), 500
        
        return jsonify({
            "success": True,
            "message": result["message"],
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error executing critical report: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/<int:agent_id>/execute/critical_level', methods=['POST'])
@authenticate_request
@log
def execute_critical_level_report(agent_id):
    """Execute only critical level report generation for a specific agent"""
    try:
        result = DpoAgentService.execute_critical_level_report(agent_id)
        
        if "error" in result:
            return jsonify({
                "success": False,
                "message": result["message"],
                "error": result["error"]
            }), 500
        
        return jsonify({
            "success": True,
            "message": result["message"],
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error executing critical level report: {str(e)}"
        }), 500


# DPO Agent History
@dpo_agent_bp.route('/dpo_agent/history', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_history():
    """Get DPO Agent execution history"""
    try:
        # Get query parameters with defaults
        filters = {
            'dpo_agent_id': int(request.args.get('dpo_agent_id')) if request.args.get('dpo_agent_id') else None,
            'page': int(request.args.get('page', 1)),
            'per_page': int(request.args.get('per_page', 10)),
            'execution_status': request.args.get('execution_status'),
            'sort_by': request.args.get('sort_by', 'created_at'),
            'sort_order': request.args.get('sort_order', 'desc')
        }
        
        # Parse dates if provided
        if request.args.get('from_date'):
            filters['from_date'] = datetime.strptime(request.args.get('from_date'), '%Y-%m-%d').date()
        if request.args.get('to_date'):
            filters['to_date'] = datetime.strptime(request.args.get('to_date'), '%Y-%m-%d').date()
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Get history
        result = DpoAgentHistoryService.get_agent_history(filters)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent history retrieved successfully",
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent history: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/history/<int:history_id>', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_history_by_id(history_id):
    """Get DPO Agent history by ID"""
    try:
        history = DpoAgentHistoryService.get_history_by_id(history_id)
        
        if not history:
            return jsonify({"success": False, "message": "DPO Agent history not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "DPO Agent history retrieved successfully",
            "data": history.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent history: {str(e)}"
        }), 500


# DPO Agent Reports
@dpo_agent_bp.route('/dpo_agent/reports', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_reports():
    """Get DPO Agent reports"""
    try:
        # Get query parameters with defaults
        filters = {
            'dpo_agent_history_id': int(request.args.get('dpo_agent_history_id')) if request.args.get('dpo_agent_history_id') else None,
            'dpo_agent_id': int(request.args.get('dpo_agent_id')) if request.args.get('dpo_agent_id') else None,
            'jurisdiction': request.args.get('jurisdiction'),
            'report_type': request.args.get('report_type'),
            'page': int(request.args.get('page', 1)),
            'per_page': int(request.args.get('per_page', 10)),
            'sort_by': request.args.get('sort_by', 'created_at'),
            'sort_order': request.args.get('sort_order', 'desc')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Get reports
        result = DpoAgentReportsService.get_reports(filters)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent reports retrieved successfully",
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent reports: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/reports/<int:report_id>', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_report_by_id(report_id):
    """Get DPO Agent report by ID"""
    try:
        report_type = request.args.get('report_type', 'overall')
        report = DpoAgentReportsService.get_report_by_id(report_id, report_type)
        
        if not report:
            return jsonify({"success": False, "message": "DPO Agent report not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "DPO Agent report retrieved successfully",
            "data": report.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent report: {str(e)}"
        }), 500


# DPO Agent Critical Levels
@dpo_agent_bp.route('/dpo_agent/critical_levels', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_critical_levels():
    """Get DPO Agent critical levels"""
    try:
        # Get query parameters with defaults
        filters = {
            'dpo_agent_history_id': int(request.args.get('dpo_agent_history_id')) if request.args.get('dpo_agent_history_id') else None,
            'dpo_agent_id': int(request.args.get('dpo_agent_id')) if request.args.get('dpo_agent_id') else None,
            'level': request.args.get('level'),
            'jurisdiction': request.args.get('jurisdiction'),
            'type': request.args.get('type'),
            'severity_score_min': int(request.args.get('severity_score_min')) if request.args.get('severity_score_min') else None,
            'severity_score_max': int(request.args.get('severity_score_max')) if request.args.get('severity_score_max') else None,
            'page': int(request.args.get('page', 1)),
            'per_page': int(request.args.get('per_page', 10)),
            'sort_by': request.args.get('sort_by', 'created_at'),
            'sort_order': request.args.get('sort_order', 'desc')
        }
        
        # Parse dates if provided
        if request.args.get('date_from'):
            filters['date_from'] = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d').date()
        if request.args.get('date_to'):
            filters['date_to'] = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d').date()
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Get critical levels
        result = DpoAgentCriticalLevelsService.get_critical_levels(filters)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent critical levels retrieved successfully",
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent critical levels: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/critical_levels/summary', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_critical_levels_summary():
    """Get DPO Agent critical levels summary"""
    try:
        # Get query parameters (same as critical levels but for summary)
        filters = {
            'dpo_agent_history_id': int(request.args.get('dpo_agent_history_id')) if request.args.get('dpo_agent_history_id') else None,
            'dpo_agent_id': int(request.args.get('dpo_agent_id')) if request.args.get('dpo_agent_id') else None
        }
        
        # Parse dates if provided
        if request.args.get('date_from'):
            filters['date_from'] = datetime.strptime(request.args.get('date_from'), '%Y-%m-%d').date()
        if request.args.get('date_to'):
            filters['date_to'] = datetime.strptime(request.args.get('date_to'), '%Y-%m-%d').date()
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        # Get summary
        result = DpoAgentCriticalLevelsService.get_critical_level_summary(filters)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent critical levels summary retrieved successfully",
            "data": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent critical levels summary: {str(e)}"
        }), 500


# Utility endpoints
@dpo_agent_bp.route('/dpo_agent/<int:agent_id>/relationships', methods=['GET'])
@authenticate_request
@log
def get_dpo_agent_relationships(agent_id):
    """Get DPO Agent relationships"""
    try:
        agent = DpoAgentService.get_dpo_agent_by_id(agent_id)
        
        if not agent:
            return jsonify({"success": False, "message": "DPO Agent not found"}), 404
        
        relationships = DpoAgentService.get_agent_relationships(agent_id)
        
        return jsonify({
            "success": True,
            "message": "DPO Agent relationships retrieved successfully",
            "data": relationships
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving DPO Agent relationships: {str(e)}"
        }), 500


@dpo_agent_bp.route('/dpo_agent/history/<int:history_id>/status', methods=['PUT'])
@authenticate_request
@log
def update_execution_status(history_id):
    """Update execution status of DPO Agent history"""
    try:
        data = request.get_json()
        status = data.get('status')
        error_message = data.get('error_message')
        
        if not status:
            return jsonify({"success": False, "message": "Status is required"}), 400
        
        success = DpoAgentHistoryService.update_execution_status(
            history_id, status, error_message
        )
        
        if not success:
            return jsonify({"success": False, "message": "DPO Agent history not found"}), 404
        
        return jsonify({"success": True, "message": "Execution status updated successfully"})
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error updating execution status: {str(e)}"
        }), 500






















//service












from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
from sqlalchemy import and_, or_, desc, asc, select, update, delete, insert, func, Table
from bson import ObjectId
from api import db, logger
from api.db import get_session
from api.common.auth import mongo_client


class DpoAgentService:
    """Service class for DPO Agent operations with separate report generation"""

    @staticmethod
    def create_agent(data: Dict) -> Dict:
        """Create a new DPO Agent"""
        session = db.session
        try:
            DpoAgentTable = Table('dpo_agent', db.metadata, autoload=True)
            
            # Set timestamps
            data['created_at'] = func.now()
            data['updated_at'] = func.now()
            
            # Insert new agent
            insert_query = insert(DpoAgentTable).values(**data)
            result = session.execute(insert_query)
            session.flush()
            
            agent_id = result.inserted_primary_key[0]
            
            # Create relationships
            DpoAgentService._create_relationships(
                session, agent_id, data.get('jurisdictions', []), 
                data.get('industries', []), data.get('regulations', []), 
                data.get('regulators', [])
            )
            
            # Return created agent
            select_query = select(DpoAgentTable).where(DpoAgentTable.c.id == agent_id)
            agent_record = session.execute(select_query).first()
            
            session.commit()
            return dict(agent_record._mapping)
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating agent: {str(e)}")
            raise e

    @staticmethod
    def _create_relationships(session, agent_id: int, jurisdictions: List, industries: List, regulations: List, regulators: List):
        """Create agent relationships using Table inserts"""
        try:
            # Agent Jurisdictions
            if jurisdictions:
                JurisdictionsTable = Table('dpo_agent_jurisdictions', db.metadata, autoload=True)
                for jurisdiction_id in jurisdictions:
                    jurisdiction_data = {
                        'dpo_agent_id': agent_id,
                        'jurisdiction_id': jurisdiction_id,
                        'created_at': func.now()
                    }
                    insert_jurisdiction = insert(JurisdictionsTable).values(**jurisdiction_data)
                    session.execute(insert_jurisdiction)
            
            # Agent Industries
            if industries:
                IndustriesTable = Table('dpo_agent_industries', db.metadata, autoload=True)
                for industry_id in industries:
                    industry_data = {
                        'dpo_agent_id': agent_id,
                        'industry_id': industry_id,
                        'created_at': func.now()
                    }
                    insert_industry = insert(IndustriesTable).values(**industry_data)
                    session.execute(insert_industry)
            
            # Agent Regulations
            if regulations:
                RegulationsTable = Table('dpo_agent_regulations', db.metadata, autoload=True)
                for regulation_id in regulations:
                    regulation_data = {
                        'dpo_agent_id': agent_id,
                        'regulation_id': regulation_id,
                        'created_at': func.now()
                    }
                    insert_regulation = insert(RegulationsTable).values(**regulation_data)
                    session.execute(insert_regulation)
            
            # Agent Regulators
            if regulators:
                RegulatorsTable = Table('dpo_agent_regulators', db.metadata, autoload=True)
                for regulator_id in regulators:
                    regulator_data = {
                        'dpo_agent_id': agent_id,
                        'regulator_id': regulator_id,
                        'created_at': func.now()
                    }
                    insert_regulator = insert(RegulatorsTable).values(**regulator_data)
                    session.execute(insert_regulator)
                    
        except Exception as e:
            logger.error(f"Error creating relationships: {str(e)}")
            raise e

    @staticmethod
    def execute_overall_report(agent_id: int) -> Dict:
        """Execute overall report generation for a specific agent"""
        session = db.session
        try:
            # Step 1: Get agent details to calculate date range from update_frequency
            AgentTable = Table('dpo_agent', db.metadata, autoload=True)
            agent_query = select(AgentTable).where(AgentTable.c.id == agent_id)
            agent_record = session.execute(agent_query).first()
            
            if not agent_record:
                return {"error": "Agent not found", "message": f"No agent found with ID {agent_id}"}

            agent = dict(agent_record._mapping)
            
            # Step 2: Calculate date range based on agent's update_frequency
            update_frequency = agent.get('update_frequency', 7)
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=update_frequency)
            
            # Step 3: Search for existing history in the date range
            HistoryTable = Table('dpo_agent_history', db.metadata, autoload=True)
            history_query = select(HistoryTable).where(
                and_(
                    HistoryTable.c.dpo_agent_id == agent_id,
                    HistoryTable.c.from_date == start_date,
                    HistoryTable.c.to_date == end_date
                )
            ).order_by(desc(HistoryTable.c.created_at))
            
            history_record = session.execute(history_query).first()
            
            # Step 4: If no history exists, create new history first
            if not history_record:
                history_id = DpoAgentService._create_new_history(session, agent_id, agent, start_date, end_date)
                
                # Get the newly created history record
                history_query = select(HistoryTable).where(HistoryTable.c.id == history_id)
                history_record = session.execute(history_query).first()
            
            history_id = history_record.id
            
            # Step 5: Check overall report status
            overall_status = history_record.status_check_overall_report or {}
            
            # Step 6: If completed, return existing report from table
            if isinstance(overall_status, dict) and overall_status.get('status') == 'completed':
                # Get existing report from table
                ReportsTable = Table('dpo_agent_reports', db.metadata, autoload=True)
                report_query = select(ReportsTable).where(
                    and_(
                        ReportsTable.c.dpo_agent_history_id == history_id,
                        ReportsTable.c.report_type == 'overall'
                    )
                )
                existing_report = session.execute(report_query).first()
                
                if existing_report:
                    return {
                        'history_id': history_id,
                        'report': existing_report.citation or existing_report.summary,
                        'message': 'Overall report already completed',
                        'status': 'already_completed'
                    }
            
            # Step 7: If pending or not present, generate report
            if not overall_status or overall_status.get('status') in ['pending', None]:
                # Get retrieved document UUIDs from history
                bills_uuids = history_record.bills_retrieved or []
                gazette_uuids = history_record.gazette_retrieved or []
                regwatch_uuids = history_record.regwatch_retrieved or []
                
                if not any([bills_uuids, gazette_uuids, regwatch_uuids]):
                    return {"error": "No documents found", "message": "No retrieved documents found in history"}
                
                try:
                    # Generate overall report using LLM based on retrieved documents
                    overall_report = DpoAgentService._generate_overall_report_from_documents(
                        session, history_id, bills_uuids, gazette_uuids, regwatch_uuids, history_record
                    )
                    
                    # Update status to completed
                    DpoAgentService._update_report_status(session, history_id, 'status_check_overall_report', 'completed')
                    session.commit()
                    
                    return {
                        'history_id': history_id,
                        'execution_status': 'completed',
                        'report': overall_report,
                        'message': 'Overall report generated successfully'
                    }
                    
                except Exception as e:
                    logger.error(f"Error generating overall report: {str(e)}")
                    DpoAgentService._update_report_status(session, history_id, 'status_check_overall_report', 'failed')
                    session.commit()
                    return {"error": str(e), "message": "Failed to generate overall report"}
            else:
                return {
                    'history_id': history_id,
                    'message': f'Overall report status is {overall_status.get("status")}',
                    'status': overall_status.get('status')
                }
                
        except Exception as e:
            logger.error(f"Error in execute_overall_report: {str(e)}")
            session.rollback()
            return {"error": str(e), "message": "Failed to execute overall report"}

    @staticmethod
    def execute_jurisdiction_report(agent_id: int) -> Dict:
        """Execute jurisdiction report generation for a specific agent"""
        session = db.session
        try:
            # Step 1: Get agent details and calculate date range
            AgentTable = Table('dpo_agent', db.metadata, autoload=True)
            agent_query = select(AgentTable).where(AgentTable.c.id == agent_id)
            agent_record = session.execute(agent_query).first()
            
            if not agent_record:
                return {"error": "Agent not found", "message": f"No agent found with ID {agent_id}"}

            agent = dict(agent_record._mapping)
            update_frequency = agent.get('update_frequency', 7)
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=update_frequency)
            
            # Step 2: Search for existing history in date range
            HistoryTable = Table('dpo_agent_history', db.metadata, autoload=True)
            history_query = select(HistoryTable).where(
                and_(
                    HistoryTable.c.dpo_agent_id == agent_id,
                    HistoryTable.c.from_date == start_date,
                    HistoryTable.c.to_date == end_date
                )
            ).order_by(desc(HistoryTable.c.created_at))
            
            history_record = session.execute(history_query).first()
            
            # Step 3: Create new history if not exists
            if not history_record:
                history_id = DpoAgentService._create_new_history(session, agent_id, agent, start_date, end_date)
                history_query = select(HistoryTable).where(HistoryTable.c.id == history_id)
                history_record = session.execute(history_query).first()
            
            history_id = history_record.id
            
            # Step 4: Check jurisdiction report status
            jurisdiction_status = history_record.status_check_jurisdiction_report or {}
            
            # Step 5: If completed, return existing reports from table
            if isinstance(jurisdiction_status, dict) and jurisdiction_status.get('status') == 'completed':
                JurisdictionReportsTable = Table('dpo_agent_jurisdiction_reports', db.metadata, autoload=True)
                reports_query = select(JurisdictionReportsTable).where(
                    JurisdictionReportsTable.c.dpo_agent_history_id == history_id
                )
                existing_reports = session.execute(reports_query).fetchall()
                
                if existing_reports:
                    reports_data = [{'jurisdiction': r.jurisdiction, 'report': r.citation or r.summary} for r in existing_reports]
                    return {
                        'history_id': history_id,
                        'reports': reports_data,
                        'message': 'Jurisdiction reports already completed',
                        'status': 'already_completed'
                    }
            
            # Step 6: If pending, generate reports
            if not jurisdiction_status or jurisdiction_status.get('status') in ['pending', None]:
                bills_uuids = history_record.bills_retrieved or []
                gazette_uuids = history_record.gazette_retrieved or []
                regwatch_uuids = history_record.regwatch_retrieved or []
                
                if not any([bills_uuids, gazette_uuids, regwatch_uuids]):
                    return {"error": "No documents found", "message": "No retrieved documents found in history"}
                
                try:
                    jurisdiction_reports = DpoAgentService._generate_jurisdiction_reports_from_documents(
                        session, history_id, bills_uuids, gazette_uuids, regwatch_uuids, history_record
                    )
                    
                    DpoAgentService._update_report_status(session, history_id, 'status_check_jurisdiction_report', 'completed')
                    session.commit()
                    
                    return {
                        'history_id': history_id,
                        'execution_status': 'completed',
                        'reports': jurisdiction_reports,
                        'message': 'Jurisdiction reports generated successfully'
                    }
                    
                except Exception as e:
                    logger.error(f"Error generating jurisdiction reports: {str(e)}")
                    DpoAgentService._update_report_status(session, history_id, 'status_check_jurisdiction_report', 'failed')
                    session.commit()
                    return {"error": str(e), "message": "Failed to generate jurisdiction reports"}
            else:
                return {
                    'history_id': history_id,
                    'message': f'Jurisdiction report status is {jurisdiction_status.get("status")}',
                    'status': jurisdiction_status.get('status')
                }
                
        except Exception as e:
            logger.error(f"Error in execute_jurisdiction_report: {str(e)}")
            session.rollback()
            return {"error": str(e), "message": "Failed to execute jurisdiction report"}

    @staticmethod
    def execute_critical_report(agent_id: int) -> Dict:
        """Execute critical report generation for a specific agent"""
        return DpoAgentService._execute_report_with_history_check(agent_id, 'critical', 'status_check_critical_report')

    @staticmethod
    def execute_critical_level_report(agent_id: int) -> Dict:
        """Execute critical level report generation for a specific agent"""
        return DpoAgentService._execute_report_with_history_check(agent_id, 'critical_level', 'status_check_critical_level')

    @staticmethod
    def _execute_report_with_history_check(agent_id: int, report_type: str, status_field: str) -> Dict:
        """Generic method to execute reports with proper history checking"""
        session = db.session
        try:
            # Step 1: Get agent and calculate date range
            AgentTable = Table('dpo_agent', db.metadata, autoload=True)
            agent_query = select(AgentTable).where(AgentTable.c.id == agent_id)
            agent_record = session.execute(agent_query).first()
            
            if not agent_record:
                return {"error": "Agent not found", "message": f"No agent found with ID {agent_id}"}

            agent = dict(agent_record._mapping)
            update_frequency = agent.get('update_frequency', 7)
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=update_frequency)
            
            # Step 2: Search for existing history in date range
            HistoryTable = Table('dpo_agent_history', db.metadata, autoload=True)
            history_query = select(HistoryTable).where(
                and_(
                    HistoryTable.c.dpo_agent_id == agent_id,
                    HistoryTable.c.from_date == start_date,
                    HistoryTable.c.to_date == end_date
                )
            ).order_by(desc(HistoryTable.c.created_at))
            
            history_record = session.execute(history_query).first()
            
            # Step 3: Create new history if not exists
            if not history_record:
                history_id = DpoAgentService._create_new_history(session, agent_id, agent, start_date, end_date)
                history_query = select(HistoryTable).where(HistoryTable.c.id == history_id)
                history_record = session.execute(history_query).first()
            
            history_id = history_record.id
            
            # Step 4: Check report status
            report_status = getattr(history_record, status_field, {}) or {}
            
            # Step 5: If completed, return existing report from table
            if isinstance(report_status, dict) and report_status.get('status') == 'completed':
                existing_report = DpoAgentService._get_existing_report_from_table(session, history_id, report_type)
                if existing_report:
                    return {
                        'history_id': history_id,
                        'report': existing_report,
                        'message': f'{report_type.title()} report already completed',
                        'status': 'already_completed'
                    }
            
            # Step 6: If pending, generate report
            if not report_status or report_status.get('status') in ['pending', None]:
                bills_uuids = history_record.bills_retrieved or []
                gazette_uuids = history_record.gazette_retrieved or []
                regwatch_uuids = history_record.regwatch_retrieved or []
                
                if not any([bills_uuids, gazette_uuids, regwatch_uuids]):
                    return {"error": "No documents found", "message": "No retrieved documents found in history"}
                
                try:
                    # Generate report based on type
                    if report_type == 'critical':
                        result = DpoAgentService._generate_critical_report_from_documents(
                            session, history_id, bills_uuids, gazette_uuids, regwatch_uuids, history_record
                        )
                        response_key = 'report'
                    elif report_type == 'critical_level':
                        result = DpoAgentService._generate_critical_levels_from_documents(
                            session, history_id, bills_uuids, gazette_uuids, regwatch_uuids, history_record
                        )
                        response_key = 'levels'
                    else:
                        return {"error": "Invalid report type", "message": f"Unknown report type: {report_type}"}
                    
                    # Update status to completed
                    DpoAgentService._update_report_status(session, history_id, status_field, 'completed')
                    session.commit()
                    
                    return {
                        'history_id': history_id,
                        'execution_status': 'completed',
                        response_key: result,
                        'message': f'{report_type.title()} report generated successfully'
                    }
                    
                except Exception as e:
                    logger.error(f"Error generating {report_type} report: {str(e)}")
                    DpoAgentService._update_report_status(session, history_id, status_field, 'failed')
                    session.commit()
                    return {"error": str(e), "message": f"Failed to generate {report_type} report"}
            else:
                return {
                    'history_id': history_id,
                    'message': f'{report_type.title()} report status is {report_status.get("status")}',
                    'status': report_status.get('status')
                }
                
        except Exception as e:
            logger.error(f"Error in _execute_report_with_history_check: {str(e)}")
            session.rollback()
            return {"error": str(e), "message": f"Failed to execute {report_type} report"}

    @staticmethod
    def _get_existing_report_from_table(session, history_id: int, report_type: str):
        """Get existing report from appropriate table"""
        try:
            if report_type in ['overall', 'critical']:
                ReportsTable = Table('dpo_agent_reports', db.metadata, autoload=True)
                query = select(ReportsTable).where(
                    and_(
                        ReportsTable.c.dpo_agent_history_id == history_id,
                        ReportsTable.c.report_type == report_type
                    )
                )
                result = session.execute(query).first()
                return result.citation or result.summary if result else None
                
            elif report_type == 'critical_level':
                CriticalLevelsTable = Table('dpo_agent_critical_levels', db.metadata, autoload=True)
                query = select(CriticalLevelsTable).where(
                    CriticalLevelsTable.c.dpo_agent_history_id == history_id
                )
                results = session.execute(query).fetchall()
                return [r.details for r in results] if results else None
                
            elif report_type == 'jurisdiction':
                JurisdictionReportsTable = Table('dpo_agent_jurisdiction_reports', db.metadata, autoload=True)
                query = select(JurisdictionReportsTable).where(
                    JurisdictionReportsTable.c.dpo_agent_history_id == history_id
                )
                results = session.execute(query).fetchall()
                return [{'jurisdiction': r.jurisdiction, 'report': r.citation or r.summary} for r in results] if results else None
                
        except Exception as e:
            logger.error(f"Error getting existing report: {str(e)}")
            return None

    @staticmethod
    def _generate_overall_report_from_documents(session, history_id: int, bills_uuids: List, gazette_uuids: List, regwatch_uuids: List, history_record) -> Dict:
        """Generate overall report from MongoDB documents using LLM"""
        try:
            # Fetch documents from MongoDB using UUIDs
            mongo_client_conn = mongo_client()
            
            # Fetch bills documents
            bills_db = mongo_client_conn["esg_agent"]
            bills_col = bills_db["esg_bills_collection"]
            bills_docs = list(bills_col.find({"uuid": {"$in": bills_uuids}}))
            
            # Fetch gazette documents
            gazette_col = bills_db["esg_gazette_collection"] 
            gazette_docs = list(gazette_col.find({"uuid": {"$in": gazette_uuids}}))
            
            # Fetch regwatch documents
            regwatch_db = mongo_client_conn["reg_watch"]
            regwatch_col = regwatch_db["reg_news_processed_data"]
            regwatch_docs = list(regwatch_col.find({"uuid": {"$in": regwatch_uuids}}))
            
            # TODO: Use LLM to generate overall report based on all documents
            # This should follow the pattern from agent code/helpers/overall_report.py
            # For now, returning basic summary
            report_content = {
                "summary": f"Overall regulatory summary based on {len(bills_docs)} bills, {len(gazette_docs)} gazette notices, and {len(regwatch_docs)} regulatory news items",
                "bills_count": len(bills_docs),
                "gazette_count": len(gazette_docs),
                "regwatch_count": len(regwatch_docs),
                "generated_at": datetime.now().isoformat()
            }
            
            # Save to reports table
            ReportsTable = Table('dpo_agent_reports', db.metadata, autoload=True)
            report_data = {
                'dpo_agent_history_id': history_id,
                'overall_report': report_content['summary'],
                'summary': report_content['summary'], 
                'citation': report_content,
                'report_type': 'overall',
                'created_at': func.now(),
                'updated_at': func.now()
            }
            insert_report = insert(ReportsTable).values(**report_data)
            session.execute(insert_report)
            
            return report_content
            
        except Exception as e:
            logger.error(f"Error generating overall report from documents: {str(e)}")
            raise e

    @staticmethod
    def _generate_jurisdiction_reports_from_documents(session, history_id: int, bills_uuids: List, gazette_uuids: List, regwatch_uuids: List, history_record) -> List[Dict]:
        """Generate jurisdiction-specific reports from MongoDB documents using LLM"""
        try:
            # Get jurisdictions from history record
            jurisdictions = history_record.jurisdiction or []
            
            jurisdiction_reports = []
            
            for jurisdiction in jurisdictions:
                # Fetch documents from MongoDB filtered by jurisdiction
                mongo_client_conn = mongo_client()
                
                # Fetch bills documents for this jurisdiction
                bills_db = mongo_client_conn["esg_agent"]
                bills_col = bills_db["esg_bills_collection"]
                bills_docs = list(bills_col.find({
                    "uuid": {"$in": bills_uuids},
                    "jurisdiction": jurisdiction
                }))
                
                # Fetch gazette documents for this jurisdiction
                gazette_col = bills_db["esg_gazette_collection"] 
                gazette_docs = list(gazette_col.find({
                    "uuid": {"$in": gazette_uuids},
                    "jurisdiction": jurisdiction
                }))
                
                # Fetch regwatch documents for this jurisdiction
                regwatch_db = mongo_client_conn["reg_watch"]
                regwatch_col = regwatch_db["reg_news_processed_data"]
                regwatch_docs = list(regwatch_col.find({
                    "uuid": {"$in": regwatch_uuids},
                    "jurisdiction": jurisdiction
                }))
                
                # TODO: Use LLM to generate jurisdiction-specific report
                # This should follow the pattern from agent code/helpers/country_specific_report.py
                report_content = {
                    "jurisdiction": jurisdiction,
                    "summary": f"Regulatory summary for {jurisdiction} based on {len(bills_docs)} bills, {len(gazette_docs)} gazette notices, and {len(regwatch_docs)} regulatory news items",
                    "bills_count": len(bills_docs),
                    "gazette_count": len(gazette_docs),
                    "regwatch_count": len(regwatch_docs),
                    "generated_at": datetime.now().isoformat()
                }
                
                # Save to jurisdiction reports table
                JurisdictionReportsTable = Table('dpo_agent_jurisdiction_reports', db.metadata, autoload=True)
                jurisdiction_data = {
                    'dpo_agent_history_id': history_id,
                    'report': report_content['summary'],
                    'summary': report_content['summary'],
                    'citation': report_content,
                    'jurisdiction': jurisdiction,
                    'jurisdiction_id': None,
                    'created_at': func.now(),
                    'updated_at': func.now()
                }
                insert_jurisdiction = insert(JurisdictionReportsTable).values(**jurisdiction_data)
                session.execute(insert_jurisdiction)
                
                jurisdiction_reports.append(report_content)
            
            return jurisdiction_reports
            
        except Exception as e:
            logger.error(f"Error generating jurisdiction reports from documents: {str(e)}")
            raise e

    @staticmethod
    def _generate_critical_report_from_documents(session, history_id: int, bills_uuids: List, gazette_uuids: List, regwatch_uuids: List, history_record) -> Dict:
        """Generate critical report from MongoDB documents using LLM"""
        try:
            # Fetch documents from MongoDB using UUIDs
            mongo_client_conn = mongo_client()
            
            # Fetch all documents
            bills_db = mongo_client_conn["esg_agent"]
            bills_col = bills_db["esg_bills_collection"]
            bills_docs = list(bills_col.find({"uuid": {"$in": bills_uuids}}))
            
            gazette_col = bills_db["esg_gazette_collection"] 
            gazette_docs = list(gazette_col.find({"uuid": {"$in": gazette_uuids}}))
            
            regwatch_db = mongo_client_conn["reg_watch"]
            regwatch_col = regwatch_db["reg_news_processed_data"]
            regwatch_docs = list(regwatch_col.find({"uuid": {"$in": regwatch_uuids}}))
            
            # TODO: Use LLM to analyze critical/urgent items
            # This should identify high-priority regulatory changes
            critical_report = {
                "summary": f"Critical regulatory analysis based on {len(bills_docs)} bills, {len(gazette_docs)} gazette notices, and {len(regwatch_docs)} regulatory news items",
                "critical_items": [],  # TODO: LLM should identify critical items
                "bills_count": len(bills_docs),
                "gazette_count": len(gazette_docs),
                "regwatch_count": len(regwatch_docs),
                "generated_at": datetime.now().isoformat()
            }
            
            # Save to reports table with critical type
            ReportsTable = Table('dpo_agent_reports', db.metadata, autoload=True)
            report_data = {
                'dpo_agent_history_id': history_id,
                'overall_report': critical_report['summary'],
                'summary': critical_report['summary'], 
                'citation': critical_report,
                'report_type': 'critical',
                'created_at': func.now(),
                'updated_at': func.now()
            }
            insert_report = insert(ReportsTable).values(**report_data)
            session.execute(insert_report)
            
            return critical_report
            
        except Exception as e:
            logger.error(f"Error generating critical report from documents: {str(e)}")
            raise e

    @staticmethod
    def _generate_critical_levels_from_documents(session, history_id: int, bills_uuids: List, gazette_uuids: List, regwatch_uuids: List, history_record) -> List[Dict]:
        """Generate critical level assessments from MongoDB documents using LLM"""
        try:
            # Fetch documents from MongoDB using UUIDs
            mongo_client_conn = mongo_client()
            
            # Fetch all documents
            bills_db = mongo_client_conn["esg_agent"]
            bills_col = bills_db["esg_bills_collection"]
            bills_docs = list(bills_col.find({"uuid": {"$in": bills_uuids}}))
            
            gazette_col = bills_db["esg_gazette_collection"] 
            gazette_docs = list(gazette_col.find({"uuid": {"$in": gazette_uuids}}))
            
            regwatch_db = mongo_client_conn["reg_watch"]
            regwatch_col = regwatch_db["reg_news_processed_data"]
            regwatch_docs = list(regwatch_col.find({"uuid": {"$in": regwatch_uuids}}))
            
            # TODO: Use LLM to assess critical levels for different categories
            # This should assign severity/urgency levels to different regulatory areas
            critical_levels = []
            
            # Example critical level types
            level_types = ['regulatory_changes', 'compliance_deadlines', 'policy_updates', 'enforcement_actions']
            
            for level_type in level_types:
                # TODO: LLM should analyze documents and assign critical levels
                severity_score = 3  # TODO: LLM should determine this
                
                level_data = {
                    "type": level_type,
                    "status": "medium",  # TODO: LLM should determine: low/medium/high/critical
                    "severity_score": severity_score,
                    "description": f"Critical level assessment for {level_type}",
                    "generated_at": datetime.now().isoformat()
                }
                
                # Save to critical levels table
                CriticalLevelsTable = Table('dpo_agent_critical_levels', db.metadata, autoload=True)
                critical_data = {
                    'dpo_agent_history_id': history_id,
                    'uuid': f"{history_id}_{level_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    'level': level_data['status'],
                    'date_issued': datetime.now().date(),
                    'jurisdiction': "General",
                    'type': level_type,
                    'details': level_data,
                    'severity_score': severity_score,
                    'created_at': func.now(),
                    'updated_at': func.now()
                }
                insert_critical = insert(CriticalLevelsTable).values(**critical_data)
                session.execute(insert_critical)
                
                critical_levels.append(level_data)
            
            return critical_levels
            
        except Exception as e:
            logger.error(f"Error generating critical levels from documents: {str(e)}")
            raise e

    @staticmethod
    def _create_new_history(session, agent_id: int, agent: Dict, start_date: date, end_date: date) -> int:
        """Create new history record with filtered documents"""
        try:
            # Get agent relationships for filtering
            jurisdictions = DpoAgentService._get_agent_jurisdictions(session, agent_id)
            industries = DpoAgentService._get_agent_industries(session, agent_id)
            regulations = DpoAgentService._get_agent_regulations(session, agent_id)
            regulators = DpoAgentService._get_agent_regulators(session, agent_id)
            
            # Run document filter to get UUIDs (reuse existing logic)
            filtered_uuids = DpoAgentService._get_filtered_documents(agent, jurisdictions, regulations, regulators, start_date, end_date)
            
            # Create history record
            HistoryTable = Table('dpo_agent_history', db.metadata, autoload=True)
            history_data = {
                'dpo_agent_id': agent_id,
                'name': agent['name'],
                'industry': industries,
                'theme': agent.get('theme', []),
                'role_of_users': agent.get('role_of_users', []),
                'regulator': regulators,
                'regulation': regulations,
                'jurisdiction': jurisdictions,
                'from_date': start_date,
                'to_date': end_date,
                'ai_model': agent.get('ai_model', 'gpt-4'),
                'answer_word_cap': agent.get('answer_word_cap', 1000),
                'bills_retrieved': filtered_uuids.get('bills_uuids', []),
                'gazette_retrieved': filtered_uuids.get('gazette_uuids', []),
                'regwatch_retrieved': filtered_uuids.get('regwatch_uuids', []),
                'status_check_overall_report': {'status': 'pending'},
                'status_check_jurisdiction_report': {'status': 'pending'},
                'status_check_critical_report': {'status': 'pending'},
                'status_check_critical_level': {'status': 'pending'},
                'execution_status': 'running',
                'created_at': func.now(),
                'updated_at': func.now()
            }
            
            insert_history = insert(HistoryTable).values(**history_data)
            result = session.execute(insert_history)
            session.flush()
            
            return result.inserted_primary_key[0]
            
        except Exception as e:
            logger.error(f"Error creating new history: {str(e)}")
            raise e

    @staticmethod
    def _get_filtered_documents(agent: Dict, jurisdictions: List, regulations: List, regulators: List, start_date: date, end_date: date) -> Dict:
        """Filter documents based on agent criteria and date range"""
        try:
            # TODO: Implement document filtering logic similar to original codebase
            # This should query MongoDB collections based on agent filters
            
            # Placeholder - return empty for now
            return {
                'bills_uuids': [],
                'gazette_uuids': [],
                'regwatch_uuids': []
            }
            
        except Exception as e:
            logger.error(f"Error filtering documents: {str(e)}")
            return {'bills_uuids': [], 'gazette_uuids': [], 'regwatch_uuids': []}

    @staticmethod
    def _get_agent_jurisdictions(session, agent_id: int) -> List:
        """Get agent jurisdictions"""
        try:
            JurisdictionsTable = Table('dpo_agent_jurisdictions', db.metadata, autoload=True)
            query = select(JurisdictionsTable.c.jurisdiction_id).where(JurisdictionsTable.c.dpo_agent_id == agent_id)
            results = session.execute(query).fetchall()
            return [row.jurisdiction_id for row in results]
        except Exception as e:
            logger.error(f"Error getting agent jurisdictions: {str(e)}")
            return []

    @staticmethod
    def _get_agent_industries(session, agent_id: int) -> List:
        """Get agent industries"""
        try:
            IndustriesTable = Table('dpo_agent_industries', db.metadata, autoload=True)
            query = select(IndustriesTable.c.industry_id).where(IndustriesTable.c.dpo_agent_id == agent_id)
            results = session.execute(query).fetchall()
            return [row.industry_id for row in results]
        except Exception as e:
            logger.error(f"Error getting agent industries: {str(e)}")
            return []

    @staticmethod
    def _get_agent_regulations(session, agent_id: int) -> List:
        """Get agent regulations"""
        try:
            RegulationsTable = Table('dpo_agent_regulations', db.metadata, autoload=True)
            query = select(RegulationsTable.c.regulation_id).where(RegulationsTable.c.dpo_agent_id == agent_id)
            results = session.execute(query).fetchall()
            return [row.regulation_id for row in results]
        except Exception as e:
            logger.error(f"Error getting agent regulations: {str(e)}")
            return []

    @staticmethod
    def _get_agent_regulators(session, agent_id: int) -> List:
        """Get agent regulators"""
        try:
            RegulatorsTable = Table('dpo_agent_regulators', db.metadata, autoload=True)
            query = select(RegulatorsTable.c.regulator_id).where(RegulatorsTable.c.dpo_agent_id == agent_id)
            results = session.execute(query).fetchall()
            return [row.regulator_id for row in results]
        except Exception as e:
            logger.error(f"Error getting agent regulators: {str(e)}")
            return []

    @staticmethod
    def _update_report_status(session, history_id: int, status_field: str, status_value: str):
        """Update specific report status in history"""
        try:
            HistoryTable = Table('dpo_agent_history', db.metadata, autoload=True)
            update_query = update(HistoryTable).where(
                HistoryTable.c.id == history_id
            ).values(**{status_field: {'status': status_value, 'updated_at': datetime.now().isoformat()}})
            
            session.execute(update_query)
            
        except Exception as e:
            logger.error(f"Error updating report status: {str(e)}")




 def _get_agent_jurisdictions(session, agent_id: int) -> List:
        """Get agent jurisdiction names"""
        try:
            JurisdictionsTable = Table('dpo_agent_jurisdictions', db.metadata, autoload=True)
            JurisdictionMasterTable = Table('jurisdictions', db.metadata, autoload=True)
            
            query = select(JurisdictionMasterTable.c.name).select_from(
                JurisdictionsTable.join(
                    JurisdictionMasterTable, 
                    JurisdictionsTable.c.jurisdiction_id == JurisdictionMasterTable.c.id
                )
            ).where(JurisdictionsTable.c.dpo_agent_id == agent_id)
            
            results = session.execute(query).fetchall()
            return [row.name for row in results]
        except Exception as e:
            logger.error(f"Error getting agent jurisdictions: {str(e)}")
            return []

    @staticmethod
    def _get_agent_industries(session, agent_id: int) -> List:
        """Get agent industry names"""
        try:
            IndustriesTable = Table('dpo_agent_industries', db.metadata, autoload=True)
            IndustryMasterTable = Table('industries', db.metadata, autoload=True)
            
            query = select(IndustryMasterTable.c.name).select_from(
                IndustriesTable.join(
                    IndustryMasterTable, 
                    IndustriesTable.c.industry_id == IndustryMasterTable.c.id
                )
            ).where(IndustriesTable.c.dpo_agent_id == agent_id)
            
            results = session.execute(query).fetchall()
            return [row.name for row in results]
        except Exception as e:
            logger.error(f"Error getting agent industries: {str(e)}")
            return []

    @staticmethod
    def _get_agent_regulations(session, agent_id: int) -> List:
        """Get agent regulation names"""
        try:
            RegulationsTable = Table('dpo_agent_regulations', db.metadata, autoload=True)
            RegulationMasterTable = Table('regulations', db.metadata, autoload=True)
            
            query = select(RegulationMasterTable.c.name).select_from(
                RegulationsTable.join(
                    RegulationMasterTable, 
                    RegulationsTable.c.regulation_id == RegulationMasterTable.c.id
                )
            ).where(RegulationsTable.c.dpo_agent_id == agent_id)
            
            results = session.execute(query).fetchall()
            return [row.name for row in results]
        except Exception as e:
            logger.error(f"Error getting agent regulations: {str(e)}")
            return []

    @staticmethod
    def _get_agent_regulators(session, agent_id: int) -> List:
        """Get agent regulator names"""
        try:
            RegulatorsTable = Table('dpo_agent_regulators', db.metadata, autoload=True)
            RegulatorMasterTable = Table('regulators', db.metadata, autoload=True)
            
            query = select(RegulatorMasterTable.c.name).select_from(
                RegulatorsTable.join(
                    RegulatorMasterTable, 
                    RegulatorsTable.c.regulator_id == RegulatorMasterTable.c.id
                )
            ).where(RegulatorsTable.c.dpo_agent_id == agent_id)
            
            results = session.execute(query).fetchall()
            return [row.name for row in results]
        except Exception as e:
            logger.error(f"Error getting agent regulators: {str(e)}")
            return []
