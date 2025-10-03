# PropFix Assistant - Multi-Agentic Real Estate Chatbot

An intelligent real estate chatbot system powered by two specialized AI agents that can analyze property images and answer tenancy-related questions.

## 🚀 Built With

This application was built using **[app.emergent.sh](https://app.emergent.sh)** - a no-code/low-code platform for rapid AI application development.

### Technology Stack

**Frontend:**
- React 19.0
- shadcn/ui component library
- Tailwind CSS for styling
- Axios for API communication
- Create React App with CRACO

**Backend:**
- FastAPI (Python)
- Motor (Async MongoDB driver)
- Emergent Integrations LLM SDK
- OpenAI GPT-4 (gpt-5 model)

**Database:**
- MongoDB (for session and message history)

**Deployment:**
- Emergent.sh cloud platform

## 🤖 Multi-Agent Architecture

### Agent Routing Logic

The system uses an intelligent router that automatically determines which agent should handle each request based on:

1. **Image Presence Detection**
   - If an image is uploaded → Routes to **Agent 1** (Issue Detection)
   - Images always indicate property problems needing visual analysis

2. **Keyword-Based Classification**
   - Analyzes the user's message text for specific keywords
   - Scores each message against two keyword dictionaries
   - Routes to the agent with the higher keyword match score

3. **Clarification Handling**
   - If neither agent has a clear keyword advantage → Asks user for clarification
   - Provides options to help user reformulate their question

### Agent 1: Issue Detection & Troubleshooting Agent

**Capabilities:**
- Accepts property images with optional text context
- Uses GPT-4 Vision to analyze visual content
- Detects issues like:
  - Water damage and leaks
  - Mold and mildew growth
  - Structural cracks
  - Electrical/plumbing problems
  - Broken fixtures
  - Paint damage
  - Poor lighting/ventilation

**Keyword Triggers:**
`damage`, `broken`, `crack`, `leak`, `mold`, `water`, `stain`, `fix`, `repair`, `problem`, `issue`, `paint`, `wall`, `ceiling`, `floor`, `electrical`, `plumbing`, `fixture`, `appliance`, `moisture`, `damp`, `ventilation`

### Agent 2: Tenancy FAQ Agent

**Capabilities:**
- Answers text-based questions about rental matters
- Provides location-specific guidance when region is specified
- Covers topics including:
  - Tenancy laws and regulations
  - Lease agreements
  - Landlord/tenant rights
  - Security deposits
  - Eviction procedures
  - Rent increases
  - Maintenance responsibilities
  - Dispute resolution

**Keyword Triggers:**
`lease`, `rent`, `tenant`, `landlord`, `evict`, `deposit`, `contract`, `agreement`, `notice`, `law`, `legal`, `right`, `responsibility`, `terminate`, `renew`, `increase`, `pay`, `maintenance`, `dispute`, `vacate`, `move out`

## 🖼️ Image-Based Issue Detection

### How It Works

1. **Upload & Encoding**
   - User uploads image through the React frontend
   - Frontend creates a preview using FileReader API
   - Image is sent via multipart/form-data to backend

2. **Processing**
   - Backend receives image file
   - Converts to base64 encoding
   - Creates ImageContent object with base64 data

3. **AI Analysis**
   - Image + text sent to OpenAI GPT-4 with vision capabilities
   - Agent 1's specialized system prompt guides analysis
   - Model examines visual details and identifies issues

4. **Response Generation**
   - AI provides detailed description of observed issues
   - Suggests potential causes
   - Offers troubleshooting steps
   - Recommends professionals if needed

## 💡 Use Case Examples

### Use Case 1: Water Damage Detection
**User Action:** Uploads photo of ceiling with brown stains
**Agent Used:** Issue Detection Agent
**Response Example:**
> "I can see brown water stains on your ceiling, indicating a water leak from above. This could be from:
> - A leaking roof (if this is the top floor)
> - Plumbing issues from the floor above
> - HVAC condensation problems
>
> I recommend checking your roof for damage and inspecting pipes above this area. If the issue persists, contact a licensed plumber or roofer."

### Use Case 2: Tenancy Rights Question
**User Query:** "Can my landlord evict me without notice in California?"
**Agent Used:** Tenancy FAQ Agent
**Response Example:**
> "In California, landlords generally cannot evict tenants without proper notice. Required notice periods are:
> - 3-day notice for non-payment of rent or lease violations
> - 30-day notice for month-to-month tenancy (under 1 year)
> - 60-day notice for tenancies over 1 year
>
> Exceptions include illegal activity or significant lease violations. For your specific situation, consult with a tenant rights attorney."

### Use Case 3: Mold Identification
**User Action:** Uploads photo of black spots on bathroom wall with text "What is this?"
**Agent Used:** Issue Detection Agent
**Response Example:**
> "The black spots in your image appear to be mold growth, likely due to high moisture levels in your bathroom. This is common in poorly ventilated bathrooms.
>
> Recommendations:
> 1. Improve ventilation - run exhaust fan during and after showers
> 2. Clean with mold-killing solution (bleach/water mix or specialized cleaner)
> 3. Use a dehumidifier if ventilation is poor
> 4. Check for leaks behind the wall
>
> If mold covers a large area or returns quickly, consult a mold remediation specialist."

### Use Case 4: Security Deposit Return
**User Query:** "My landlord is keeping my deposit for normal wear and tear. Is this legal?"
**Agent Used:** Tenancy FAQ Agent
**Response Example:**
> "In most jurisdictions, landlords cannot withhold security deposits for normal wear and tear. This typically includes:
> - Minor scuff marks on walls
> - Carpet wear from regular use
> - Faded paint
> - Minor scratches on floors
>
> Landlords can deduct for:
> - Damages beyond normal wear
> - Unpaid rent
> - Cleaning costs if property is left dirty
>
> Request an itemized statement of deductions. If you believe charges are unfair, you may be able to dispute them in small claims court. Let me know your location for more specific guidance."

### Use Case 5: Ambiguous Query
**User Query:** "I have a problem with my apartment"
**Agent Used:** Router (Clarification)
**Response Example:**
> "I'd be happy to help! Could you please clarify what you need assistance with?
>
> • If you have a property issue or problem (damage, repairs, etc.), I can help identify and troubleshoot it.
> • If you have questions about tenancy, rent, leases, or landlord/tenant matters, I can provide information on that.
>
> Please provide more details so I can direct you to the right specialist!"

## 🗂️ Project Structure

```
prop-fix/
├── frontend/                 # React application
│   ├── src/
│   │   ├── App.js           # Main application component
│   │   ├── components/ui/   # shadcn/ui components
│   │   └── App.css          # Styling
│   └── package.json
├── backend/                 # FastAPI server
│   ├── server.py           # Main server with agent routing
│   └── requirements.txt    # Python dependencies
├── .emergent/              # Emergent.sh configuration
│   └── emergent.yml
└── README.md
```

## 🏃 Running the Application

The application is deployed and managed through **app.emergent.sh**. For local development:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
yarn install
yarn start
```

## 🔑 Environment Variables

Required environment variables (managed by Emergent.sh):
- `EMERGENT_LLM_KEY` - API key for Emergent LLM service
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: real_estate_chatbot)
- `CORS_ORIGINS` - Allowed CORS origins
- `REACT_APP_BACKEND_URL` - Backend API URL

## 📝 Features

✅ Dual-agent system with automatic routing
✅ Image upload and analysis capabilities
✅ Real-time chat interface
✅ Session persistence with MongoDB
✅ Message history tracking
✅ Responsive UI with modern design
✅ Professional property issue diagnostics
✅ Comprehensive tenancy information

## 🎯 Future Enhancements

- Multi-image upload support
- Voice input/output capabilities
- Location-based legal information
- Integration with property management systems
- Maintenance request ticketing
- Contractor recommendation system
- Multi-language support

