from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
import base64
import uuid
from openai import AsyncOpenAI

load_dotenv()

app = FastAPI()

# CORS Configuration
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Configuration
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "real_estate_chatbot")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Pydantic Models
class ChatMessage(BaseModel):
    session_id: str
    message: str
    image_base64: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    agent_used: str
    timestamp: str

class SessionCreate(BaseModel):
    user_name: Optional[str] = "Guest"

class MessageHistory(BaseModel):
    role: str
    content: str
    agent: Optional[str] = None
    timestamp: str
    image_url: Optional[str] = None


# Agent System Prompts
AGENT_1_SYSTEM_PROMPT = """You are a Property Issue Detection and Troubleshooting Specialist. 
Your role is to analyze property images and descriptions to identify issues like:
- Water damage, leaks, and moisture problems
- Mold and mildew growth
- Structural cracks and damage
- Electrical and plumbing issues
- Poor lighting or ventilation
- Broken fixtures or appliances
- Paint and wall damage

When analyzing issues:
1. Describe what you observe in the image clearly
2. Identify the likely cause of the problem
3. Provide practical troubleshooting suggestions
4. Recommend professionals if needed (plumber, electrician, etc.)
5. Ask clarifying questions when needed

Be helpful, specific, and professional in your responses."""

AGENT_2_SYSTEM_PROMPT = """You are a Tenancy and Real Estate FAQ Specialist.
Your role is to answer questions about:
- Tenancy laws and regulations
- Rental agreements and contracts
- Landlord and tenant rights and responsibilities
- Security deposits and rent payments
- Eviction procedures and notice periods
- Lease termination and renewal
- Property maintenance responsibilities
- Dispute resolution

Provide accurate, helpful information while:
1. Asking for location/jurisdiction when laws vary by region
2. Being clear about general guidance vs specific legal advice
3. Recommending consultation with legal professionals for complex issues
4. Using clear, accessible language

Be professional, informative, and helpful."""


async def determine_agent(message: str, has_image: bool) -> str:
    """Determine which agent should handle the request"""
    
    # If image is present, always use Agent 1
    if has_image:
        return "agent_1"
    
    # Keywords for Agent 1 (Issue Detection)
    issue_keywords = [
        "damage", "broken", "crack", "leak", "mold", "mould", "water", 
        "stain", "fix", "repair", "problem", "issue", "wrong", "broken",
        "paint", "wall", "ceiling", "floor", "electrical", "plumbing",
        "fixture", "appliance", "moisture", "damp", "ventilation"
    ]
    
    # Keywords for Agent 2 (Tenancy FAQ)
    tenancy_keywords = [
        "lease", "rent", "tenant", "landlord", "evict", "deposit", 
        "contract", "agreement", "notice", "law", "legal", "right",
        "responsibility", "terminate", "renew", "increase", "pay",
        "maintenance", "repair", "dispute", "vacate", "move out"
    ]
    
    message_lower = message.lower()
    
    # Count keyword matches
    issue_score = sum(1 for keyword in issue_keywords if keyword in message_lower)
    tenancy_score = sum(1 for keyword in tenancy_keywords if keyword in message_lower)
    
    # Determine agent based on scores
    if issue_score > tenancy_score:
        return "agent_1"
    elif tenancy_score > issue_score:
        return "agent_2"
    else:
        # Default to clarifying with user
        return "clarification_needed"


@app.get("/")
async def root():
    return {"message": "Multi-Agent Real Estate Chatbot API"}


@app.post("/api/chat/session")
async def create_session(session_data: SessionCreate):
    """Create a new chat session"""
    session_id = str(uuid.uuid4())
    
    session = {
        "session_id": session_id,
        "user_name": session_data.user_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sessions.insert_one(session)
    
    return {"session_id": session_id}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    session_id: str = Form(...),
    message: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    """Main chat endpoint with agent routing"""
    
    try:
        # Check if session exists
        session = await db.sessions.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Process image if present
        image_base64 = None
        if image:
            image_bytes = await image.read()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Determine which agent to use
        has_image = image_base64 is not None
        agent_type = await determine_agent(message, has_image)
        
        # Handle clarification needed
        if agent_type == "clarification_needed":
            response_text = """I'd be happy to help! Could you please clarify what you need assistance with?

• If you have a property issue or problem (damage, repairs, etc.), I can help identify and troubleshoot it.
• If you have questions about tenancy, rent, leases, or landlord/tenant matters, I can provide information on that.

Please provide more details so I can direct you to the right specialist!"""
            
            agent_name = "Router"
        else:
            # Select system prompt based on agent
            system_prompt = AGENT_1_SYSTEM_PROMPT if agent_type == "agent_1" else AGENT_2_SYSTEM_PROMPT
            agent_name = "Issue Detection Agent" if agent_type == "agent_1" else "Tenancy FAQ Agent"

            # Prepare messages for OpenAI
            messages = [
                {"role": "system", "content": system_prompt}
            ]

            # Get conversation history for this session
            history = await db.messages.find(
                {"session_id": session_id}
            ).sort("timestamp", 1).limit(10).to_list(length=10)

            # Add history to context
            for msg in history:
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    messages.append({"role": "assistant", "content": msg["content"]})

            # Prepare current message
            if image_base64:
                # Message with image
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": message},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                })
            else:
                # Text-only message
                messages.append({
                    "role": "user",
                    "content": message
                })

            # Get response from OpenAI
            response = await openai_client.chat.completions.create(
                model="gpt-4o",  # or "gpt-4-vision-preview" for image support
                messages=messages,
                max_tokens=1000
            )

            response_text = response.choices[0].message.content
        
        # Save message to database
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Save user message
        user_msg = {
            "session_id": session_id,
            "role": "user",
            "content": message,
            "timestamp": timestamp,
            "has_image": has_image
        }
        await db.messages.insert_one(user_msg)
        
        # Save assistant response
        assistant_msg = {
            "session_id": session_id,
            "role": "assistant",
            "content": response_text,
            "agent": agent_name,
            "timestamp": timestamp
        }
        await db.messages.insert_one(assistant_msg)
        
        # Update session
        await db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": timestamp}}
        )
        
        return ChatResponse(
            response=response_text,
            agent_used=agent_name,
            timestamp=timestamp
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    
    messages = await db.messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(length=100)
    
    # Remove MongoDB _id field
    for msg in messages:
        msg.pop("_id", None)
    
    return {"messages": messages}


@app.get("/api/sessions")
async def get_sessions():
    """Get all chat sessions"""
    
    sessions = await db.sessions.find().sort("updated_at", -1).to_list(length=50)
    
    # Remove MongoDB _id field
    for session in sessions:
        session.pop("_id", None)
    
    return {"sessions": sessions}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)