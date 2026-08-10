# Stealth AI Operations Ecosystem

Production AI, support, ecommerce, machine-service, and internal-operations ecosystem spanning Stealth Machine Tools, Stealth Batteries, customer websites, admin portals, field-service workflows, and local/hosted LLM tooling.

This is the system-level overview of the AI work. It is not a chatbot demo. The architecture connects real customers, real machines, real orders, real warranties, real support tickets, real field-service workflows, and internal staff into one AI-assisted operating layer.

## What This Proves

- Production AI application engineering across customer support, ecommerce, warranty, onboarding, diagnostics, and internal operations.
- Agentic workflow design using tool calling, structured context, stateful memory, routing, escalation, and human review.
- Full-stack ownership across website surfaces, admin portals, backend APIs, databases, authentication, AI orchestration, and operational dashboards.
- Hardware-aware AI support for industrial equipment, including machine context, CAD/CAM workflows, software configuration, service history, diagnostics, manuals, parts, and customer environment.
- Live machine-cut monitoring and cut-quality analysis using learned process memory, telemetry, diagnostics, operator context, and machine state.
- Business-critical automation that connects support, sales, inventory, shipping, engineering, field service, and leadership workflows.

## Business Context

Stealth Machine Tools and Stealth Batteries are physical-product businesses with complex support and operations requirements:

- Customers need onboarding, product guidance, warranty intake, diagnostics, order status, shipping updates, and technical support.
- Machine customers need help with laser cutters, fiber laser welders, plasma CNC machines, press brakes, tube benders, CAD/CAM workflows, settings, material/process behavior, machine configuration, and troubleshooting.
- Internal teams need clean customer records, product records, support history, machine records, warranty state, inventory data, shipping status, dealer/sales context, and engineering notes.
- Warranty and support teams need evidence when a failure came from a real machine issue versus bad setup, incorrect parameters, worn consumables, operator error, material issues, or customer misuse.
- Support cannot depend on scattered email threads, tribal knowledge, screenshots, unstructured documents, and repeated manual lookup.

The AI ecosystem turns those fragments into structured, searchable, auditable, role-aware workflows.

## High-Level Architecture

```text
Customer Website / Portal
        |
        v
AI Intake and Support Layer
        |
        +--> Product and Machine Context Retrieval
        +--> Customer / Order / Warranty Lookup
        +--> Document and Manual Retrieval
        +--> Diagnostic Question Flow
        +--> Tool Calls and Workflow Actions
        +--> Ticket / Escalation Creation
        |
        v
Admin Portal / Operations Dashboard
        |
        +--> Support Queue
        +--> Warranty Review
        +--> Inventory / Shipping Workflows
        +--> Machine Records
        +--> AI Conversation History
        +--> Human Review and Override
```

## AI Capabilities

### Customer Support Agent

- Answers product, warranty, setup, troubleshooting, and ordering questions with business-specific context.
- Pulls from machine/product knowledge, manuals, support notes, onboarding data, warranty policy, customer records, and previous conversation history.
- Converts vague customer descriptions into structured support data: issue category, product/machine, severity, symptoms, environment, attachments, next steps, and escalation state.
- Supports human handoff when confidence is low, the customer is frustrated, the issue touches safety, warranty approval is required, or a technician must intervene.

### Machine Diagnostics Agent

- Guides customers through structured diagnostic flows for industrial machine tools.
- Uses machine type, configuration, material/process context, controller/software context, and known failure modes to ask the right next question.
- Helps diagnose problems around cutting/welding behavior, machine setup, consumables, configuration mismatch, operator workflow, software state, and support history.
- Can turn a diagnostic conversation into a technician-ready support ticket with the important context preserved.

### Live Cut Monitoring and Quality Memory

- Monitors live cut behavior from supported Stealth Machine Tools equipment and compares machine state, cut behavior, telemetry, operator settings, material context, and process history against learned examples of good and bad cuts.
- Uses learned cut-quality memory to recognize patterns that point to correct operation, bad setup, consumable problems, material mismatch, incorrect parameters, mechanical issues, software/configuration problems, or customer misuse.
- Captures cut sessions as structured diagnostic records so support can review what actually happened instead of relying only on customer descriptions.
- Helps protect the business during warranty review by separating legitimate machine faults from cases where the machine was misconfigured, abused, operated outside the recommended process, or damaged by avoidable user error.
- Tracks real machine issues over time so engineering can see repeated patterns, improve documentation, update prompts/tools, change onboarding flows, or fix product/software problems.
- Supports both server-connected diagnostics and offline/local diagnostic workflows so the system remains useful when machines are deployed in shops with unreliable connectivity.

### CAD/CAM and Operator Workflow Support

