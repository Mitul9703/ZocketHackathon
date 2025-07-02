import { FunctionHandler } from "./types";
import { ragService } from "./ragService";

const functions: FunctionHandler[] = [];

// Zocket Knowledge Search Tool
functions.push({
  schema: {
    name: "search_zocket_knowledge",
    type: "function",
    description: "Search Zocket's comprehensive knowledge base including product features, tutorials, troubleshooting guides, and marketing strategies. Use this when users ask about Zocket-specific topics.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant information about Zocket (e.g., 'how to create campaigns', 'product features', 'troubleshooting ads', 'marketing strategies', 'tutorials')"
        },
        document_type: {
          type: "string",
          description: "Optional: Filter by document type. Use 'troubleshooting' for fixing troubleshooting issues/problems, or 'product_features_or_tutorials' for features, capabilities, and how-to guides. Leave empty to search all documents."
        },
        max_results: {
          type: "number",
          description: "Maximum number of relevant documents to return (default: 3)"
        }
      },
      required: ["query"],
    },
  },
  handler: async (args: { query: string; document_type?: string; max_results?: number }) => {
    console.log("🔍 Searching Zocket knowledge base for:", args.query);

    try {
      const context = await ragService.searchDocuments(
        args.query,
        args.max_results || 3,
        args.document_type
      );

      if (!context || context.trim().length === 0) {
        return JSON.stringify({
          success: true,
          results: [],
          message: "I couldn't find specific information about that in our knowledge base. Let me know if you'd like me to search for something else, or I can connect you with a specialist who can help."
        });
      }

      return JSON.stringify({
        success: true,
        context: context,
        message: `Found relevant information about "${args.query}". Here's what I found:`,
        query: args.query
      });

    } catch (error) {
      console.error("❌ Knowledge search error:", error);
      return JSON.stringify({
        success: false,
        error: "Knowledge base search failed",
        message: "I'm experiencing technical difficulties accessing our knowledge base. Please try again, or I can connect you with a human agent for immediate assistance."
      });
    }
  },
});

// Support Ticket Tool
functions.push({
  schema: {
    name: "raise_support_ticket",
    type: "function",
    description: "Create a support ticket when you cannot resolve the customer's issue or when they request human assistance. This will notify the Zocket support team via Slack. Always collect the required customer information before calling this function.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Customer's first name"
        },
        customer_lastname: {
          type: "string",
          description: "Customer's last name"
        },
        company_name: {
          type: "string",
          description: "Customer's company name"
        },
        email: {
          type: "string",
          description: "Customer's email address (optional but recommended)"
        },
        phone: {
          type: "string",
          description: "Customer's phone number (optional)"
        },
        issue_summary: {
          type: "string",
          description: "Brief summary of the issue (1-2 sentences)"
        },
        issue_details: {
          type: "string",
          description: "Detailed description of the issue, including steps taken and any error messages"
        },
        priority: {
          type: "string",
          description: "Priority level based on business impact: low (general questions), medium (feature issues), high (blocking workflows), urgent (system down)"
        },
        category: {
          type: "string",
          description: "Category of the issue to help route to the right team: technical, billing, feature_request, bug_report, general"
        }
      },
      required: ["customer_name", "customer_lastname", "company_name", "issue_summary", "issue_details", "priority", "category"]
    }
  },
  handler: async (args: {
    customer_name: string;
    customer_lastname: string;
    company_name: string;
    email?: string;
    phone?: string;
    issue_summary: string;
    issue_details: string;
    priority: string;
    category: string;
  }) => {
    try {
      const {
        customer_name,
        customer_lastname,
        company_name,
        email,
        phone,
        issue_summary,
        issue_details,
        priority,
        category
      } = args;

      const timestamp = new Date().toISOString();
      const ticketId = `ZOCKET-${Date.now()}`;

      // Format the Slack message
      const slackMessage: any = {
        text: `🎫 New Support Ticket - ${ticketId}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🎫 Support Ticket: ${ticketId}`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Customer:* ${customer_name} ${customer_lastname}`
              },
              {
                type: "mrkdwn",
                text: `*Company:* ${company_name}`
              },
              {
                type: "mrkdwn",
                text: `*Priority:* ${priority.toUpperCase()}`
              },
              {
                type: "mrkdwn",
                text: `*Category:* ${category.replace('_', ' ').toUpperCase()}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Issue Summary:*\n${issue_summary}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Issue Details:*\n${issue_details}`
            }
          }
        ]
      };

      // Add contact info if provided
      if (email || phone) {
        const contactFields = [];
        if (email) contactFields.push({ type: "mrkdwn", text: `*Email:* ${email}` });
        if (phone) contactFields.push({ type: "mrkdwn", text: `*Phone:* ${phone}` });

        slackMessage.blocks.push({
          type: "section",
          fields: contactFields
        });
      }

      // Add timestamp
      slackMessage.blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📅 Created: ${timestamp} | 🤖 Via AI Agent`
          }
        ]
      });

      // Send to Slack
      const response = await fetch('https://hooks.slack.com/services/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', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      return JSON.stringify({
        success: true,
        ticket_id: ticketId,
        message: `Support ticket ${ticketId} has been created successfully! Our team will review it and get back to you soon. You should receive a follow-up within 24 hours.`,
        timestamp: timestamp
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      return JSON.stringify({
        success: false,
        error: 'Failed to create support ticket. Please try again or contact support directly.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

export default functions;
