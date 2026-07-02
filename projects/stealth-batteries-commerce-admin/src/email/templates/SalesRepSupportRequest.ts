import type { SalesRep } from '@/payload-types'

interface SalesRepSupportRequestProps {
  salesRep: SalesRep
  subject: string
  message: string
}

export const SalesRepSupportRequest = ({ salesRep, subject, message }: SalesRepSupportRequestProps) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Rep Support Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #E94E31;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #E94E31;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            color: #333;
            margin: 0;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h3 {
            color: #E94E31;
            margin-bottom: 10px;
            font-size: 16px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .message-box {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #E94E31;
            border-radius: 4px;
            margin-top: 10px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .urgent {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Stealth Batteries</div>
            <h1 class="title">Sales Rep Support Request</h1>
        </div>

        <div class="urgent">
            <strong>⚠️ Sales Rep Support Request Received</strong><br>
            A sales representative has submitted a support request and requires assistance.
        </div>

        <div class="section">
            <h3>Sales Representative Information</h3>
            <div class="info-grid">
                <div class="info-label">Name:</div>
                <div class="info-value">${salesRep.name}</div>

                <div class="info-label">Email:</div>
                <div class="info-value">${salesRep.email}</div>

                <div class="info-label">Role:</div>
                <div class="info-value">${salesRep.role ? salesRep.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Sales Representative'}</div>

                <div class="info-label">Commission Rate:</div>
                <div class="info-value">${salesRep.commissionRate}%</div>

                <div class="info-label">Status:</div>
                <div class="info-value">${salesRep.active ? 'Active' : 'Inactive'}</div>
            </div>
        </div>

        <div class="section">
            <h3>Support Request Details</h3>
            <div class="info-grid">
                <div class="info-label">Subject:</div>
                <div class="info-value"><strong>${subject}</strong></div>

                <div class="info-label">Submitted:</div>
                <div class="info-value">${new Date().toLocaleString()}</div>
            </div>

            <div class="message-box">
                <strong>Message:</strong><br>
                ${message.replace(/\n/g, '<br>')}
            </div>
        </div>

        <div class="section">
            <h3>Next Steps</h3>
            <ul>
                <li>Review the sales rep's request and determine the appropriate response</li>
                <li>Contact the sales rep directly at ${salesRep.email} if clarification is needed</li>
                <li>Update the sales rep's account or provide assistance as required</li>
                <li>Follow up to ensure the issue has been resolved</li>
            </ul>
        </div>

        <div class="footer">
            <p>This email was generated automatically from the Stealth Batteries Sales Rep Portal.</p>
            <p>Please respond to support requests in a timely manner to maintain sales team productivity.</p>
        </div>
    </div>
</body>
</html>
  `
}