- Provides AI support around CAD/CAM workflow concepts, cut setup, job preparation, machine configuration, common setup mistakes, operator guidance, and process notes.
- Helps bridge customer-facing support with internal machine-software knowledge.
- Treats machine support as a workflow problem, not a single prompt: gather context, validate assumptions, produce next action, log the result, and escalate when needed.

### Warranty and Claims Intake

- Converts unstructured customer requests into structured warranty cases.
- Captures customer, order, product, machine, failure description, photos/documents, purchase context, support history, and claim status.
- Links warranty claims to machine diagnostics, live cut records, local/offline logs, server telemetry, operator settings, support history, and AI-generated issue classification.
- Helps determine whether the claim is likely a product defect, configuration problem, operator mistake, consumable/material issue, shipping damage, service issue, or misuse case.
- Routes warranty issues into admin review instead of leaving them inside email threads.
- Supports human approval paths and audit-friendly records.

### Ecommerce and Order Support

- Connects AI support to product catalog, customer account, order, shipping, inventory, dealer, affiliate, and sales-rep context.
- Helps customers and staff answer order-status, product-fitment, replacement, return, shipping, and post-sale questions.
- Keeps the AI from acting blindly by requiring structured lookup and validated context before responding.

### Internal Operations Assistant

- Helps staff query operational context across customers, machines, warranties, support tickets, inventory, shipping, and documents.
- Supports admin users with summaries, next-action suggestions, issue categorization, duplicate detection, and support history review.
- Designed for internal productivity, not public marketing chat.

## Agentic Workflow Design

The system is organized around controlled workflows instead of free-form chatbot behavior:

- **Intent classification:** product question, machine support, order status, warranty, onboarding, service, escalation, internal lookup.
- **Context assembly:** customer identity, account role, order history, machine records, product metadata, support history, documents, manuals, and current conversation.
- **Tool routing:** database lookup, ticket creation, warranty intake, document retrieval, notification, analytics event, escalation, admin action.
- **State management:** conversation state, ticket state, warranty state, onboarding progress, escalation state, and user role.
- **Guardrails:** permission checks, confidence thresholds, required human approval, restricted actions, role-aware data exposure, and audit logging.
- **Human-in-the-loop:** escalation queues, staff review, manual override, support notes, and final decision ownership.

## Local and Hosted LLM Strategy

The AI layer is designed around both hosted and local model workflows:

- Hosted LLM APIs for strong reasoning, summarization, support drafting, document interpretation, and multi-step workflow guidance.
- Local LLM workflows for private operational tasks, internal experimentation, offline support concepts, low-latency staff tools, and controlled data handling.
- Model routing based on task type, data sensitivity, latency, cost, and required capability.
- Prompt and context versioning so behavior can be tuned without losing track of what changed.
- Separation between model output and system action: the model can recommend, classify, summarize, and draft, but privileged actions are routed through validated tools.

## Data and Memory

- Persistent conversation history tied to customers, tickets, machines, orders, warranty claims, and admin users.
- Contextual memory for repeat issues, machine configuration, previous recommendations, support outcomes, and customer-specific details.
- Structured knowledge ingestion from manuals, training material, product docs, troubleshooting guides, warranty notes, internal SOPs, and support records.
- Retrieval-augmented generation style flows where documents and records are fetched into a controlled context window.
- Source-aware responses so support staff can understand where an answer came from.

## Technical Components

### Frontend

- React and Next.js customer-facing website surfaces.
- Admin dashboards for support, warranty, orders, customers, machines, inventory, shipping, AI config, analytics, and review queues.
- Chat and support interfaces with conversation state, attachments, status, escalation, and staff handoff.
- Field-service style UX patterns for technicians and support users.

### Backend

- Node.js, Express, Next.js API routes, and FastAPI-style service patterns depending on the subsystem.
- REST APIs, webhooks, background workers, validation layers, provider adapters, and structured service boundaries.
- Auth, JWT/OAuth/RBAC concepts, role-aware access, audit trails, and admin-only operations.
- MongoDB/Mongoose, Postgres, Prisma-style modeling, Payload CMS, Oracle APEX-connected databases, and SQL-backed operational workflows.

### AI Orchestration

- Claude/Anthropic and OpenAI-style integrations.
- Tool calling and function-style routing for lookups, ticket creation, warranty intake, document retrieval, notifications, and workflow actions.
- Prompt templates, system policies, contextual memory, RAG/document ingestion, OCR/document processing, summarization, classification, extraction, and escalation logic.
- Confidence scoring concepts, fallback responses, low-confidence escalation, and staff review.

### Integrations

