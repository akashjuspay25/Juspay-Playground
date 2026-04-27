import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Play, Save, Trash2, Key, Building2, Globe, Loader2, AlertCircle, Info, HelpCircle, ArrowRight, Monitor, ExternalLink, Smartphone, Tablet, RefreshCw, Code2, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const ENDPOINTS = [
  {
    name: "Create Order",
    path: "/orders",
    method: "POST",
    category: "Backend",
    tags: ["EC API", "EC SDK", "Common"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      amount: "1.00",
      currency: "INR",
      customer_id: "customer_123",
      customer_email: "test@example.com",
      customer_phone: "9876543210",
      return_url: "https://example.com/return",
      description: "Test Order from Playground"
    }
  },
  {
    name: "Juspay Session",
    path: "/session",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout"],
    defaultBody: {
      amount: "1.00",
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      customer_id: "customer_123",
      customer_phone: "9876543210",
      customer_email: "test@gmail.com",
      payment_page_client_id: "merchant_id",
      action: "paymentPage",
      return_url: "https://example.com/return"
    }
  },
  {
    name: "TXN: Card Payment",
    path: "/txns",
    method: "POST",
    category: "Backend",
    tags: ["EC API"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      payment_method_type: "CARD",
      payment_method: "CARD",
      card_number: "4111111111111111",
      card_exp_month: "12",
      card_exp_year: "2025",
      card_security_code: "123",
      save_to_locker: true,
      redirect_after_checkout: true,
      format: "json"
    }
  },
  {
    name: "TXN: UPI Intent",
    path: "/txns",
    method: "POST",
    category: "Backend",
    tags: ["EC API"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      payment_method_type: "UPI",
      payment_method: "UPI",
      upi_vpa: "test@upi",
      action: "intent",
      format: "json"
    }
  },
  {
    name: "TXN: Wallet",
    path: "/txns",
    method: "POST",
    category: "Backend",
    tags: ["EC API"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      payment_method_type: "WALLET",
      payment_method: "PAYTM",
      direct_wallet_checkout: true,
      redirect_after_checkout: true,
      format: "json"
    }
  },
  {
    name: "TXN: Netbanking",
    path: "/txns",
    method: "POST",
    category: "Backend",
    tags: ["EC API"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      payment_method_type: "NB",
      payment_method: "SBIN",
      redirect_after_checkout: true,
      format: "json"
    }
  },
  {
    name: "Initiate Payload",
    path: "SDK.initiate()",
    method: "SDK",
    category: "Frontend",
    tags: ["HyperCheckout", "EC SDK"],
    defaultBody: {
      requestId: `req_${Math.floor(Math.random() * 1000000)}`,
      service: "in.juspay.hyperpay",
      payload: {
        action: "initiate",
        merchantId: "merchant_id",
        clientId: "client_id",
        orderId: `ORD_${Math.floor(Math.random() * 1000000)}`,
        environment: "sandbox"
      }
    }
  },
  {
    name: "Process Payload",
    path: "SDK.process()",
    method: "SDK",
    category: "Frontend",
    tags: ["HyperCheckout", "EC SDK"],
    defaultBody: {
      requestId: `req_${Math.floor(Math.random() * 1000000)}`,
      service: "in.juspay.hyperpay",
      payload: {
        action: "paymentPage",
        merchantId: "merchant_id",
        clientId: "client_id",
        orderId: `ORD_${Math.floor(Math.random() * 1000000)}`,
        amount: "1.00",
        currency: "INR",
        customerEmail: "test@example.com",
        customerMobile: "9876543210"
      }
    }
  },
  {
    name: "Get Order Status",
    path: "/orders/{order_id}",
    method: "GET",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Common"],
    defaultBody: {}
  },
  {
    name: "Cancel Order",
    path: "/orders/{order_id}/cancel",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Common"],
    defaultBody: {}
  },
  {
    name: "Refund Order",
    path: "/orders/{order_id}/refunds",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Common"],
    defaultBody: {
      amount: "1.00",
      unique_request_id: `REFUND_${Math.floor(Math.random() * 1000000)}`
    }
  },
  {
    name: "Create Customer",
    path: "/customers",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Common"],
    defaultBody: {
      object: "customer",
      id: "customer_123",
      email: "test@example.com",
      mobile_number: "9876543210",
      first_name: "John",
      last_name: "Doe"
    }
  },
  {
    name: "Get Customer",
    path: "/customers/{customer_id}",
    method: "GET",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Common"],
    defaultBody: {}
  },
  {
    name: "Update Customer",
    path: "/customers/{customer_id}",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Common"],
    defaultBody: {
      first_name: "Jane",
      last_name: "Smith",
      email: "updated@example.com",
      mobile_number: "9876543210",
      description: "Updated customer details"
    }
  },
  {
    name: "Create Mandate",
    path: "/mandates",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      amount: "1.00",
      currency: "INR",
      customer_id: "customer_123",
      mandate: {
        action: "create",
        mandate_id: `MND_${Math.floor(Math.random() * 1000000)}`,
        frequency: "DAILY",
        amount_type: "MAX",
        amount: "500.00",
        start_date: Math.floor(Date.now() / 1000),
        end_date: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
      }
    }
  },
  {
    name: "Get Mandate Status",
    path: "/mandates/{mandate_id}",
    method: "GET",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK"],
    defaultBody: {}
  },
  {
    name: "Calculate Surcharge",
    path: "/surcharge",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Surcharge"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      amount: "1.00",
      currency: "INR",
      payment_method: "CARD",
      payment_method_type: "CARD"
    }
  },
  {
    name: "Apply Offer",
    path: "/offers/apply",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Offers"],
    defaultBody: {
      order_id: `ORD_${Math.floor(Math.random() * 1000000)}`,
      amount: "1.00",
      currency: "INR",
      offer_id: "OFFER_123",
      customer_id: "customer_123"
    }
  },
  {
    name: "List Offers",
    path: "/offers",
    method: "GET",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "EC SDK", "Offers"],
    defaultBody: {}
  },
  {
    name: "Create Payout",
    path: "/payouts",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "Payouts"],
    defaultBody: {
      amount: "100.00",
      currency: "INR",
      beneficiary_name: "John Doe",
      beneficiary_account_number: "123456789012",
      beneficiary_ifsc: "HDFC0000123",
      purpose: "PAYOUT",
      unique_request_id: `PYT_${Math.floor(Math.random() * 1000000)}`
    }
  },
  {
    name: "Get Payout Status",
    path: "/payouts/{payout_id}",
    method: "GET",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "Payouts"],
    defaultBody: {}
  },
  {
    name: "SmartConvert Quote",
    path: "/smartconvert/quote",
    method: "POST",
    category: "Backend",
    tags: ["HyperCheckout", "EC API", "SmartConvert"],
    defaultBody: {
      amount: "100.00",
      from_currency: "USD",
      to_currency: "INR"
    }
  }
];

