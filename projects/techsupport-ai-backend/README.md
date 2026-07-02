# TechSupport AI Backend

A comprehensive Node.js/Express backend API for an AI-powered tech support portal specializing in SMT (Surface Mount Technology) machines.

## Features

- **Multi-tier User System**: Support for customers, sales agents, technicians, support managers, and system administrators
- **AI Integration**: OpenAI GPT-4 integration for intelligent customer support
- **Ticket Management**: Complete ticketing system with escalation and tracking
- **Machine Management**: SMT machine registration, maintenance tracking, and issue management
- **Knowledge Base**: Searchable knowledge base with manuals, FAQs, and guides
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **Role-based Access Control**: Granular permissions based on user roles
- **Real-time Communication**: WebSocket support for real-time updates
- **File Upload**: Support for document and image uploads
- **Email/SMS Notifications**: Automated notifications via email and SMS

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **AI**: OpenAI GPT-4 API
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **SMS**: Twilio
- **Logging**: Winston
- **Validation**: Joi and express-validator
- **Security**: Helmet, CORS, rate limiting

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd techsupportbot/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/techsupportbot
   JWT_SECRET=your-super-secret-jwt-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   # ... other environment variables
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/preferences` - Update user preferences
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/messages` - Add message to ticket

### Machines
- `GET /api/machines` - Get all machines
- `GET /api/machines/:id` - Get single machine
- `POST /api/machines` - Register new machine
- `PUT /api/machines/:id` - Update machine
- `POST /api/machines/:id/maintenance` - Add maintenance record
- `POST /api/machines/:id/issues` - Add issue

### AI
- `POST /api/ai/chat` - Generate AI response
- `POST /api/ai/feature/:featureName` - Use specific AI feature
- `GET /api/ai/capabilities` - Get user AI capabilities
- `GET /api/ai/metrics` - Get AI performance metrics
- `POST /api/ai/train` - Train AI model (Admin only)
- `GET /api/ai/config` - Get AI configuration (Admin only)
- `PUT /api/ai/config` - Update AI configuration (Admin only)

### Knowledge Base
- `GET /api/knowledge-base` - Get knowledge base items
- `GET /api/knowledge-base/:id` - Get single knowledge base item
- `GET /api/knowledge-base/search` - Search knowledge base
- `GET /api/knowledge-base/categories` - Get knowledge base categories

### Analytics
- `GET /api/analytics/dashboard` - Get analytics dashboard data
- `GET /api/analytics/users` - Get user analytics
- `GET /api/analytics/tickets` - Get ticket analytics
- `GET /api/analytics/ai` - Get AI analytics
- `GET /api/analytics/performance` - Get performance metrics

### Admin
- `GET /api/admin/overview` - Get system overview
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/config` - Get system configuration
- `PUT /api/admin/config` - Update system configuration
- `POST /api/admin/restart` - Restart system
- `POST /api/admin/backup` - Backup system
- `POST /api/admin/clear-cache` - Clear system cache
- `GET /api/admin/health` - Get system health

## User Roles and Permissions

### Customer
- Create and view own tickets
- Register and manage own machines
- Access knowledge base
- Basic AI chat support

### Sales Agent
- All customer permissions
- Access customer data
- Product information and specifications
- Enhanced AI support

### Technician
- All sales agent permissions
- Technical support capabilities
- Machine maintenance and troubleshooting
- Escalation capabilities

### Support Manager
- All technician permissions
- Team management
- Analytics access
- Knowledge base management
- Advanced AI features

### System Administrator
- Full system access
- User management
- System configuration
- AI training and management
- Complete analytics access

## AI Features

The AI system provides different capabilities based on user roles:

- **Basic Chat**: General conversation and support
- **Ticket Creation**: AI-assisted ticket creation
- **Knowledge Base Search**: Intelligent search through documentation
- **Customer Data Access**: Access to customer information (employees only)
- **Technical Support**: Advanced technical assistance
- **Escalation**: Intelligent escalation recommendations
- **Analytics**: AI-powered insights and reporting
- **System Management**: AI-assisted system administration

## Database Models

### User
- Personal information and preferences
- Role-based permissions
- Authentication data
- Activity tracking

### Machine
- SMT machine specifications
- Maintenance history
- Issue tracking
- Performance metrics

### Ticket
- Support ticket management
- Message threading
- Escalation tracking
- Resolution history

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Monitoring and Logging

- Winston logging with multiple transports
- Error tracking and reporting
- Performance monitoring
- Health check endpoints
- System metrics collection

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Code Structure
```
src/
├── config/          # Database and configuration
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Application entry point
```

## Deployment

### Environment Variables
Ensure all required environment variables are set:
- Database connection strings
- JWT secrets
- API keys (OpenAI, Cloudinary, Twilio)
- Email/SMS configuration
- Security settings

### Production Considerations
- Use PM2 for process management
- Set up reverse proxy (nginx)
- Configure SSL certificates
- Set up monitoring and alerting
- Regular database backups
- Log rotation and management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team or create an issue in the repository.