- Ecommerce and admin platforms.
- Stripe/payment flows.
- Shipping provider workflows such as ShipStation-style operations.
- Email and SMS notification patterns through providers such as Nodemailer, Resend, and Twilio-style flows.
- Slack, Signal, WhatsApp-style internal notification and LLM workstation routing.
- Airtable, Jira, Google Workspace-style operational workflows where the business process required it.

### DevOps and Reliability

- GitHub-centered CI/CD.
- Docker and Docker Compose for repeatable local and service environments.
- Environment and secret management.
- Logging, structured errors, health checks, operational analytics, incident triage, and production debugging.
- Manual override paths and human review for workflows where AI should not be the final authority.

## Examples of Real Workflows

### Machine Support

1. Customer opens a support chat from the machine website or customer portal.
2. AI identifies machine type, product family, customer account, warranty state, and issue category.
3. System retrieves manuals, training docs, support history, configuration context, live/offline machine diagnostics, cut-quality history, and known troubleshooting paths.
4. Agent asks targeted diagnostic questions instead of guessing.
5. The conversation becomes a structured support ticket with symptoms, attempted steps, severity, attachments, machine logs, cut records, and next action.
6. Technician receives a clean handoff with the context already organized.

### Live Cut Verification

1. Machine runs a job and emits local diagnostic data, cut/session context, settings, and telemetry.
2. AI compares the session against learned examples of good and bad cuts, known failure modes, machine configuration, material/process context, and historical support patterns.
3. System classifies likely root cause categories such as machine fault, consumable issue, parameter mismatch, software/configuration issue, operator setup problem, or misuse.
4. Diagnostics are stored locally and synced to the server when available, preserving useful evidence even when the machine is offline.
5. Support and warranty teams can review the actual machine behavior behind a claim instead of guessing from photos or email descriptions.

### Warranty Intake

1. Customer describes a failure or uploads documentation.
2. AI extracts product, order, date, symptoms, photos/docs, customer info, and warranty category.
3. System checks known customer/order/warranty context plus available telemetry, cut-session records, offline logs, diagnostics, and support history.
4. Claim is routed to admin review with confidence notes, likely root-cause classification, supporting machine evidence, and missing information.
5. Human staff approves, denies, requests more info, or escalates.

### Ecommerce Support

1. Customer asks about product selection, order status, shipping, replacement, or fitment.
2. AI routes to catalog, order, account, shipping, and support-history tools.
3. Response is grounded in current records instead of generic product text.
4. Escalation happens when the request touches refund, warranty, complex technical fitment, or policy exceptions.

### Internal Staff Assistant

1. Staff asks for customer history, machine status, warranty state, or support summary.
2. AI retrieves structured records and conversation history.
3. System returns a concise operational summary, open risks, missing fields, and recommended next action.
4. Staff remains in control of final decisions.

## Why It Mattered

- Reduced support load by turning repeated questions into structured, assisted workflows.
- Preserved context across customer conversations, orders, machines, warranties, and support tickets.
- Gave staff faster access to the information needed to help customers.
- Gave warranty and support teams evidence from actual machine behavior, cut sessions, diagnostics, and telemetry instead of forcing them to judge disputes from incomplete customer descriptions.
- Helped distinguish true product issues from setup mistakes, bad parameters, consumables, material problems, operator misuse, or avoidable damage.
- Connected ecommerce, warranty, shipping, machine service, and admin operations into one operating model.
- Made AI useful in production by wrapping it in permissions, context, tools, logging, and human review.

## Engineering Judgment

The important part of this system is not simply that it calls an LLM. The important part is the control layer around it:

- The AI does not replace the business workflow. It accelerates it.
- Sensitive data is retrieved through role-aware backend tools.
- High-risk actions require human review.
- Conversations become structured records.
- Diagnostics preserve assumptions and decision paths.
- Live cuts, machine logs, and local/offline diagnostic records become evidence that can support troubleshooting, warranty decisions, and product improvement.
- AI output is treated as a draft, recommendation, extraction, or routing signal unless a validated tool completes the action.

## Stack Summary

React, Next.js, TypeScript, Node.js, Express, Python, FastAPI-style services, MongoDB/Mongoose, Postgres, Prisma, Payload CMS, Oracle APEX-connected databases, REST APIs, webhooks, JWT/OAuth/RBAC, Claude/Anthropic, OpenAI-style APIs, local LLM workflows, RAG, document ingestion, OCR, tool calling, contextual memory, learned diagnostic memory, live telemetry, cut-session records, offline-first diagnostics, server sync, structured extraction, summarization, classification, escalation, Slack/Signal/WhatsApp-style routing, Stripe, shipping APIs, email/SMS notifications, Docker, GitHub Actions, CI/CD, logging, audit trails, and production observability.