const WEBHOOK_SAMPLES = [
  // Order-Level Webhooks
  {
    event: "ORDER_SUCCEEDED",
    category: "Order",
    description: "Triggered when a payment is successful and the order status changes to CHARGED.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "ORDER_SUCCEEDED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "CHARGED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          customer_email: "customer@example.com",
          customer_phone: "9876543210",
          payment_method: "UPI",
          payment_method_type: "UPI",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          gateway_id: 1,
          gateway_reference_id: "gateway_ref_123",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "ORDER_FAILED",
    category: "Order",
    description: "Triggered when a payment attempt fails due to authentication, authorization, or other errors.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "ORDER_FAILED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "AUTHENTICATION_FAILED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          customer_email: "customer@example.com",
          customer_phone: "9876543210",
          payment_method: "CARD",
          payment_method_type: "VISA",
          error_message: "Authentication failed",
          error_code: "AUTHENTICATION_FAILED",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "ORDER_REFUNDED",
    category: "Order",
    description: "Triggered when a partial or full refund is initiated against an order.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "ORDER_REFUNDED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "REFUNDED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          customer_email: "customer@example.com",
          refunds: [
            {
              refund_id: "REF_12345",
              status: "SUCCESS",
              amount: 1.00,
              reason: "Customer request",
              error_message: null,
              error_code: null,
              date_created: new Date().toISOString()
            }
          ],
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "ORDER_CREATED",
    category: "Order",
    description: "Triggered when a new order is created in the system.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "ORDER_CREATED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "NEW",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          customer_email: "customer@example.com",
          customer_phone: "9876543210",
          product_id: "prod_123",
          return_url: "https://merchant.com/return",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "ORDER_PENDING",
    category: "Order",
    description: "Triggered when an order moves to pending state awaiting customer action.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "ORDER_PENDING",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "PENDING",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "NB",
          payment_method_type: "NET_BANKING",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          gateway_id: 1,
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  // Transaction-Level Webhooks
  {
    event: "TXN_CHARGED",
    category: "Transaction",
    description: "Triggered when a transaction is successfully charged.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "TXN_CHARGED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "CHARGED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "CARD",
          payment_method_type: "VISA",
          card: {
            card_brand: "Visa",
            card_type: "credit",
            card_token: "tok_abc123",
            card_reference: "ref_abc123",
            last_four_digits: "4242",
            name_on_card: "John Doe"
          },
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          gateway_id: 1,
          gateway: "RAZORPAY",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "TXN_INITIATED",
    category: "Transaction",
    description: "Triggered when a transaction is initiated by the customer.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "TXN_INITIATED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "PENDING_VBV",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "CARD",
          payment_method_type: "VISA",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          gateway_id: 1,
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "TXN_FAILED",
    category: "Transaction",
    description: "Triggered when a transaction fails at any stage.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "TXN_FAILED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "FAILED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "UPI",
          payment_method_type: "UPI",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          error_message: "Transaction declined by bank",
          error_code: "TRANSACTION_DECLINED",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "AUTHENTICATION_SUCCESSFUL",
    category: "Transaction",
    description: "Triggered when 3DS/OTP authentication is successful.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "AUTHENTICATION_SUCCESSFUL",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "AUTHENTICATION_SUCCESSFUL",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "CARD",
          payment_method_type: "VISA",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "AUTHENTICATION_FAILED",
    category: "Transaction",
    description: "Triggered when 3DS/OTP authentication fails.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "AUTHENTICATION_FAILED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "AUTHENTICATION_FAILED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "CARD",
          payment_method_type: "VISA",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          error_message: "3D Secure authentication failed",
          error_code: "AUTHENTICATION_FAILED",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "AUTHORIZATION_FAILED",
    category: "Transaction",
    description: "Triggered when authorization fails at the gateway.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "AUTHORIZATION_FAILED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "AUTHORIZATION_FAILED",
          amount: 1.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "CARD",
          payment_method_type: "VISA",
          txn_id: "TXN_123456789",
          txn_uuid: "txn_uuid_abc123",
          error_message: "Insufficient funds",
          error_code: "INSUFFICIENT_FUNDS",
          gateway: "RAZORPAY",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  // Refund Webhooks
  {
    event: "REFUND_SUCCEEDED",
    category: "Refund",
    description: "Triggered when a refund is successfully processed.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "REFUND_SUCCEEDED",
      content: {
        refund: {
          refund_id: "REF_12345",
          order_id: "ORD_12345",
          status: "SUCCESS",
          amount: 1.00,
          currency: "INR",
          reason: "Customer request",
          error_message: null,
          error_code: null,
          gateway_reference_id: "gateway_ref_123",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "REFUND_FAILED",
    category: "Refund",
    description: "Triggered when a refund fails to process.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "REFUND_FAILED",
      content: {
        refund: {
          refund_id: "REF_12345",
          order_id: "ORD_12345",
          status: "FAILED",
          amount: 1.00,
          currency: "INR",
          reason: "Customer request",
          error_message: "Refund window expired",
          error_code: "REFUND_WINDOW_EXPIRED",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  // Mandate Webhooks
  {
    event: "MANDATE_CREATED",
    category: "Mandate",
    description: "Triggered when a new mandate is created and sent to the customer's bank.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "MANDATE_CREATED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "CHARGED",
          customer_id: "customer_123"
        },
        mandate: {
          mandate_id: "mandate_abc123",
          mandate_status: "ACTIVE",
          mandate_type: "EMANDATE",
          max_amount: 10000.00,
          currency: "INR",
          start_date: "2024-01-01",
          end_date: "2025-01-01",
          frequency: "MONTHLY",
          rule_value: 1,
          rule_type: "ON",
          revokable_by_customer: true,
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "MANDATE_ACTIVATED",
    category: "Mandate",
    description: "Triggered when a mandate is activated by the customer's bank.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "MANDATE_ACTIVATED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "CHARGED"
        },
        mandate: {
          mandate_id: "mandate_abc123",
          mandate_status: "ACTIVE",
          mandate_type: "EMANDATE",
          max_amount: 10000.00,
          currency: "INR",
          start_date: "2024-01-01",
          end_date: "2025-01-01",
          frequency: "MONTHLY",
          bank_mandate_id: "BANK123456",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "MANDATE_REVOKED",
    category: "Mandate",
    description: "Triggered when a mandate is revoked by the merchant or customer.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "MANDATE_REVOKED",
      content: {
        mandate: {
          mandate_id: "mandate_abc123",
          mandate_status: "REVOKED",
          mandate_type: "EMANDATE",
          max_amount: 10000.00,
          currency: "INR",
          revocation_reason: "Customer request",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "MANDATE_FAILED",
    category: "Mandate",
    description: "Triggered when mandate creation or activation fails.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "MANDATE_FAILED",
      content: {
        order: {
          order_id: "ORD_12345",
          status: "FAILED"
        },
        mandate: {
          mandate_id: "mandate_abc123",
          mandate_status: "FAILED",
          mandate_type: "EMANDATE",
          error_message: "Bank rejected mandate registration",
          error_code: "MANDATE_REGISTRATION_FAILED",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "MANDATE_EXECUTED",
    category: "Mandate",
    description: "Triggered when a recurring payment is successfully charged via mandate.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "MANDATE_EXECUTED",
      content: {
        order: {
          order_id: "ORD_RECURRING_001",
          status: "CHARGED",
          amount: 999.00,
          currency: "INR",
          customer_id: "customer_123",
          payment_method: "UPI",
          payment_method_type: "UPI",
          txn_id: "TXN_MANDATE_001",
          txn_uuid: "txn_uuid_mandate_001",
          mandate_id: "mandate_abc123",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  // Notification Webhooks
  {
    event: "NOTIFICATION_SENT",
    category: "Notification",
    description: "Triggered when a notification (SMS/Email/Push) is sent to the customer.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "NOTIFICATION_SENT",
      content: {
        notification: {
          notification_id: "notif_abc123",
          order_id: "ORD_12345",
          customer_id: "customer_123",
          type: "EMAIL",
          template_id: "payment_confirmation",
          status: "SENT",
          recipient: "customer@example.com",
          subject: "Payment Successful",
          content_preview: "Your payment of Rs. 1.00 was successful...",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "NOTIFICATION_DELIVERED",
    category: "Notification",
    description: "Triggered when a notification is confirmed delivered.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "NOTIFICATION_DELIVERED",
      content: {
        notification: {
          notification_id: "notif_abc123",
          order_id: "ORD_12345",
          customer_id: "customer_123",
          type: "EMAIL",
          template_id: "payment_confirmation",
          status: "DELIVERED",
          recipient: "customer@example.com",
          delivered_at: new Date().toISOString(),
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "NOTIFICATION_FAILED",
    category: "Notification",
    description: "Triggered when a notification fails to send or deliver.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "NOTIFICATION_FAILED",
      content: {
        notification: {
          notification_id: "notif_abc123",
          order_id: "ORD_12345",
          customer_id: "customer_123",
          type: "SMS",
          template_id: "otp",
          status: "FAILED",
          recipient: "9876543210",
          error_message: "Invalid phone number",
          error_code: "INVALID_RECIPIENT",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "NOTIFICATION_CLICKED",
    category: "Notification",
    description: "Triggered when a customer clicks on a notification link.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "NOTIFICATION_CLICKED",
      content: {
        notification: {
          notification_id: "notif_abc123",
          order_id: "ORD_12345",
          customer_id: "customer_123",
          type: "EMAIL",
          template_id: "payment_link",
          link_clicked: "https://checkout.juspay.in/pay?orderId=ORD_12345",
          clicked_at: new Date().toISOString(),
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  // Additional Refund Webhooks
  {
    event: "REFUND_INITIATED",
    category: "Refund",
    description: "Triggered when a refund request is received and validated.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "REFUND_INITIATED",
      content: {
        refund: {
          refund_id: "REF_12345",
          order_id: "ORD_12345",
          status: "INITIATED",
          amount: 1.00,
          currency: "INR",
          unique_request_id: "ref_req_001",
          reason: "Customer request",
          initiator: "MERCHANT",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "REFUND_PENDING",
    category: "Refund",
    description: "Triggered when a refund is pending with the acquiring bank.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "REFUND_PENDING",
      content: {
        refund: {
          refund_id: "REF_12345",
          order_id: "ORD_12345",
          status: "PENDING",
          amount: 1.00,
          currency: "INR",
          unique_request_id: "ref_req_001",
          reason: "Customer request",
          gateway: "RAZORPAY",
          gateway_reference_id: "refund_gateway_ref_001",
          date_created: new Date().toISOString()
        }
      },
      created: new Date().toISOString()
    }
  },
  {
    event: "PARTIAL_REFUND_SUCCEEDED",
    category: "Refund",
    description: "Triggered when a partial refund is successfully processed.",
    payload: {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event_name: "PARTIAL_REFUND_SUCCEEDED",
      content: {
        refund: {
          refund_id: "REF_12346",
          order_id: "ORD_12345",
          status: "SUCCESS",
          amount: 0.50,
          currency: "INR",
          unique_request_id: "ref_req_002",
          reason: "Partial cancellation",
          gateway_reference_id: "refund_gateway_ref_002",
          date_created: new Date().toISOString()
        },
        order: {
          order_id: "ORD_12345",
          total_amount: 1.00,
          refunded_amount: 0.50,
          remaining_amount: 0.50,
          status: "PARTIALLY_REFUNDED"
        }
      },
      created: new Date().toISOString()
    }
  }
];

import { ThemeColors } from "@/src/App";

export function Playground({ 
  suggestedIntegration, 
  onResetFilter,
  activeTheme 
}: { 
  suggestedIntegration?: string | null, 
  onResetFilter?: () => void,
  activeTheme: ThemeColors
}) {
  const [apiKey, setApiKey] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [mandateId, setMandateId] = useState("");
  
  // Filter endpoints based on suggested integration
  const filteredEndpoints = (() => {
    if (!suggestedIntegration) return ENDPOINTS;

    const lowerSuggestion = suggestedIntegration.toLowerCase();

    // Collect all relevant tags based on suggestion
    const targetTags: string[] = ["Common"];

    if (lowerSuggestion.includes("hypercheckout")) {
      targetTags.push("HyperCheckout");
    }
    if (lowerSuggestion.includes("express checkout") || lowerSuggestion.includes("ec sdk") || lowerSuggestion.includes("headless") || lowerSuggestion.includes("sdk")) {
      targetTags.push("EC SDK");
    }
    if (lowerSuggestion.includes("api") || lowerSuggestion.includes("web") || lowerSuggestion.includes("merchant-only")) {
      targetTags.push("EC API");
    }
    if (lowerSuggestion.includes("surcharge")) {
      targetTags.push("Surcharge");
    }
    if (lowerSuggestion.includes("offer")) {
      targetTags.push("Offers");
    }
    if (lowerSuggestion.includes("payout")) {
      targetTags.push("Payouts");
    }
    if (lowerSuggestion.includes("mandate")) {
      targetTags.push("Mandates");
    }
    if (lowerSuggestion.includes("smartconvert") || lowerSuggestion.includes("convert")) {
      targetTags.push("SmartConvert");
    }

    return ENDPOINTS.filter(e => (e as any).tags?.some((tag: string) => targetTags.includes(tag)));
  })();

  const [selectedEndpoint, setSelectedEndpoint] = useState(filteredEndpoints[0] || ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(JSON.stringify((filteredEndpoints[0] || ENDPOINTS[0]).defaultBody, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [webhookSample, setWebhookSample] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null);
  const [activePlayTab, setActivePlayTab] = useState("api");
  const [deviceView, setDeviceView] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [iframeKey, setIframeKey] = useState(0);

  const refreshIframe = () => setIframeKey(prev => prev + 1);

  const getDeviceWidth = () => {
    switch(deviceView) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      default: return "100%";
    }
  };

  const updateBodyWithCredentials = (bodyStr: string, mId: string, cId: string) => {
    try {
      const body = JSON.parse(bodyStr);
      let changed = false;
      if (body.hasOwnProperty("payment_page_client_id") && cId) {
        body.payment_page_client_id = cId.trim();
        changed = true;
      }
      // Some other APIs might use merchant_id in body
      if (body.hasOwnProperty("merchant_id") && mId) {
        body.merchant_id = mId.trim();
        changed = true;
      }
      return changed ? JSON.stringify(body, null, 2) : bodyStr;
    } catch (e) {
      return bodyStr;
    }
  };

  // Reset selection when filtering changes
  useEffect(() => {
    if (filteredEndpoints.length > 0) {
      const lowerSuggestion = suggestedIntegration?.toLowerCase() || "";
      let initial;
      
      if (lowerSuggestion.includes("hypercheckout")) {
        initial = filteredEndpoints.find(e => e.name === "Juspay Session") || filteredEndpoints[0];
      } else {
        initial = filteredEndpoints.find(e => e.name === "Create Order") || filteredEndpoints[0];
      }
      
      setSelectedEndpoint(initial);
      const body = JSON.stringify(initial.defaultBody, null, 2);
      setRequestBody(updateBodyWithCredentials(body, merchantId, clientId));
    }
  }, [suggestedIntegration]);

  const handleEndpointChange = (name: string) => {
    const endpoint = filteredEndpoints.find(e => e.name === name);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
      const body = JSON.stringify(endpoint.defaultBody, null, 2);
      setRequestBody(updateBodyWithCredentials(body, merchantId, clientId));
    }
  };

  const generateNewOrderId = () => `ORD_${Math.floor(Math.random() * 1000000)}`;

  const handleRun = async () => {
    if (!apiKey || !merchantId) {
      toast.error("API Key and Merchant ID are required.");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      let currentRequestBody = requestBody;
      let currentOrderId = orderId;

      // Handle SDK simulated calls
      if (selectedEndpoint.method === "SDK") {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        setResponse({
          status: "SIMULATED_SDK_SUCCESS",
          message: `The HyperPay SDK would now process the ${selectedEndpoint.name.toLowerCase()}.`,
          service: "in.juspay.hyperpay",
          timestamp: new Date().toISOString(),
          context: JSON.parse(currentRequestBody)
        });
        setLoading(false);
        toast.success(`${selectedEndpoint.name} simulated successfully!`);
        return;
      }

      // Automatically regenerate order_id for create/session calls if present in body
      if (selectedEndpoint.method !== "GET" && requestBody.includes("order_id")) {
        try {
          const body = JSON.parse(requestBody);
          if (body.hasOwnProperty("order_id")) {
            const newId = generateNewOrderId();
            body.order_id = newId;
            
            // If it's a mandate creation, handle mandate_id too
            if (body.hasOwnProperty("mandate") && body.mandate.hasOwnProperty("mandate_id")) {
              const newMndId = `MND_${Math.floor(Math.random() * 1000000)}`;
              body.mandate.mandate_id = newMndId;
              setMandateId(newMndId);
            }

            currentRequestBody = JSON.stringify(body, null, 2);
            setRequestBody(currentRequestBody);
            setOrderId(newId); // Keep the path parameter state in sync
            currentOrderId = newId;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      let path = selectedEndpoint.path;
      if (path.includes("{order_id}")) {
        if (!currentOrderId) {
          toast.error("Order ID is required for this endpoint.");
          setLoading(false);
          return;
        }
        path = path.replace("{order_id}", currentOrderId);
      }
      
      if (path.includes("{mandate_id}")) {
        if (!mandateId) {
          toast.error("Mandate ID is required for this endpoint.");
          setLoading(false);
          return;
        }
        path = path.replace("{mandate_id}", mandateId);
      }

      const res = await fetch("/api/juspay/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-merchantid": merchantId.trim(),
        },
        body: JSON.stringify({
          method: selectedEndpoint.method,
          endpoint: path,
          body: selectedEndpoint.method === "GET" ? undefined : JSON.parse(currentRequestBody),
          apiKey: apiKey.trim(),
          environment: environment,
        }),
      });

      const data = await res.json();
      setResponse(data);
      
      if (res.ok) {
        toast.success("API Request Successful!");

        // Auto-redirect to Live Web View if a web link is returned
        const webUrl = data.payment_links?.web || data.url || data.link;
        if (webUrl && (
          selectedEndpoint.name.toLowerCase().includes("session") || 
          selectedEndpoint.path.includes("session") ||
          selectedEndpoint.name.toLowerCase().includes("order") ||
          selectedEndpoint.name.toLowerCase().includes("txn")
        )) {
          toast.info("Opening Live Web View", {
            description: "Opening the payment page in the simulator tab."
          });
          setLiveViewUrl(webUrl);
          setActivePlayTab("simulator");
        }
      } else {
        const errorCode = data.error_code || data.status || "API Request Failed";
        toast.error(errorCode, {
          description: data.error_message || "Check the response panel for details."
        });
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Network error. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs value={activePlayTab} onValueChange={setActivePlayTab} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-xl self-start border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-md relative h-auto">
          {["api", "simulator", "webhooks"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="relative px-4 py-2 text-sm font-medium transition-all duration-300 z-10 data-active:!text-white dark:data-active:!text-white data-inactive:text-zinc-950 dark:data-inactive:text-zinc-300 border-none shadow-none bg-transparent data-active:bg-transparent"
            >
              <div className="flex items-center gap-2 relative z-20">
                {tab === "api" && <Terminal className="w-4 h-4" />}
                {tab === "simulator" && <Monitor className="w-4 h-4" />}
                {tab === "webhooks" && <Globe className="w-4 h-4" />}
                
                <span className="capitalize">
                  {tab === "api" ? "API Explorer" : tab === "simulator" ? "Live View Simulator" : "Webhook Samples"}
                </span>
                
                {tab === "simulator" && liveViewUrl && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                )}
              </div>
              
              {activePlayTab === tab && (
                <motion.div
                  layoutId="active-pill"
                  className={cn(
                    "absolute inset-0 rounded-lg shadow-md z-10",
                    activeTheme.primary
                  )}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeTheme && <div className="hidden" />}
        
        {suggestedIntegration && (
          <Button variant="ghost" size="sm" onClick={onResetFilter} className={`text-zinc-500 dark:text-zinc-400 hover:${activeTheme.text}`}>
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </div>

      <TabsContent value="api" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration & Request */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white font-bold">
              <Key className={`w-5 h-5 ${activeTheme.text}`} />
              Credentials
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Enter your Juspay Sandbox or Production keys.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Environment</Label>
              <Select onValueChange={setEnvironment} value={environment}>
                <SelectTrigger className={`w-full focus:ring-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white ${activeTheme.ring}`}>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                  <SelectItem value="sandbox">Sandbox (sandbox.juspay.in)</SelectItem>
                  <SelectItem value="production">Production (api.juspay.in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="apiKey" className="text-zinc-700 dark:text-zinc-300">API Key</Label>
                <span title="Get this key by logging into juspay dashboard -> payments -> settings -> Api key -> create new api key">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help hover:text-blue-500 transition-colors" />
                </span>
              </div>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API Key (AK_...)"
                  className={`pl-9 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white ${activeTheme.ring}`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Key className="w-4 h-4 absolute left-3 top-3 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchantId" className="text-zinc-700 dark:text-zinc-300">Merchant ID</Label>
              <div className="relative">
                <Input
                  id="merchantId"
                  placeholder="Enter Merchant ID"
                  className={`pl-9 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white ${activeTheme.ring}`}
                  value={merchantId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMerchantId(val);
                    setRequestBody(updateBodyWithCredentials(requestBody, val, clientId));
                  }}
                />
                <Building2 className="w-4 h-4 absolute left-3 top-3 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId" className="text-zinc-700 dark:text-zinc-300">Client ID</Label>
              <div className="relative">
                <Input
                  id="clientId"
                  placeholder="Enter Client ID"
                  className={`pl-9 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white ${activeTheme.ring}`}
                  value={clientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClientId(val);
                    setRequestBody(updateBodyWithCredentials(requestBody, merchantId, val));
                  }}
                />
                <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white font-bold">
              <Code2 className={`w-5 h-5 ${activeTheme.text}`} />
              Request Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-700 dark:text-zinc-300">Endpoint</Label>
                {suggestedIntegration && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${activeTheme.bg} ${activeTheme.text} ${activeTheme.border} border-opacity-30 flex items-center gap-1`}>
                      <Info className="w-3 h-3" />
                      Filtered for {suggestedIntegration}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 px-2 text-[10px] text-zinc-500 dark:text-zinc-400 hover:${activeTheme.text}`}
                      onClick={onResetFilter}
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>
              <Select onValueChange={handleEndpointChange} value={selectedEndpoint.name}>
                <SelectTrigger className={`w-full focus:ring-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white ${activeTheme.ring}`}>
                  <SelectValue placeholder="Select an endpoint" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
                  {/* Backend Group */}
                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-400 px-2 py-1.5">Backend APIs</SelectLabel>
                    {filteredEndpoints.filter(e => e.category === "Backend").map((e) => (
                      <SelectItem key={e.name} value={e.name}>
                        <div className="flex items-center gap-2">
                          <Badge variant={e.method === "POST" ? "default" : "secondary"} className={e.method === "POST" ? activeTheme.primary : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"}>
                            {e.method}
                          </Badge>
                          {e.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  
                  {/* Frontend Group (EC SDK) */}
                  {filteredEndpoints.some(e => e.category === "Frontend") && (
                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-400 px-2 py-1.5 border-t border-zinc-100 dark:border-zinc-800 mt-1">Frontend (SDK) Payloads</SelectLabel>
                      {filteredEndpoints.filter(e => e.category === "Frontend").map((e) => (
                        <SelectItem key={e.name} value={e.name}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50">
                              {e.method}
                            </Badge>
                            {e.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedEndpoint.path.includes("{order_id}") && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="orderId" className="text-zinc-700 dark:text-zinc-300">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="e.g., ORD_123456"
                  className={`bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white ${activeTheme.ring}`}
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
            )}

            {selectedEndpoint.path.includes("{mandate_id}") && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="mandateId" className="text-zinc-700 dark:text-zinc-300">Mandate ID</Label>
                <Input
                  id="mandateId"
                  placeholder="e.g., MND_123456"
                  className={`bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white ${activeTheme.ring}`}
                  value={mandateId}
                  onChange={(e) => setMandateId(e.target.value)}
                />
              </div>
            )}

            {selectedEndpoint.method !== "GET" && (
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Request Body (JSON)</Label>
            <textarea
              className={`w-full h-64 p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 ${activeTheme.ring} resize-none shadow-inner shadow-zinc-100/50 dark:shadow-none transition-colors`}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
            />
              </div>
            )}

            <motion.div 
              className={`w-full ${activeTheme.primary} hover:opacity-90 text-white h-11 rounded-lg flex items-center justify-center`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="ghost"
                className="w-full h-full text-white hover:bg-transparent hover:text-white"
                onClick={handleRun}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Run Request
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Response Section */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md h-full flex flex-col overflow-hidden transition-colors">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-row items-center justify-between py-4 transition-colors">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white font-bold">
                <Terminal className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                Response
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Live API response from Juspay servers.</CardDescription>
            </div>
            {response && (
              <Button variant="ghost" size="sm" onClick={() => setResponse(null)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-grow bg-slate-900 rounded-b-xl overflow-hidden transition-colors">
            {response ? (
              <ScrollArea className="h-[600px] w-full">
                <SyntaxHighlighter
                  language="json"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    fontSize: '0.875rem',
                    background: 'transparent',
                  }}
                >
                  {JSON.stringify(response, null, 2)}
                </SyntaxHighlighter>
              </ScrollArea>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 transition-colors">
                <Terminal className="w-12 h-12 mb-4 opacity-10 text-zinc-900 dark:text-white transition-opacity" />
                <p className="text-sm font-mono text-zinc-400 dark:text-zinc-500">Waiting for request...</p>
                <p className="text-xs mt-2 opacity-70 max-w-xs text-zinc-400 dark:text-zinc-500">
                  Configure your credentials and hit "Run Request" to see the response here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>
      </TabsContent>

      <TabsContent value="simulator" className="mt-0">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg overflow-hidden flex flex-col min-h-[700px] transition-colors">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between transition-colors">
            <div className="flex items-center gap-6">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white font-bold">
                  <Monitor className={`w-5 h-5 ${activeTheme.text}`} />
                  Live View Simulator
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  {liveViewUrl 
                    ? "Interact with the Juspay payment page in real-time." 
                    : "Create a session first to view the payment page here."}
                </CardDescription>
              </div>

              {liveViewUrl && (
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-inner transition-colors">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant={deviceView === "mobile" ? "secondary" : "ghost"} 
                      size="sm" 
                      className={`h-8 px-3 gap-2 ${deviceView === "mobile" ? "bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400"}`}
                      onClick={() => { setDeviceView("mobile"); refreshIframe(); }}
                    >
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant={deviceView === "tablet" ? "secondary" : "ghost"} 
                      size="sm" 
                      className={`h-8 px-3 gap-2 ${deviceView === "tablet" ? "bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400"}`}
                      onClick={() => { setDeviceView("tablet"); refreshIframe(); }}
                    >
                      <Tablet className="w-4 h-4" />
                      Tablet
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant={deviceView === "desktop" ? "secondary" : "ghost"} 
                      size="sm" 
                      className={`h-8 px-3 gap-2 ${deviceView === "desktop" ? "bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400"}`}
                      onClick={() => { setDeviceView("desktop"); refreshIframe(); }}
                    >
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
            {liveViewUrl && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refreshIframe} className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                 <Button variant="outline" size="sm" onClick={() => window.open(liveViewUrl, "_blank")} className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLiveViewUrl(null)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-grow bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-inner">
            {liveViewUrl ? (
              <div 
                className="transition-all duration-500 ease-in-out bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden relative border border-zinc-200 dark:border-zinc-800"
                style={{ 
                  width: getDeviceWidth(), 
                  height: '700px',
                  borderRadius: deviceView === "desktop" ? "0" : "1.5rem",
                  border: deviceView === "desktop" ? "none" : "12px solid #18181b"
                }}
              >
                <iframe
                  key={iframeKey}
                  src={liveViewUrl}
                  className="w-full h-full border-none bg-white transition-colors"
                  title="Juspay Live View Simulator"
                  allow="payment"
                />
              </div>
            ) : (
              <div className="text-center p-12 max-w-sm space-y-4">
                <div className="bg-white dark:bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <Monitor className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">No Active Session</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Once you run the <b>Create Session</b> API in the Explorer, 
                  the payment page will automatically load here for testing.
                </p>
                <Button variant="outline" onClick={() => setActivePlayTab("api")} className="mt-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm transition-colors">
                  Go to API Explorer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="webhooks" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden transition-colors">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
                <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white font-bold">
                  <Globe className={`w-5 h-5 ${activeTheme.text}`} />
                  Webhook Events
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Select an event to see its payload.</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {WEBHOOK_SAMPLES.map((sample, idx) => (
                      <motion.button
                        key={sample.event}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ x: 5, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setWebhookSample(sample.payload)}
                        className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md group ${
                          webhookSample?.event_name === sample.event 
                            ? `${activeTheme.border.replace("border-", "border-").split(" ")[0]} bg-zinc-50 dark:bg-zinc-900 border-opacity-100 ring-1 ${activeTheme.primary.replace("bg-", "ring-")}` 
                            : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${webhookSample?.event_name === sample.event ? activeTheme.text : "text-zinc-800 dark:text-zinc-200"}`}>
                              {sample.event}
                            </span>
                            {(sample as any).category && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                webhookSample?.event_name === sample.event
                                  ? `${activeTheme.primary} text-white`
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}>
                                {(sample as any).category}
                              </span>
                            )}
                          </div>
                          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${webhookSample?.event_name === sample.event ? activeTheme.text : "text-zinc-300 dark:text-zinc-600"}`} />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                          {sample.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md h-full flex flex-col overflow-hidden transition-colors">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-row items-center justify-between transition-colors">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white font-bold">
                    <Terminal className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                    Webhook Payload
                  </CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400">Sample JSON payload for the selected event.</CardDescription>
                </div>
                {webhookSample && (
                  <Button variant="ghost" size="sm" onClick={() => setWebhookSample(null)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-grow bg-slate-900 rounded-b-xl overflow-hidden">
                {webhookSample ? (
                  <ScrollArea className="h-[600px] w-full">
                    <SyntaxHighlighter
                      language="json"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.875rem',
                        background: 'transparent',
                      }}
                    >
                      {JSON.stringify(webhookSample, null, 2)}
                    </SyntaxHighlighter>
                  </ScrollArea>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 transition-colors">
                    <Globe className="w-12 h-12 mb-4 opacity-10" />
                    <p className="text-sm font-mono text-zinc-400 dark:text-zinc-500">Select a webhook event...</p>
                    <p className="text-xs mt-2 opacity-70 max-w-xs text-zinc-400 dark:text-zinc-500">
                      Click on an event from the left panel to view its structure and data.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
